# Use an official Python runtime as a parent image
FROM python:3.12-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy the current directory contents into the container at /usr/src/app
COPY . .

# Install any needed packages specified in pyproject.toml
RUN pip install .

# Make port 8000 available to the world outside this container
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=30s --retries=3 CMD curl --fail http://localhost:8000/health || exit 1

# Run app.py when the container launches
CMD ["uvicorn", "pyvista_webapp.main:app", "--host", "0.0.0.0", "--port", "8000"]
