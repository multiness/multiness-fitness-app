import { QueryClient } from "@tanstack/react-query";

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }

  return res;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Sofort als veraltet markieren
      refetchOnMount: true, // Bei Komponenten-Mount neu laden
      refetchOnWindowFocus: true, // Bei Fokuswechsel neu laden
      retry: 1 // Nur einmal wiederholen bei Fehler
    },
  },
});