//import "../styles/globals.css";

import { Quicksand } from 'next/font/google'

const quicksand = Quicksand({
  weight: '400',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={quicksand.className}>{children}</div>
  );
}
