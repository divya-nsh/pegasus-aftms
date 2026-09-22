import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

const users = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'admin',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'user',
  },
  {
    id: 3,
    name: 'Michael Johnson',
    email: 'michael.johnson@example.com',
    role: 'user',
  },
  {
    id: 4,
    name: 'Emily Davis',
    email: 'emily.davis@example.com',
    role: 'admin',
  },
  {
    id: 5,
    name: 'Chris Brown',
    email: 'chris.brown@example.com',
    role: 'user',
  },
  {
    id: 6,
    name: 'Amanda Wilson',
    email: 'amanda.wilson@example.com',
    role: 'user',
  },
  {
    id: 7,
    name: 'David Martinez',
    email: 'david.martinez@example.com',
    role: 'user',
  },
  {
    id: 8,
    name: 'Sarah Anderson',
    email: 'sarah.anderson@example.com',
    role: 'admin',
  },
  {
    id: 9,
    name: 'James Taylor',
    email: 'james.taylor@example.com',
    role: 'user',
  },
  {
    id: 10,
    name: 'Jessica Thomas',
    email: 'jessica.thomas@example.com',
    role: 'user',
  },
  {
    id: 11,
    name: 'Daniel Jackson',
    email: 'daniel.jackson@example.com',
    role: 'user',
  },
  {
    id: 12,
    name: 'Laura White',
    email: 'laura.white@example.com',
    role: 'user',
  },
  {
    id: 13,
    name: 'Matthew Harris',
    email: 'matthew.harris@example.com',
    role: 'admin',
  },
  {
    id: 14,
    name: 'Olivia Martin',
    email: 'olivia.martin@example.com',
    role: 'user',
  },
  {
    id: 15,
    name: 'Ryan Thompson',
    email: 'ryan.thompson@example.com',
    role: 'user',
  },
  {
    id: 16,
    name: 'Sophia Garcia',
    email: 'sophia.garcia@example.com',
    role: 'user',
  },
  {
    id: 17,
    name: 'Kevin Robinson',
    email: 'kevin.robinson@example.com',
    role: 'user',
  },
  {
    id: 18,
    name: 'Megan Clark',
    email: 'megan.clark@example.com',
    role: 'admin',
  },
  {
    id: 19,
    name: 'Brian Lewis',
    email: 'brian.lewis@example.com',
    role: 'user',
  },
  {
    id: 20,
    name: 'Rachel Walker',
    email: 'rachel.walker@example.com',
    role: 'user',
  },
]

function Home() {
  return (
    <div className="p-8 bg-slate-100 min-h-screen">
      <div className=" bg-card rounded-lg p-4">
        <p className="text-2xl font-bold">Welcome to AFTMS</p>
      </div>
    </div>
  )
}
