import React from "react";
import { Button } from "antd";
import { FilePdfOutlined } from "@ant-design/icons";
import { PRIMARY_BLUE } from "../constants/colors";

const PdfExportButton = ({ isGeneratingPDF, onClick }) => {
  return (
    <Button
      icon={<FilePdfOutlined />}
      onClick={onClick}
      loading={isGeneratingPDF}
      style={{
        backgroundColor: PRIMARY_BLUE,
        borderColor: PRIMARY_BLUE,
        color: "white",
        borderRadius: "6px",
        fontWeight: 600,
      }}
    >
      Download PDF
    </Button>
  );
};

export default PdfExportButton;
