import os
import random
import string
import tempfile

import pytest


@pytest.fixture
def app():
    from pyvista_webapp.main import app

    return app
