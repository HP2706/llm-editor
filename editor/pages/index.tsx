'client'

import { BasicButton, BorderMagicButton, TailWindConnectButton } from '@/app/components/ui/buttons';
import { useEffect, useState } from "react";

import AuthForm from '@/app/components/authComponent'
import { BackgroundGradientAnimation } from "@/app/components/ui/background-gradient-animation";
import React from "react";
import { useRouter } from "next/router";

export default function HomePage() {
  const router = useRouter();

  const navigateToAnotherPage = (url:string) => {
    router.push(url);
  }; 

  return (
    <BackgroundGradientAnimation>
      <div className="absolute z-50 inset-0 flex items-center justify-center text-white font-bold px-4 pointer-events-none text-3xl text-center md:text-4xl lg:text-7xl">
        <p className="bg-clip-text text-transparent drop-shadow-2xl bg-gradient-to-b from-white/80 to-white/20">
          Let Ai edit your writing
        </p> 
          <BasicButton
            pos={[50, 1550]}
            name={"Authenticate"}
            className={"bg-clip-text text-transparent drop-shadow-2xl bg-gradient-to-b from-white/80 to-white/20"} 
            func={() => navigateToAnotherPage('/authPage')} 
          />
          <BasicButton
            pos={[50, 50]}
            name={"Try it out"}
            className={"bg-clip-text text-transparent drop-shadow-2xl bg-gradient-to-b from-white/80 to-white/20"} 
            func={() => navigateToAnotherPage('/editor')} 
          />
      </div>
    </BackgroundGradientAnimation>
  );
}

