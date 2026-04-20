export const getChecklistBaseInfoRows = ({
  checklist,
  timing,
  createdByFallback = "N/A",
  rmFallback = "Not assigned",
  coCheckerFallback = "Pending Assignment",
}) => [
  { label: "DCL No", value: checklist?.dclNo || "-" },
  { label: "IBPS No", value: checklist?.ibpsNo || "Not provided" },
  { label: "Date Created", value: timing.createdAtLabel },
  { label: "Loan Type", value: checklist?.loanType || "-" },
  {
    label: "Created By",
    value: checklist?.createdBy?.name || checklist?.createdBy || createdByFallback,
  },
  {
    label: "RM",
    value: checklist?.assignedToRM?.name || checklist?.assignedToRM || rmFallback,
  },
  {
    label: "Co-Checker",
    value:
      checklist?.assignedToCoChecker?.name ||
      checklist?.assignedToCoChecker ||
      coCheckerFallback,
  },
];