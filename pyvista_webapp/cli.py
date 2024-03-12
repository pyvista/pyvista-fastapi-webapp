"""Command line options for pyvista web application."""

import click
import uvicorn


@click.group()
def cli():
    pass


@cli.command()
@click.option("--port", default=8000, help="FastAPI Port")
@click.option("--host", default="0.0.0.0", help="FastAPI Host.")
@click.option(
    "--reload", default=False, help="Automatically reload backend due to changes.", is_flag=True
)
def start(port: int, host: str, reload: bool):
    """Start the FastAPI application."""
    uvicorn.run("pyvista_webapp.main:app", host=host, port=port, reload=reload)


if __name__ == "__main__":
    cli()
