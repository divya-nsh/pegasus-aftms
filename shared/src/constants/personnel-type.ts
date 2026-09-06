const personnelTypes = [
  {
    name: "Trainee",
    id: "trainee",
  },
  {
    name: "Instructor",
    id: "instructor",
  },
  {
    name: "Admin",
    id: "admin",
  },
] as const;

const personnelTypeOptions = personnelTypes.map((type) => ({
  label: type.name,
  value: type.id,
}));

const getPersonnelType = (id: string) => {
  return personnelTypes.find((type) => type.id === id);
};

export { personnelTypes, getPersonnelType, personnelTypeOptions };
