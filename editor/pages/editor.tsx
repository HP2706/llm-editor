'client'

import '@/app/styles/globals.css';

import { BasicButton, BorderMagicButton, TailWindConnectButton } from '@/app/components/ui/buttons';
import { useEffect, useState } from "react";

import { BackgroundGradientAnimation } from "@/app/components/ui/background-gradient-animation";
import {FileUpload} from '@/app/components/fileUpload';
import { MarkdownEditor } from '@/app/components/markdowneditor';
import React from "react";
import { useAuth } from '@/app/components/authContext';
import { useRouter } from "next/router";
import {useTheme} from '@/app/components/ui/theme-context'; // adjust the path as necessary

export default function Editor() {
    const [Files, setFiles] = useState<File[] | null>(null);
    const [Markdown, setMarkdown] = useState<string | null>('');
    const router = useRouter();
    
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

    const sendFile = async (num : number) => {
        console.log('calling API');
        if (!Files) {
            console.log('no file, select a file first');
            // make popup error message, fading
            return;
        }
        
        const host = process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000';
        const endpoint = `${host}/api/editDoc`;
        console.log(endpoint);

        const formData = new FormData();
        formData.append("file", Files[num]);

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
            <p className="custom-paragraph">
                
            </p>
            
            <h3>
                <FileUpload label={"upload your file here"} onFileChange={setFiles}></FileUpload>
            </h3> 
            <BasicButton 
                pos={[50, 50]} 
                name={"call api"} 
                className={"bg-clip-text text-transparent drop-shadow-2xl bg-gradient-to-b from-white/80 to-white/20"}
                func={(num : number) => sendFile(num)}> {/* this be done better */}
            </BasicButton>
          </div>
        </BackgroundGradientAnimation>
    );
}