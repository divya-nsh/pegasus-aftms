import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/multicheck')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div className="p-8"></div>
}
