import { useState } from 'react';

interface LogEntry {
  step: number;
  name: string;
  timestamp: string;
  status: 'success' | 'warning' | 'info';
  details: string;
  metrics?: { before?: string; after?: string };
}

interface ProcessingLogProps {
  logs: LogEntry[];
}

const ProcessingLog = ({ logs }: ProcessingLogProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  const toggleStep = (step: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(step)) {
      newExpanded.delete(step);
    } else {
      newExpanded.add(step);
    }
    setExpandedSteps(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '•';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return '#10b981';
      case 'warning':
        return '#f59e0b';
      case 'info':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const exportLog = () => {
    const logText = logs.map(log => {
      let text = `Step ${log.step}: ${log.name}\n`;
      text += `Timestamp: ${log.timestamp}\n`;
      text += `Status: ${log.status}\n`;
      text += `Details: ${log.details}\n`;
      if (log.metrics) {
        text += `Metrics:\n`;
        if (log.metrics.before) text += `  Before: ${log.metrics.before}\n`;
        if (log.metrics.after) text += `  After: ${log.metrics.after}\n`;
      }
      text += '\n';
      return text;
    }).join('---\n\n');

    const header = `SUPERWRANGLER - PROCESSING LOG\n`;
    const date = `Generated: ${new Date().toLocaleString()}\n`;
    const separator = `${'='.repeat(50)}\n\n`;
    
    const fullLog = header + date + separator + logText;

    const blob = new Blob([fullLog], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `processing_log_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (logs.length === 0) return null;

  return (
    <div className="card">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ 
          cursor: 'pointer', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: isExpanded ? '1rem' : 0
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>📝 Processing Log</h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#666', fontSize: '0.875rem' }}>
            {logs.length} steps completed successfully
          </p>
        </div>
        <span style={{ fontSize: '1.5rem', color: '#3b82f6' }}>{isExpanded ? '−' : '+'}</span>
      </div>

      {isExpanded && (
        <>
          <button 
            onClick={exportLog}
            style={{ 
              marginBottom: '1rem',
              backgroundColor: '#10b981',
              color: 'white',
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            📥 Export Processing Log
          </button>

          <div style={{ position: 'relative' }}>
            {/* Timeline line */}
            <div style={{
              position: 'absolute',
              left: '1rem',
              top: '0',
              bottom: '0',
              width: '2px',
              backgroundColor: '#e5e7eb'
            }} />

            {/* Log entries */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {logs.map((log) => (
                <div 
                  key={log.step}
                  style={{ 
                    position: 'relative',
                    paddingLeft: '3rem',
                    paddingBottom: '0.5rem'
                  }}
                >
                  {/* Status icon */}
                  <div style={{
                    position: 'absolute',
                    left: '0.5rem',
                    top: '0',
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '50%',
                    backgroundColor: getStatusColor(log.status),
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '1.25rem',
                    zIndex: 1
                  }}>
                    {getStatusIcon(log.status)}
                  </div>

                  {/* Log content */}
                  <div 
                    onClick={() => toggleStep(log.step)}
                    style={{ 
                      cursor: 'pointer',
                      backgroundColor: '#f9fafb',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#1f2937' }}>
                          Step {log.step}: {log.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                          {log.timestamp}
                        </div>
                      </div>
                      <span style={{ fontSize: '1rem', color: '#3b82f6' }}>
                        {expandedSteps.has(log.step) ? '−' : '+'}
                      </span>
                    </div>

                    {expandedSteps.has(log.step) && (
                      <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #e5e7eb' }}>
                        <div style={{ color: '#4b5563', fontSize: '0.875rem' }}>
                          {log.details}
                        </div>
                        {log.metrics && (
                          <div style={{ 
                            marginTop: '0.5rem', 
                            padding: '0.5rem',
                            backgroundColor: '#ffffff',
                            borderRadius: '0.25rem',
                            fontSize: '0.875rem'
                          }}>
                            {log.metrics.before && (
                              <div><strong>Before:</strong> {log.metrics.before}</div>
                            )}
                            {log.metrics.after && (
                              <div><strong>After:</strong> {log.metrics.after}</div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProcessingLog;
