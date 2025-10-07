# 🦸 SuperWrangler - Universal Data Cleaning Platform

A professional web application for cleaning, analyzing, and visualizing **ANY dataset** from OpenML or CSV files. This tool provides automated data preprocessing, intelligent feature detection, and comprehensive analysis capabilities that work with both single and dual datasets.

## ✨ Key Features

✅ **Universal Dataset Support** - Works with ANY dataset, not just wine data
✅ **Single & Dual Dataset Processing** - Load one or two datasets for comparison/merging
✅ **Smart Feature Detection** - Automatically detects wine-specific columns and adapts processing
✅ **Column Analysis** - Analyzes all columns and provides encoding recommendations
✅ **Balance Check** - Auto-detects target column and checks class balance
✅ **Intelligent Data Cleaning** - Automatic normalization, duplicate removal, and missing value handling
✅ **Conditional Feature Engineering** - Creates domain-specific features when applicable
✅ **Smart Binning** - Bins columns only when appropriate
✅ **Interactive Visualizations** - Dynamic charts that adapt to your data
✅ **Data Dictionary** - Auto-generated documentation with statistics for all columns
✅ **Export Capabilities** - Download cleaned data, analysis reports, and processing logs
✅ **Professional UI** - Clean, responsive design with clear visual feedback
✅ **Comprehensive Logging** - Track every step of the data processing pipeline

## Technologies Used

- **Frontend**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Visualization**: Recharts
- **Data Processing**: Custom utilities with TypeScript
- **Styling**: Modern CSS with responsive design
- **Deployment**: Netlify (configured for SPA routing)

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/wine-data-wrangler.git
cd wine-data-wrangler
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Open http://localhost:5173 in your browser

### Usage

#### Single Dataset Mode
1. **Load Data**: Enter one OpenML dataset ID (e.g., 43406) or upload a CSV file
2. **Automatic Processing**: Watch as the app analyzes and cleans your data
3. **Review Analysis**: Check column analysis and balance check results
4. **Explore Results**: View cleaned data, visualizations, and data dictionary
5. **Export Results**: Download processed data and analysis reports

#### Dual Dataset Mode (Merge)
1. **Load Data**: Enter two OpenML dataset IDs (e.g., 43406 and 44136) or upload two CSV files
2. **Automatic Merging**: App finds common columns and merges datasets
3. **Review Analysis**: Check column analysis and balance check results
4. **Explore Results**: View merged data, visualizations, and data dictionary
5. **Export Results**: Download processed data and analysis reports

## Project Structure

```
wine-wrangler/
├── src/
│   ├── components/
│   │   ├── DataImport.tsx      # Dataset loading interface
│   │   ├── DataTable.tsx       # Data preview table
│   │   ├── Visualizations.tsx  # Charts and graphs
│   │   ├── DataDictionary.tsx  # Column statistics
│   │   ├── ExportSection.tsx   # Download functionality
│   │   ├── LoadingSpinner.tsx  # Loading indicators
│   │   ├── ErrorMessage.tsx    # Error displays
│   │   └── SuccessMessage.tsx  # Success notifications
│   └── utils/
│       ├── dataProcessing.ts   # Data cleaning pipeline
│       ├── statistics.ts       # Statistical calculations
│       ├── exportUtils.ts      # CSV export utilities
│       └── openmlApi.ts        # OpenML API client
├── public/
└── README.md
```

## Data Processing Pipeline

The app implements an intelligent, adaptive cleaning process:

### Core Steps (Always Applied)
1. **Column Normalization** - Standardizes column names to lowercase with underscores
2. **Column Analysis** - Analyzes all columns for encoding recommendations
3. **Numeric Conversion** - Converts all numeric columns to proper types
4. **Duplicate Removal** - Eliminates exact duplicate rows
5. **Missing Value Imputation** - Fills gaps with column medians

### Conditional Steps (Applied When Applicable)
6. **Feature Engineering** - Creates domain-specific features (e.g., wine-specific ratios)
7. **Smart Binning** - Bins appropriate columns (e.g., quality, alcohol)
8. **Balance Check** - Auto-detects target column and checks class balance

### Dual Dataset Mode Additional Steps
- **Common Column Identification** - Finds overlapping columns between datasets
- **Dataset Alignment** - Ensures consistent column structure
- **Type Column Addition** - Adds source classification (e.g., red/white wine)

## Intelligent Feature Detection

SuperWrangler adapts its processing based on your data:

### Column Analysis
- Analyzes every column for data type and cardinality
- Provides encoding recommendations (Keep, Review, Drop)
- Identifies ID columns and high-cardinality categoricals
- Suggests appropriate encoding strategies

### Balance Check
- Auto-detects target column using common names or lowest cardinality
- Calculates class distribution and imbalance ratio
- Provides color-coded status (Balanced, Slightly Imbalanced, Imbalanced, Severely Imbalanced)
- Recommends appropriate techniques (SMOTE, class weights, stratified sampling)

### Conditional Feature Engineering
When wine-specific columns are detected, creates 6 new features:
- `so2_ratio` - Sulfur dioxide ratio analysis
- `chlorides_to_sulphates` - Chemical balance indicator
- `total_acidity_proxy` - Combined acidity measure
- `alcohol_x_sulphates` - Interaction feature
- `density_centered` - Normalized density values
- `high_acidity_flag` - Binary acidity classification

When wine columns are NOT found, gracefully skips with clear user feedback.

### Smart Binning
- Bins `quality` column into low/medium/high (if present)
- Bins `alcohol` column into very_low/low/medium/high (if present)
- Skips binning if columns not found

## Visualizations

Four key visualizations provide insights:

1. **Quality Distribution** - Bar chart showing wine quality distribution
2. **Alcohol vs Quality** - Scatter plot with wine type coloring
3. **Correlation Analysis** - Key feature correlations with quality
4. **Feature Importance** - Top 10 features by variance

## Deployment

The app is configured for easy deployment to Netlify:

1. Push to GitHub
2. Connect repository to Netlify
3. Deploy automatically on push

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational purposes as part of CAP3321 Data Wrangling course.

## Troubleshooting

**Common Issues:**

- **API Errors**: Check dataset IDs are valid (43406, 44136 recommended)
- **Build Errors**: Ensure Node.js 16+ and run `npm install`
- **Type Errors**: The project uses TypeScript - check your IDE setup

**Getting Help:**

- Check browser console for detailed error messages
- Verify network connectivity for OpenML API calls
- Ensure all dependencies are installed correctly

---

*Built with ❤️ using React, TypeScript, and modern web technologies*
