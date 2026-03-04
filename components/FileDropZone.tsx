'use client';

import { useCallback, useState, useRef } from 'react';

interface FileDropZoneProps {
  onFileSelected: (file: File) => void;
  isLoading: boolean;
}

export default function FileDropZone({ onFileSelected, isLoading }: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
        onFileSelected(file);
      }
    },
    [onFileSelected]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelected(file);
      }
    },
    [onFileSelected]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
        isDragOver
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400 bg-gray-50'
      } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileInput}
        className="hidden"
      />
      <div className="text-4xl mb-4">{isLoading ? '...' : '+'}</div>
      <p className="text-lg font-medium text-gray-700">
        {isLoading ? 'Processing...' : 'Drop your Excel file here'}
      </p>
      <p className="text-sm text-gray-500 mt-2">
        or click to browse (.xlsx, .xls)
      </p>
    </div>
  );
}
