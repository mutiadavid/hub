const TAG_TONES = {
  default: { text: "#374151", border: "#d1d5db" },
  blue: { text: "#164679", border: "#9fb8d7" },
  processing: { text: "#164679", border: "#9fb8d7" },
  geekblue: { text: "#1d4f91", border: "#a9c0e4" },
  cyan: { text: "#155e75", border: "#a5d8e2" },
  green: { text: "#25613a", border: "#a8d5b6" },
  success: { text: "#25613a", border: "#a8d5b6" },
  lime: { text: "#3f6212", border: "#c6df91" },
  orange: { text: "#8a4b14", border: "#f2c18a" },
  warning: { text: "#8a4b14", border: "#f2c18a" },
  gold: { text: "#8a4b14", border: "#f2c18a" },
  volcano: { text: "#9a3412", border: "#efb19d" },
  red: { text: "#991b1b", border: "#efb4b4" },
  error: { text: "#991b1b", border: "#efb4b4" },
  magenta: { text: "#9d174d", border: "#efb2cb" },
  purple: { text: "#6b21a8", border: "#d7baf4" },
};

const ROLE_TONES = {
  rm: "blue",
  admin: "red",
  approver: "purple",
  customer: "default",
  system: "default",
  creator: "green",
  cocreator: "green",
  "co creator": "green",
  "co-creator": "green",
  co_creator: "green",
  checker: "volcano",
  cochecker: "volcano",
  "co checker": "volcano",
  "co-checker": "volcano",
  co_checker: "volcano",
  "deferral management": "green",
};

export const formatTagText = (value) =>
  String(value || "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const getTagTone = (tone) => {
  const normalizedTone = String(tone || "default").toLowerCase().trim();
  return TAG_TONES[normalizedTone] || TAG_TONES.default;
};

export const getRoleTone = (role) => {
  const normalizedRole = formatTagText(role).toLowerCase();
  return ROLE_TONES[normalizedRole] || "blue";
};

export const getOutlinedTagStyle = (tone, overrides = {}) => {
  const palette = getTagTone(tone);

  return {
    background: "#ffffff",
    borderColor: palette.border,
    color: palette.text,
    borderRadius: 999,
    padding: "0 8px",
    minHeight: 20,
    lineHeight: "18px",
    fontSize: 11,
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    whiteSpace: "nowrap",
    ...overrides,
  };
};