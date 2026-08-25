import { createTRPCClient, httpLink } from '@trpc/client'
import type { AppRouter } from 'server/router'
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'
import queryClient from './lib/query-client'

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpLink({
      url: '/api/trpc',
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: 'include',
        })
      },
    }),
  ],
})

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient: queryClient,
})

export default trpc
