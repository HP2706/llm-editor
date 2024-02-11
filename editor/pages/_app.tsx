import { AppProps } from 'next/app';
import Layout from "@/app/components/ui/layout"
import { ThemeProvider } from '@/app/components/ui/theme-context';

function MyApp({ Component , pageProps } : AppProps ) {
  return (
    <ThemeProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ThemeProvider>
  );
}

export default MyApp;
