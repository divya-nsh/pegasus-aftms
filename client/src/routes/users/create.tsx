import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/users/create')({
  beforeLoad: () => {
    throw redirect({
      to: '/users',
      search: {
        modal: 'create',
      },
    })
  },
})
