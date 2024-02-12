'client'

import { useEffect, useState } from "react";

import { BackgroundGradientAnimation } from "@/app/components/ui/background-gradient-animation";
import React from "react";
import {UploadDoc} from '@/app/components/uploadDoc';
import { useAuth } from '@/app/components/authContext';
import { useRouter } from "next/router";
import {useTheme} from '@/app/components/ui/theme-context'; // adjust the path as necessary

export default function Editor() {
    const [File, setFile] = useState<File | null>(null);
    const router = useRouter();
    const { 
        color, setColor, 
        textColor, setTextColor, 
        toggleDarkMode, isDark, 
        titleColor, setTitleColor,
        hoverColor, setHoverColor
    } = useTheme(); 
    
    /* const { authState, setAuthState } = useAuth();
    const { user, session } = authState;
    
    useEffect(() => {
        if (!user) {
            router.push('/authPage');
        }
    }, []); */

    const UploadFile = async () => {
        console.log('calling API');
        if (!File) {
            console.log('no file, select a file first');
            return;
        }
        const host = process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000';
        const endpoint = `${host}/api/editDoc`;
        console.log(endpoint);

        const formData = new FormData();
        formData.append("file", File);

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
        }

    return (
        <BackgroundGradientAnimation>
          <div className="absolute z-50 inset-0 flex items-center justify-center text-white font-bold px-4 pointer-events-none text-3xl text-center md:text-4xl lg:text-7xl">
            <p className="bg-clip-text text-transparent drop-shadow-2xl bg-gradient-to-b from-white/80 to-white/20">
              Gradients X Animations
            </p>
            <UploadDoc file={File} setFile={setFile}></UploadDoc>
            <h3>
                <button onClick={UploadFile}>Call API</button>
            </h3> 
          </div>
        </BackgroundGradientAnimation>
    );
}