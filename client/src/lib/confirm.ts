import Swal from 'sweetalert2'

const promptConfirm = async (
  message: string,
  title: string = 'Are you sure?',
) => {
  const result = await Swal.fire({
    title: title,
    text: message,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes',
    cancelButtonText: 'No',
  })
  return result.isConfirmed
}

export default promptConfirm
