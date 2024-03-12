import React, { FC } from "react";

type ModalProgressProps = {
  open: boolean;
  title: string;
  progress: number;
};

const ModalProgress: FC<ModalProgressProps> = ({ open, title, progress }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-auto flex">
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="relative p-8 bg-white w-full max-w-md m-auto flex-col flex rounded-lg">
        <div className="text-lg font-medium">{title}</div>
        <div className="w-full bg-gray-200 rounded-full dark:bg-gray-700 my-2">
          <div
            className="bg-blue-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full"
            style={{ width: `${progress}%` }}
          >
            {" "}
            {progress.toFixed(0)}%{" "}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalProgress;
