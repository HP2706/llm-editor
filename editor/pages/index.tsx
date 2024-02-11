'client'

import { BackgroundGradientAnimation } from "@/app/components/ui/background-gradient-animation";
import React from "react";
import { useRouter } from "next/router";
import {useTheme} from '@/app/components/ui/theme-context'; // adjust the path as necessary
export default function Home() {
    const router = useRouter();
    const { 
        color, setColor, 
        textColor, setTextColor, 
        toggleDarkMode, isDark, 
        titleColor, setTitleColor,
        hoverColor, setHoverColor
    } = useTheme(); 

    const callAPI = async () => {
        console.log('calling API');
        const host = process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000';
        const endpoint = `${host}/api/Ping`;
        console.log(endpoint);
        const response = await fetch(endpoint, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });
        console.log(response);
        const data = await response.json();
        console.log(data);
    }

    return (
        <BackgroundGradientAnimation>
          <div className="absolute z-50 inset-0 flex items-center justify-center text-white font-bold px-4 pointer-events-none text-3xl text-center md:text-4xl lg:text-7xl">
            <p className="bg-clip-text text-transparent drop-shadow-2xl bg-gradient-to-b from-white/80 to-white/20">
              Gradients X Animations
            </p>
          </div>
        </BackgroundGradientAnimation>
    );
}


