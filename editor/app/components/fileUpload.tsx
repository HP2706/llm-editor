import '@/app/styles/FileUpload.css'; // Assuming you have a separate CSS file for styles

// FileUpload.tsx
import React, { useEffect, useRef, useState } from 'react';

import {BasicButton} from '@/app/components/ui/buttons';

interface FileUploadProps {
  label: string;
  accept?: string[];
  multiple?: boolean;
  maxFileSizeInBytes?: number;
  add_files: (files: File[]) => void; // we give as input the setter function
}

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  accept = ['.md', '.docx', '.txt'], // try .md, .docx, .txt  perhaps not correct
  multiple = true,
  maxFileSizeInBytes =  500000,
  add_files,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleFileSelect')
    if (event.target.files) {
      const file = Array.from(event.target.files);
      add_files(file);
    }
  };

  const handleButtonClick = () => {
    console.log('handleButtonClick')
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };



  return (
    <div className="file-upload"> 
      <BasicButton
        pos={[50, 50]}
        name={label}
        className={"custom-text-gradient"} 
        func={() => handleButtonClick()}
        style={{ fontSize: '1rem'}}
      />
      <input
        id="file-upload"
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept={accept.join(',')} // Join the accept array to a string
        multiple={multiple}
        onChange={(event) => handleFileSelect(event)}
      />
    </div>
  );
};

export { FileUpload };
