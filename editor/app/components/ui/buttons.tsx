

"use client";

import {ButtonsCard} from "@/app/components/ui/tailwind-css-buttons";
import { FunctionsError } from "@supabase/supabase-js";

export const BorderMagicButton = ({pos, name, className, func} : any) : React.JSX.Element=> {
    return (
        <ButtonsCard pos={pos} className={className} key={null} onClick={func}>
            <button className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
            <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
            <p style={{ fontSize: '1rem' }} className="bg-clip-text text-transparent drop-shadow-2xl bg-gradient-to-b from-white/80 to-white/20">
               {name}
            </p>
            </span>
            </button>
        </ButtonsCard>
    );
}

export const TailWindConnectButton = ({pos, name, className, func} : any) : React.JSX.Element=> {
    return (
        <ButtonsCard pos={pos} className={className} key={null} onClick={func}>
            <button className="bg-transparent no-underline group cursor-pointer relative shadow-2xl shadow-zinc-900 rounded-full p-px text-xs font-semibold leading-6 text-white inline-block">
            <span className="absolute inset-0 overflow-hidden rounded-full">
                <span className="absolute inset-0 rounded-full bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(56,189,248,0.6)_0%,rgba(56,189,248,0)_75%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </span>
            <div className="relative flex space-x-2 items-center z-10 rounded-full bg-zinc-950 py-0.5 px-4 ring-1 ring-white/10 ">
                <p style={{ fontSize: '1rem' }} className="bg-clip-text text-transparent drop-shadow-2xl bg-gradient-to-b from-white/80 to-white/20">
                    {name}
                </p>
                <svg
                fill="none"
                height="16"
                viewBox="0 0 24 24"
                width="16"
                xmlns="http://www.w3.org/2000/svg"
                >
                <path
                    d="M10.75 8.75L14.25 12L10.75 15.25"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                />
                </svg>
            </div>
            <span className="absolute -bottom-0 left-[1.125rem] h-px w-[calc(100%-2.25rem)] bg-gradient-to-r from-emerald-400/0 via-emerald-400/90 to-emerald-400/0 transition-opacity duration-500 group-hover:opacity-40" />
            </button>
        </ButtonsCard>
    );
}

export const BasicButton = ({pos, name, className, func, style} : any)  : React.JSX.Element=> {
    
    return (
        <ButtonsCard pos={pos} className={`${className} pointer-events-auto`} key={null} onClick={func}>
            <div className="bg-transparent visible">
                <p style={style} className="bg-clip-text text-transparent drop-shadow-2xl bg-gradient-to-b from-white/80 to-white/20">
                    {name}
                </p>
            </div>
        </ButtonsCard>
    )
}