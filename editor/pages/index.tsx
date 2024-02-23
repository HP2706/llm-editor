'client'

import { BasicButton, BorderMagicButton, TailWindConnectButton } from '@/app/components/ui/buttons';
import { useEffect, useState } from "react";

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
        <p className="custom-text-gradient">
          Let Ai edit your writing
        </p> 
        <BasicButton
          pos={[50, 50]}
          name={"Try it out"}
          className={"custom-text-gradient"} 
          func={() => navigateToAnotherPage('/editor')} 
          style={{ fontSize: '1rem' }}
        />
      </div>
    </BackgroundGradientAnimation>
  );
}

