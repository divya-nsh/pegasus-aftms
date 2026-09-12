import { MultiSelectCheckbox } from '@/components/inputs/multi-select-checkbox'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/multicheck')({
  component: RouteComponent,
})

function RouteComponent() {
  const [value, setValue] = useState<string[]>([])

  return (
    <div className="p-8">
      <MultiSelectCheckbox
        label="Status"
        options={[
          { label: 'Published', value: 'published' },
          { label: 'Unpublished', value: 'unpublished' },
          { label: 'Archived', value: 'archived' },
        ]}
        value={value}
        onChange={setValue}
      />
    </div>
  )
}
