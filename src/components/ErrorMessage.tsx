const ErrorMessage = ({ message }: { message: string }) => (
  <div style={{ padding: '1rem', backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb', borderRadius: '4px' }}>
    {message}
  </div>
);

export default ErrorMessage;
