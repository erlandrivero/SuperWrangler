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

    const response = await fetch(`${API_URL}/api/train-stream`, {
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

    // Handle streaming response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    let finalResult: MLSummary | null = null;
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6);
          try {
            const event = JSON.parse(jsonStr);
            
            if (event.type === 'progress') {
              onProgress?.(`Training ${event.algorithm} (${event.current}/${event.total})...`);
            } else if (event.type === 'complete') {
              finalResult = {
                results: event.results,
                bestModel: event.bestModel,
                totalTime: event.totalTime,
                successCount: event.successCount,
                failureCount: event.failureCount
              };
            } else if (event.type === 'error') {
              throw new Error(event.error);
            }
          } catch (e) {
            console.error('Failed to parse SSE event:', e);
          }
        }
      }
    }

    if (!finalResult) {
      throw new Error('Training completed but no results received');
    }

    onProgress?.('Training complete!');
    return finalResult;
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
