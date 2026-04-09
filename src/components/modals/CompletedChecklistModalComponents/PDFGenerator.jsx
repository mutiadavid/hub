import React from "react";
import { Button, message } from "antd";
import { FilePdfOutlined } from "@ant-design/icons";
import usePDFGenerator from "../../../hooks/usePDFGenerator";
import { PRIMARY_BLUE } from "../../../utils/checklistConstants";

const PDFGenerator = ({
  checklist,
  docs,
  supportingDocs = [],
  creatorComment = "",
  comments = [],
  size = "default",
  buttonText = "Download as PDF",
  className = "",
  style = {},
}) => {
  const { generatePDF, isGenerating, progress } = usePDFGenerator();

  const handleGeneratePDF = async () => {
    try {
      if (!checklist) {
        message.error("No checklist data available");
        return;
      }

      await generatePDF({
        checklist,
        documents: docs || [],
        supportingDocs: supportingDocs || [],
        creatorComment,
        comments: comments || [],
      });
    } catch (error) {
      console.error("Failed to generate completed checklist PDF:", error);
      message.error(error.message || "Failed to generate PDF");
    }
  };

  const resolvedButtonText = isGenerating
    ? progress > 0
      ? `Generating PDF (${progress}%)`
      : "Generating PDF..."
    : buttonText;

  return (
    <Button
      icon={<FilePdfOutlined />}
      loading={isGenerating}
      onClick={handleGeneratePDF}
      className={className}
      style={{
        backgroundColor: PRIMARY_BLUE,
        borderColor: PRIMARY_BLUE,
        color: "#ffffff",
        ...(size === "small" ? { height: 32, padding: "4px 12px" } : {}),
        ...style,
      }}
    >
      {resolvedButtonText}
    </Button>
  );
};

export default PDFGenerator;