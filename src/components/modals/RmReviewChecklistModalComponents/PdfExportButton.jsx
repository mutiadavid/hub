import React, { useState } from "react";
import { Button, message } from "antd";
import { FilePdfOutlined as PdfIcon } from "@ant-design/icons";
import { PRIMARY_BLUE } from "../../../utils/colors";
import { generateChecklistPDF } from "../../../utils/reportGenerator";

const PdfExportButton = ({ checklist, docs, documentStats, comments = [] }) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      generateChecklistPDF(checklist, docs, documentStats, comments?.data || comments || []);
      message.success("Checklist downloaded as PDF successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      message.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <Button
      key="download"
      icon={<PdfIcon />}
      loading={isGeneratingPDF}
      onClick={handleDownloadPDF}
      style={{
        backgroundColor: PRIMARY_BLUE,
        borderColor: PRIMARY_BLUE,
        color: "white",
        borderRadius: "6px",
        fontWeight: 600,
        marginRight: 8,
      }}
    >
      Download PDF
    </Button>
  );
};

export default PdfExportButton;