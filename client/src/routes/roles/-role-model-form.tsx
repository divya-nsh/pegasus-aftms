import { baseFormOptions, useAppForm } from '@/components/form/tanstack-form'
import { BlockingLoaderOverlay } from '@/components/loaders/BlockingLoader'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogMain,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { trpc, trpcClient } from '@/trpc'
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { z } from 'zod'

const schema = z.object({
  id: z.number().optional(),
  name: z.string().min(1),
  description: z.string().min(1),
  permissions: z.set(z.string()),
})

export type RoleModelFormData = z.infer<typeof schema>

function getGroupCheckState(selected: Set<string>, keys: string[]) {
  const selectedCount = keys.filter((key) => selected.has(key)).length
  if (selectedCount === 0) return false
  if (selectedCount === keys.length) return true
  return 'indeterminate' as const
}

function toggleKeys(current: Set<string>, keys: string[], checked: boolean) {
  const next = new Set(current)
  for (const key of keys) {
    if (checked) next.add(key)
    else next.delete(key)
  }
  return next
}

export function RoleModelForm({
  onClose,
  mode,
  initialFormData,
}: {
  onClose: () => void
  mode: 'create' | 'edit'
  initialFormData?: RoleModelFormData
}) {
  const queryClient = useQueryClient()
  const { data: permissionsGroup } = useSuspenseQuery(
    trpc.rolesV2.getPermissions.queryOptions(),
  )
  const form = useAppForm({
    ...baseFormOptions,
    defaultValues: initialFormData ?? {
      name: '',
      description: '',
      permissions: new Set<string>(),
    },
    validators: {
      onDynamic: schema,
    },
    onSubmit: ({ value }) => mutation.mutate(value),
  })

  const mutation = useMutation({
    mutationFn: (data: RoleModelFormData) => {
      if (mode === 'create') {
        return trpcClient.rolesV2.create.mutate({
          ...data,
          permissions: Array.from(data.permissions),
        })
      }
      return trpcClient.rolesV2.update.mutate({
        ...data,
        id: data.id!,
        permissions: Array.from(data.permissions),
      })
    },
    onSuccess: () => {
      toast.success(
        mode === 'create'
          ? 'New role created successfully'
          : 'Role save successfully',
      )
      queryClient.resetQueries(trpc.rolesV2.pathFilter())

      onClose()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <BlockingLoaderOverlay
          show={mutation.isPending}
          message="Saving role..."
        />
        <DialogHeader>
          <DialogTitle className="uppercase">
            {mode === 'create' ? 'Create New Role' : 'Edit Role'}
          </DialogTitle>
        </DialogHeader>
        <DialogMain className="grid gap-4">
          <form.AppField
            name="name"
            children={(f) => (
              <f.CTextField
                required
                label="Name"
                placeholder="Enter role name"
              />
            )}
          />

          <form.AppField
            name="description"
            children={(f) => (
              <f.CTextAreaField
                required
                label="Description"
                placeholder="Enter role description"
              />
            )}
          />

          <form.AppField
            name="permissions"
            children={(f) => {
              const selected = f.state.value
              const totalCount = permissionsGroup.reduce(
                (sum, group) => sum + group.actions.length,
                0,
              )

              return (
                <div className="grid gap-3 mt-4">
                  <div className="flex items-end justify-between gap-2">
                    <Label>Permissions</Label>
                    <p className="text-xs text-muted-foreground">
                      {selected.size} of {totalCount} selected
                    </p>
                  </div>

                  <div className="grid gap-3">
                    {permissionsGroup.map((group) => {
                      const groupKeys = group.actions.map(
                        (action) => action.key,
                      )
                      const groupState = getGroupCheckState(selected, groupKeys)
                      const selectedInGroup = groupKeys.filter((key) =>
                        selected.has(key),
                      ).length

                      return (
                        <div
                          key={group.resource}
                          className="rounded-lg border bg-muted/20"
                        >
                          <label className="flex items-center gap-2 border-b px-3 py-2">
                            <Checkbox
                              checked={groupState === true}
                              indeterminate={groupState === 'indeterminate'}
                              onCheckedChange={(checked) =>
                                f.handleChange(
                                  toggleKeys(selected, groupKeys, checked),
                                )
                              }
                            />
                            <span className="text-sm font-medium">
                              {group.label}
                            </span>
                            <span className="ml-auto text-xs text-muted-foreground">
                              {selectedInGroup} of {groupKeys.length}
                            </span>
                          </label>

                          <div className="grid grid-cols-2 gap-1 p-2 sm:grid-cols-4">
                            {group.actions.map((action) => (
                              <label
                                key={action.key}
                                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60"
                              >
                                <Checkbox
                                  checked={selected.has(action.key)}
                                  onCheckedChange={(checked) =>
                                    f.handleChange(
                                      toggleKeys(
                                        selected,
                                        [action.key],
                                        checked,
                                      ),
                                    )
                                  }
                                />
                                {action.label}
                              </label>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            }}
          />
        </DialogMain>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <form.AppForm>
            <form.SubscribeButton label="Save" />
          </form.AppForm>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
