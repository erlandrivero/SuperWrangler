# Wine Data Wrangler

A professional web application for cleaning, analyzing, and visualizing wine quality datasets from OpenML. This tool provides automated data preprocessing, feature engineering, and comprehensive analysis capabilities.

## Features

✅ **Automated Data Loading** - Enter OpenML dataset IDs and load wine quality data
✅ **Intelligent Data Cleaning** - Automatic normalization, duplicate removal, and missing value handling
✅ **Feature Engineering** - Creates 6 new engineered features for better analysis
✅ **Interactive Visualizations** - 4 professional charts including quality distribution and correlations
✅ **Data Dictionary** - Auto-generated documentation with statistics for all columns
✅ **Export Capabilities** - Download cleaned data as CSV with full processing report
✅ **Professional UI** - Clean, responsive design that works on all devices
✅ **Error Handling** - Comprehensive error messages and loading states

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

1. **Load Data**: Enter OpenML dataset IDs (default: 43406 for red wine, 44136 for white wine)
2. **Automatic Processing**: Watch as the app cleans and merges your data
3. **Explore Results**: View the cleaned data table, visualizations, and data dictionary
4. **Export Results**: Download your processed data as CSV

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

The app implements a comprehensive 7-step cleaning process:

1. **Column Normalization** - Standardizes column names
2. **Type Column Addition** - Adds wine type classification
3. **Common Column Identification** - Finds overlapping columns
4. **Dataset Alignment** - Ensures consistent column structure
5. **Numeric Conversion** - Converts all values to proper types
6. **Duplicate Removal** - Eliminates exact duplicate rows
7. **Missing Value Imputation** - Fills gaps with column medians

## Feature Engineering

The app creates 6 new features automatically:

- `so2_ratio` - Sulfur dioxide ratio analysis
- `chlorides_to_sulphates` - Chemical balance indicator
- `total_acidity_proxy` - Combined acidity measure
- `alcohol_x_sulphates` - Interaction feature
- `density_centered` - Normalized density values
- `high_acidity_flag` - Binary acidity classification

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
