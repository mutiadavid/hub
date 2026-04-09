// utils/chartExport.js
import html2canvas from "html2canvas";

const downloadChartAsPNG = async (chartId, filename) => {
  const chartElement = document.getElementById(chartId);

  if (!chartElement) {
    console.error(`Chart with ID ${chartId} not found`);
    return;
  }

  const canvas = await html2canvas(chartElement, { scale: 2 });
  const link = document.createElement("a");
  link.download = filename + ".png";
  link.href = canvas.toDataURL("image/png");
  link.click();
};

export default downloadChartAsPNG;
