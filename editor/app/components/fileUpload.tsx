import '@/app/styles/FileUpload.css'; // Assuming you have a separate CSS file for styles

// FileUpload.tsx
import React, { useRef, useState } from 'react';

interface FileUploadProps {
  label: string;
  accept?: string;
  multiple?: boolean;
  maxFileSizeInBytes?: number;
  onFileChange: (files: File[]) => void; // we give 
}

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  accept = '.md', // try .md, .docx, .txt  perhaps not correct
  multiple = false,
  maxFileSizeInBytes =  500000,
  onFileChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      setSelectedFiles(files);
      onFileChange(files);
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileRemove = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFileChange(newFiles);
  };

  return (
    <div className="file-upload">
      <label htmlFor="file-upload" className="custom-file-upload">
        <i className="fa fa-cloud-upload"></i> {label}
      </label>
      <input
        id="file-upload"
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
      />
      <div className="file-preview">
        {selectedFiles.map((file, index) => (
          <div key={file.name} className="file-item">
            <span>{file.name}</span>
            <button onClick={() => handleFileRemove(index)}>
              <i className="fa fa-remove"></i>
            </button>
          </div>
        ))}
      </div>
      <button onClick={handleButtonClick} className="upload-btn">
        Upload Files
      </button>
    </div>
  );
};

export { FileUpload };
