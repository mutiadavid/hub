import { useState, useEffect } from "react";
import { prepareDocuments } from "../utils/documentUtils";

export const useChecklistDocuments = (checklist) => {
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    if (!checklist) {
      setDocs([]);
      return;
    }

    if (checklist.documents && Array.isArray(checklist.documents)) {
      const preparedDocs = prepareDocuments(checklist);
      setDocs(preparedDocs);
    } else {
      setDocs([]);
    }
  }, [checklist]);

  return docs;
};