import { AppProps } from 'next/app';
import Layout from "@/app/layout"
import { ThemeProvider } from '@/app/components/ui/theme-context';
function MyApp({ Component , pageProps } : AppProps ) {
  return (
    <Layout>
      <ThemeProvider>
          <Component {...pageProps} />
      </ThemeProvider>
    </Layout>
  );
}

export default MyApp;
