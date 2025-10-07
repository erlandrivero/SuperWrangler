import type { BalanceReport } from '../utils/statistics';

interface BalanceCheckProps {
  report: BalanceReport;
}

const BalanceCheck = ({ report }: BalanceCheckProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'balanced':
        return { bg: '#d1fae5', border: '#10b981', text: '#065f46' };
      case 'slightly_imbalanced':
        return { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' };
      case 'imbalanced':
        return { bg: '#fed7aa', border: '#f97316', text: '#9a3412' };
      case 'severely_imbalanced':
        return { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' };
      default:
        return { bg: '#f3f4f6', border: '#9ca3af', text: '#1f2937' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'balanced':
        return '✓';
      case 'slightly_imbalanced':
        return '⚠';
      case 'imbalanced':
        return '⚠';
      case 'severely_imbalanced':
        return '✗';
      default:
        return 'ℹ';
    }
  };

  const colors = getStatusColor(report.status);
  const maxPercentage = Math.max(...report.classes.map(c => c.percentage));

  return (
    <div style={{ 
      padding: '1.5rem', 
      backgroundColor: colors.bg, 
      border: `2px solid ${colors.border}`,
      borderRadius: '0.5rem'
    }}>
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: colors.text }}>
          {getStatusIcon(report.status)} Class Balance Check
        </h3>
        <p style={{ margin: 0, fontSize: '0.875rem', color: colors.text }}>
          <strong>Target Column:</strong> {report.targetColumn}
        </p>
      </div>

      {/* Class Distribution */}
      <div style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 0.75rem 0', color: colors.text }}>Distribution:</h4>
        <div style={{ 
          maxHeight: '300px', 
          overflowY: 'auto', 
          paddingRight: '0.5rem' 
        }}>
        {report.classes.map(cls => {
          const barWidth = (cls.percentage / maxPercentage) * 100;
          return (
            <div key={cls.value} style={{ marginBottom: '0.5rem' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '0.25rem',
                fontSize: '0.875rem',
                color: colors.text
              }}>
                <span><strong>Class {cls.value}:</strong> {cls.count.toLocaleString()} ({cls.percentage.toFixed(1)}%)</span>
              </div>
              <div style={{ 
                width: '100%', 
                height: '24px', 
                backgroundColor: 'rgba(255, 255, 255, 0.5)', 
                borderRadius: '0.25rem',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${barWidth}%`, 
                  height: '100%', 
                  backgroundColor: colors.border,
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: '0.5rem',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  transition: 'width 0.3s ease'
                }}>
                  {barWidth > 15 ? `${cls.percentage.toFixed(1)}%` : ''}
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {/* Status and Metrics */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '1rem', 
        marginBottom: '1rem',
        padding: '1rem',
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: '0.5rem'
      }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: colors.text, marginBottom: '0.25rem' }}>Status</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: colors.text }}>
            {report.isBalanced ? 'Balanced' : 'Imbalanced'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: colors.text, marginBottom: '0.25rem' }}>
            Imbalance Ratio
            <span style={{ marginLeft: '0.25rem', cursor: 'help' }} title="Ratio of largest class to smallest class">ℹ</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: colors.text }}>
            {report.imbalanceRatio.toFixed(1)}:1
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div style={{ 
        padding: '1rem', 
        backgroundColor: 'rgba(255, 255, 255, 0.7)', 
        borderRadius: '0.5rem',
        borderLeft: `4px solid ${colors.border}`
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: colors.text }}>Recommendation:</h4>
        <p style={{ margin: 0, fontSize: '0.875rem', color: colors.text, lineHeight: '1.5' }}>
          {report.recommendation}
        </p>
      </div>
    </div>
  );
};

export default BalanceCheck;
