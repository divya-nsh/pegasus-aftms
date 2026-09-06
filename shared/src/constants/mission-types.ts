// Id will be readable Code should not be never changed once set and in production
const missionTypes: Readonly<
  { id: string; name: string; default?: boolean }[]
> = [
  { id: "flight", name: "Flight", default: true },
  { id: "simulator", name: "Simulator" },
  {
    id: "lecture",
    name: "Lecture",
  },
  {
    id: "exam",
    name: "Exam",
  },
  {
    id: "cai",
    name: "CAI",
  },
  {
    id: "working-group",
    name: "Working Group",
  },
  {
    id: "tour",
    name: "Tour",
  },
  {
    id: "lab",
    name: "Lab",
  },
];

const missionTypeOptions = missionTypes.map((type) => ({
  label: type.name,
  value: type.id,
}));

const getMissionType = (id: string) => {
  return missionTypes.find((missionType) => missionType.id === id);
};

const defaultMissionTypeId =
  missionTypes.find((type) => type.default)?.id ?? missionTypes[0]!.id;

export {
  missionTypes,
  missionTypeOptions,
  getMissionType,
  defaultMissionTypeId,
};
