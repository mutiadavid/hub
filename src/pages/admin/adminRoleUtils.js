export const normalizeRoleKey = (role) => {
  const normalized = String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  const roleMap = {
    admin: "admin",
    administrator: "admin",
    approver: "approver",
    customer: "customer",
    rm: "rm",
    relationshipmanager: "rm",
    cocreator: "cocreator",
    creator: "cocreator",
    cochecker: "cochecker",
    checker: "cochecker",
  };

  return roleMap[normalized] || normalized;
};

export const formatRoleLabel = (role) => {
  switch (normalizeRoleKey(role)) {
    case "admin":
      return "Admin";
    case "approver":
      return "Approver";
    case "customer":
      return "Customer";
    case "rm":
      return "RM";
    case "cocreator":
      return "CO Creator";
    case "cochecker":
      return "CO Checker";
    default:
      return role || "Unknown";
  }
};

export const ADMIN_ASSIGNABLE_ROLE_OPTIONS = [
  { value: "rm", label: "RM" },
  { value: "cocreator", label: "CO Creator" },
  { value: "cochecker", label: "CO Checker" },
  { value: "approver", label: "Approver" },
];

export const countUsersByRole = (users) =>
  users.reduce(
    (counts, user) => {
      const roleKey = normalizeRoleKey(user?.role);
      if (roleKey) {
        counts[roleKey] = (counts[roleKey] || 0) + 1;
      }
      return counts;
    },
    {
      admin: 0,
      approver: 0,
      cocreator: 0,
      cochecker: 0,
      customer: 0,
      rm: 0,
    },
  );