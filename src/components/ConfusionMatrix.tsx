import React from 'react';

interface ConfusionMatrixProps {
  matrix: number[][];
  algorithm: string;
}

const ConfusionMatrix: React.FC<ConfusionMatrixProps> = ({ matrix, algorithm }) => {
  const maxValue = Math.max(...matrix.flat());
  
  const getColor = (value: number) => {
    const intensity = value / maxValue;
    const green = Math.round(16 + (185 - 16) * intensity);
    const blue = Math.round(185 + (105 - 185) * intensity);
    return `rgb(${green}, ${blue}, 129)`;
  };

  const getTextColor = (value: number) => {
    const intensity = value / maxValue;
    return intensity > 0.5 ? 'white' : '#374151';
  };

  return (
    <div>
      <h4 style={{ marginBottom: '8px', color: '#374151', fontSize: '0.875rem' }}>Confusion Matrix - {algorithm}</h4>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', margin: '0 auto', fontSize: '0.75rem' }}>
          <thead>
            <tr>
              <th style={{ padding: '4px 6px', border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: '0.625rem' }}></th>
              {matrix[0].map((_, idx) => (
                <th 
                  key={idx}
                  style={{ 
                    padding: '4px 6px', 
                    border: '1px solid #e5e7eb', 
                    background: '#f9fafb',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '0.625rem'
                  }}
                >
                  P{idx}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, rowIdx) => (
              <tr key={rowIdx}>
                <th style={{ 
                  padding: '4px 6px', 
                  border: '1px solid #e5e7eb', 
                  background: '#f9fafb',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '0.625rem'
                }}>
                  A{rowIdx}
                </th>
                {row.map((value, colIdx) => (
                  <td 
                    key={colIdx}
                    style={{ 
                      padding: '6px 8px', 
                      border: '1px solid #e5e7eb',
                      background: getColor(value),
                      color: getTextColor(value),
                      fontWeight: '600',
                      fontSize: '0.75rem',
                      textAlign: 'center',
                      minWidth: '36px'
                    }}
                  >
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ 
        marginTop: '6px', 
        padding: '6px 8px', 
        background: '#eff6ff', 
        borderRadius: '4px',
        fontSize: '0.625rem',
        color: '#1e40af',
        lineHeight: '1.3'
      }}>
        <strong>💡</strong> Rows=actual (A), cols=predicted (P). Diagonal=correct (darker=more).
      </div>
    </div>
  );
};

export default ConfusionMatrix;
