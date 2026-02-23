import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import Layout from "@/components/layout/Layout";

export default function App({ Component, pageProps }: AppProps) {
  // Create QueryClient instance per app render (avoids sharing state between SSR requests)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 60, // 1 hour default
            gcTime: 1000 * 60 * 60 * 24, // 24 hours
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
