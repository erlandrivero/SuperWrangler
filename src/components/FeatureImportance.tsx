import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface FeatureImportanceProps {
  importance: { feature: string; importance: number }[];
}

const FeatureImportance: React.FC<FeatureImportanceProps> = ({ importance }) => {
  // Sort by importance and take top 10
  const sortedImportance = [...importance]
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 10);

  const chartData = sortedImportance.map(item => ({
    name: item.feature,
    value: item.importance * 100
  }));

  const colors = [
    '#10b981', '#059669', '#047857', '#065f46', '#064e3b',
    '#6ee7b7', '#34d399', '#10b981', '#059669', '#047857'
  ];

  return (
    <div>
      <h4 style={{ marginBottom: '15px', color: '#374151' }}>Feature Importance (Top 10)</h4>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart 
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            type="number" 
            stroke="#6b7280"
            tick={{ fill: '#6b7280' }}
            label={{ value: 'Importance (%)', position: 'insideBottom', offset: -5, fill: '#374151' }}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            stroke="#6b7280"
            tick={{ fill: '#374151', fontSize: 12 }}
            width={90}
          />
          <Tooltip 
            contentStyle={{ 
              background: 'white', 
              border: '1px solid #e5e7eb', 
              borderRadius: '6px',
              padding: '10px'
            }}
            formatter={(value: number) => [`${value.toFixed(2)}%`, 'Importance']}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{ 
        marginTop: '15px', 
        padding: '12px', 
        background: '#eff6ff', 
        borderRadius: '6px',
        fontSize: '0.875rem',
        color: '#1e40af'
      }}>
        <strong>💡 Note:</strong> Feature importance shows which features contribute most to the model's predictions. 
        Higher values indicate more influential features.
      </div>
    </div>
  );
};

export default FeatureImportance;
