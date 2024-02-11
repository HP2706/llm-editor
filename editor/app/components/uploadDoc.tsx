import { ChangeEvent, useState } from "react";

interface UploadDocProps {
    file: File | null;
    setFile: (file: File | null) => void;
}

function UploadDoc({ file, setFile }: UploadDocProps) {
    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files ? event.target.files[0] : null;
        if (file) {
            const validExtensions = ['.md', '.docx', '.txt'];
            const fileExtension = file.name.split('.').pop();
            if (validExtensions.includes('.' + fileExtension)) {
                setFile(file);
            } else {
                alert("Please select a Markdown, DOCX, or TXT file.");
                setFile(null);
            }
        }
    };

    return (
        <div>
            <input type="file" onChange={handleFileChange} />
            {file && <p>File name: {file.name}</p>}
        </div>
    );
}

export { UploadDoc };