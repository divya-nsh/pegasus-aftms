import { QueryClient } from '@tanstack/react-query'
import { TRPCClientError } from '@trpc/client'

function isUnauthorized(error: unknown) {
  return (
    error instanceof TRPCClientError && error.data?.code === 'UNAUTHORIZED'
  )
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (isUnauthorized(error)) return false
        return failureCount < 3
      },
    },
  },
})

export default queryClient
