"""
Version info for pyvista web application.

On the ``master`` branch, use 'dev0' to denote a development version.

version_info = 1, 2, 'dev0'

This is used so any Reports() indicate that this isn't a release install.

"""

# major, minor, patch
version_info = 0, 0, "dev0"

# Nice string for the version
__version__ = ".".join(map(str, version_info))
