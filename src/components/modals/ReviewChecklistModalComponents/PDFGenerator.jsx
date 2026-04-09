import React from "react";
import { Button, message } from "antd";
import { FilePdfOutlined } from "@ant-design/icons";
import { PRIMARY_BLUE } from "../../../utils/constants";
import usePDFGenerator from "../../../hooks/usePDFGenerator";

const PDFGenerator = ({
  checklist,
  docs,
  supportingDocs = [],
  creatorComment,
  comments,
  size = "default", // 'small', 'default', 'large'
  variant = "primary", // 'primary', 'outline'
  showIcon = true,
  buttonText = "Download PDF",
  className = "",
}) => {
  const { generatePDF, isGenerating } = usePDFGenerator();

  const handleGeneratePDF = async () => {
    try {
      if (!checklist) {
        message.error("No checklist data available");
        return;
      }

      console.log("📄 PDFGenerator button clicked", {
        checklistId: checklist?._id || checklist?.id,
        docsCount: docs?.length,
        supportingDocsCount: supportingDocs?.length,
      });

      await generatePDF({
        checklist,
        documents: docs || [],
        supportingDocs: supportingDocs || [],
        creatorComment: creatorComment || "",
        comments: comments || [],
      });
    } catch (error) {
      console.error("❌ PDF generation error:", error);
      message.error(error.message || "Failed to generate PDF");
    }
  };

  // Button style variants
  const getButtonStyle = () => {
    const baseStyle = {
      borderRadius: "6px",
      fontWeight: 500,
      fontSize: size === "small" ? "12px" : size === "large" ? "16px" : "14px",
      padding:
        size === "small"
          ? "4px 12px"
          : size === "large"
            ? "10px 24px"
            : "6px 16px",
      height: size === "small" ? "32px" : size === "large" ? "44px" : "38px",
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      transition: "all 0.2s ease",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
      border: "none",
      cursor: "pointer",
    };

    if (variant === "outline") {
      return {
        ...baseStyle,
        backgroundColor: "transparent",
        border: `1px solid ${PRIMARY_BLUE}`,
        color: PRIMARY_BLUE,
      };
    }

    // Primary variant
    return {
      ...baseStyle,
      backgroundColor: PRIMARY_BLUE,
      borderColor: PRIMARY_BLUE,
      color: "white",
    };
  };

  return (
    <Button
      icon={
        showIcon ? (
          <FilePdfOutlined style={{ fontSize: size === "small" ? 14 : 16 }} />
        ) : null
      }
      loading={isGenerating}
      onClick={handleGeneratePDF}
      style={getButtonStyle()}
      className={`pdf-generator-btn ${className}`}
    >
      {buttonText}
    </Button>
  );
};

export default PDFGenerator;
