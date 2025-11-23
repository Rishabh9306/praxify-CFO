import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';

interface PDFGeneratorOptions {
  fullReportData: any;
  mode: string;
}

// Helper to capture chart/heatmap as image
async function captureElementAsImage(elementId: string): Promise<string | null> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`Element ${elementId} not found`);
    return null;
  }
  
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
    });
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error(`Error capturing ${elementId}:`, error);
    return null;
  }
}

export async function generateCompletePDF(options: PDFGeneratorOptions): Promise<void> {
  const { fullReportData, mode } = options;
  const report = fullReportData.full_analysis_report || fullReportData;
  
  // Create PDF with better configuration
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  }) as any; // Cast to any to use autoTable
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  
  let currentY = margin;
  let pageCount = 1;
  
  // Primary color
  const primaryColor: [number, number, number] = [255, 199, 0]; // Yellow/Gold
  const textColor: [number, number, number] = [0, 0, 0];
  const grayColor: [number, number, number] = [100, 100, 100];
  const lightGray: [number, number, number] = [245, 245, 245];
  
  // Helper: Add logo
  const addLogo = async (small: boolean = false) => {
    try {
      const logoFile = small ? '/logo.png' : '/long_logo.png';
      const logoResponse = await fetch(logoFile);
      const logoBlob = await logoResponse.blob();
      const logoUrl = URL.createObjectURL(logoBlob);
      
      const img = new Image();
      img.src = logoUrl;
      await new Promise((resolve) => { img.onload = resolve; });
      
      if (small) {
        pdf.addImage(img, 'PNG', pageWidth - margin - 20, 5, 20, 20);
      } else {
        const w = 100, h = 25;
        pdf.addImage(img, 'PNG', (pageWidth - w) / 2, 30, w, h);
      }
      
      URL.revokeObjectURL(logoUrl);
    } catch (error) {
      console.error('Logo error:', error);
    }
  };
  
  // Helper: New page
  const addPage = async () => {
    pdf.addPage();
    pageCount++;
    currentY = margin + 25;
    await addLogo(true);
  };
  
  // Helper: Check space
  const checkSpace = async (needed: number) => {
    if (currentY + needed > pageHeight - margin - 10) {
      await addPage();
    }
  };
  
  // Helper: Add page numbers
  const addPageNumbers = () => {
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(9);
      pdf.setTextColor(...grayColor);
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
  };
  
  // =======================
  // COVER PAGE
  // =======================
  await addLogo(false);
  
  pdf.setFontSize(28);
  pdf.setTextColor(...textColor);
  pdf.text('Financial Analysis Report', pageWidth / 2, 80, { align: 'center' });
  
  pdf.setFontSize(16);
  pdf.setTextColor(...grayColor);
  const modeName = mode === 'financial_storyteller' ? 'Strategic CFO Report' : 'Guardian Analysis';
  pdf.text(modeName, pageWidth / 2, 95, { align: 'center' });
  
  const metadata = report.metadata || {};
  pdf.setFontSize(12);
  pdf.text(`Generated: ${new Date(metadata.generated_at || Date.now()).toLocaleDateString()}`, pageWidth / 2, 110, { align: 'center' });
  
  pdf.setFontSize(11);
  pdf.setTextColor(120, 120, 120);
  const dataStart = metadata.data_start_date || 'N/A';
  const dataEnd = metadata.data_end_date || 'N/A';
  pdf.text(`Analysis Period: ${dataStart} to ${dataEnd}`, pageWidth / 2, 125, { align: 'center' });
  
  // Decorative line
  pdf.setDrawColor(...primaryColor);
  pdf.setLineWidth(1);
  pdf.line(margin + 40, 140, pageWidth - margin - 40, 140);
  
  // Footer
  pdf.setFontSize(10);
  pdf.setTextColor(150, 150, 150);
  pdf.text('Praxifi AI-Powered Financial Intelligence', pageWidth / 2, pageHeight - 20, { align: 'center' });
  pdf.text('Confidential - For Internal Use Only', pageWidth / 2, pageHeight - 12, { align: 'center' });
  
  // =======================
  // PAGE 2: KEY KPIs
  // =======================
  await addPage();
  
  pdf.setFontSize(20);
  pdf.setTextColor(...textColor);
  pdf.text('Key Performance Indicators', margin, currentY);
  currentY += 12;
  
  const kpis = report.kpis || {};
  const kpiData = [
    ['Total Revenue', `$${(kpis.total_revenue || 0).toLocaleString()}`, kpis.growth_rate ? `${kpis.growth_rate.toFixed(2)}%` : 'N/A'],
    ['Total Expenses', `$${(kpis.total_expenses || 0).toLocaleString()}`, 'N/A'],
    ['Profit Margin', `${((kpis.profit_margin || 0) * 100).toFixed(2)}%`, 'N/A'],
    ['Cash Flow', `$${(kpis.cashflow || 0).toLocaleString()}`, 'N/A'],
    ['Growth Rate', `${(kpis.growth_rate || 0).toFixed(2)}%`, 'N/A'],
    ['Financial Health Score', `${(kpis.financial_health_score || 0).toFixed(2)}/100`, 'N/A'],
    ['Forecast Accuracy', `${(kpis.forecast_accuracy || 0).toFixed(2)}%`, 'N/A'],
    ['DSO (Days)', `${(kpis.dso || 0).toFixed(1)}`, 'N/A'],
  ];
  
  autoTable(pdf, {
    startY: currentY,
    head: [['Metric', 'Value', 'Trend']],
    body: kpiData,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: [0, 0, 0], fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: 'bold' },
      1: { cellWidth: 60, halign: 'right' },
      2: { cellWidth: 40, halign: 'center' }
    }
  });
  
  currentY = (pdf as any).lastAutoTable.finalY + 15;
  
  // =======================
  // EXECUTIVE SUMMARY
  // =======================
  await checkSpace(40);
  
  pdf.setFontSize(18);
  pdf.setTextColor(...textColor);
  pdf.text('Executive Summary', margin, currentY);
  currentY += 10;
  
  const narratives = report.narratives || {};
  const summaryText = mode === 'financial_storyteller' 
    ? (narratives.executive_summary || narratives.narrative || 'No summary available.')
    : (narratives.summary_text || 'No summary available.');
  
  pdf.setFontSize(10);
  pdf.setTextColor(60, 60, 60);
  const summaryLines = pdf.splitTextToSize(summaryText.replace(/\*\*/g, '').replace(/\*/g, ''), contentWidth);
  
  for (const line of summaryLines) {
    await checkSpace(7);
    pdf.text(line, margin, currentY);
    currentY += 7;
  }
  
  currentY += 10;
  
  // =======================
  // STRATEGIC INSIGHTS
  // =======================
  await checkSpace(30);
  
  pdf.setFontSize(18);
  pdf.setTextColor(...textColor);
  pdf.text('Strategic Insights', margin, currentY);
  currentY += 10;
  
  const insights = mode === 'financial_storyteller'
    ? (narratives.strategic_insights || [])
    : (narratives.analyst_insights || []);
  
  pdf.setFontSize(10);
  pdf.setTextColor(60, 60, 60);
  
  for (const insight of insights) {
    const cleanInsight = insight.replace(/\*\*/g, '').replace(/\*/g, '').replace(/`/g, '');
    const lines = pdf.splitTextToSize(`• ${cleanInsight}`, contentWidth - 5);
    
    for (const line of lines) {
      await checkSpace(7);
      pdf.text(line, margin, currentY);
      currentY += 7;
    }
    currentY += 3;
  }
  
  currentY += 10;
  
  // =======================
  // RECOMMENDATIONS
  // =======================
  await checkSpace(30);
  
  pdf.setFontSize(18);
  pdf.setTextColor(...textColor);
  pdf.text('Recommendations', margin, currentY);
  currentY += 10;
  
  const recommendations = mode === 'financial_storyteller'
    ? (narratives.recommendations || [])
    : (report.recommendations || []);
  
  pdf.setFontSize(10);
  pdf.setTextColor(60, 60, 60);
  
  for (const rec of recommendations) {
    const cleanRec = rec.replace(/\*\*/g, '').replace(/\*/g, '');
    const lines = pdf.splitTextToSize(`• ${cleanRec}`, contentWidth - 5);
    
    for (const line of lines) {
      await checkSpace(7);
      pdf.text(line, margin, currentY);
      currentY += 7;
    }
    currentY += 3;
  }
  
  // =======================
  // ANOMALIES TABLE
  // =======================
  const anomalies = report.anomalies_table || [];
  
  if (anomalies.length > 0) {
    await addPage();
    
    pdf.setFontSize(18);
    pdf.setTextColor(...textColor);
    pdf.text('Detected Anomalies', margin, currentY);
    currentY += 12;
    
    const anomalyData = anomalies.slice(0, 20).map((a: any) => [
      a.date || 'N/A',
      a.metric || 'N/A',
      `$${(a.value || 0).toLocaleString()}`,
      `$${(a.expected_value || 0).toLocaleString()}`,
      `${((a.deviation_percent || 0) * 100).toFixed(1)}%`,
      a.severity || 'N/A'
    ]);
    
    autoTable(pdf, {
      startY: currentY,
      head: [['Date', 'Metric', 'Value', 'Expected', 'Deviation', 'Severity']],
      body: anomalyData,
      theme: 'striped',
      headStyles: { fillColor: primaryColor, textColor: [0, 0, 0] },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 30 },
        2: { cellWidth: 25, halign: 'right' },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 20, halign: 'right' },
        5: { cellWidth: 20, halign: 'center' }
      },
      didParseCell: function(data: any) {
        if (data.column.index === 5 && data.section === 'body') {
          const severity = data.cell.text[0];
          if (severity === 'high') data.cell.styles.textColor = [239, 68, 68];
          else if (severity === 'medium') data.cell.styles.textColor = [245, 158, 11];
          else if (severity === 'low') data.cell.styles.textColor = [16, 185, 129];
        }
      }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 15;
  }
  
  // =======================
  // ENHANCED KPIs TABLE
  // =======================
  const enhancedKPIs = report.enhanced_kpis || {};
  
  if (Object.keys(enhancedKPIs).length > 0) {
    await checkSpace(50);
    if (currentY > pageHeight - 100) await addPage();
    
    pdf.setFontSize(18);
    pdf.setTextColor(...textColor);
    pdf.text('Enhanced Metrics', margin, currentY);
    currentY += 12;
    
    const enhancedData = Object.entries(enhancedKPIs).map(([key, value]: [string, any]) => {
      const label = key.replace(/_/g, ' ').toUpperCase();
      const val = typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value;
      return [label, val];
    });
    
    autoTable(pdf, {
      startY: currentY,
      head: [['Metric', 'Value']],
      body: enhancedData,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: [0, 0, 0] },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 100, fontStyle: 'bold' },
        1: { cellWidth: 65, halign: 'right' }
      }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 15;
  }
  
  // =======================
  // FORECAST TABLES
  // =======================
  await addPage();
  
  pdf.setFontSize(18);
  pdf.setTextColor(...textColor);
  pdf.text('Forecast Data', margin, currentY);
  currentY += 12;
  
  const forecastTableMetrics = ['revenue', 'expenses', 'profit', 'cashflow'];
  
  for (const metric of forecastTableMetrics) {
    const forecastData = report.forecast_chart?.[metric];
    if (!forecastData || forecastData.length === 0) continue;
    
    await checkSpace(50);
    if (currentY > pageHeight - 80) await addPage();
    
    pdf.setFontSize(14);
    pdf.setTextColor(...textColor);
    pdf.text(`${metric.toUpperCase()} Forecast`, margin, currentY);
    currentY += 8;
    
    const tableData = forecastData.slice(0, 12).map((item: any) => [
      new Date(item.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      `$${(item.predicted || 0).toLocaleString()}`,
      `$${(item.lower || 0).toLocaleString()}`,
      `$${(item.upper || 0).toLocaleString()}`
    ]);
    
    autoTable(pdf, {
      startY: currentY,
      head: [['Date', 'Predicted', 'Lower Bound', 'Upper Bound']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [100, 100, 100], textColor: [255, 255, 255] },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 45, halign: 'right' },
        2: { cellWidth: 45, halign: 'right' },
        3: { cellWidth: 45, halign: 'right' }
      }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 10;
  }
  
  // =======================
  // CORRELATION INSIGHTS
  // =======================
  const corrInsights = report.correlation_insights || [];
  
  if (corrInsights.length > 0) {
    await checkSpace(50);
    if (currentY > pageHeight - 80) await addPage();
    
    pdf.setFontSize(18);
    pdf.setTextColor(...textColor);
    pdf.text('Correlation Insights', margin, currentY);
    currentY += 12;
    
    const corrData = corrInsights.slice(0, 15).map((c: any) => [
      c.metric_a || 'N/A',
      c.metric_b || 'N/A',
      (c.correlation || 0).toFixed(3),
      c.strength || 'N/A',
      c.insight || 'N/A'
    ]);
    
    autoTable(pdf, {
      startY: currentY,
      head: [['Metric A', 'Metric B', 'Correlation', 'Strength', 'Insight']],
      body: corrData,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: [0, 0, 0] },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 30 },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 20 },
        4: { cellWidth: 65 }
      }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 15;
  }
  
  // =======================
  // PROFIT DRIVERS
  // =======================
  const profitDrivers = report.profit_drivers?.feature_attributions || [];
  
  if (profitDrivers.length > 0) {
    await checkSpace(50);
    if (currentY > pageHeight - 80) await addPage();
    
    pdf.setFontSize(18);
    pdf.setTextColor(...textColor);
    pdf.text('Profit Driver Analysis', margin, currentY);
    currentY += 12;
    
    const driverData = profitDrivers.slice(0, 10).map((d: any) => [
      (d.feature || '').replace(/_/g, ' ').toUpperCase(),
      (d.contribution_score || 0).toFixed(4),
      (d.impact_rank || 'N/A')
    ]);
    
    autoTable(pdf, {
      startY: currentY,
      head: [['Feature', 'Contribution', 'Rank']],
      body: driverData,
      theme: 'striped',
      headStyles: { fillColor: primaryColor, textColor: [0, 0, 0] },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 100, fontStyle: 'bold' },
        1: { cellWidth: 40, halign: 'right' },
        2: { cellWidth: 25, halign: 'center' }
      }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 15;
  }
  
  // =======================
  // MODEL HEALTH REPORT
  // =======================
  const modelHealth = report.model_health_report || {};
  
  if (Object.keys(modelHealth).length > 0) {
    await checkSpace(50);
    if (currentY > pageHeight - 80) await addPage();
    
    pdf.setFontSize(18);
    pdf.setTextColor(...textColor);
    pdf.text('Model Performance', margin, currentY);
    currentY += 12;
    
    const healthData = Object.entries(modelHealth).map(([key, value]: [string, any]) => [
      key.replace(/_/g, ' ').toUpperCase(),
      value.best_model_selected || 'N/A',
      value.status || 'N/A',
      value.accuracy ? `${(value.accuracy * 100).toFixed(1)}%` : 'N/A'
    ]);
    
    autoTable(pdf, {
      startY: currentY,
      head: [['Metric', 'Model', 'Status', 'Accuracy']],
      body: healthData,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: [0, 0, 0] },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40 },
        2: { cellWidth: 30 },
        3: { cellWidth: 35, halign: 'right' }
      }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 15;
  }
  
  // =======================
  // VISUALIZATIONS: BREAKDOWNS
  // =======================
  const visualizations = report.visualizations || {};
  const breakdowns = visualizations.breakdowns || {};
  
  if (Object.keys(breakdowns).length > 0) {
    await addPage();
    
    pdf.setFontSize(20);
    pdf.setTextColor(...textColor);
    pdf.text('Revenue & Expense Breakdown', margin, currentY);
    currentY += 15;
    
    // Revenue by Region
    if (breakdowns.revenue_by_region && breakdowns.revenue_by_region.length > 0) {
      pdf.setFontSize(14);
      pdf.setTextColor(...textColor);
      pdf.text('Revenue by Region', margin, currentY);
      currentY += 8;
      
      const revenueData = breakdowns.revenue_by_region.map((item: any) => [
        item.region || 'N/A',
        `$${(item.total_revenue || 0).toLocaleString()}`
      ]);
      
      autoTable(pdf, {
        startY: currentY,
        head: [['Region', 'Total Revenue']],
        body: revenueData,
        theme: 'striped',
        headStyles: { fillColor: primaryColor, textColor: [0, 0, 0] },
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: {
          0: { cellWidth: 90, fontStyle: 'bold' },
          1: { cellWidth: 75, halign: 'right' }
        }
      });
      
      currentY = (pdf as any).lastAutoTable.finalY + 12;
    }
    
    // Profit by Region
    if (breakdowns.profit_by_region && breakdowns.profit_by_region.length > 0) {
      await checkSpace(50);
      
      pdf.setFontSize(14);
      pdf.setTextColor(...textColor);
      pdf.text('Profit by Region', margin, currentY);
      currentY += 8;
      
      const profitData = breakdowns.profit_by_region.map((item: any) => [
        item.region || 'N/A',
        `$${(item.total_profit || 0).toLocaleString()}`
      ]);
      
      autoTable(pdf, {
        startY: currentY,
        head: [['Region', 'Total Profit']],
        body: profitData,
        theme: 'striped',
        headStyles: { fillColor: primaryColor, textColor: [0, 0, 0] },
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: {
          0: { cellWidth: 90, fontStyle: 'bold' },
          1: { cellWidth: 75, halign: 'right' }
        }
      });
      
      currentY = (pdf as any).lastAutoTable.finalY + 12;
    }
    
    // Expenses by Department
    if (breakdowns.expenses_by_department && breakdowns.expenses_by_department.length > 0) {
      await checkSpace(50);
      
      pdf.setFontSize(14);
      pdf.setTextColor(...textColor);
      pdf.text('Expenses by Department', margin, currentY);
      currentY += 8;
      
      const expensesData = breakdowns.expenses_by_department.map((item: any) => [
        item.department || 'N/A',
        `$${(item.total_expenses || 0).toLocaleString()}`
      ]);
      
      autoTable(pdf, {
        startY: currentY,
        head: [['Department', 'Total Expenses']],
        body: expensesData,
        theme: 'striped',
        headStyles: { fillColor: primaryColor, textColor: [0, 0, 0] },
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: {
          0: { cellWidth: 90, fontStyle: 'bold' },
          1: { cellWidth: 75, halign: 'right' }
        }
      });
      
      currentY = (pdf as any).lastAutoTable.finalY + 15;
    }
  }
  
  // =======================
  // CORRELATION HEATMAP (as captured image)
  // =======================
  await addPage();
  
  pdf.setFontSize(20);
  pdf.setTextColor(...textColor);
  pdf.text('Correlation Analysis', margin, currentY);
  currentY += 12;
  
  // Try to capture the heatmap visualization
  const heatmapImage = await captureElementAsImage('correlation-heatmap');
  
  if (heatmapImage) {
    pdf.setFontSize(12);
    pdf.setTextColor(...grayColor);
    pdf.text('Correlation Heatmap - Key Metric Relationships', margin, currentY);
    currentY += 10;
    
    const imgWidth = contentWidth;
    const imgHeight = 120; // Fixed height for landscape heatmap
    
    await checkSpace(imgHeight + 10);
    
    pdf.addImage(heatmapImage, 'PNG', margin, currentY, imgWidth, imgHeight);
    currentY += imgHeight + 15;
  } else {
    // Fallback: Show correlation matrix as table (top correlations)
    const correlations = report.correlations || {};
    const corrMatrix = correlations.correlation_matrix;
    
    if (corrMatrix && corrMatrix.columns && corrMatrix.values) {
      pdf.setFontSize(12);
      pdf.setTextColor(...grayColor);
      pdf.text('Top Metric Correlations', margin, currentY);
      currentY += 10;
      
      // Show top 10 strongest correlations
      const topCorrelations: any[] = [];
      
      for (let i = 0; i < corrMatrix.columns.length && i < 10; i++) {
        for (let j = i + 1; j < corrMatrix.columns.length && j < 10; j++) {
          if (corrMatrix.values[i] && corrMatrix.values[i][j] !== null) {
            const corr = corrMatrix.values[i][j];
            if (Math.abs(corr) > 0.5) { // Only strong correlations
              topCorrelations.push({
                metric1: corrMatrix.columns[i],
                metric2: corrMatrix.columns[j],
                correlation: corr
              });
            }
          }
        }
      }
      
      // Sort by absolute correlation
      topCorrelations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
      
      const corrData = topCorrelations.slice(0, 15).map((item: any) => [
        item.metric1.replace(/_/g, ' ').toUpperCase(),
        item.metric2.replace(/_/g, ' ').toUpperCase(),
        item.correlation.toFixed(3),
        Math.abs(item.correlation) > 0.8 ? 'Very Strong' : 
        Math.abs(item.correlation) > 0.6 ? 'Strong' : 'Moderate'
      ]);
      
      autoTable(pdf, {
        startY: currentY,
        head: [['Metric A', 'Metric B', 'Correlation', 'Strength']],
        body: corrData,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: [0, 0, 0] },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 50 },
          2: { cellWidth: 30, halign: 'center' },
          3: { cellWidth: 35 }
        },
        didParseCell: function(data: any) {
          if (data.column.index === 2 && data.section === 'body') {
            const corr = parseFloat(data.cell.text[0]);
            if (corr > 0.8) data.cell.styles.textColor = [16, 185, 129]; // Green
            else if (corr < -0.8) data.cell.styles.textColor = [239, 68, 68]; // Red
          }
        }
      });
      
      currentY = (pdf as any).lastAutoTable.finalY + 15;
    }
  }
  
  // =======================
  // TIME SERIES CHARTS (as captured images)
  // =======================
  const timeSeries = visualizations.time_series || {};
  
  if (Object.keys(timeSeries).length > 0) {
    await addPage();
    
    pdf.setFontSize(20);
    pdf.setTextColor(...textColor);
    pdf.text('Trend Analysis', margin, currentY);
    currentY += 12;
    
    // Try to capture trend charts
    const chartIds = [
      { id: 'revenue-trend-chart', title: 'Revenue Trend' },
      { id: 'profit-trend-chart', title: 'Profit Trend' },
      { id: 'cashflow-trend-chart', title: 'Cash Flow Trend' }
    ];
    
    for (const chart of chartIds) {
      const chartImage = await captureElementAsImage(chart.id);
      
      if (chartImage) {
        await checkSpace(80);
        
        pdf.setFontSize(12);
        pdf.setTextColor(...grayColor);
        pdf.text(chart.title, margin, currentY);
        currentY += 8;
        
        const imgWidth = contentWidth;
        const imgHeight = 60;
        
        pdf.addImage(chartImage, 'PNG', margin, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 10;
      }
    }
    
    // Fallback: Show time series data as tables
    if (timeSeries.revenue_rolling_avg && timeSeries.revenue_rolling_avg.length > 0) {
      await checkSpace(50);
      
      pdf.setFontSize(14);
      pdf.setTextColor(...textColor);
      pdf.text('Revenue Trend Data', margin, currentY);
      currentY += 8;
      
      const revenueData = timeSeries.revenue_rolling_avg.slice(-12).map((item: any) => [
        new Date(item.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        `$${(item.value || 0).toLocaleString()}`
      ]);
      
      autoTable(pdf, {
        startY: currentY,
        head: [['Date', 'Revenue (Rolling Avg)']],
        body: revenueData,
        theme: 'striped',
        headStyles: { fillColor: [100, 100, 100], textColor: [255, 255, 255] },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 85, halign: 'right' }
        }
      });
      
      currentY = (pdf as any).lastAutoTable.finalY + 15;
    }
  }
  
  // =======================
  // FORECAST CHARTS (try to capture images)
  // =======================
  const forecastChart = report.forecast_chart || {};
  const forecastMetrics = Object.keys(forecastChart);
  
  if (forecastMetrics.length > 0) {
    await addPage();
    
    pdf.setFontSize(20);
    pdf.setTextColor(...textColor);
    pdf.text('Forecast Visualizations', margin, currentY);
    currentY += 12;
    
    // Try to capture forecast chart images (they're shown as tabs in the UI)
    for (const metric of ['revenue', 'expenses', 'profit', 'cashflow']) {
      if (forecastChart[metric] && forecastChart[metric].length > 0) {
        const chartImage = await captureElementAsImage(`forecast-chart-${metric}`);
        
        if (chartImage) {
          await checkSpace(80);
          
          pdf.setFontSize(14);
          pdf.setTextColor(...textColor);
          pdf.text(`${metric.toUpperCase()} Forecast`, margin, currentY);
          currentY += 8;
          
          const imgWidth = contentWidth;
          const imgHeight = 70;
          
          pdf.addImage(chartImage, 'PNG', margin, currentY, imgWidth, imgHeight);
          currentY += imgHeight + 12;
        }
      }
    }
  }
  
  // =======================
  // DIAGNOSTICS TABLES
  // =======================
  const diagnostics = report.diagnostics || {};
  
  if (Object.keys(diagnostics).length > 0) {
    await addPage();
    
    pdf.setFontSize(20);
    pdf.setTextColor(...textColor);
    pdf.text('Diagnostic Analysis', margin, currentY);
    currentY += 15;
    
    // Top Revenue Spikes
    if (diagnostics.top_revenue_spikes && diagnostics.top_revenue_spikes.length > 0) {
      pdf.setFontSize(14);
      pdf.setTextColor(...textColor);
      pdf.text('Top Revenue Spikes', margin, currentY);
      currentY += 8;
      
      const spikeData = diagnostics.top_revenue_spikes.slice(0, 10).map((item: any) => [
        new Date(item.date).toLocaleDateString(),
        `$${(item.revenue || 0).toLocaleString()}`,
        `${((item.spike_magnitude || 0) * 100).toFixed(1)}%`
      ]);
      
      autoTable(pdf, {
        startY: currentY,
        head: [['Date', 'Revenue', 'Spike %']],
        body: spikeData,
        theme: 'striped',
        headStyles: { fillColor: primaryColor, textColor: [0, 0, 0] },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 55 },
          1: { cellWidth: 60, halign: 'right' },
          2: { cellWidth: 50, halign: 'right' }
        }
      });
      
      currentY = (pdf as any).lastAutoTable.finalY + 12;
    }
    
    // Top Expense Spikes
    if (diagnostics.top_expense_spikes && diagnostics.top_expense_spikes.length > 0) {
      await checkSpace(50);
      
      pdf.setFontSize(14);
      pdf.setTextColor(...textColor);
      pdf.text('Top Expense Spikes', margin, currentY);
      currentY += 8;
      
      const spikeData = diagnostics.top_expense_spikes.slice(0, 10).map((item: any) => [
        new Date(item.date).toLocaleDateString(),
        `$${(item.expenses || 0).toLocaleString()}`,
        `${((item.spike_magnitude || 0) * 100).toFixed(1)}%`
      ]);
      
      autoTable(pdf, {
        startY: currentY,
        head: [['Date', 'Expenses', 'Spike %']],
        body: spikeData,
        theme: 'striped',
        headStyles: { fillColor: primaryColor, textColor: [0, 0, 0] },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 55 },
          1: { cellWidth: 60, halign: 'right' },
          2: { cellWidth: 50, halign: 'right' }
        }
      });
      
      currentY = (pdf as any).lastAutoTable.finalY + 12;
    }
    
    // High Risk Periods
    if (diagnostics.high_risk_periods && diagnostics.high_risk_periods.length > 0) {
      await checkSpace(50);
      
      pdf.setFontSize(14);
      pdf.setTextColor(...textColor);
      pdf.text('High Risk Periods', margin, currentY);
      currentY += 8;
      
      const riskData = diagnostics.high_risk_periods.slice(0, 10).map((item: any) => [
        new Date(item.date).toLocaleDateString(),
        item.risk_level || 'N/A',
        item.description || 'N/A'
      ]);
      
      autoTable(pdf, {
        startY: currentY,
        head: [['Date', 'Risk Level', 'Description']],
        body: riskData,
        theme: 'striped',
        headStyles: { fillColor: primaryColor, textColor: [0, 0, 0] },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 100 }
        },
        didParseCell: function(data: any) {
          if (data.column.index === 1 && data.section === 'body') {
            const risk = data.cell.text[0].toLowerCase();
            if (risk.includes('high')) data.cell.styles.textColor = [239, 68, 68];
            else if (risk.includes('medium')) data.cell.styles.textColor = [245, 158, 11];
          }
        }
      });
      
      currentY = (pdf as any).lastAutoTable.finalY + 15;
    }
  }
  
  // =======================
  // DATA VALIDATION REPORT
  // =======================
  const dataValidation = report.data_validation || {};
  
  if (Object.keys(dataValidation).length > 0) {
    await checkSpace(50);
    if (currentY > pageHeight - 80) await addPage();
    
    pdf.setFontSize(18);
    pdf.setTextColor(...textColor);
    pdf.text('Data Quality Report', margin, currentY);
    currentY += 12;
    
    pdf.setFontSize(10);
    pdf.setTextColor(60, 60, 60);
    
    if (dataValidation.original_shape) {
      pdf.text(`Original Data: ${dataValidation.original_shape[0]} rows × ${dataValidation.original_shape[1]} columns`, margin, currentY);
      currentY += 7;
    }
    
    if (dataValidation.cleaned_shape) {
      pdf.text(`Cleaned Data: ${dataValidation.cleaned_shape[0]} rows × ${dataValidation.cleaned_shape[1]} columns`, margin, currentY);
      currentY += 7;
    }
    
    if (dataValidation.missing_values_summary) {
      currentY += 5;
      pdf.setFontSize(12);
      pdf.setTextColor(...textColor);
      pdf.text('Missing Values Summary', margin, currentY);
      currentY += 8;
      
      const missingData = Object.entries(dataValidation.missing_values_summary).map(([key, value]: [string, any]) => [
        key,
        value.toString()
      ]);
      
      if (missingData.length > 0) {
        autoTable(pdf, {
          startY: currentY,
          head: [['Column', 'Missing Values']],
          body: missingData.slice(0, 20),
          theme: 'grid',
          headStyles: { fillColor: primaryColor, textColor: [0, 0, 0] },
          styles: { fontSize: 8, cellPadding: 3 },
          columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 65, halign: 'right' }
          }
        });
        
        currentY = (pdf as any).lastAutoTable.finalY + 10;
      }
    }
  }
  
  // Add page numbers to all pages
  addPageNumbers();
  
  // Save PDF
  const fileName = `Praxifi_Complete_Report_${mode}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
}
