import type { AnyFormApi } from '@tanstack/react-form'
import {
  createFormHook,
  formOptions,
  revalidateLogic,
} from '@tanstack/react-form'
import { fieldContext, formContext } from './form-context'
import * as fields from './field-controllers'
import { SubscribeButton } from './form-components'
import toast from 'react-hot-toast'

// Allow us to bind components to the form to keep type safety but reduce production boilerplate
// Define this once to have a generator of consistent form instances throughout your app
export const { useAppForm } = createFormHook({
  fieldComponents: fields,
  formComponents: {
    SubscribeButton,
  },
  fieldContext,
  formContext,
})

export const handleSubmitInvalid = ({ formApi }: { formApi: AnyFormApi }) => {
  const firstInvalidField = document.querySelector<HTMLInputElement>(
    '[aria-invalid="true"]',
  )
  if (firstInvalidField) {
    firstInvalidField.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
    if ('focus' in firstInvalidField) {
      firstInvalidField.focus()
    }
  }

  const errors = formApi.state.errors
  console.log('Error Validating Form:', errors)

  toast.error('Form validation failed. Please check the form and try again.')
}

export const baseFormOptions = formOptions({
  validationLogic: revalidateLogic(),
  onSubmitInvalid: handleSubmitInvalid,
})
