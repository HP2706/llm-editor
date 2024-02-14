import '@/app/styles/globals.css';

import { AppProps } from 'next/app';
import { AuthProvider } from '@/app/components/authContext';
import Layout from "@/app/styles/layout"
import { ThemeProvider } from '@/app/components/ui/theme-context';

function MyApp({ Component , pageProps } : AppProps ) {
  return (
    <AuthProvider>
      <Layout>
        <ThemeProvider>
            <Component {...pageProps} />
        </ThemeProvider>
      </Layout>
    </AuthProvider>
  );
}

export default MyApp;
