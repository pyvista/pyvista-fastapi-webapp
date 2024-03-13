# Use an official Python runtime as a parent image
FROM ubuntu:22.04

# Set the working directory in the container
WORKDIR /usr/src/app

# Install Python and pip
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Copy the current directory contents into the container at /usr/src/app
COPY . .

# Install any needed packages specified in pyproject.toml
RUN pip install .

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Run app.py when the container launches
CMD ["uvicorn", "pyvista_webapp.main:app", "--host", "0.0.0.0", "--port", "8000"]
