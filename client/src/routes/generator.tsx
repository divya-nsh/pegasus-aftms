import { useAppForm } from '@/components/form/tanstack-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogMain,
  DialogTitle,
} from '@/components/ui/dialog'
import { getErrorMessage } from '@/lib/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'react-hot-toast'

export const Route = createFileRoute('/generator')({
  component: RouteComponent,
})

type Area = {
  code: string
  name: string
  description: string
  address: string
}

function RouteComponent() {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <Button onClick={() => setOpen(true)}>New Area</Button>
      {open && (
        <FormModel
          moduleName="Area"
          onClose={() => setOpen(false)}
          mutationFn={async (data: Area) => {
            console.log(data)
          }}
          title="Create Area"
          description="Create a new area"
          mode="create"
          fields={[
            {
              key: 'code',
              type: 'text',
              label: 'Code',
              required: true,
            },
            {
              key: 'name',
              type: 'text',
              label: 'Name',
              required: true,
            },
            {
              key: 'description',
              type: 'text',
              label: 'Description',
              required: true,
            },
            {
              key: 'address',
              type: 'text',
              label: 'Address',
              required: true,
            },
          ]}
        />
      )}
    </div>
  )
}

type CommonField = {
  key: string
  type: string
  label: string
  placeholder?: string
  required?: boolean
  v?: (value: any) => Promise<string | undefined>
}

type TextField = CommonField & {
  type: 'text'
}

type SelectField = CommonField & {
  type: 'select'
  options: {
    label: string
    value: string
  }[]
}

type FormModelConfig = {
  moduleName: string
  invalidateQueryKey?: string[]
  onClose: () => void
  mutationFn: (data: any) => Promise<void>
  title: string
  description: string
  mode: 'create' | 'edit' | 'view'
  fields: (TextField | SelectField)[]
  onSuccess?: () => void
  asyncValidators?: (value: any) => Promise<string | undefined>
}

function FormModel(props: FormModelConfig) {
  const queryClient = useQueryClient()

  const form = useAppForm({
    defaultValues: {} as Record<string, any>,
    onSubmit: (d) => mutateAsync(d.value),
  })

  const { isPending, mutateAsync } = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      return await props.mutationFn(data)
    },
    onSuccess: async () => {
      props.onSuccess?.()
      props.onClose()
      toast.success(`${props.moduleName} saved successfully`)
      if (props.invalidateQueryKey) {
        await queryClient.resetQueries({ queryKey: props.invalidateQueryKey })
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })

  return (
    <Dialog
      open
      onOpenChange={() => {
        if (isPending) return
        props.onClose()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
        </DialogHeader>

        <DialogMain className="space-y-4">
          {props.fields.map((field) => {
            return (
              <form.AppField
                name={field.key}
                validators={{
                  onChange: ({ value }) => {
                    if (
                      field.required &&
                      (!value ||
                        (typeof value === 'string' && value.trim() === ''))
                    ) {
                      return 'Please fill this field'
                    }
                    return undefined
                  },
                  onBlurAsync: async ({ value }) => {
                    if (props.asyncValidators) {
                      return await props.asyncValidators(value)
                    }
                    return undefined
                  },
                }}
                children={(f) => {
                  if (field.type === 'select') {
                    return (
                      <f.CBasicSelect
                        label={field.label}
                        placeholder={field.placeholder}
                        required={field.required}
                        options={field.options}
                      />
                    )
                  }
                  return (
                    <f.CTextField
                      label={field.label}
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  )
                }}
              />
            )
          })}
        </DialogMain>

        <DialogFooter>
          <Button type="submit" onClick={() => form.handleSubmit()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
