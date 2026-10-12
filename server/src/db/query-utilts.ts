export const withAuditColumns = () => {
  return {
    createdBy: {
      columns: {
        id: true,
        name: true,
        username: true,
      },
    },
    updatedBy: {
      columns: {
        id: true,
        name: true,
        username: true,
      },
    },
  } as const;
};
