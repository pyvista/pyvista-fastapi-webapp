import axios from "axios";
import React, { useState, useRef } from "react";
import ModalProgress from "./ModalProgress";
import { getBackendUrl } from "../utils/backendUrl";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js";
import * as THREE from "three";

const fileTypes = {
  surface: ".stl,.ply",
};

type UploadProgressCallback = (progress: number) => void;

const serializeGeometryData = (geometry: THREE.BufferGeometry): ArrayBuffer => {
  const verticesArray = geometry.attributes.position.array;
  const vertexCount = geometry.attributes.position.count;
  const hasFaces = geometry.index !== null;
  const facesArray = hasFaces
    ? new Int32Array(geometry.index?.array ?? [])
    : new Int32Array(0);

  // Calculate the size of the final buffer
  // 4 bytes for vertex count, vertices data, and faces data
  const bufferSize = 4 + verticesArray.byteLength + facesArray.byteLength;
  const buffer = new ArrayBuffer(bufferSize);
  const dataView = new DataView(buffer);

  // Set vertex count (int32)
  dataView.setInt32(0, vertexCount, true);
  let offset = 4;

  // Copy vertices data (float32 for each vertex coordinate)
  new Float32Array(buffer, offset, verticesArray.length).set(verticesArray);
  offset += verticesArray.byteLength;

  // Copy faces data (int32 for each face index)
  new Int32Array(buffer, offset, facesArray.length).set(facesArray);

  return buffer;
};

const sendGeometryDataToBackend = async (
  buffer: ArrayBuffer,
  setUploadProgress: UploadProgressCallback,
) => {
  const url = `${getBackendUrl()}/gen-tetra`;

  try {
    const response = await axios.post(url, buffer, {
      headers: {
        "Content-Type": "application/octet-stream",
      },
      responseType: "arraybuffer",
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total === null || progressEvent.total === undefined) {
          return;
        }
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total / 4 + 50,
        );
        setUploadProgress(percentCompleted);
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to send geometry data to backend: ${error}`);
  }
};

export type SurfaceData = {
  vertices: Float32Array;
  faces: Uint32Array;
};

type FileLoaderProps = {
  setSurfaceData: (data: SurfaceData) => void;
};

const FileLoader: React.FC<FileLoaderProps> = ({ setSurfaceData }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [processTitle, setProcessTitle] = useState("Uploading");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleGetDemo = async () => {
    try {
      const response = await axios.get(`${getBackendUrl()}/get-demo`, {
        responseType: "arraybuffer",
      });
      const arrayBuffer = response.data;
      const dataView = new DataView(arrayBuffer);
      const numVertices = dataView.getUint32(0, true); // true for little-endian
      const verticesData = new Float32Array(arrayBuffer, 4, numVertices * 3);
      const facesData = new Uint32Array(arrayBuffer, 4 + numVertices * 12);
      setSurfaceData({ vertices: verticesData, faces: facesData });
    } catch (error) {
      throw new Error(`Failed to get aero bracket: ${error}`);
    }
  };

  const uploadGeometry = async (geometry: THREE.BufferGeometry) => {
    const buffer = serializeGeometryData(geometry);
    setProcessTitle("Uploading and Generating Tetrahedra");
    const arrayBuffer = await sendGeometryDataToBackend(
      buffer,
      setUploadProgress,
    );

    try {
      const dataView = new DataView(arrayBuffer);
      const numVertices = dataView.getUint32(0, true); // true for little-endian
      const verticesData = new Float32Array(arrayBuffer, 4, numVertices * 3);
      const facesData = new Uint32Array(arrayBuffer, 4 + numVertices * 12);
      setSurfaceData({ vertices: verticesData, faces: facesData });
    } catch (error) {
      console.error("Failed to fetch surface data:", error);
    }

    setUploadProgress(100);
    setProcessDialogOpen(false);
  };

  const loadFile = (file: File | undefined) => {
    if (!file) return;
    setProcessDialogOpen(true);
    setProcessTitle("Processing");
    setUploadProgress(0);
    console.log("starting...");
    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target === null) {
        return;
      }
      const buffer = event.target.result;
      const loader = file.name.endsWith(".stl")
        ? new STLLoader()
        : new PLYLoader();
      loader.load(
        URL.createObjectURL(file),
        (geometry) => {
          // onload
          // setProcessDialogOpen(false);
          uploadGeometry(geometry);
          console.log("loaded", geometry);
        },
        (event) => {
          // onProgress callback
          if (event.lengthComputable) {
            const percentLoaded = Math.round((event.loaded / event.total) * 50);
            // console.log(`Progress: ${percentLoaded}%`);
            setUploadProgress(percentLoaded);
          }
        },
        (error) => {
          // onError callback
          console.error("Error loading file", error);
          setProcessDialogOpen(false);
        },
      );
    };
    reader.readAsArrayBuffer(file);
    console.log("called");
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Only proceed if a file is selected
    if (event.target.files === null) {
      return;
    }
    if (event.target.files.length > 0) {
      console.log(`file ${event.target.files[0]} selected`);
      setSelectedFile(event.target.files[0]);
      loadFile(event.target.files[0]);
      event.target.value = "";
    }
  };

  const handleLoadSurfaceClicked = async () => {
    setTimeout(() => {
      if (fileInputRef.current !== null) {
        fileInputRef.current.click();
      }
    }, 0);
  };

  const handleClear = async () => {
    setSurfaceData({ vertices: new Float32Array(), faces: new Uint32Array() });
  };

  return (
    <div className="relative inline-block text-left p-4">
      <div className="flex justify-start items-center">
        <button
          type="button"
          className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-lg px-4 py-2 bg-white text-base text-gray-700 hover:bg-gray-100 mr-2"
          style={{ whiteSpace: "nowrap", textAlign: "center" }}
          onClick={handleLoadSurfaceClicked}
        >
          Import Surface
        </button>
        <button
          type="button"
          className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-lg px-4 py-2 bg-white text-base text-gray-700 hover:bg-gray-100 mr-2"
          style={{ whiteSpace: "nowrap", textAlign: "center" }}
          onClick={handleGetDemo}
        >
          Demo - Cube
        </button>
        <button
          type="button"
          className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-lg px-4 py-2 bg-white text-base text-gray-700 hover:bg-gray-100 mr-2"
          onClick={handleClear}
        >
          Clear
        </button>
      </div>

      {/* Trigger file input click through button */}
      <input
        type="file"
        onChange={handleFileSelected}
        style={{ display: "none" }} // Hide the file input
        ref={fileInputRef}
        accept={fileTypes["surface"]}
      />

      <ModalProgress
        open={processDialogOpen}
        title={processTitle}
        progress={uploadProgress}
      />
    </div>
  );
};

export default FileLoader;
