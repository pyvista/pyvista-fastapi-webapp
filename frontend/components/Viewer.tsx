import React, { useEffect, useRef, useState, FC } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import {
  TrackballControls,
  Bounds,
  useBounds,
  Center,
} from "@react-three/drei";
import { EffectComposer, SSAO } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { EdgesGeometry, LineBasicMaterial, LineSegments } from "three";
import { getBackendUrl } from "../utils/backendUrl";
import { SurfaceData } from "./FileLoader";

function Effects() {
  return (
    <EffectComposer enableNormalPass>
      {/* @ts-ignore */}
      <SSAO
        blendFunction={BlendFunction.MULTIPLY} // Use NORMAL to see the effect
        samples={60}
        radius={0.05}
        intensity={10}
      />
    </EffectComposer>
  );
}

const Lights: React.FC = () => {
  return (
    <>
      {/* Ambient light for general illumination */}
      <ambientLight intensity={0.5} />
      {/* Directional light #1 */}
      <directionalLight position={[10, 10, 5]} intensity={0.7} />
      {/* Directional light #2, positioned to simulate sunlight from a different angle */}
      <directionalLight position={[-10, 10, -5]} intensity={0.7} />
    </>
  );
};

type MeshComponentProps = {
  vertices: Float32Array;
  faces: Uint32Array;
  visible: boolean;
  showEdges: boolean;
};

function hasDisposeMethod(object: any): object is { dispose: () => void } {
  return typeof object.dispose === "function";
}

const MeshComponent: FC<MeshComponentProps> = ({
  vertices,
  faces,
  visible,
  showEdges,
}) => {
  const meshRef = useRef<THREE.Mesh | null>(null);
  const edgesRef = useRef<THREE.LineSegments>();
  const { camera, scene } = useThree();
  const bounds = useBounds();
  const perspectiveCamera = camera as THREE.PerspectiveCamera;

  useEffect(() => {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      flatShading: true,
      side: THREE.DoubleSide,
    });
    // const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });

    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));

    geometry.setIndex(new THREE.BufferAttribute(faces, 1));
    geometry.computeVertexNormals();

    if (meshRef.current) {
      meshRef.current.geometry.dispose();
      meshRef.current.geometry = geometry;
      meshRef.current.material = material;
    }

    // Create edges for the mesh
    if (showEdges) {
      const edgesGeometry = new EdgesGeometry(geometry, -0.0); // Generate edges from the mesh
      const edgesMaterial = new LineBasicMaterial({
        color: 0x000000,
        linewidth: 1,
      });
      const edges = new LineSegments(edgesGeometry, edgesMaterial);
      edgesRef.current = edges;
      scene.add(edges);
    }

    // Simply center mesh and then update the camera bounds
    geometry.computeBoundingBox();
    const boundingBox = geometry.boundingBox;
    if (boundingBox) {
      const center = new THREE.Vector3();
      boundingBox.getCenter(center);
      geometry.center();
    }
    bounds.refresh().clip().fit();

    if (meshRef.current) {
      scene.add(meshRef.current);
    }
  }, [vertices, faces, bounds, scene, showEdges]);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.visible = visible;
      if (edgesRef.current && showEdges) {
        edgesRef.current.visible = visible;
      }
    }
  }, [visible, showEdges]);

  return <mesh ref={meshRef} />;
};

type ViewerProps = {
  surfaceData: SurfaceData;
};

const Viewer: React.FC<ViewerProps> = ({ surfaceData }) => {
  const [showSurface, setShowSurface] = useState(true);
  const [showEdges, setShowEdges] = useState(false);

  const SceneClearer: FC = () => {
    const { scene } = useThree();

    useEffect(() => {
      const nonLightObjects = scene.children.filter(
        (child) => !(child instanceof THREE.Light),
      );

      // Call dispose if available for each object
      nonLightObjects.forEach((object) => {
        if (hasDisposeMethod(object)) object.dispose();
        scene.remove(object);
      });
    }, [, scene]);

    return null;
  };

  const hasVertices = surfaceData.vertices && surfaceData.vertices.length > 0;

  return (
    <Canvas>
      <SceneClearer />
      <perspectiveCamera />
      <Lights />
      <TrackballControls rotateSpeed={3.0} />
      <Bounds fit clip observe margin={1.2}>
        {hasVertices && (
          <MeshComponent
            vertices={surfaceData.vertices}
            faces={surfaceData.faces}
            visible={showSurface}
            showEdges={false}
          />
        )}
      </Bounds>
      <Effects />
    </Canvas>
  );
};

export default Viewer;
