import type { MLSummary } from '../types/ml';

// Use environment variable or default to localhost for development
const API_URL = import.meta.env.VITE_ML_API_URL || 'http://127.0.0.1:5000';

export async function trainAdvancedML(
  data: any[],
  targetColumn: string,
  onProgress?: (message: string) => void
): Promise<MLSummary> {
  try {
    onProgress?.('Connecting to Advanced ML server...');

    const response = await fetch(`${API_URL}/api/train`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data, targetColumn })
    });

    if (!response.ok) {
      let errorMessage = `Server error: ${response.status} ${response.statusText}`;
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } catch {
        // If JSON parsing fails, use the default error message
      }
      throw new Error(errorMessage);
    }

    onProgress?.('Training complete! Processing results...');
    const results = await response.json();
    
    return results;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to connect to Advanced ML server');
  }
}

export async function checkAPIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function getAvailableAlgorithms(): Promise<string[]> {
  try {
    const response = await fetch(`${API_URL}/api/algorithms`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch algorithms');
    }
    
    const data = await response.json();
    return data.algorithms || [];
  } catch (error) {
    console.error('Error fetching algorithms:', error);
    return [];
  }
}
