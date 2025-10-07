const CleaningSummary = ({ items, data }: { items: { key: string, title: string }[], data: { [key: string]: number } }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
      {items.map((item) => (
        <div key={item.key} className="card" style={{ textAlign: 'center' }}>
          <h4 style={{ margin: 0, color: '#666' }}>{item.title}</h4>
          <p style={{ fontSize: '2rem', margin: '0.5rem 0', color: '#3b82f6' }}>
            {data[item.key] !== undefined ? data[item.key] : '-'}
          </p>
        </div>
      ))}
    </div>
  );
};

export default CleaningSummary;
