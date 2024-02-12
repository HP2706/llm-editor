"use client";

import { IconClipboard } from "@tabler/icons-react";
import React from "react";
import { cn } from "@/lib/utils";

export const ButtonsCard = ({
  children,
  className,
  onClick,
  pos, 
}: {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  pos: [number, number] 
  // first number is how much to the top, 
  // the second is how much to the left
}) => {
  console.log("position", `${pos[0]}px`, `${pos[1]}px`)
  return (
    <div style={{ position: 'absolute', top: `${pos[0]}px`, left: `${pos[1]}px` }}
      onClick={onClick}
      className={className}
    >
      <div className="absolute inset-0 dark:bg-dot-white/[0.1] bg-dot-black/[0.1]" />
      <IconClipboard className="absolute top-2 right-2 text-neutral-300 group-hover/btn:block hidden h-4 w-4 transition duration-200" />
      <div className="relative z-50">{children}</div>
    </div>
  );
};
