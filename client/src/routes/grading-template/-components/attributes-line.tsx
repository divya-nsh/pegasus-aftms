import { useMemo, useRef } from 'react'
import type { AttributeFormData, GradingTemplateFormData } from './schema'
import { useQuery } from '@tanstack/react-query'
import { trpc } from '@/trpc'
import AppCombobox from '@/components/inputs/combox2'
import { Button } from '@/components/ui/button'
import { CirclePlusIcon, XIcon } from 'lucide-react'
import { wait } from '@/lib/utils'

export function TemplateAttributesLine({
  attributes,
  setAttributes,
}: {
  attributes: GradingTemplateFormData['attributes']
  setAttributes: (attributes: GradingTemplateFormData['attributes']) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { data } = useQuery(trpc.gradingAttribute.getAll.queryOptions())
  const existingItemSet = useMemo(() => {
    return new Set(attributes.map((attribute) => attribute.attributeId.value))
  }, [attributes])

  const attributeOptions = useMemo(() => {
    const options: {
      label: string
      value: number
    }[] = []

    if (data) {
      for (const attribute of data.items) {
        if (existingItemSet.has(attribute.id)) continue
        options.push({
          label: attribute.name,
          value: attribute.id,
        })
      }
    }
    return options
  }, [data, existingItemSet])

  const addItem = async (item: AttributeFormData['attributeId'] | null) => {
    if (!item) return
    if (existingItemSet.has(item.value)) {
      alert('Attribute already in list')
      return
    }
    setAttributes([...attributes, { attributeId: item }])
    await wait(200)
    inputRef.current?.focus()
    inputRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div>
      <h3 className="text-sm font-semibold border-b pb-2 mb-3 mt-3">
        Evaluation Attributes
      </h3>

      <ul className="grid gap-2 mt-3">
        {attributes.map((attribute, index) => (
          <li
            key={attribute.attributeId.value}
            className="flex items-center gap-2 border border-dashed rounded-md py-1 px-2 shadow-xs"
          >
            <Button
              variant="ghost-destructive"
              size="icon-sm"
              className="text-destructive"
            >
              <XIcon className="size-4 " />
            </Button>
            <span>{index + 1}.</span>
            <p className="text-sm font-semibold ">
              {attribute.attributeId.label}
            </p>
          </li>
        ))}
        <li>
          <AppCombobox
            inputRef={inputRef}
            placeholder="Select & add attribute to list"
            items={attributeOptions}
            value={null}
            onValueChange={addItem}
            icon={<CirclePlusIcon />}
          />
        </li>
      </ul>
    </div>
  )
}
