import { createFormHook } from '@tanstack/react-form'
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

export const handleSubmitInvalid = () => {
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

  toast.error('Invalid form values')
}
