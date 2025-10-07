const SuccessMessage = ({ message }: { message: string }) => (
  <div style={{ padding: '1rem', backgroundColor: '#d4edda', color: '#155724', border: '1px solid #c3e6cb', borderRadius: '4px' }}>
    {message}
  </div>
);

export default SuccessMessage;
