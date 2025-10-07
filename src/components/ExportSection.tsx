import { exportToCsv } from '../utils/exportUtils';

const ExportSection = ({ data }: { data: any[] }) => {
  const handleExportData = () => {
    if (data.length > 0) {
      exportToCsv(data, 'cleaned_wine_data.csv');
    }
  };

  return (
    <div>
<button onClick={handleExportData} disabled={data.length === 0}>
        Export Cleaned Data as CSV
      </button>
    </div>
  );
};

export default ExportSection;
