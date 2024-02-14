import { NightIcon, SunIcon } from '@/app/components/ui/icons';
import { animated, useSpring } from 'react-spring';

import React from 'react';

// Assuming the rest of your imports and setup remains the same

interface DarkModeTogglerProps {
  isDark: boolean;
  toggleDarkMode: () => void;
  color: string;
  hoverColor: string;
}

// make this animated at some point
export const DarkModeToggler = ({ isDark, toggleDarkMode, color, hoverColor }: DarkModeTogglerProps) => {
  const buttonStyle = {
    position: 'relative' as 'relative',
    color: color,
    top: 5,
    left: 5,
    display: 'flex',
    alignItems: 'center' as 'center',
    padding: '10px', // Adjust padding as needed
    width: '60px', // Adjust width as needed for oval shape
    height: '30px', // Adjust height as needed for oval shape
    borderRadius: '15px', // This should be half of the height to create an oval shape
    backgroundColor: 'inherit', // This will make the button have the same background color as its parent
    border: 'none', // Remove border if not needed
    cursor: 'pointer', // Optional, for a pointer cursor on hover
    // Other styles...
  };

  return (
    <button style={{ ...buttonStyle }} onClick={toggleDarkMode} className="shadow-[inset_0_0_0_2px_#616467] rounded-full tracking-widest uppercase font-bold bg-transparent hover:bg-[#616467] hover:text-white dark:text-neutral-200 transition duration-200">
        <div style={{width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}> {/* Adjust size as needed */}
            {isDark ? <SunIcon /> : <NightIcon />}
        </div>
    </button>
  );
};
