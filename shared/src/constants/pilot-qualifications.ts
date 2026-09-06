// Id will be readable Code should not be never changed once set and in production
const pilotQualifications: Readonly<{ id: string; name: string }[]> = [
  { id: "wingman", name: "Wingman" },
  { id: "section-lead", name: "Section Lead" },
  { id: "division-lead", name: "Division Lead" },
  { id: "strike-lead", name: "Strike Lead" },
  { id: "instructor", name: "Instructor" },
  { id: "weapon", name: "Weapon" },
  { id: "functional-check-pilot", name: "Functional Check Pilot" },
  { id: "nvg-high", name: "NVG High" },
  { id: "nvg-low", name: "NVG Low" },
];

const pilotQualificationOptions = pilotQualifications.map((qualification) => ({
  label: qualification.name,
  value: qualification.id,
}));

const getPilotQualification = (id: string) => {
  return pilotQualifications.find((qualification) => qualification.id === id);
};

export {
  pilotQualifications,
  pilotQualificationOptions,
  getPilotQualification,
};
