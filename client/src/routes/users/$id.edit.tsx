import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/users/$id/edit')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/users',
      search: {
        modal: 'edit',
        docId: Number(params.id),
      },
    })
  },
})
