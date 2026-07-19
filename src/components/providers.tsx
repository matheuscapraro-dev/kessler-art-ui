"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider, signOut, useSession } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { ContentProvider } from "@/components/content-provider";
import { clearAccessTokenCache } from "@/lib/session-token";

/** Refresh token morreu (expirou/revogado): encerra a sessão em vez de acumular 401. */
function SessionErrorWatcher() {
  const { data: session } = useSession();
  useEffect(() => {
    if (session?.error) {
      clearAccessTokenCache();
      void signOut({ callbackUrl: "/entrar?expirado=1" });
    }
  }, [session?.error]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, refetchOnWindowFocus: false },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SessionErrorWatcher />
          <ContentProvider>{children}</ContentProvider>
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
