import { useState } from 'react'

export function useModalForm<TData extends { id?: number | null }>() {
  const [state, setState] = useState<{
    open: boolean
    data?: TData
    readonly?: boolean
  } | null>({
    open: false,
  })

  const openModal = (data?: TData | null, readonly?: boolean) => {
    setState({
      open: true,
      data: data ?? undefined,
      readonly: readonly ?? false,
    })
  }

  const closeModal = () => {
    setState(null)
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const mode = (
    state?.data?.id ? (state.readonly ? 'view' : 'edit') : 'create'
  ) as 'view' | 'edit' | 'create'

  console.log('state', state)

  return {
    modalState: {
      ...state,
      mode,
    },
    openModal,
    closeModal,
  }
}
