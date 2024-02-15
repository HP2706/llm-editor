import { ClassValue, clsx } from "clsx";

import { saveAs } from 'file-saver';
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// saves files REMEMEBER TO ADD FILE EXTENSION
export function SaveFile(fileBuffer: any, filename: string) {
  saveAs(fileBuffer, filename);
}
