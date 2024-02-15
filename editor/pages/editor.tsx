'client'

import '@/app/styles/globals.css';

import { BasicButton, BorderMagicButton, TailWindConnectButton } from '@/app/components/ui/buttons';
import { useEffect, useState } from "react";

import { BackgroundGradientAnimation } from "@/app/components/ui/background-gradient-animation";
import {FileUpload} from '@/app/components/fileUpload';
import { MarkdownEditor } from '@/app/components/markdowneditor';
import {MultiFileDisplay} from '@/app/components/ui/fileDisplay';
import React from "react";
import { useAuth } from '@/app/components/authContext';
import { useRouter } from "next/router";
import {useTheme} from '@/app/components/ui/theme-context'; // adjust the path as necessary

export default function Editor() {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [Markdown, setMarkdown] = useState<string | null>('');
    const router = useRouter();

    const appendFiles = (files: File[]) => {
        setSelectedFiles([...selectedFiles, ...files]);
    }

    useEffect(() => {
        console.log('selectedFiles', selectedFiles)
    }, [selectedFiles]);
    
    const { 
        color, setColor, 
        textColor, setTextColor, 
        toggleDarkMode, isDark, 
        titleColor, setTitleColor,
        hoverColor, setHoverColor
    } = useTheme(); 
    
    const { authState, setAuthState } = useAuth();
    const { user, session } = authState;
    
    useEffect(() => {
        if (!user) {
            //think about how this can be done more elegantly, warning user for instance
            router.push('/authPage');
        }
    }, []);

    /* const openFile = async (num : number) => {
        console.log('open file');
        if (!selectedFiles) {
            console.log('no file, select a file first');
            // make popup error message, fading
            return;
        }
        const file = selectedFiles[num];
        const reader = new FileReader();
        reader.onload = function(e) {
            const text = reader.result;
            console.log(text);
            setMarkdown(text as string);
        }
        reader.readAsText(file);
    } */

    const sendFile = async (num : number) => {
        console.log('calling API');
        if (!selectedFiles) {
            console.log('no file, select a file first');
            // make popup error message, fading
            return;
        }
        
        const host = process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000';
        const endpoint = `${host}/api/editDoc`;
        console.log(endpoint);

        const formData = new FormData();
        formData.append("file", selectedFiles[num]);

        const response = await fetch(endpoint, {
            method: "POST",
            body: formData, // Use FormData here instead of JSON
        });
        console.log(response);
        if (!response.ok) {
            console.error("Failed to call API", response.statusText);
            return;
        }
        const data = await response.json();
        console.log(data);
        return (
            <MarkdownEditor markdown={data} setMarkdown={setMarkdown}></MarkdownEditor>
            )
        }

    return (
        <BackgroundGradientAnimation>
          <div className="custom-div">
            <h3>
                <FileUpload label={"upload your file here"} add_files={appendFiles}></FileUpload>
            </h3> 
            <BasicButton 
                pos={[50, 50]} 
                name={"call api"} 
                className={"custom-text-gradient"}
                func={(num : number) => sendFile(num)}> {/* this be done better */}
                style={{ fontSize: '1rem' }}
            </BasicButton>
            <MultiFileDisplay func={sendFile} upperRight={[1700, 300]} lowerLeft={[1400,0]} selectedFiles={selectedFiles}></MultiFileDisplay>
          </div>
        </BackgroundGradientAnimation>
    );
}