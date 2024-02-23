'client'

import '@/app/styles/globals.css';

import { BasicButton, BorderMagicButton, TailWindConnectButton } from '@/app/components/ui/buttons';
import { docx_to_html, lexical_to_html, markdown_to_html } from '@/lib/lexicalConversion';
import { useEffect, useState } from "react";

import { BackgroundGradientAnimation } from "@/app/components/ui/background-gradient-animation";
import { EditorState } from 'lexical'
import {FileUpload} from '@/app/components/fileUpload';
import Head from 'next/head';
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { MarkdownEditor } from '@/app/components/editor/markdowneditor';
import {MultiFileDisplay} from '@/app/components/ui/fileDisplay';
import React from "react";
import { useRouter } from "next/router";
import {useTheme} from '@/app/components/ui/theme-context'; // adjust the path as necessary

export default function Editor() {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [fileIdx, setFileIdx] = useState<number | null>(null);
    const router = useRouter();

    const appendFiles = async (files: File[]) => {
        setSelectedFiles([...selectedFiles, ...files]);
    }

    return (
        <BackgroundGradientAnimation>
            <div className="custom-div">
                <h3>
                    <FileUpload label={"upload your file here"} add_files={appendFiles}></FileUpload>
                </h3> 
                <div>
                    <MultiFileDisplay setFileIdx={setFileIdx} selectedFiles={selectedFiles}></MultiFileDisplay>
                </div>
                {(selectedFiles.length !== 0 && fileIdx !== null) && 
                    <MarkdownEditor fileState={selectedFiles[fileIdx]}/>
               }
            </div>
        </BackgroundGradientAnimation>
    );
}