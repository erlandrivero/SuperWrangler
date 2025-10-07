const DataTable = ({ data }: { data: any[] }) => {
  if (data.length === 0) {
    return <p>No data to display. Please load datasets.</p>;
  }

  const headers = Object.keys(data[0]);
  const previewData = data.slice(0, 10);

  return (
    <div style={{ overflowX: 'auto' }}>
      <p>Showing first 10 of {data.length} rows.</p>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {headers.map(header => (
              <th key={header} style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {previewData.map((row, index) => (
            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }}>
              {headers.map(header => (
                <td key={header} style={{ border: '1px solid #ddd', padding: '8px' }}>
                  {row[header]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
