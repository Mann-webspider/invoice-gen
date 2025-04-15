import React from 'react';

interface ExportControlsProps {
  onExportPDF: () => void;
  onExportCSV: () => void;
  onPrint: () => void;
}

const ExportControls: React.FC<ExportControlsProps> = ({
  onExportPDF,
  onExportCSV,
  onPrint
}) => {
  return (
    <div className="export-controls">
      <button onClick={onExportPDF} className="export-button">
        Export PDF
      </button>
      <button onClick={onExportCSV} className="export-button">
        Export CSV
      </button>
      <button onClick={onPrint} className="export-button">
        Print Invoice
      </button>
    </div>
  );
};

export default ExportControls;
