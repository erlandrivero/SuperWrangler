import axios from 'axios';
import Papa from 'papaparse';

const API_URL = 'https://www.openml.org/api/v1/json/data';

const parseArff = (arffText: string) => {
  const lines = arffText.split(/\r?\n/);
  let inDataSection = false;
  const data = [];
  const headers: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine === '' || trimmedLine.startsWith('%')) {
      continue; // Skip empty lines and comments
    }

    if (inDataSection) {
      data.push(trimmedLine);
    } else if (trimmedLine.toLowerCase().startsWith('@attribute')) {
      // Extract attribute name, handling spaces in names if quoted
      const match = trimmedLine.match(/@attribute\s+(['"]?)(.*?)\1\s+/i);
      if (match && match[2]) {
        headers.push(match[2]);
      }
    } else if (trimmedLine.toLowerCase() === '@data') {
      inDataSection = true;
    }
  }

  if (data.length === 0) {
    throw new Error('No data found in ARFF file.');
  }

  const csvData = data.join('\n');
  const parsed = Papa.parse(csvData, { dynamicTyping: true });

  // Combine headers with parsed data
  return parsed.data.map((row: any) => {
    const rowObject: { [key: string]: any } = {};
    headers.forEach((header, index) => {
      rowObject[header] = row[index];
    });
    return rowObject;
  });
};

export const fetchOpenMLData = async (id: string) => {
  console.log(`[Perf] Starting fetch for ID: ${id}`);
  let startTime = performance.now();
  
  // Validate ID
  if (!id || id.trim() === '') {
    throw new Error('Dataset ID cannot be empty');
  }

  if (!/^\d+$/.test(id.trim())) {
    throw new Error('Dataset ID must be a valid number');
  }

  try {
    // 1. Fetch metadata to get the ARFF file URL
    const metaResponse = await axios.get(`${API_URL}/${id}`, {
      timeout: 30000, // 30 second timeout
      validateStatus: (status) => status < 500 // Don't throw on 4xx errors
    });

    if (metaResponse.status === 404) {
      throw new Error(`Dataset with ID ${id} not found on OpenML. Please verify the dataset ID.`);
    }

    if (metaResponse.status >= 400) {
      throw new Error(`OpenML API error (${metaResponse.status}): Unable to fetch dataset metadata.`);
    }

    console.log(`[Perf] Fetched metadata for ID ${id} in ${performance.now() - startTime}ms`);
    startTime = performance.now();
    
    const arffUrl = metaResponse.data?.data_set_description?.url;

    if (!arffUrl) {
      throw new Error('Dataset metadata is incomplete. ARFF file URL not found.');
    }

    // 2. Fetch the ARFF file content
    const arffResponse = await axios.get(arffUrl, {
      timeout: 60000, // 60 second timeout for larger files
    });
    
    console.log(`[Perf] Fetched ARFF file for ID ${id} in ${performance.now() - startTime}ms`);
    startTime = performance.now();
    
    if (!arffResponse.data || typeof arffResponse.data !== 'string') {
      throw new Error('Invalid ARFF file format received from OpenML.');
    }
    
    // 3. Parse the ARFF data
    const data = parseArff(arffResponse.data);
    
    if (!data || data.length === 0) {
      throw new Error('Dataset is empty. No data rows found after parsing.');
    }
    
    console.log(`[Perf] Parsed ARFF file for ID ${id} in ${performance.now() - startTime}ms`);
    console.log(`[Success] Loaded ${data.length} rows from dataset ${id}`);
    
    return data;

  } catch (error) {
    console.error(`Error fetching data for ID ${id}:`, error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout: The dataset is taking too long to load. Please try again or use a smaller dataset.');
      }
      if (error.code === 'ERR_NETWORK') {
        throw new Error('Network error: Unable to connect to OpenML. Please check your internet connection.');
      }
      if (error.response?.status === 404) {
        throw new Error(`Dataset ${id} not found on OpenML. Please verify the dataset ID.`);
      }
      if (error.response?.status === 500) {
        throw new Error('OpenML server error: The service is temporarily unavailable. Please try again later.');
      }
    }
    
    if (error instanceof Error) {
      throw error; // Re-throw our custom errors
    }
    
    throw new Error(`Failed to fetch dataset ${id} from OpenML. Please try again.`);
  }
};
