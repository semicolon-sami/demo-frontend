import React, { useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

type DiaryExportButtonProps = {
  exportTargetId: string; // ID of the HTML node to export (e.g., page container div)
  filename?: string;
};

export default function DiaryExportButton({
  exportTargetId,
  filename = "diary-entry.pdf",
}: DiaryExportButtonProps) {
  const exporting = useRef(false);

  const handleExport = async () => {
    if (exporting.current) return;
    exporting.current = true;
    try {
      const node = document.getElementById(exportTargetId);
      if (!node) throw new Error("Export target not found");
      const canvas = await html2canvas(node);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      // Calculate scaling for full width
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(filename);
    } catch (err) {
      alert("Export failed: " + (err as any).message);
    }
    exporting.current = false;
  };

  return (
    <button
      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded ml-2 text-sm"
      onClick={handleExport}
      title="Export this diary page as PDF"
      type="button"
    >
      📄 Export as PDF
    </button>
  );
}
