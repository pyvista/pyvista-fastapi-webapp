import React, { useState } from 'react';
import type { NextPage } from 'next';
import Viewer from '../components/Viewer';
import FileLoader from '../components/FileLoader';

const Home: NextPage = () => {
  const [surfaceData, setSurfaceData] = useState({
    vertices: new Float32Array(),
    faces: new Uint32Array()
  });
  return (
    <div className="flex flex-col h-screen">
      <div className="flex justify-between items-center w-full z-10 absolute">
        <FileLoader setSurfaceData={setSurfaceData}/>
      </div>
      <Viewer surfaceData={surfaceData} />
    </div>
  );
};

export default Home;
