import { LOAN_DOCS_CONFIG } from "../data/loanDocsConfig";

export const generateChecklistDocs = (loanType) => {
  const config = LOAN_DOCS_CONFIG[loanType];
  if (!config) return [];

  let docs = [];

  Object.entries(config).forEach(([category, list]) => {
    list.forEach((doc) => {
      docs.push({
        name: doc,
        category,
        status: "Pending"
      });
    });
  });

  return docs;
};
