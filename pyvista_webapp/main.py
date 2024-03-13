from typing import Tuple
import numpy as np
import logging
from pathlib import Path
import time
from concurrent.futures import ProcessPoolExecutor

import asyncio
from fastapi import FastAPI, HTTPException, Response, WebSocket, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
import pytetwild
import pyvista as pv

ENABLE_TIMING = False

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
LOG = logging.getLogger(__name__)
LOG.setLevel("DEBUG")

BASE_DIR = Path(__file__).resolve().parent

MAX_WORKERS = 10
EXECUTOR_POOL = ProcessPoolExecutor(max_workers=MAX_WORKERS)


def vf_from_bytes(content: bytes) -> Tuple[np.ndarray, np.ndarray]:
    vertex_count = int.from_bytes(content[:4], "little")
    offset = 4

    # Assuming vertices are stored as Float32, 3 coordinates per vertex
    vertices_bytes = content[offset : offset + vertex_count * 12]  # 12 bytes per vertex (3 floats)
    vertices = np.frombuffer(vertices_bytes, dtype=np.float32).reshape((vertex_count, 3))
    offset += vertex_count * 12  # 4 bytes and x, y, z per vertex

    # The rest are faces, assuming stored as Int32, 3 indices per face
    faces_bytes = content[offset:]
    faces = np.frombuffer(faces_bytes, dtype=np.int32).reshape((-1, 3))
    return vertices, faces


def mesh_to_bytes(mesh: pv.PolyData) -> bytes:
    # Assume mesh.points is Nx3 float32 and mesh.faces is Mx3 or Mx4 int32
    vertices_bytes = mesh.points.astype(np.float32).tobytes()

    faces_bytes = (
        mesh.faces.reshape((-1, 4))[:, 1:].astype(np.int32, copy=False).tobytes()
    )  # Skip face size indicator

    # Combine vertices and faces into a single bytes object
    # and prepend length
    return mesh.n_points.to_bytes(4, "little") + vertices_bytes + faces_bytes


class ConnectionManager:
    def __init__(self):
        self.active_connections = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        LOG.debug("Added active WebSocket connection.")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            LOG.debug("Sending message %s", message)
            await connection.send_text(message)

    async def broadcast_bytes(self, message: bytes):
        for connection in self.active_connections:
            LOG.debug("Sending bytes")
            tstart = time.time()
            await connection.send_bytes(message)
            LOG.debug("Sent in %f seconds", time.time() - tstart)


connection_manager = ConnectionManager()

app = FastAPI()

if ENABLE_TIMING:

    class TimingMiddleware(BaseHTTPMiddleware):
        async def dispatch(self, request: Request, call_next):
            start_time = time.time()
            response = await call_next(request)
            # This gets executed after the response is fully sent
            elapsed_time = time.time() - start_time
            LOG.info(
                "%s request to %s completed in %.2f seconds",
                request.method,
                request.url.path,
                elapsed_time,
            )
            return response

    app.add_middleware(TimingMiddleware)


def tetrahedralize(vertices, faces):
    try:
        tetra_points, tetra_cells = pytetwild.tetrahedralize(
            vertices.astype(np.float64), faces, edge_length_fac=0.1, optimize=True
        )
        LOG.info("Finished with pytetwild")
        return tetra_points.copy(), tetra_cells.copy()
    except Exception:
        LOG.exception("Failed to tetrahedralize")
        return None, None


async def async_tetrahedralize(vertices, faces):
    loop = asyncio.get_running_loop()
    future = loop.run_in_executor(EXECUTOR_POOL, tetrahedralize, vertices, faces)
    tetra_points, tetra_cells = await future
    return tetra_points, tetra_cells


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


# Serve the assets (JS, CSS, images, etc.)
next_assets = BASE_DIR / "frontend/_next"
if not next_assets.is_dir():
    raise RuntimeError(f"Missing static next assets at {next_assets}")
app.mount(
    "/_next/",
    StaticFiles(directory=BASE_DIR / "frontend/_next"),
    name="next-assets",
)

# Serve the main page and other static files
static_pages = BASE_DIR / "frontend/"
if not static_pages.is_dir():
    raise RuntimeError(f"Missing static pages at {static_pages}")
app.mount("/static", StaticFiles(directory=static_pages), name="app")


@app.get("/")
@app.head("/")
async def serve_frontend():
    return FileResponse(BASE_DIR / "frontend/index.html")


@app.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    return {"status": "ok"}


# @app.post("/gen-tetra")
# async def generate_tetrahedral_mesh(request: Request, response_class=Response) -> Response:
#     content = await request.body()
#     vertices, faces = vf_from_bytes(content)

#     # debug, plot pyvista surface
#     # import pyvista
#     # pyvista.make_tri_mesh(vertices, faces).plot()

#     tetra_points, tetra_cells = await async_tetrahedralize(vertices, faces)

#     if tetra_points is None:
#         raise HTTPException(status_code=500, detail="Failed to tetrahedralize")

#     cells = np.hstack(
#         [
#             np.full((tetra_cells.shape[0], 1), 4, dtype=np.int32),
#             tetra_cells,
#         ]
#     )
#     cell_types = np.full(tetra_cells.shape[0], 10, dtype=np.uint8)
#     grid = pv.UnstructuredGrid(cells, cell_types, tetra_points)
#     mesh_out = grid.explode(0.5).extract_surface()
#     mesh_out = mesh_out.explode(0).extract_surface()  # separate edges for SSAO
#     data = mesh_to_bytes(mesh_out)

#     return Response(content=data, media_type="application/octet-stream")


def tetrahedralize_mesh(mesh):
    grid = pytetwild.tetrahedralize_pv(mesh, edge_length_fac=0.1, optimize=True)
    mesh_out = grid.explode(0.5).extract_surface()
    mesh_out = mesh_out.explode(0).extract_surface()  # separate edges for SSAO
    return mesh_to_bytes(mesh_out)


async def generate_demo_bracket_async() -> bytes:
    import pyvista as pv

    mesh = pv.Cube()
    loop = asyncio.get_running_loop()
    future = loop.run_in_executor(EXECUTOR_POOL, tetrahedralize_mesh, mesh)
    data = await future
    return data


@app.get("/get-demo")
async def generate_demo_bracket_endpoint() -> Response:
    """Return a demo 'exploded' grid."""
    try:
        data = await generate_demo_bracket_async()
        return Response(content=data, media_type="application/octet-stream")
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to process mesh")
