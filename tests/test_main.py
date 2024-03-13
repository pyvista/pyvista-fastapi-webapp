"""Test main application endpoints."""

import asyncio
import os
import uuid

import numpy as np
from httpx import AsyncClient
import pytest
import pyvista as pv
from pyvista import examples
from pyvista_webapp.main import mesh_to_bytes, vf_from_bytes

BASE_URL = "http://test"


@pytest.mark.asyncio
async def test_health(app):
    """Test the /health endpoint."""
    async with AsyncClient(app=app, base_url=BASE_URL) as ac:
        response = await ac.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


# @pytest.mark.asyncio
# async def test_generate_tetrahedral_mesh(app):
#     """Test the /gen-tetra endpoint with a simple cube mesh."""
#     mesh = pv.Cube().triangulate()
#     data = mesh_to_bytes(mesh)

#     async with AsyncClient(app=app, base_url=BASE_URL) as ac:
#         response = await ac.post("/gen-tetra", content=data)

#     assert response.status_code == 200
#     assert response.headers["content-type"] == "application/octet-stream"
#     vertices, faces = vf_from_bytes(response.content)
#     assert not np.isnan(vertices[faces]).any()


@pytest.mark.asyncio
async def test_generate_demo_bracket(app):
    """Test the /get-demo endpoint."""
    async with AsyncClient(app=app, base_url=BASE_URL) as ac:
        response = await ac.get("/get-demo")

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/octet-stream"


async def make_get_demo_request(app):
    """Helper function to make a single /get-demo request."""
    async with AsyncClient(app=app, base_url=BASE_URL) as ac:
        response = await ac.get("/get-demo")
    return response


@pytest.mark.asyncio
async def test_multiple_get_demo_requests(app):
    """Test making 10 simultaneous /get-demo requests."""
    tasks = [make_get_demo_request(app) for _ in range(10)]
    responses = await asyncio.gather(*tasks)
    for response in responses:
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/octet-stream"
