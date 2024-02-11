// theme-context.tsx
import React, { createContext, useContext, useState } from 'react';

interface ThemeContextType {
  color: string;
  setColor: (color: string) => void;
  textColor: string;
  setTextColor: (textColor: string) => void;
  isDark: boolean;
  toggleDarkMode: () => void;
  setTitleColor: (titleColor: string) => void;
  titleColor: string;
  hoverColor: string;
  setHoverColor: (hoverColor: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [color, setColor] = useState('#FFFCF0'); // default color
    const [textColor, setTextColor] = useState('#6F6E69'); // default color
    const [titleColor, setTitleColor] = useState('#9B9B9B'); // default color
    const [isDark, setIsDark] = useState(false); // default color
    const [hoverColor, setHoverColor] = useState('#50E3C2'); // default color

    /* background color #251e1e
    index.tsx:53 text color #7a6161 */
    const toggleDarkMode = () => {
      setIsDark(!isDark);
      setColor(isDark ? '#FFFCF0' : '#100F0F'); // Switch between light and dark background colors
      setTextColor(isDark ? '#6F6E69' : '#CECDC3'); // Switch between light and dark text colors
    };
  return (
    <ThemeContext.Provider value={{
      color, setColor, 
      textColor, setTextColor, 
      isDark, toggleDarkMode, 
      titleColor, setTitleColor,
      hoverColor, setHoverColor
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};