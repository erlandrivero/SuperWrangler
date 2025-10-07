import Papa from 'papaparse';
import JSZip from 'jszip';

export const exportToCsv = (data: any[], fileName: string) => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToText = (content: string, fileName: string) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generateDataDictionaryMarkdown = (stats: any[]): string => {
  let markdown = '# Data Dictionary\n\n';
  markdown += `Generated: ${new Date().toLocaleString()}\n\n`;
  markdown += '| Column | Source | Type | Formula/Description | Non-Null | Unique | Min | Max | Mean |\n';
  markdown += '|--------|--------|------|---------------------|----------|--------|-----|-----|------|\n';
  
  stats.forEach(stat => {
    const formula = stat.formula !== '-' ? stat.formula : stat.description;
    markdown += `| ${stat.column} | ${stat.source} | ${stat.dataType} | ${formula} | ${stat.nonNullCount} | ${stat.uniqueCount} | ${stat.min || 'N/A'} | ${stat.max || 'N/A'} | ${stat.mean || 'N/A'} |\n`;
  });
  
  return markdown;
};

export const generateSummaryReport = (_data: any[], summary: any): string => {
  const timestamp = new Date().toLocaleString();
  
  let report = `DATA WRANGLING PROJECT\n`;
  report += `${'='.repeat(50)}\n\n`;
  report += `Date: ${timestamp}\n`;
  report += `Processing Mode: ${summary.processingMode === 'single' ? 'Single Dataset' : 'Merged Datasets'}\n\n`;
  
  report += `ORIGINAL DATA:\n`;
  if (summary.processingMode === 'single') {
    report += `- Dataset: ${summary.initialRows1?.toLocaleString() || 'N/A'} rows × ${summary.commonColumns || 'N/A'} columns\n\n`;
  } else {
    report += `- Dataset 1: ${summary.initialRows1?.toLocaleString() || 'N/A'} rows\n`;
    report += `- Dataset 2: ${summary.initialRows2?.toLocaleString() || 'N/A'} rows\n`;
    report += `- Combined: ${(summary.initialRows1 + summary.initialRows2)?.toLocaleString() || 'N/A'} rows\n\n`;
  }
  
  report += `CLEANING OPERATIONS:\n`;
  report += `1. Column normalization (${summary.commonColumns || 'N/A'} columns)\n`;
  if (summary.processingMode !== 'single') {
    report += `2. Type column added (dataset_1/dataset_2)\n`;
    report += `3. Common columns identified (${summary.commonColumns || 'N/A'})\n`;
    report += `4. Datasets aligned\n`;
  }
  report += `${summary.processingMode === 'single' ? '2' : '5'}. Numeric conversion applied\n`;
  report += `${summary.processingMode === 'single' ? '3' : '6'}. Duplicates removed (${summary.duplicatesRemoved || 0} rows)\n`;
  report += `${summary.processingMode === 'single' ? '4' : '7'}. Missing values filled (${summary.missingValuesFilled || 0} values)\n`;
  report += `${summary.processingMode === 'single' ? '5' : '8'}. Features engineered (${summary.engineeredFeatures || 0} new columns)\n`;
  report += `${summary.processingMode === 'single' ? '6' : '9'}. Binning applied (${summary.binnedColumnsCreated || 0} new columns)\n\n`;
  
  report += `FINAL DATASET:\n`;
  report += `- Rows: ${summary.finalRows?.toLocaleString() || 'N/A'}\n`;
  report += `- Columns: ${summary.finalColumns || 'N/A'} (${summary.commonColumns || 'N/A'} original + ${summary.engineeredFeatures || 0} engineered + ${summary.binnedColumnsCreated || 0} binned)\n`;
  
  const qualityScore = summary.finalRows && summary.finalColumns 
    ? (((summary.finalRows * summary.finalColumns - (summary.missingValuesFilled || 0)) / (summary.finalRows * summary.finalColumns)) * 100).toFixed(2)
    : 'N/A';
  report += `- Data Quality Score: ${qualityScore}%\n\n`;
  
  return report;
};

export const exportCompletePackage = async (
  data: any[], 
  dataDictionary: any[], 
  summary: any,
  processingLog: any[]
) => {
  const zip = new JSZip();
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  
  // 1. Cleaned data CSV
  const dataCsv = Papa.unparse(data);
  zip.file('cleaned_data.csv', dataCsv);
  
  // 2. Data dictionary Markdown
  const dictMarkdown = generateDataDictionaryMarkdown(dataDictionary);
  zip.file('data_dictionary.md', dictMarkdown);
  
  // 3. Data dictionary CSV
  const dictCsv = Papa.unparse(dataDictionary);
  zip.file('data_dictionary.csv', dictCsv);
  
  // 4. Processing log
  const logText = processingLog.map(log => {
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
  
  const logHeader = `DATA WRANGLING - PROCESSING LOG\n`;
  const logDate = `Generated: ${new Date().toLocaleString()}\n`;
  const logSeparator = `${'='.repeat(50)}\n\n`;
  zip.file('processing_log.txt', logHeader + logDate + logSeparator + logText);
  
  // 5. Summary report
  const summaryReport = generateSummaryReport(data, summary);
  zip.file('summary_report.txt', summaryReport);
  
  // 6. README
  const readme = `DATA WRANGLING EXPORT PACKAGE\n`;
  const readmeContent = `${'='.repeat(50)}\n\n`;
  const readmeBody = `This package contains all outputs from the data wrangling process.\n\n`;
  const readmeFiles = `FILES INCLUDED:\n`;
  const readmeList = `- cleaned_data.csv: Final cleaned dataset (${data.length} rows × ${Object.keys(data[0] || {}).length} columns)\n`;
  const readmeList2 = `- data_dictionary.md: Column documentation in Markdown format\n`;
  const readmeList3 = `- data_dictionary.csv: Column documentation in CSV format\n`;
  const readmeList4 = `- processing_log.txt: Step-by-step processing history\n`;
  const readmeList5 = `- summary_report.txt: Comprehensive project summary\n`;
  const readmeList6 = `- README.txt: This file\n\n`;
  const readmeFooter = `Generated: ${new Date().toLocaleString()}\n`;
  
  zip.file('README.txt', readme + readmeContent + readmeBody + readmeFiles + readmeList + readmeList2 + readmeList3 + readmeList4 + readmeList5 + readmeList6 + readmeFooter);
  
  // Generate and download ZIP
  const blob = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `data_wrangling_${timestamp}.zip`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
