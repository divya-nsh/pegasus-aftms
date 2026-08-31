const personnelTypeOptions = [
  { label: 'Pilot', value: 'pilot' },
  { label: 'Trainee', value: 'trainee' },
  { label: 'Instructor', value: 'instructor' },
] as const

const genderOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
] as const

const medicalStatusOptions = [
  { label: 'fit', value: 'fit' },
  { label: 'Unfit', value: 'unfit' },
  { label: 'Pending', value: 'pending' },
] as const

export { personnelTypeOptions, genderOptions, medicalStatusOptions }
