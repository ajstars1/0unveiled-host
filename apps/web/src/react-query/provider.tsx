"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const makeClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 1,
      },
    },
  })

type ReactQueryProviderProps = {
  children: React.ReactNode
}

const client = makeClient()

export const ReactQueryProvider = ({ children }: ReactQueryProviderProps) => {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
