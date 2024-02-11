import "./globals.css";

import Head from 'next/head';
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Head>
        <html lang="en" />
      </Head>
      <div className={inter.className}>{children}</div>
    </>
  );
}
