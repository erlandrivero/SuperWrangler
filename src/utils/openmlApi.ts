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
  try {
    // 1. Fetch metadata to get the ARFF file URL
    const metaResponse = await axios.get(`${API_URL}/${id}`);
    console.log(`[Perf] Fetched metadata for ID ${id} in ${performance.now() - startTime}ms`);
    startTime = performance.now();
    const arffUrl = metaResponse.data.data_set_description.url;

    if (!arffUrl) {
      throw new Error('ARFF file URL not found in metadata.');
    }

    // 2. Fetch the ARFF file content
    const arffResponse = await axios.get(arffUrl);
    console.log(`[Perf] Fetched ARFF file for ID ${id} in ${performance.now() - startTime}ms`);
    startTime = performance.now();
    
    // 3. Parse the ARFF data
    const data = parseArff(arffResponse.data);
    console.log(`[Perf] Parsed ARFF file for ID ${id} in ${performance.now() - startTime}ms`);
    return data;

  } catch (error) {
    console.error(`Error fetching data for ID ${id}:`, error);
    throw new Error('Failed to fetch or parse data from OpenML.');
  }
};
