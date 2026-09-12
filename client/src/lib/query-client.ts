import { QueryClient } from '@tanstack/react-query'
import { TRPCClientError } from '@trpc/client'

const MAX_RETRIES = 3

function getHttpStatus(error: unknown): number | undefined {
  if (!(error instanceof TRPCClientError)) return undefined
  const httpStatus = error.data?.httpStatus
  return typeof httpStatus === 'number' ? httpStatus : undefined
}

function shouldRetryQuery(failureCount: number, error: unknown) {
  if (failureCount >= MAX_RETRIES) return false

  const httpStatus = getHttpStatus(error)
  // Explicit client/app errors (400, 401, 404, etc.) should not be retried.
  if (httpStatus !== undefined && httpStatus < 500) return false

  return true
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetryQuery,
    },
  },
})

export default queryClient
