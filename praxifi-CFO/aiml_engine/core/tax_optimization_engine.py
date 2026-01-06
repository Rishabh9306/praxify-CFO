"""
TaxIQ Tax Optimization Engine
AI-powered tax planning, forecasting, and optimization
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Tuple
from datetime import datetime, timedelta
from collections import defaultdict
import logging

from .tax_models import (
    PurchaseRecord, SalesRecord, TaxOptimizationResult
)

logger = logging.getLogger(__name__)


class TaxOptimizationEngine:
    """Intelligent Tax Optimization and Planning"""
    
    # Industry benchmarks (simplified - would come from database in production)
    INDUSTRY_BENCHMARKS = {
        'manufacturing': {'effective_rate': 21.5, 'itc_ratio': 85},
        'services': {'effective_rate': 24.2, 'itc_ratio': 70},
        'trading': {'effective_rate': 18.8, 'itc_ratio': 90},
        'retail': {'effective_rate': 20.1, 'itc_ratio': 75},
        'default': {'effective_rate': 22.0, 'itc_ratio': 80}
    }
    
    def __init__(
        self,
        purchases: List[PurchaseRecord],
        sales: List[SalesRecord],
        industry: str = 'default'
    ):
        self.purchases = purchases
        self.sales = sales
        self.industry = industry
        self.benchmark = self.INDUSTRY_BENCHMARKS.get(industry, self.INDUSTRY_BENCHMARKS['default'])
    
    def analyze_tax_optimization(self) -> TaxOptimizationResult:
        """Comprehensive tax optimization analysis"""
        
        # Calculate current tax liability
        current_liability = self._calculate_current_liability()
        
        # Generate optimization scenarios
        scenarios = self._generate_optimization_scenarios()
        
        # Calculate optimized liability and savings
        if scenarios:
            optimized_liability = min(s['new_liability'] for s in scenarios)
            potential_savings = sum(s['savings'] for s in scenarios)
        else:
            optimized_liability = current_liability
            potential_savings = 0
        
        # Calculate savings percentage meaningfully
        # Use current ITC as baseline for ITC improvement scenarios
        total_input_gst = sum(p.total_gst for p in self.purchases if p.vendor_gstin)
        if total_input_gst > 0:
            savings_percentage = (potential_savings / total_input_gst * 100)
        else:
            savings_percentage = 100.0 if potential_savings > 0 else 0
        
        # Cap at 100% for sensible display
        savings_percentage = min(savings_percentage, 100)
        
        # Calculate effective tax rate
        total_sales = sum(s.taxable_value for s in self.sales)
        effective_rate = (current_liability / total_sales * 100) if total_sales > 0 else 0
        
        # Forecast next quarter
        forecast = self._forecast_next_quarter()
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            current_liability, potential_savings, effective_rate, scenarios
        )
        
        return TaxOptimizationResult(
            current_tax_liability=round(current_liability, 2),
            optimized_tax_liability=round(optimized_liability, 2),
            potential_savings=round(potential_savings, 2),
            savings_percentage=round(savings_percentage, 2),
            scenarios=scenarios,
            recommendations=recommendations,
            effective_tax_rate=round(effective_rate, 2),
            industry_benchmark=self.benchmark['effective_rate'],
            forecast_next_quarter=forecast
        )
    
    def _calculate_current_liability(self) -> float:
        """Calculate current GST liability"""
        # Output GST (from sales)
        output_gst = sum(s.total_gst for s in self.sales)
        
        # Input GST (ITC from purchases)
        input_gst = sum(p.total_gst for p in self.purchases if p.vendor_gstin)
        
        # Net liability
        net_liability = output_gst - input_gst
        
        return max(net_liability, 0)  # Can't be negative (refund scenario)
    
    def _generate_optimization_scenarios(self) -> List[Dict]:
        """Generate tax-saving scenarios"""
        scenarios = []
        
        current_liability = self._calculate_current_liability()
        
        # Scenario 1: Defer high-value purchases
        scenario_1 = self._scenario_defer_purchases()
        if scenario_1:
            scenarios.append(scenario_1)
        
        # Scenario 2: Maximize ITC claims
        scenario_2 = self._scenario_maximize_itc()
        if scenario_2:
            scenarios.append(scenario_2)
        
        # Scenario 3: Optimize interstate vs intrastate
        scenario_3 = self._scenario_optimize_location()
        if scenario_3:
            scenarios.append(scenario_3)
        
        # Scenario 4: Timing optimization
        scenario_4 = self._scenario_timing_optimization()
        if scenario_4:
            scenarios.append(scenario_4)
        
        # Scenario 5: Vendor optimization
        scenario_5 = self._scenario_vendor_optimization()
        if scenario_5:
            scenarios.append(scenario_5)
        
        # Sort by savings (highest first)
        scenarios.sort(key=lambda x: x['savings'], reverse=True)
        
        return scenarios[:5]  # Top 5 scenarios
    
    def _scenario_defer_purchases(self) -> Dict:
        """Scenario: Defer large purchases to next quarter"""
        # Find large recent purchases
        current_quarter_end = self._get_quarter_end()
        
        large_purchases = [
            p for p in self.purchases
            if p.total > 100000 and
            (current_quarter_end - p.date).days <= 30
        ]
        
        if not large_purchases:
            return None
        
        # Calculate impact of deferring
        deferred_itc = sum(p.total_gst for p in large_purchases)
        current_liability = self._calculate_current_liability()
        new_liability = current_liability + deferred_itc
        
        # But saves this quarter's liability
        savings = deferred_itc
        
        return {
            'name': 'Defer Large Purchases',
            'description': f'Defer {len(large_purchases)} large purchases worth ₹{sum(p.total for p in large_purchases):,.0f} to next quarter',
            'current_liability': current_liability,
            'new_liability': current_liability,  # This quarter
            'savings': savings,
            'savings_percentage': (savings / current_liability * 100) if current_liability > 0 else 0,
            'impact': 'Improves current quarter cash flow by deferring ITC claim',
            'implementation': f'Delay invoicing/booking of identified purchases to next quarter',
            'risk': 'Medium - Requires vendor coordination',
            'timeline': '1-2 weeks',
            'effort': 'Medium'
        }
    
    def _scenario_maximize_itc(self) -> Dict:
        """Scenario: Maximize ITC claims"""
        # Find purchases without GSTIN
        no_gstin = [p for p in self.purchases if not p.vendor_gstin]
        
        if not no_gstin:
            return None
        
        # Potential ITC recovery
        potential_itc = sum(p.total_gst for p in no_gstin)
        current_liability = self._calculate_current_liability()
        new_liability = max(current_liability - potential_itc, 0)
        
        # Calculate savings percentage as reduction in liability (meaningful metric)
        # If liability is 0 (refund position), show as % of potential ITC vs current ITC
        total_input_gst = sum(p.total_gst for p in self.purchases if p.vendor_gstin)
        if total_input_gst > 0:
            savings_percentage = (potential_itc / total_input_gst * 100)
        else:
            # Fallback: show as absolute benefit
            savings_percentage = 100.0  # 100% improvement from 0
        
        return {
            'name': 'Maximize ITC Claims',
            'description': f'Obtain GSTIN from {len(no_gstin)} vendors to claim ₹{potential_itc:,.0f} additional ITC',
            'current_liability': current_liability,
            'new_liability': new_liability,
            'savings': potential_itc,
            'savings_percentage': round(min(savings_percentage, 100), 2),  # Cap at 100%
            'impact': 'Direct reduction in GST liability',
            'implementation': 'Contact vendors to provide their GSTIN for future transactions',
            'risk': 'Low - Standard compliance practice',
            'timeline': '2-4 weeks',
            'effort': 'Low'
        }
    
    def _scenario_optimize_location(self) -> Dict:
        """Scenario: Optimize multi-state operations"""
        # Analyze interstate vs intrastate
        interstate_sales = [s for s in self.sales if s.is_interstate]
        
        if not interstate_sales:
            return None
        
        # IGST impacts working capital (claimed only after buyer files return)
        igst_amount = sum(s.igst for s in interstate_sales)
        
        # Potential savings by routing through local branch (20% working capital benefit)
        working_capital_benefit = igst_amount * 0.20
        
        current_liability = self._calculate_current_liability()
        
        # Calculate savings percentage based on working capital impact
        total_output_gst = sum(s.total_gst for s in self.sales)
        savings_pct = (working_capital_benefit / total_output_gst * 100) if total_output_gst > 0 else 0
        
        return {
            'name': 'Optimize State Routing',
            'description': f'Route inter-state sales through local branches to avoid IGST of ₹{igst_amount:,.0f}',
            'current_liability': current_liability,
            'new_liability': current_liability,  # Same GST, better cash flow
            'savings': working_capital_benefit,
            'savings_percentage': round(savings_pct, 2),
            'impact': 'Improves working capital by avoiding IGST',
            'implementation': 'Set up local branches or route sales through existing state presence',
            'risk': 'High - Requires infrastructure',
            'timeline': '3-6 months',
            'effort': 'High'
        }
    
    def _scenario_timing_optimization(self) -> Dict:
        """Scenario: Optimize invoice timing"""
        # Find sales near quarter/year end
        quarter_end = self._get_quarter_end()
        
        near_end_sales = [
            s for s in self.sales
            if (quarter_end - s.date).days <= 7
        ]
        
        if not near_end_sales or len(near_end_sales) < 3:
            return None
        
        # Deferring these saves GST payment for 1 month
        deferred_gst = sum(s.total_gst for s in near_end_sales)
        
        # Interest savings (assuming 12% p.a. for 1 month)
        interest_savings = deferred_gst * 0.12 / 12
        
        current_liability = self._calculate_current_liability()
        total_output_gst = sum(s.total_gst for s in self.sales)
        savings_pct = (interest_savings / total_output_gst * 100) if total_output_gst > 0 else 0
        
        return {
            'name': 'Optimize Invoice Timing',
            'description': f'Defer {len(near_end_sales)} invoices near quarter-end to next period',
            'current_liability': current_liability,
            'new_liability': current_liability - deferred_gst,
            'savings': interest_savings,
            'savings_percentage': round(savings_pct, 2),
            'impact': 'Cash flow benefit through timing of GST payment',
            'implementation': 'Delay billing by few days for identified transactions',
            'risk': 'Low - Common business practice',
            'timeline': 'Immediate',
            'effort': 'Low'
        }
    
    def _scenario_vendor_optimization(self) -> Dict:
        """Scenario: Optimize vendor selection"""
        # Find vendors charging different GST rates for similar items
        vendor_rates = defaultdict(list)
        
        for p in self.purchases:
            if p.taxable_value > 0:
                rate = (p.total_gst / p.taxable_value) * 100
                vendor_rates[p.expense_category or 'General'].append({
                    'vendor': p.vendor_name,
                    'rate': rate,
                    'amount': p.taxable_value
                })
        
        # Find categories with rate variations
        savings = 0
        for category, vendors in vendor_rates.items():
            if len(vendors) > 1:
                rates = [v['rate'] for v in vendors]
                if max(rates) - min(rates) > 2:  # More than 2% difference
                    # Potential to switch to lower rate vendor
                    high_rate_amount = sum(v['amount'] for v in vendors if v['rate'] > min(rates))
                    rate_diff = max(rates) - min(rates)
                    savings += high_rate_amount * (rate_diff / 100)
        
        if savings < 1000:
            return None
        
        current_liability = self._calculate_current_liability()
        
        return {
            'name': 'Optimize Vendor Selection',
            'description': 'Switch to vendors offering optimal GST rates for similar products',
            'current_liability': current_liability,
            'new_liability': current_liability - savings,
            'savings': savings,
            'savings_percentage': (savings / current_liability * 100) if current_liability > 0 else 0,
            'impact': 'Reduce input costs through better vendor selection',
            'implementation': 'Negotiate with vendors or switch to lower-rate alternatives',
            'risk': 'Medium - Depends on vendor availability',
            'timeline': '1-3 months',
            'effort': 'Medium'
        }
    
    def _forecast_next_quarter(self) -> Dict[str, float]:
        """Forecast tax liability for next quarter"""
        if not self.sales or not self.purchases:
            return {
                'forecasted_sales': 0,
                'forecasted_output_gst': 0,
                'forecasted_purchases': 0,
                'forecasted_itc': 0,
                'forecasted_liability': 0
            }
        
        # Calculate date range for accurate monthly average
        all_dates = [s.date for s in self.sales] + [p.date for p in self.purchases]
        min_date = min(all_dates)
        max_date = max(all_dates)
        months = max((max_date - min_date).days / 30, 1)
        
        # Calculate totals
        total_sales = sum(s.taxable_value for s in self.sales)
        total_output_gst = sum(s.total_gst for s in self.sales)
        total_purchases = sum(p.taxable_value for p in self.purchases)
        total_input_gst = sum(p.total_gst for p in self.purchases if p.vendor_gstin)
        
        # Calculate average monthly values
        avg_monthly_sales = total_sales / months
        avg_monthly_output_gst = total_output_gst / months
        avg_monthly_purchases = total_purchases / months
        avg_monthly_input_gst = total_input_gst / months
        
        # Forecast for next quarter (3 months) with 10% growth assumption
        growth_factor = 1.10  # Conservative 10% growth
        
        forecasted_sales = avg_monthly_sales * 3 * growth_factor
        forecasted_output_gst = avg_monthly_output_gst * 3 * growth_factor
        forecasted_purchases = avg_monthly_purchases * 3 * growth_factor
        forecasted_itc = avg_monthly_input_gst * 3 * growth_factor
        forecasted_liability = max(forecasted_output_gst - forecasted_itc, 0)
        
        return {
            'forecasted_sales': round(forecasted_sales, 2),
            'forecasted_output_gst': round(forecasted_output_gst, 2),
            'forecasted_purchases': round(forecasted_purchases, 2),
            'forecasted_itc': round(forecasted_itc, 2),
            'forecasted_liability': round(forecasted_liability, 2)
        }
    
    def _generate_recommendations(
        self,
        current_liability: float,
        potential_savings: float,
        effective_rate: float,
        scenarios: List[Dict]
    ) -> List[str]:
        """Generate tax optimization recommendations"""
        recommendations = []
        
        # High savings potential
        if potential_savings > 50000:
            recommendations.append(
                f"💰 Potential to save ₹{potential_savings:,.0f} through optimization strategies."
            )
        
        # Compare with industry benchmark
        rate_diff = effective_rate - self.benchmark['effective_rate']
        if rate_diff > 2:
            recommendations.append(
                f"📊 Your effective tax rate ({effective_rate:.1f}%) is {rate_diff:.1f}% higher than industry average ({self.benchmark['effective_rate']}%). Focus on ITC optimization."
            )
        elif rate_diff < -2:
            recommendations.append(
                f"🎉 Your effective tax rate ({effective_rate:.1f}%) is {abs(rate_diff):.1f}% better than industry average!"
            )
        
        # Top scenario recommendation
        if scenarios:
            top_scenario = scenarios[0]
            recommendations.append(
                f"🎯 TOP PRIORITY: {top_scenario['name']} - Can save ₹{top_scenario['savings']:,.0f} ({top_scenario['savings_percentage']:.1f}%)"
            )
        
        # ITC ratio check
        total_purchases_gst = sum(p.total_gst for p in self.purchases)
        total_purchases_gst_claimed = sum(p.total_gst for p in self.purchases if p.vendor_gstin)
        itc_ratio = (total_purchases_gst_claimed / total_purchases_gst * 100) if total_purchases_gst > 0 else 0
        
        if itc_ratio < self.benchmark['itc_ratio']:
            recommendations.append(
                f"⚠️ Your ITC claim ratio ({itc_ratio:.0f}%) is below industry average ({self.benchmark['itc_ratio']}%). Review vendor compliance."
            )
        
        # Quarterly planning
        recommendations.append(
            "📅 Review tax optimization opportunities at start of each quarter for maximum benefit."
        )
        
        # Working capital optimization
        interstate_sales = sum(s.igst for s in self.sales)
        if interstate_sales > 500000:
            recommendations.append(
                f"💵 ₹{interstate_sales:,.0f} locked in IGST. Consider multi-state presence for better cash flow."
            )
        
        return recommendations
    
    def _get_quarter_end(self) -> datetime:
        """Get current quarter end date"""
        now = datetime.now()
        quarter = (now.month - 1) // 3 + 1
        quarter_end_month = quarter * 3
        
        if quarter_end_month == 12:
            return datetime(now.year, 12, 31)
        else:
            return datetime(now.year, quarter_end_month + 1, 1) - timedelta(days=1)
    
    def get_optimization_summary(self) -> Dict:
        """Get quick optimization summary for dashboard"""
        result = self.analyze_tax_optimization()
        
        return {
            'current_liability': result.current_tax_liability,
            'potential_savings': result.potential_savings,
            'effective_rate': result.effective_tax_rate,
            'vs_industry': result.effective_tax_rate - result.industry_benchmark,
            'top_opportunity': result.scenarios[0]['name'] if result.scenarios else 'No opportunities'
        }
