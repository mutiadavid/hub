// src/components/modals/CreatorCompletedChecklistModal/hooks/usePDFGeneration.js
import { useState } from "react";
import { message } from "antd";
import { generateChecklistPDF } from "../../../../utils/reportGenerator";

export const usePDFGeneration = () => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const generatePDF = async (checklist, docs, documentStats, comments) => {
    setIsGeneratingPDF(true);
    try {
      // Use unified PDF export function
      generateChecklistPDF(checklist, docs, documentStats, comments);
      message.success("Checklist PDF generated successfully!");
    } catch (error) {
      console.error("Error in PDF generation:", error);
      message.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return {
    isGeneratingPDF,
    generatePDF,
  };
};
