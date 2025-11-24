/**
 * Server-Side PDF Generator
 * Generates complete PDF from raw data without DOM dependencies
 * Uses Chart.js for programmatic chart rendering
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportData {
  kpis: any;
  summary: string;
  insights: any[];
  recommendations: any[];
  forecast_chart?: any;
  visualizations?: {
    breakdowns?: any;
    time_series?: any;
    correlations?: any;
  };
  anomalies_table?: any[];
  correlation_insights?: any[];
  profit_drivers?: any[];
  model_health_report?: any;
  diagnostics?: any;
}

/**
 * Generate complete PDF from report data
 * @param data - Report data
 * @param mode - Report mode (guardian, storyteller, etc)
 * @param returnBlob - If true, returns Blob instead of downloading
 * @returns Blob if returnBlob is true, void otherwise
 */
export async function generateServerSidePDF(
  data: ReportData, 
  mode: string = 'guardian',
  returnBlob: boolean = false
): Promise<Blob | void> {
  console.log('🚀 Starting server-side PDF generation...');
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (2 * margin);
  
  let currentY = margin;
  let pageNumber = 0;

  // Helper function to add new page
  const addNewPage = () => {
    pdf.addPage();
    pageNumber++;
    currentY = margin;
    addPageHeader();
    addPageFooter();
  };

  // Helper function to check if we need a new page
  const checkPageBreak = (requiredHeight: number) => {
    if (currentY + requiredHeight > pageHeight - margin - 10) {
      addNewPage();
      return true;
    }
    return false;
  };

  // Add page header with logo
  const addPageHeader = () => {
    if (pageNumber > 0) {
      // Praxifi logo in top left corner
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(59, 130, 246); // blue-500
      pdf.text('Praxifi', margin, 12);
      
      // Date in top right corner
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(148, 163, 184); // slate-400
      pdf.text(new Date().toLocaleDateString(), pageWidth - margin, 10, { align: 'right' });
    }
  };

  // Add page footer with page number
  const addPageFooter = () => {
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text(
      `Page ${pageNumber + 1}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  };

  // ==================== COVER PAGE ====================
  console.log('📄 Creating cover page...');
  
  // Background
  pdf.setFillColor(15, 23, 42); // slate-900
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // PRAXIFI Logo - Large and Bold in Center
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(48);
  pdf.setTextColor(59, 130, 246); // blue-500
  pdf.text('PRAXIFI', pageWidth / 2, pageHeight / 2 - 20, { align: 'center' });
  
  // Subtitle
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(24);
  pdf.setTextColor(255, 255, 255);
  pdf.text('Financial Report', pageWidth / 2, pageHeight / 2 + 10, { align: 'center' });
  
  pdf.setFontSize(16);
  pdf.setTextColor(148, 163, 184);
  pdf.text('Comprehensive Analysis', pageWidth / 2, pageHeight / 2 + 25, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.text(new Date().toLocaleDateString(), pageWidth / 2, pageHeight / 2 + 45, { align: 'center' });
  
  pdf.setFontSize(10);
  pdf.text(`Mode: ${mode.toUpperCase()}`, pageWidth / 2, pageHeight / 2 + 55, { align: 'center' });

  // ==================== KPI PAGE ====================
  addNewPage();
  console.log('📊 Adding KPIs...');
  
  pdf.setFontSize(24);
  pdf.setTextColor(15, 23, 42);
  pdf.text('Key Performance Indicators', margin, currentY);
  currentY += 15;

  // Add KPI cards
  if (data.kpis) {
    const kpiKeys = Object.keys(data.kpis);
    const cardsPerRow = 2;
    const cardWidth = (contentWidth - 10) / cardsPerRow;
    const cardHeight = 30;
    
    for (let i = 0; i < kpiKeys.length; i++) {
      const key = kpiKeys[i];
      const value = data.kpis[key];
      
      const row = Math.floor(i / cardsPerRow);
      const col = i % cardsPerRow;
      
      const x = margin + (col * (cardWidth + 10));
      const y = currentY + (row * (cardHeight + 5));
      
      // Check if we need a new page
      if (checkPageBreak(cardHeight + 5)) {
        i--; // Retry this card on new page
        continue;
      }
      
      // Draw card background
      pdf.setFillColor(241, 245, 249); // slate-100
      pdf.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'F');
      
      // Draw card content
      pdf.setFontSize(10);
      pdf.setTextColor(71, 85, 105); // slate-600
      pdf.text(key.replace(/_/g, ' ').toUpperCase(), x + 5, y + 8);
      
      pdf.setFontSize(16);
      pdf.setTextColor(15, 23, 42);
      const displayValue = typeof value === 'number' ? 
        (key.includes('margin') || key.includes('rate') ? `${value.toFixed(2)}%` : value.toLocaleString()) :
        value;
      pdf.text(String(displayValue), x + 5, y + 20);
    }
    
    currentY += Math.ceil(kpiKeys.length / cardsPerRow) * (cardHeight + 5) + 10;
  }

  // ==================== SUMMARY ====================
  checkPageBreak(40);
  console.log('📝 Adding summary...');
  
  pdf.setFontSize(18);
  pdf.setTextColor(15, 23, 42);
  pdf.text('Executive Summary', margin, currentY);
  currentY += 10;
  
  if (data.summary) {
    pdf.setFontSize(10);
    pdf.setTextColor(51, 65, 85); // slate-700
    const summaryLines = pdf.splitTextToSize(data.summary, contentWidth);
    pdf.text(summaryLines, margin, currentY);
    currentY += summaryLines.length * 5 + 10;
  }

  // ==================== FORECAST TABLES ====================
  if (data.forecast_chart) {
    console.log('📈 Adding forecast tables...');
    
    const forecastMetrics = Object.keys(data.forecast_chart);
    
    for (const metric of forecastMetrics) {
      checkPageBreak(60);
      
      pdf.setFontSize(16);
      pdf.setTextColor(15, 23, 42);
      pdf.text(`${metric.toUpperCase()} Forecast`, margin, currentY);
      currentY += 10;
      
      const forecastData = data.forecast_chart[metric];
      if (forecastData && forecastData.length > 0) {
        const tableData = forecastData.slice(0, 10).map((item: any) => [
          item.date || item.month || item.period || 'N/A',
          item.predicted?.toFixed(2) || 'N/A',
          item.lower?.toFixed(2) || 'N/A',
          item.upper?.toFixed(2) || 'N/A'
        ]);

        autoTable(pdf, {
          startY: currentY,
          head: [['Period', 'Predicted', 'Lower Bound', 'Upper Bound']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          margin: { left: margin, right: margin },
          styles: { fontSize: 9 }
        });

        currentY = (pdf as any).lastAutoTable.finalY + 10;
      }
    }
  }

  // ==================== BREAKDOWN TABLES ====================
  if (data.visualizations?.breakdowns) {
    console.log('📊 Adding breakdown data...');
    
    const breakdowns = data.visualizations.breakdowns;
    
    // Revenue by Region
    if (breakdowns.revenue_by_region) {
      checkPageBreak(50);
      
      pdf.setFontSize(16);
      pdf.setTextColor(15, 23, 42);
      pdf.text('Revenue by Region', margin, currentY);
      currentY += 10;
      
      const tableData = breakdowns.revenue_by_region.map((item: any) => [
        item.region || item.name,
        `$${item.total_revenue?.toLocaleString() || item.revenue?.toLocaleString() || item.value?.toLocaleString() || 0}`
      ]);

      autoTable(pdf, {
        startY: currentY,
        head: [['Region', 'Revenue']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: margin, right: margin },
        styles: { fontSize: 10 }
      });

      currentY = (pdf as any).lastAutoTable.finalY + 10;
    }
    
    // Expenses by Department
    if (breakdowns.expenses_by_department) {
      checkPageBreak(50);
      
      pdf.setFontSize(16);
      pdf.setTextColor(15, 23, 42);
      pdf.text('Expenses by Department', margin, currentY);
      currentY += 10;
      
      const tableData = breakdowns.expenses_by_department.map((item: any) => [
        item.department || item.name,
        `$${item.total_expenses?.toLocaleString() || item.expenses?.toLocaleString() || item.value?.toLocaleString() || 0}`
      ]);

      autoTable(pdf, {
        startY: currentY,
        head: [['Department', 'Expenses']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: margin, right: margin },
        styles: { fontSize: 10 }
      });

      currentY = (pdf as any).lastAutoTable.finalY + 10;
    }
    
    // Profit by Region
    if (breakdowns.profit_by_region) {
      checkPageBreak(50);
      
      pdf.setFontSize(16);
      pdf.setTextColor(15, 23, 42);
      pdf.text('Profit by Region', margin, currentY);
      currentY += 10;
      
      const tableData = breakdowns.profit_by_region.map((item: any) => [
        item.region || item.name,
        `$${item.total_profit?.toLocaleString() || item.profit?.toLocaleString() || item.value?.toLocaleString() || 0}`
      ]);

      autoTable(pdf, {
        startY: currentY,
        head: [['Region', 'Profit']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: margin, right: margin },
        styles: { fontSize: 10 }
      });

      currentY = (pdf as any).lastAutoTable.finalY + 10;
    }
  }

  // ==================== CORRELATION MATRIX ====================
  if (data.visualizations?.correlations?.correlation_matrix) {
    console.log('🔥 Adding correlation matrix...');
    checkPageBreak(60);
    
    pdf.setFontSize(16);
    pdf.setTextColor(15, 23, 42);
    pdf.text('Correlation Matrix', margin, currentY);
    currentY += 10;
    
    const matrix = data.visualizations.correlations.correlation_matrix;
    const columns = matrix.columns || [];
    const values = matrix.values || [];
    
    if (columns.length > 0 && values.length > 0) {
      // Show top correlations as table (top 15)
      const correlations: Array<{metric1: string, metric2: string, value: number}> = [];
      
      for (let i = 0; i < Math.min(columns.length, 10); i++) {
        for (let j = i + 1; j < Math.min(columns.length, 10); j++) {
          if (values[i] && values[i][j] !== undefined) {
            correlations.push({
              metric1: columns[i],
              metric2: columns[j],
              value: values[i][j]
            });
          }
        }
      }
      
      // Sort by absolute value
      correlations.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
      
      const tableData = correlations.slice(0, 15).map(item => [
        item.metric1,
        item.metric2,
        item.value.toFixed(3),
        item.value > 0.7 ? 'Strong Positive' :
        item.value > 0.3 ? 'Moderate Positive' :
        item.value < -0.7 ? 'Strong Negative' :
        item.value < -0.3 ? 'Moderate Negative' : 'Weak'
      ]);

      autoTable(pdf, {
        startY: currentY,
        head: [['Metric 1', 'Metric 2', 'Correlation', 'Strength']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: margin, right: margin },
        styles: { fontSize: 8 }
      });

      currentY = (pdf as any).lastAutoTable.finalY + 10;
    }
  }

  // ==================== INSIGHTS ====================
  if (data.insights && data.insights.length > 0) {
    console.log('💡 Adding insights...');
    checkPageBreak(60);
    
    pdf.setFontSize(18);
    pdf.setTextColor(15, 23, 42);
    pdf.text('Key Insights', margin, currentY);
    currentY += 10;
    
    data.insights.forEach((insight: any, index: number) => {
      checkPageBreak(30);
      
      pdf.setFontSize(12);
      pdf.setTextColor(59, 130, 246); // blue-500
      pdf.text(`${index + 1}. ${insight.title || 'Insight'}`, margin, currentY);
      currentY += 7;
      
      pdf.setFontSize(10);
      pdf.setTextColor(71, 85, 105);
      const descLines = pdf.splitTextToSize(insight.description || insight.insight || '', contentWidth);
      pdf.text(descLines, margin + 5, currentY);
      currentY += descLines.length * 5 + 5;
    });
  }

  // ==================== RECOMMENDATIONS ====================
  if (data.recommendations && data.recommendations.length > 0) {
    console.log('✅ Adding recommendations...');
    checkPageBreak(60);
    
    pdf.setFontSize(18);
    pdf.setTextColor(15, 23, 42);
    pdf.text('Recommendations', margin, currentY);
    currentY += 10;
    
    data.recommendations.forEach((rec: any, index: number) => {
      checkPageBreak(25);
      
      pdf.setFontSize(11);
      pdf.setTextColor(34, 197, 94); // green-500
      pdf.text(`${index + 1}. ${rec.title || rec.recommendation || ''}`, margin, currentY);
      currentY += 7;
      
      if (rec.description) {
        pdf.setFontSize(9);
        pdf.setTextColor(71, 85, 105);
        const descLines = pdf.splitTextToSize(rec.description, contentWidth - 5);
        pdf.text(descLines, margin + 5, currentY);
        currentY += descLines.length * 4 + 5;
      }
    });
  }

  // ==================== ANOMALIES ====================
  if (data.anomalies_table && data.anomalies_table.length > 0) {
    console.log('⚠️ Adding anomalies...');
    checkPageBreak(60);
    
    pdf.setFontSize(18);
    pdf.setTextColor(15, 23, 42);
    pdf.text('Detected Anomalies', margin, currentY);
    currentY += 10;
    
    const tableData = data.anomalies_table.slice(0, 10).map((anomaly: any) => [
      anomaly.date || anomaly.period || 'N/A',
      anomaly.metric || 'N/A',
      anomaly.value?.toFixed(2) || 'N/A',
      anomaly.severity || 'N/A'
    ]);

    autoTable(pdf, {
      startY: currentY,
      head: [['Date', 'Metric', 'Value', 'Severity']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [254, 242, 242] },
      margin: { left: margin, right: margin },
      styles: { fontSize: 9 }
    });

    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }

  // ==================== MODEL HEALTH ====================
  if (data.model_health_report) {
    console.log('🏥 Adding model health report...');
    checkPageBreak(60);
    
    pdf.setFontSize(18);
    pdf.setTextColor(15, 23, 42);
    pdf.text('Model Health Report', margin, currentY);
    currentY += 10;
    
    // Helper function to recursively format values
    const formatValue = (val: any, depth: number = 0): string => {
      if (val === null || val === undefined) return 'N/A';
      
      if (typeof val === 'number') {
        return val.toFixed(4);
      }
      
      if (typeof val === 'boolean') {
        return val ? 'Yes' : 'No';
      }
      
      if (Array.isArray(val)) {
        if (val.length === 0) return 'N/A';
        return val.map(v => formatValue(v, depth + 1)).join(', ');
      }
      
      if (typeof val === 'object') {
        // Recursively format nested objects
        const entries = Object.entries(val);
        if (entries.length === 0) return 'N/A';
        
        return entries
          .map(([k, v]) => {
            const formattedKey = k.replace(/_/g, ' ');
            const formattedVal = formatValue(v, depth + 1);
            return `${formattedKey}: ${formattedVal}`;
          })
          .join('; ');
      }
      
      return String(val);
    };
    
    const healthData = Object.entries(data.model_health_report).map(([key, value]) => [
      key.replace(/_/g, ' ').toUpperCase(),
      formatValue(value)
    ]);

    autoTable(pdf, {
      startY: currentY,
      head: [['Metric', 'Value']],
      body: healthData,
      theme: 'grid',
      headStyles: { 
        fillColor: [15, 23, 42], 
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin },
      styles: { 
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak',
        cellWidth: 'wrap'
      },
      columnStyles: {
        0: { cellWidth: 60, fontStyle: 'bold' },
        1: { cellWidth: 'auto' }
      }
    });

    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }

  // Add page footers to all pages
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    if (i > 1) {
      addPageHeader();
    }
    addPageFooter();
  }

  const filename = `Praxifi_Complete_Report_${mode}_${new Date().toISOString().split('T')[0]}.pdf`;
  
  console.log(`✅ PDF generated successfully: ${filename}`);
  console.log(`📄 Total pages: ${totalPages}`);

  // Return blob or download based on parameter
  if (returnBlob) {
    return pdf.output('blob');
  } else {
    pdf.save(filename);
  }
}
