import React, { useState } from "react";

export default function FileUploader({ title, isMandatory = false }) {
  const [files, setFiles] = useState([]);

  const handleUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files);
    setFiles([...files, ...uploadedFiles]);
  };

  const removeFile = (index) => {
    const temp = [...files];
    temp.splice(index, 1);
    setFiles(temp);
  };

  return (
    <div className="space-y-2">
      <div className={`font-semibold ${isMandatory ? "text-red-600" : ""}`}>{title}</div>

      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded p-4 cursor-pointer hover:bg-gray-100">
        <span className="text-4xl mb-2">☁️</span>
        <span className="text-sm">{isMandatory ? "Click to upload DCL document" : "Click to upload additional documents"}</span>
        <input type="file" className="hidden" onChange={handleUpload} multiple />
      </label>

      {files.length > 0 && (
        <div className="space-y-1 mt-2">
          {files.map((file, i) => (
            <div
              key={i}
              className="flex justify-between items-center border p-2 rounded bg-gray-50"
            >
              <span className="text-sm">{file.name}</span>
              <button
                className="text-red-600 text-sm underline"
                onClick={() => removeFile(i)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}