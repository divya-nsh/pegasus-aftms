import { useEffect, useMemo, useRef } from 'react'
import type { GradingTemplateFormData } from './grading-template-form'
import { useQuery } from '@tanstack/react-query'
import { trpc } from '@/trpc'
import AppCombobox from '@/components/inputs/combox2'
import { Button } from '@/components/ui/button'
import { CirclePlusIcon, XIcon } from 'lucide-react'
// export function TemplateAttributesLine({
//   attributes,
//   setAttributes,
//   attributeOptions,
// }: {
//   attributes: GradingTemplateFormData['attributes']
//   setAttributes: (attributes: GradingTemplateFormData['attributes']) => void
//   attributeOptions: BasicSelectOption[]
// }) {
//   const [editingIndex, setEditingIndex] = useState<number | null>(null)

//   const saveAttribute = (attributeId: number, weight: number) => {
//     const hasDuplicate = attributes.some(
//       (attribute, index) =>
//         index !== editingIndex && attribute.attributeId === attributeId,
//     )

//     if (hasDuplicate) {
//       toast.error('Attribute already added')
//       return false
//     }

//     const nextItem = { attributeId, weight }
//     const next =
//       editingIndex === null
//         ? [...attributes, nextItem]
//         : attributes.map((item, index) =>
//             index === editingIndex ? nextItem : item,
//           )

//     setAttributes(next)
//     setEditingIndex(null)
//     return true
//   }

//   const handleDeleteAttribute = (index: number) => {
//     setAttributes(
//       attributes.filter((_, attributeIndex) => attributeIndex !== index),
//     )
//     setEditingIndex(null)
//   }

//   const moveAttribute = (index: number, direction: -1 | 1) => {
//     const nextIndex = index + direction
//     if (nextIndex < 0 || nextIndex >= attributes.length) return

//     const next = [...attributes]
//     const current = next[index]
//     const swap = next[nextIndex]
//     if (!current || !swap) return

//     next[index] = swap
//     next[nextIndex] = current
//     setAttributes(next)

//     if (editingIndex === index) {
//       setEditingIndex(nextIndex)
//     } else if (editingIndex === nextIndex) {
//       setEditingIndex(index)
//     }
//   }

//   const totalWeight = attributes.reduce((sum, item) => sum + item.weight, 0)
//   const attributeLabelById = new Map(
//     attributeOptions.map((option) => [Number(option.value), option.label]),
//   )

