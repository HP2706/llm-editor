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
import { useAuth } from '@/app/components/authContext';
import { useRouter } from "next/router";
import {useTheme} from '@/app/components/ui/theme-context'; // adjust the path as necessary

export default function Editor() {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const router = useRouter();

    const appendFiles = async (files: File[]) => {
        setSelectedFiles([...selectedFiles, ...files]);
    }
    
    const { authState, setAuthState } = useAuth();
    const { user, session } = authState;
    
    useEffect(() => {
        if (!user) {
            //think about how this can be done more elegantly, warning user for instance
            router.push('/authPage');
        }
    }, []);

    const getEdits = async (num : number) => { 
        // this function is not working right now
        /* console.log('calling API');
        if (!selectedFiles) {
            console.log('no file, select a file first');
            // make popup error message, fading
            return;
        }

        const testnum = 0; // we are setting this for testing purposes
        
        const host = process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000';
        const endpoint = `${host}/api/convertDoc`;
        console.log(endpoint);

        
        //formData.append("useAsync", "true"); // Assuming you want to use async processing, adjust the value as needed

        const response = await fetch(endpoint, {
            method: "POST",
            body: {
                doc : {
                        title : selectedFiles[num].name.split('.').slice(0, -1).join('.'),
                        n_tokens : 100, // dummyNumber CHANGE THIS IMPORTANT
                        },
                useAsync : true
                
            }
        });
        console.log(response);
        if (!response.ok) {
            console.error("Failed to call API", response.statusText);
            return;
        }
        const data = await response.json();
        console.log(data); */
        }

    return (
        <BackgroundGradientAnimation>
            <div className="custom-div">
                <h3>
                    <FileUpload label={"upload your file here"} add_files={appendFiles}></FileUpload>
                </h3> 
                <div>
                    <MultiFileDisplay selectedFiles={selectedFiles}></MultiFileDisplay>
                </div>
                {(selectedFiles.length !== 0) && 
                    <MarkdownEditor fileState={selectedFiles[0]}/>
               }
            </div>
        </BackgroundGradientAnimation>
    );
}