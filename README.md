# PyVista Web Application - Demo

This is a React/Next.js + PyVista demo application designed to show clear separation of concerns between the backend and the frontend in a way that's accessible to Python developers who are excited about learning more about the webstack. It differs from other examples that use dashboarding libraries in that:

- Integrates React/Next.js with Three.js for 3D visualization.
- Uses ArrayBuffer for efficient frontend-backend data transfer.
- Bridges desktop-native PyVista/VTK with web technologies.
- Allows flexible deployment of separate or combined services.

### Design Approach

This demo application takes a different approach to providing a web interface to PyVista and can be generalized to serve any surface-like data. It uses [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer) to rapidly transfer surface data from the backend to the frontend. It's a simple application, and it's meant to demonstrate how you can effectively decouple the backend pre/post-processing of surface data from the frontend, allowing you to pick your tech-stack.

The software stack used here is:

##### Frontend

The frontend is in the `frontend/` directory and uses:

- [React](https://react.dev/)
- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Three.js](https://threejs.org/)

##### Backend

The backend is contained within the `pyvista_webapp/` directory, and contains:

- [FastAPI](https://fastapi.tiangolo.com/)
- [PyVista](https://docs.pyvista.org/)

While deployed as a single application in this demo with the backend and frontend accessible under the same URL, you can easily separate the two.

#### Alternatives

This tech stack of this demo is by no means complete or comprehensive. Instead, it's here to demonstrate how you can use web-native technologies like [React](https://react.dev/) and [Three.js](https://threejs.org/) with desktop native technologies like [VTK](https://vtk.org/) and [PyVista](https://docs.pyvista.org) using [FastAPI](https://fastapi.tiangolo.com/) as a bridge. If you feel comfortable (or want to try) developing using JavaScript/TypeScript and Python, this repository will work for you.

Alternatively, for those who want to remain solely in the Python ecosystem:

##### Dashboarding libraries

There are several dashboarding libraries that allow you to quickly create a web interface from Python. These applications are great for scientists and engineers who are unfamilar with web development and want to quickly create a web-ready frontend.

- [trame](https://kitware.github.io/trame/)
- [Streamlit](https://streamlit.io/)
- [plotly](https://plotly.com/)


## Getting Started

To run the PyVista Web App, you need to clone the repository, install dependencies, and launch the application. Follow these steps to get started:

### Cloning the Repository

First, clone the PyVista Web App repository from GitHub:

```bash
git clone https://github.com/pyvista/pyvista-demo-webapp
cd pyvista-webapp
```

### Installation

To install the necessary dependencies for the PyVista web app, run:

```
pip install .

```

### Launching the Application

Once the installation is complete, you can launch the PyVista web application using:

```
pyvista_webapp start
```

You can access it through your web browser at `localhost:8000`

## Frontend Development

The `frontend/` directory contains the frontend part of the application. If you're interested in developing the frontend, navigate to the `frontend/` directory and use the following commands to get started. This assumes you have the LTS of node installed and yarn installed:


```
cd frontend
yarn install
yarn run dev
```

Running these commands will install all necessary frontend dependencies and start the development server. The web application will be available at `localhost:3000`, where you can see your changes in real-time. Note that you'll need the backend active, so be sure to run `pyvista_webapp start`.

### Generating the Static Pages

Changes to the `frontend/` directory will not be reflected in the 

```
yarn run build
```

## Backend Development

For those looking to contribute to or modify the application, the `-e` (editable) flag can be used during installation to install the package in editable mode.

```
pip install -e .
```

This allows changes in the source code to be immediately reflected in the running application without needing a reinstall. Note that changes to the static pages will need to be made by modifying `frontend/` and then building it, thereby updating the pages within `pyvista_webapp/frontend/`


## License

This repository MIT licensed by the PyVista developers. See `LICENSE`.
