import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div className="p-6 ">
      <div className=" bg-card px-3 pb-2 border-b">
        <p className="text-xl font-bold">Event Grading Scale</p>
      </div>
    </div>
  )
}
