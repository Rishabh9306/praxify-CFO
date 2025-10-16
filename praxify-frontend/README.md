# Praxify CFO - Agentic Financial Analysis Platform

An AI-powered financial analysis platform that combines predictive forecasting, conversational intelligence, and scenario simulation to transform how you understand your business finances.

## 🚀 Features

### Core Capabilities

- **📊 Predictive Forecasting**: Advanced ML models for accurate financial predictions
- **🔍 Anomaly Detection**: Automated identification of unusual patterns in financial data
- **💬 Conversational AI**: Interactive chat with persistent session memory powered by Google Gemini
- **🎯 Scenario Simulation**: Test what-if scenarios with real-time impact analysis
- **📈 Dual-Mode Narratives**: 
  - **Finance Guardian**: Conservative, risk-focused analysis
  - **Financial Storyteller**: Narrative-driven insights for presentations
- **🧠 Explainability**: Transparent insights into AI decision-making

### Application Pages

1. **Home (`/`)**: Landing page with feature overview and navigation
2. **Upload (`/upload`)**: File upload with persona and metric selection
3. **Insights Dashboard (`/insights`)**: Static comprehensive report with KPIs, charts, and narratives
4. **AI Chat (`/chat`)**: Interactive conversational analysis interface
5. **Simulate (`/simulate`)**: Scenario testing and comparison
6. **Reports (`/reports`)**: Session history and data export
7. **Settings (`/settings`)**: Theme, preferences, and configuration
8. **About (`/about`)**: Documentation, FAQ, and support

## 🛠 Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Recharts**: Data visualization
- **Radix UI**: Accessible component primitives
- **next-themes**: Theme management

### Backend (Expected API)
- **Python FastAPI**: High-performance API framework
- **Google Gemini AI**: Large language model for analysis
- **Pandas & NumPy**: Data processing
- **Prophet**: Time series forecasting
- **Scikit-learn**: Machine learning utilities

### State Management
- **React Context API**: Global state management
- **localStorage**: Client-side persistence
- **Session Management**: Maintains conversation history

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/your-repo/praxify-cfo.git

# Navigate to project directory
cd praxify-landing

# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# API Configuration (if backend is separate)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Google Gemini API Key (if not managed on backend)
GOOGLE_GEMINI_API_KEY=your_api_key_here
```

### Backend Setup

The frontend expects the following API endpoints:

- `POST /api/full_report` - Generate comprehensive static report
- `POST /api/agent/analyze_and_respond` - Interactive AI analysis
- `POST /api/simulate` - Scenario simulation

## 📊 Data Format

Upload CSV files with the following structure:

```csv
date,revenue,expenses,profit,cash_flow
2024-01-01,100000,70000,30000,25000
2024-02-01,110000,72000,38000,32000
```

**Required Columns**: `date`, plus at least one financial metric

## 🎨 Key Features Detail

### Upload Page
- Drag-and-drop file upload with CSV validation
- Persona selection (Finance Guardian / Financial Storyteller)
- Primary forecast metric selection
- Dual action: Generate Static Report or Launch AI Chat

### Insights Dashboard
- KPI summary cards
- Interactive forecast charts (using Recharts)
- Anomaly detection table with severity levels
- Profit driver analysis
- AI-generated narratives
- Raw data preview
- One-click switch to AI Chat

### AI Chat
- Real-time conversational analysis
- Persistent session memory
- Context canvas with live visualizations
- Automatic file context management
- Session ID tracking for conversation continuity

### Scenario Simulation
- Parameter selection (revenue, expenses, profit, cash_flow)
- Percentage change input (positive or negative)
- Before/After KPI comparison
- Impact visualization with color-coded trends
- AI-generated narrative summaries

### Reports & History
- Complete session list with metadata
- Resume previous chat sessions
- Export to JSON or text
- Session statistics dashboard
- Local storage management

## 🔒 Security Considerations

### Current Implementation
- Session data in browser localStorage
- Client-side state management

### Production Recommendations
- Server-side session management
- Secure API key storage
- Add authentication/authorization
- Implement rate limiting
- Use HTTPS only

## 📝 API Integration Examples

### Full Report Request

```typescript
const formData = new FormData();
formData.append('file', csvFile);
formData.append('persona', 'finance_guardian');
formData.append('forecast_metric', 'revenue');

const response = await fetch('/api/full_report', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
```

### AI Chat Request

```typescript
const formData = new FormData();
formData.append('file', csvFile);
formData.append('persona', 'financial_storyteller');
formData.append('user_query', 'What are the main profit drivers?');
formData.append('session_id', sessionId); // For continuation

const response = await fetch('/api/agent/analyze_and_respond', {
  method: 'POST',
  body: formData,
});
```

## 🐛 Troubleshooting

**Charts not rendering:**
- Ensure recharts is installed: `pnpm add recharts`
- Verify data format matches expected structure

**Session not persisting:**
- Check browser localStorage in DevTools
- Ensure session_id is stored correctly

**API errors:**
- Verify backend is running
- Check CORS configuration
- Validate CSV file structure

## 📄 License

MIT License

## 👥 Support

- **Email**: support@praxify.com
- **GitHub**: [Create an issue](https://github.com/your-repo/praxify-cfo/issues)
- **Documentation**: Visit `/about` page

---

Built with ❤️ using Next.js, TypeScript, and Google Gemini AI

## Original v0 Deployment

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/shared-8867s-projects/v0-archive)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/7OBKdWwIbzR)
