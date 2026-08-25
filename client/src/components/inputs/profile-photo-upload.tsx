import { useId, useRef, useState } from 'react'
import { CameraIcon, ImagePlusIcon, Trash2Icon, UserIcon } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { trpcClient } from '@/trpc'
import { toast } from '@/components/ui/toast'
import { Field, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { getMediaUrl } from '@/lib/media'

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function ProfilePhotoUpload({
  value,
  onValueChange,
  label = 'Photo',
  disabled,
  className,
}: {
  value: number | null
  onValueChange: (mediaId: number | null) => void
  label?: string
  disabled?: boolean
  className?: string
}) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return trpcClient.media.uploadFile.mutate(formData)
    },
    onSuccess: (media) => {
      onValueChange(media.id)
    },
    onError: (error) => {
      toast.add({
        type: 'error',
        title: 'Failed to upload photo',
        description: error.message,
      })
    },
  })

  const previewUrl = value ? getMediaUrl(value) : null
  const isBusy = disabled || uploadMutation.isPending

  function openFilePicker() {
    if (isBusy) return
    inputRef.current?.click()
  }

  function handleFile(file: File | undefined) {
    if (!file) return
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.add({
        type: 'error',
        title: 'Unsupported file type',
        description: 'Please upload a JPEG, PNG or WebP image.',
      })
      return
    }
    uploadMutation.mutate(file)
  }

  return (
    <Field className={cn('h-full min-h-0', className)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!isBusy) setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          handleFile(e.dataTransfer.files[0])
        }}
        className={cn(
          'group relative min-h-28 w-full flex-1 overflow-hidden rounded-lg border bg-muted/30 transition-colors',
          previewUrl ? 'border-border' : 'border-dashed border-input',
          isDragging && 'border-primary bg-primary/5',
          isBusy && 'pointer-events-none opacity-70',
        )}
      >
        <button
          type="button"
          id={id}
          disabled={isBusy}
          onClick={openFilePicker}
          className="absolute inset-0 flex flex-col items-center justify-center outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          aria-label={value ? 'Change profile photo' : 'Upload profile photo'}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Profile photo"
              className="size-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-1 px-2 text-center">
              {isDragging ? (
                <ImagePlusIcon className="size-5 text-muted-foreground" />
              ) : (
                <UserIcon className="size-5 text-muted-foreground" />
              )}
              <span className="text-[11px] font-medium leading-tight text-muted-foreground">
                {isDragging ? 'Drop here' : 'Add photo'}
              </span>
            </div>
          )}

          {previewUrl && !uploadMutation.isPending && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              <CameraIcon className="size-4 text-white" />
            </span>
          )}
        </button>

        {value && !uploadMutation.isPending && (
          <button
            type="button"
            disabled={isBusy}
            onClick={(e) => {
              e.stopPropagation()
              onValueChange(null)
            }}
            className="absolute top-1.5 right-1.5 z-10 flex size-6 items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow-xs ring-1 ring-border transition-colors hover:bg-destructive/10 hover:text-destructive outline-none"
            aria-label="Remove profile photo"
          >
            <Trash2Icon className="size-3.5" />
          </button>
        )}

        {uploadMutation.isPending && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/70">
            <Spinner />
            <span className="text-xs text-muted-foreground">Uploading...</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        className="sr-only"
        disabled={isBusy}
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          handleFile(file)
        }}
      />
    </Field>
  )
}
