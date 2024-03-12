"""Test main application endpoints."""

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
async def test_generate_tetrahedral_mesh(app):
    """Test the /gen-tetra endpoint with a simple cube mesh."""
    mesh = pv.Cube().triangulate()
    data = mesh_to_bytes(mesh)

    async with AsyncClient(app=app, base_url=BASE_URL) as ac:
        response = await ac.post("/gen-tetra", content=data)

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/octet-stream"
    vertices, faces = vf_from_bytes(response.content)
    assert not np.isnan(vertices[faces]).any()


@pytest.mark.asyncio
async def test_generate_demo_bracket(app):
    """Test the /get-demo endpoint."""
    async with AsyncClient(app=app, base_url=BASE_URL) as ac:
        response = await ac.get("/get-demo")

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/octet-stream"
