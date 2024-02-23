'client'

//this page is experimental and not used in the current version of the app
import { BasicButton, BorderMagicButton, TailWindConnectButton } from '@/app/components/ui/buttons';
import { useEffect, useState } from "react";

import AuthForm from '@/app/components/authComponent'
import { BackgroundGradientAnimation } from "@/app/components/ui/background-gradient-animation";
import React from "react";
import { useAuth } from '@/app/components/authContext'
import { useRouter } from "next/router";

export default function AuthPage() {
    const router = useRouter()
    const navigateToAnotherPage = (url:string) => {
        router.push(url);
    }; 

    const { authState, setAuthState } = useAuth();
    const { user, session } = authState;

    useEffect(() => {
        if (user && session) {
            navigateToAnotherPage('/'); 
            // if the user is already authenticated, redirect to the index page
        }
    }, [user, session]);

    return (
        <BackgroundGradientAnimation>
        <div className="absolute z-50 inset-0 flex items-center justify-center text-white font-bold px-4 text-3xl text-center md:text-4xl lg:text-7xl">
            <AuthForm></AuthForm>
        </div>    
        </BackgroundGradientAnimation>
    )
}

