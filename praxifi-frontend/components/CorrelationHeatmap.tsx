'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface CorrelationHeatmapProps {
  columns: string[];
  values: (number | null)[][];
  width?: number;
  height?: number;
}

export function CorrelationHeatmap({ columns, values, width, height }: CorrelationHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 1200 });

  // Update dimensions on mount and window resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const calculatedSize = Math.max(800, Math.min(containerWidth - 40, 1400));
        setDimensions({ width: calculatedSize, height: calculatedSize });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !columns || !values || !dimensions.width) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 180, right: 20, bottom: 20, left: 180 };
    const gridSize = Math.min(
      (dimensions.width - margin.left - margin.right) / columns.length,
      (dimensions.height - margin.top - margin.bottom) / columns.length
    );

    const svg = d3.select(svgRef.current)
      .attr('width', dimensions.width)
      .attr('height', dimensions.height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Color scale for correlations (-1 to 1)
    const colorScale = d3.scaleLinear<string>()
      .domain([-1, -0.5, 0, 0.5, 1])
      .range(['#0571b0', '#92c5de', '#f7f7f7', '#f4a582', '#ca0020'])
      .interpolate(d3.interpolateRgb);

    // Transform data for D3
    const heatmapData: { row: number; col: number; value: number | null; rowLabel: string; colLabel: string }[] = [];
    values.forEach((row, rowIdx) => {
      row.forEach((value, colIdx) => {
        heatmapData.push({
          row: rowIdx,
          col: colIdx,
          value: value,
          rowLabel: columns[rowIdx],
          colLabel: columns[colIdx]
        });
      });
    });

    // Draw cells
    g.selectAll('rect')
      .data(heatmapData)
      .enter()
      .append('rect')
      .attr('x', d => d.col * gridSize)
      .attr('y', d => d.row * gridSize)
      .attr('width', gridSize)
      .attr('height', gridSize)
      .style('fill', d => d.value === null ? '#374151' : colorScale(d.value))
      .style('stroke', '#1f2937')
      .style('stroke-width', 1)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .style('stroke', '#FFC700')
          .style('stroke-width', 2);

        if (tooltipRef.current) {
          tooltipRef.current.style.display = 'block';
          tooltipRef.current.style.left = event.pageX + 10 + 'px';
          tooltipRef.current.style.top = event.pageY - 10 + 'px';
          tooltipRef.current.innerHTML = `
            <div class="font-bold text-white">${d.rowLabel}</div>
            <div class="text-white/60">×</div>
            <div class="font-bold text-white">${d.colLabel}</div>
            <div class="mt-2 text-primary text-lg">${d.value !== null ? d.value.toFixed(4) : 'N/A'}</div>
          `;
        }
      })
      .on('mouseout', function() {
        d3.select(this)
          .style('stroke', '#1f2937')
          .style('stroke-width', 1);

        if (tooltipRef.current) {
          tooltipRef.current.style.display = 'none';
        }
      });

    // Add cell values
    g.selectAll('text.cell-text')
      .data(heatmapData)
      .enter()
      .append('text')
      .attr('class', 'cell-text')
      .attr('x', d => d.col * gridSize + gridSize / 2)
      .attr('y', d => d.row * gridSize + gridSize / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('fill', d => {
        if (d.value === null) return '#9ca3af';
        const abs = Math.abs(d.value);
        return abs > 0.5 ? '#ffffff' : '#1f2937';
      })
      .style('font-size', `${Math.min(gridSize / 4, 10)}px`)
      .style('font-weight', '500')
      .style('pointer-events', 'none')
      .text(d => d.value !== null ? d.value.toFixed(2) : 'N/A');

    // Add row labels
    g.selectAll('text.row-label')
      .data(columns)
      .enter()
      .append('text')
      .attr('class', 'row-label')
      .attr('x', -5)
      .attr('y', (d, i) => i * gridSize + gridSize / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .style('fill', '#e5e7eb')
      .style('font-size', '11px')
      .text(d => d);

    // Add column labels
    g.selectAll('text.col-label')
      .data(columns)
      .enter()
      .append('text')
      .attr('class', 'col-label')
      .attr('x', (d, i) => i * gridSize + gridSize / 2)
      .attr('y', -10)
      .attr('text-anchor', 'start')
      .attr('transform', (d, i) => `rotate(-45, ${i * gridSize + gridSize / 2}, -10)`)
      .style('fill', '#e5e7eb')
      .style('font-size', '10px')
      .style('font-weight', '500')
      .text(d => d);

  }, [columns, values, dimensions.width, dimensions.height]);

  return (
    <div ref={containerRef} className="relative w-full" id="correlation-heatmap">
      <div className="flex justify-center">
        <svg ref={svgRef} className="overflow-visible" />
      </div>
      <div
        ref={tooltipRef}
        className="fixed bg-black border border-white/20 rounded-lg p-3 text-center pointer-events-none z-50 shadow-xl"
        style={{ display: 'none' }}
      />
      
      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <div className="w-4 h-4" style={{ backgroundColor: '#0571b0' }} />
            <div className="w-4 h-4" style={{ backgroundColor: '#92c5de' }} />
            <div className="w-4 h-4" style={{ backgroundColor: '#f7f7f7' }} />
            <div className="w-4 h-4" style={{ backgroundColor: '#f4a582' }} />
            <div className="w-4 h-4" style={{ backgroundColor: '#ca0020' }} />
          </div>
          <div className="flex flex-col text-xs text-white/60">
            <div className="flex justify-between gap-8">
              <span>-1.0</span>
              <span>0.0</span>
              <span>+1.0</span>
            </div>
            <div className="text-center text-white/40 mt-1">Correlation Coefficient</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-4 bg-gray-700 rounded border border-white/20" />
          <span className="text-white/60 text-xs">No Data</span>
        </div>
      </div>
    </div>
  );
}
