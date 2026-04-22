import React from "react";
import { Button, message } from "antd";
import { FilePdfOutlined } from "@ant-design/icons";
import usePDFGenerator from "../../../hooks/usePDFGenerator";
import "../../../styles/creatorDesignSystem.css";

const PDFGenerator = ({
  checklist,
  docs,
  supportingDocs = [],
  creatorComment = "",
  comments = [],
  isLoading = false,
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
      console.error("Creator completed checklist PDF generation failed:", error);
      message.error(error.message || "Failed to generate PDF");
    }
  };

  return (
    <Button
      key="download"
      className="creator-completed-action-button"
      icon={<FilePdfOutlined />}
      loading={isLoading || isGenerating}
      onClick={handleGeneratePDF}
      style={{
        background: "var(--ncb-primary-500)",
        borderColor: "transparent",
        color: "#ffffff",
        fontWeight: 600,
        borderRadius: 6,
        border: "none",
        minHeight: 34,
        height: 34,
        boxShadow: "none",
      }}
    >
      {isGenerating
        ? progress > 0
          ? `Generating PDF (${progress}%)`
          : "Generating PDF..."
        : "Download as PDF"}
    </Button>
  );
};

export default PDFGenerator;