//   return (
//     <div className="space-y-3">
//       <AttributeForm
//         key={editingIndex ?? 'new'}
//         attributeOptions={attributeOptions}
//         usedAttributeIds={attributes
//           .filter((_, index) => index !== editingIndex)
//           .map((item) => item.attributeId)}
//         initialAttributeId={
//           editingIndex !== null ? attributes[editingIndex].attributeId : null
//         }
//         initialWeight={
//           editingIndex !== null ? attributes[editingIndex].weight : null
//         }
//         isEditing={editingIndex !== null}
//         onSave={saveAttribute}
//         onCancel={() => setEditingIndex(null)}
//       />
//       <div className="overflow-hidden rounded-md border">
//         {attributes.length > 0 ? (
//           <Table>
//             <TableHeader>
//               <TableRow className="bg-muted/40">
//                 <TableHead className="w-12 text-center">#</TableHead>
//                 <TableHead>Attribute</TableHead>
//                 <TableHead className="w-28">Weight</TableHead>
//                 <TableHead className="w-36 text-center">-</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {attributes.map((attribute, index) => (
//                 <TableRow
//                   key={`${attribute.attributeId}-${index}`}
//                   className="even:bg-muted/30"
//                 >
//                   <TableCell className="text-center">{index + 1}</TableCell>
//                   <TableCell>
//                     {attributeLabelById.get(attribute.attributeId) ??
//                       `Attribute #${attribute.attributeId}`}
//                   </TableCell>
//                   <TableCell>{attribute.weight}</TableCell>
//                   <TableCell>
//                     <div className="flex justify-center gap-1">
//                       <Button
//                         type="button"
//                         size="icon-sm"
//                         variant="ghost"
//                         disabled={index === 0}
//                         onClick={() => moveAttribute(index, -1)}
//                       >
//                         <ChevronUpIcon className="size-4" />
//                       </Button>
//                       <Button
//                         type="button"
//                         size="icon-sm"
//                         variant="ghost"
//                         disabled={index === attributes.length - 1}
//                         onClick={() => moveAttribute(index, 1)}
//                       >
//                         <ChevronDownIcon className="size-4" />
//                       </Button>
//                       <Button
//                         type="button"
//                         size="icon-sm"
//                         variant="ghost"
//                         onClick={() => setEditingIndex(index)}
//                       >
//                         <PencilIcon className="size-4" />
//                       </Button>
//                       <Button
//                         type="button"
//                         size="icon-sm"
//                         variant="ghost"
//                         onClick={() => handleDeleteAttribute(index)}
//                       >
//                         <TrashIcon className="size-4" />
//                       </Button>
//                     </div>
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         ) : (
//           <div className="px-4 py-8 text-center text-sm text-muted-foreground">
//             No attributes added yet
//           </div>
//         )}
//       </div>
//       {attributes.length > 0 && (
//         <p className="text-xs text-muted-foreground">
//           Total weight: {totalWeight}
//           {totalWeight !== 100 ? ' (typically 100)' : ''}
//         </p>
//       )}
//     </div>
//   )
// }

// function AttributeForm({
//   attributeOptions,
//   usedAttributeIds,
//   initialAttributeId,
//   initialWeight,
//   isEditing,
//   onSave,
//   onCancel,
// }: {
//   attributeOptions: BasicSelectOption[]
//   usedAttributeIds: number[]
//   initialAttributeId: number | null
//   initialWeight: number | null
//   isEditing: boolean
//   onSave: (attributeId: number, weight: number) => boolean
//   onCancel: () => void
// }) {
//   const [attributeId, setAttributeId] = useState<number | null>(
//     initialAttributeId,
//   )
//   const [weight, setWeight] = useState(
//     initialWeight != null ? String(initialWeight) : '',
//   )

//   const availableOptions = attributeOptions.filter(
//     (option) => !usedAttributeIds.includes(Number(option.value)),
//   )

//   const handleSubmit = (event?: React.SubmitEvent) => {
//     event?.preventDefault()
//     event?.stopPropagation()

//     if (!attributeId) {
//       toast.error('Please select an attribute')
//       return
//     }

//     const parsedWeight = Number(weight)
//     if (
//       !Number.isInteger(parsedWeight) ||
//       parsedWeight < 1 ||
//       parsedWeight > 100
//     ) {
//       toast.error('Weight must be a whole number from 1 to 100')
//       return
//     }

//     if (onSave(attributeId, parsedWeight) && !isEditing) {
//       setAttributeId(null)
//       setWeight('')
//     }
//   }

//   return (
//     <div className="space-y-3">
//       <div className="text-sm font-semibold text-muted-foreground border-b pb-2">
//         Attributes
//       </div>
//       <form onSubmit={handleSubmit}>
//         <div className="flex items-end gap-3">
//           <div className="flex-1">
//             <BasicSelect
//               required
//               allowClear={false}
//               placeholder="Select attribute"
//               options={availableOptions}
//               value={attributeId?.toString() ?? ''}
//               onValueChange={(value) => {
//                 setAttributeId(value ? Number(value) : null)
//               }}
//             />
//           </div>
//           <Input
//             required
//             type="number"
//             min={1}
//             max={100}
//             className="w-28"
//             placeholder="Weight"
//             value={weight}
//             onChange={(e) => setWeight(e.target.value)}
//           />
//           <Button disabled={!attributeId || !weight} type="submit">
//             {isEditing ? 'Save' : 'Add'}
//           </Button>
//           {isEditing && (
//             <Button type="button" variant="outline" onClick={onCancel}>
//               Cancel
//             </Button>
//           )}
//         </div>
//       </form>
//       <p className="text-xs text-muted-foreground">
//         Add grading attributes and assign a weight from 1 to 100 for each. Use
//         the arrows to set display order.
//       </p>
//     </div>
//   )
// }

export function TemplateAttributesLine({
  attributes,
  setAttributes,
}: {
  attributes: GradingTemplateFormData['attributes']
  setAttributes: (attributes: GradingTemplateFormData['attributes']) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { data } = useQuery(trpc.gradingAttribute.getAll.queryOptions())

  const attributeOptions = useMemo(() => {
    const usedSet = new Set(
      attributes.map((attribute) => attribute.attributeId.value),
    )

    const options: {
      label: string
      value: number
    }[] = []

    if (data) {
      for (const attribute of data.items) {
        if (usedSet.has(attribute.id)) continue
        options.push({
          label: attribute.name,
          value: attribute.id,
        })
      }
    }
    return options
  }, [data, attributes])

  return (
    <div>
      <h3 className="text-sm font-semibold border-b pb-2 mb-3">
        Evaluation Attributes
      </h3>

      <ul className="grid gap-2 mt-3">
        {attributes.map((attribute, index) => (
          <li
            key={attribute.attributeId.value}
            className="flex items-center gap-2 border border-dashed rounded-md py-1 px-2"
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
            onValueChange={(item) => {
              if (item) {
                setAttributes([...attributes, { attributeId: item }])
                setTimeout(() => {
                  inputRef.current?.focus()
                  inputRef.current?.scrollIntoView({ behavior: 'smooth' })
                }, 200)
              }
            }}
            icon={<CirclePlusIcon />}
          />
        </li>
      </ul>
    </div>
  )
}
