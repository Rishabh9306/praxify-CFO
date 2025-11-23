import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PDFGeneratorOptions {
  fullReportData: any;
  mode: string;
}

export async function generateFullReportPDF(options: PDFGeneratorOptions): Promise<void> {
  const { fullReportData, mode } = options;
  
  // Create PDF instance
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  
  let currentY = margin;
  let pageNumber = 1;
  
  // Helper function to add logo on top corner of each page
  const addPageHeader = async (isFirstPage: boolean = false) => {
    try {
      // Add small logo in top-right corner
      const logoResponse = await fetch('/logo.png');
      const logoBlob = await logoResponse.blob();
      const logoUrl = URL.createObjectURL(logoBlob);
      
      const logoImg = new Image();
      logoImg.src = logoUrl;
      
      await new Promise((resolve) => {
        logoImg.onload = resolve;
      });
      
      // Add logo to top-right corner (15mm from top, 15mm from right edge)
      const logoWidth = 20;
      const logoHeight = 20;
      pdf.addImage(logoImg, 'PNG', pageWidth - margin - logoWidth, 5, logoWidth, logoHeight);
      
      URL.revokeObjectURL(logoUrl);
    } catch (error) {
      console.error('Error adding logo:', error);
    }
  };
  
  // Helper function to add new page
  const addNewPage = async () => {
    pdf.addPage();
    pageNumber++;
    currentY = margin + 25; // Leave space for logo
    await addPageHeader();
  };
  
  // Helper function to check if we need a new page
  const checkPageSpace = async (requiredSpace: number) => {
    if (currentY + requiredSpace > pageHeight - margin) {
      await addNewPage();
    }
  };
  
  // ========================================
  // FIRST PAGE - COVER PAGE
  // ========================================
  try {
    // Add long logo on first page (centered)
    const longLogoResponse = await fetch('/long_logo.png');
    const longLogoBlob = await longLogoResponse.blob();
    const longLogoUrl = URL.createObjectURL(longLogoBlob);
    
    const longLogoImg = new Image();
    longLogoImg.src = longLogoUrl;
    
    await new Promise((resolve) => {
      longLogoImg.onload = resolve;
    });
    
    // Add long logo centered at top
    const longLogoWidth = 100;
    const longLogoHeight = 25;
    const logoX = (pageWidth - longLogoWidth) / 2;
    pdf.addImage(longLogoImg, 'PNG', logoX, 30, longLogoWidth, longLogoHeight);
    
    URL.revokeObjectURL(longLogoUrl);
  } catch (error) {
    console.error('Error adding long logo:', error);
  }
  
  // Add title
  pdf.setFontSize(28);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Financial Analysis Report', pageWidth / 2, 80, { align: 'center' });
  
  // Add subtitle
  pdf.setFontSize(16);
  pdf.setTextColor(100, 100, 100);
  const modeName = mode === 'financial_storyteller' ? 'Strategic CFO Report' : 'Comprehensive Guardian Analysis';
  pdf.text(modeName, pageWidth / 2, 95, { align: 'center' });
  
  // Add date
  const report = fullReportData.full_analysis_report || {};
  const metadata = report.metadata || {};
  const generatedDate = metadata.generated_at ? new Date(metadata.generated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  pdf.setFontSize(12);
  pdf.text(`Generated: ${generatedDate}`, pageWidth / 2, 110, { align: 'center' });
  
  // Add data period if available
  if (metadata.data_start_date && metadata.data_end_date) {
    pdf.setFontSize(11);
    pdf.setTextColor(120, 120, 120);
    pdf.text(`Analysis Period: ${metadata.data_start_date} to ${metadata.data_end_date}`, pageWidth / 2, 120, { align: 'center' });
  }
  
  // Add decorative line
  pdf.setDrawColor(255, 199, 0); // Primary color
  pdf.setLineWidth(1);
  pdf.line(margin + 30, 135, pageWidth - margin - 30, 135);
  
  // Add footer on cover page
  pdf.setFontSize(10);
  pdf.setTextColor(150, 150, 150);
  pdf.text('Praxifi AI-Powered Financial Intelligence', pageWidth / 2, pageHeight - 20, { align: 'center' });
  pdf.text('Confidential - For Internal Use Only', pageWidth / 2, pageHeight - 15, { align: 'center' });
  
  // ========================================
  // PAGE 2 - KEY PERFORMANCE INDICATORS
  // ========================================
  await addNewPage();
  
  pdf.setFontSize(20);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Key Performance Indicators', margin, currentY);
  currentY += 12;
  
  const kpis = report.kpis || {};
  
  // Format KPIs
  const kpiData = [
    { label: 'Total Revenue', value: `$${(kpis.total_revenue || 0).toLocaleString()}`, icon: '💰' },
    { label: 'Total Expenses', value: `$${(kpis.total_expenses || 0).toLocaleString()}`, icon: '💸' },
    { label: 'Profit Margin', value: `${((kpis.profit_margin || 0) * 100).toFixed(1)}%`, icon: '📊' },
    { label: 'Cash Flow', value: `$${(kpis.cashflow || 0).toLocaleString()}`, icon: '💵' },
    { label: 'Growth Rate', value: `${(kpis.growth_rate || 0).toFixed(2)}%`, icon: '📈' },
    { label: 'Financial Health Score', value: `${(kpis.financial_health_score || 0).toFixed(1)}/100`, icon: '❤️' },
    { label: 'Forecast Accuracy', value: `${(kpis.forecast_accuracy || 0).toFixed(1)}%`, icon: '🎯' },
    { label: 'DSO (Days)', value: `${(kpis.dso || 0).toFixed(1)}`, icon: '⏱️' },
  ];
  
  // Draw KPI cards
  pdf.setFontSize(11);
  const cardWidth = (contentWidth - 10) / 2;
  const cardHeight = 20;
  let cardX = margin;
  let cardY = currentY;
  
  kpiData.forEach((kpi, index) => {
    if (index > 0 && index % 2 === 0) {
      cardX = margin;
      cardY += cardHeight + 5;
    }
    
    // Draw card background
    pdf.setFillColor(245, 245, 245);
    pdf.rect(cardX, cardY, cardWidth, cardHeight, 'F');
    
    // Draw border
    pdf.setDrawColor(200, 200, 200);
    pdf.rect(cardX, cardY, cardWidth, cardHeight, 'S');
    
    // Add icon and label
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(kpi.icon, cardX + 3, cardY + 8);
    pdf.text(kpi.label, cardX + 10, cardY + 8);
    
    // Add value
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.text(kpi.value, cardX + 3, cardY + 16);
    pdf.setFont('helvetica', 'normal');
    
    if (index % 2 === 0) {
      cardX += cardWidth + 10;
    }
  });
  
  currentY = cardY + cardHeight + 15;
  
  // ========================================
  // AI SUMMARY / EXECUTIVE SUMMARY
  // ========================================
  await checkPageSpace(30);
  
  pdf.setFontSize(18);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Executive Summary', margin, currentY);
  currentY += 10;
  
  const narratives = report.narratives || {};
  let summaryText = '';
  
  if (mode === 'financial_storyteller') {
    summaryText = narratives.executive_summary || narratives.narrative || 'No summary available.';
  } else {
    summaryText = narratives.summary_text || 'No summary available.';
  }
  
  // Split text into lines that fit the page width
  pdf.setFontSize(10);
  pdf.setTextColor(60, 60, 60);
  const lines = pdf.splitTextToSize(summaryText, contentWidth);
  
  for (const line of lines) {
    await checkPageSpace(7);
    pdf.text(line, margin, currentY);
    currentY += 7;
  }
  
  currentY += 10;
  
  // ========================================
  // STRATEGIC INSIGHTS / ANALYST INSIGHTS
  // ========================================
  await checkPageSpace(30);
  
  pdf.setFontSize(18);
  pdf.setTextColor(0, 0, 0);
  const insightsTitle = mode === 'financial_storyteller' ? 'Strategic Insights' : 'Analyst Key Insights';
  pdf.text(insightsTitle, margin, currentY);
  currentY += 10;
  
  let insights: string[] = [];
  
  if (mode === 'financial_storyteller') {
    insights = narratives.strategic_insights || [];
  } else {
    insights = narratives.analyst_insights || [];
  }
  
  if (insights.length > 0) {
    pdf.setFontSize(10);
    pdf.setTextColor(60, 60, 60);
    
    for (const insight of insights) {
      // Remove markdown formatting for PDF
      const cleanInsight = insight
        .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.+?)\*/g, '$1')     // Remove italic
        .replace(/`(.+?)`/g, '$1');      // Remove code
      
      const bulletLines = pdf.splitTextToSize(`• ${cleanInsight}`, contentWidth - 5);
      
      for (let lineIndex = 0; lineIndex < bulletLines.length; lineIndex++) {
        await checkPageSpace(7);
        const line = bulletLines[lineIndex];
        if (lineIndex === 0) {
          pdf.text(line, margin, currentY);
        } else {
          pdf.text(line, margin + 5, currentY);
        }
        currentY += 7;
      }
      
      currentY += 3; // Space between insights
    }
  } else {
    pdf.text('No insights available.', margin, currentY);
    currentY += 10;
  }
  
  currentY += 5;
  
  // ========================================
  // RECOMMENDATIONS
  // ========================================
  await checkPageSpace(30);
  
  pdf.setFontSize(18);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Strategic Recommendations', margin, currentY);
  currentY += 10;
  
  let recommendations: string[] = [];
  
  if (mode === 'financial_storyteller') {
    recommendations = narratives.recommendations || [];
  } else {
    recommendations = report.recommendations || [];
  }
  
  if (recommendations.length > 0) {
    pdf.setFontSize(10);
    pdf.setTextColor(60, 60, 60);
    
    for (const rec of recommendations) {
      // Remove markdown formatting
      const cleanRec = rec
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/`(.+?)`/g, '$1');
      
      const recLines = pdf.splitTextToSize(`• ${cleanRec}`, contentWidth - 5);
      
      for (let lineIndex = 0; lineIndex < recLines.length; lineIndex++) {
        await checkPageSpace(7);
        const line = recLines[lineIndex];
        if (lineIndex === 0) {
          pdf.text(line, margin, currentY);
        } else {
          pdf.text(line, margin + 5, currentY);
        }
        currentY += 7;
      }
      
      currentY += 3;
    }
  } else {
    pdf.text('No recommendations available.', margin, currentY);
    currentY += 10;
  }
  
  // ========================================
  // ANOMALIES TABLE
  // ========================================
  const anomalies = report.anomalies_table || [];
  
  if (anomalies.length > 0) {
    await addNewPage();
    
    pdf.setFontSize(18);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Detected Anomalies', margin, currentY);
    currentY += 10;
    
    // Table headers
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setFillColor(255, 199, 0);
    pdf.rect(margin, currentY, contentWidth, 8, 'F');
    
    pdf.setTextColor(0, 0, 0);
    pdf.text('Date', margin + 2, currentY + 5);
    pdf.text('Metric', margin + 25, currentY + 5);
    pdf.text('Value', margin + 75, currentY + 5);
    pdf.text('Expected', margin + 105, currentY + 5);
    pdf.text('Severity', margin + 135, currentY + 5);
    
    currentY += 8;
    pdf.setFont('helvetica', 'normal');
    
    // Table rows
    for (const anomaly of anomalies.slice(0, 15)) {
      await checkPageSpace(8);
      
      // Alternate row colors
      pdf.setFillColor(250, 250, 250);
      pdf.rect(margin, currentY, contentWidth, 7, 'F');
      
      pdf.setTextColor(60, 60, 60);
      pdf.text(anomaly.date || '-', margin + 2, currentY + 5);
      
      const metricText = pdf.splitTextToSize(anomaly.metric || '-', 48)[0];
      pdf.text(metricText, margin + 25, currentY + 5);
      
      pdf.text((anomaly.value || 0).toFixed(2), margin + 75, currentY + 5);
      pdf.text((anomaly.expected_value || 0).toFixed(2), margin + 105, currentY + 5);
      
      // Color code severity
      const severity = (anomaly.severity || '').toLowerCase();
      if (severity === 'high') pdf.setTextColor(239, 68, 68);
      else if (severity === 'medium') pdf.setTextColor(245, 158, 11);
      else pdf.setTextColor(16, 185, 129);
      
      pdf.text(anomaly.severity || '-', margin + 135, currentY + 5);
      pdf.setTextColor(60, 60, 60);
      
      currentY += 7;
    }
    
    if (anomalies.length > 15) {
      currentY += 5;
      pdf.setFontSize(8);
      pdf.setTextColor(120, 120, 120);
      pdf.text(`... and ${anomalies.length - 15} more anomalies`, margin, currentY);
    }
  }
  
  // ========================================
  // CAPTURE CHARTS FROM THE PAGE
  // ========================================
  await addNewPage();
  
  pdf.setFontSize(18);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Forecast Visualizations', margin, currentY);
  currentY += 10;
  
  // Try to capture forecast charts
  const chartIds = [
    'forecast-chart-1',
    'forecast-chart-2',
    'forecast-chart-3',
    'forecast-chart-4',
  ];
  
  for (const chartId of chartIds) {
    const chartElement = document.getElementById(chartId);
    
    if (chartElement) {
      try {
        await checkPageSpace(100);
        
        const canvas = await html2canvas(chartElement, {
          backgroundColor: '#ffffff',
          scale: 2,
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 10;
        
        if (currentY > pageHeight - margin - 50) {
          await addNewPage();
        }
      } catch (error) {
        console.error(`Error capturing chart ${chartId}:`, error);
      }
    }
  }
  
  // ========================================
  // BREAKDOWNS SECTION
  // ========================================
  await addNewPage();
  
  pdf.setFontSize(18);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Revenue & Profit Analysis', margin, currentY);
  currentY += 10;
  
  // Try to capture breakdown charts
  const breakdownChartIds = [
    'revenue-by-region-chart',
    'profit-by-region-chart',
  ];
  
  for (const chartId of breakdownChartIds) {
    const chartElement = document.getElementById(chartId);
    
    if (chartElement) {
      try {
        await checkPageSpace(100);
        
        const canvas = await html2canvas(chartElement, {
          backgroundColor: '#ffffff',
          scale: 2,
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 10;
        
        if (currentY > pageHeight - margin - 50) {
          await addNewPage();
        }
      } catch (error) {
        console.error(`Error capturing chart ${chartId}:`, error);
      }
    }
  }
  
  // ========================================
  // ADD PAGE NUMBERS
  // ========================================
  const totalPages = pdf.getNumberOfPages();
  
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(9);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }
  
  // ========================================
  // SAVE PDF
  // ========================================
  const fileName = `Praxifi_Financial_Report_${mode}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
}
