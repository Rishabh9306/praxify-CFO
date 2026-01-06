"""
TaxIQ Compliance Risk Assessment Engine
AI-powered GST compliance monitoring and risk scoring
"""

import pandas as pd
import numpy as np
from typing import List, Dict
from datetime import datetime, timedelta
import logging

from .tax_models import (
    PurchaseRecord, SalesRecord, ComplianceRiskResult,
    ComplianceRiskLevel
)

logger = logging.getLogger(__name__)


class ComplianceRiskEngine:
    """Intelligent Compliance Risk Assessment and Monitoring"""
    
    # GST compliance deadlines
    DEADLINES = {
        'GSTR1': 11,  # 11th of next month
        'GSTR3B': 20,  # 20th of next month
        'GSTR2B': 14,  # 14th of next month (auto-generated)
        'Annual_Return': {'month': 12, 'day': 31}  # Dec 31 of next FY
    }
    
    # Penalty structure (as per GST Act)
    PENALTIES = {
        'late_filing_gstr3b': 50,  # ₹50 per day (₹20 if nil return)
        'late_filing_gstr1': 50,
        'non_filing': 10000,  # Up to ₹10,000
        'tax_evasion': lambda amount: amount * 1.0,  # 100% of tax amount
        'interest_rate': 18  # 18% p.a. on late payment
    }
    
    # Audit triggers (red flags)
    AUDIT_TRIGGERS = {
        'high_itc_ratio': 90,  # ITC > 90% of output GST
        'high_refund': 500000,  # Refund > ₹5L
        'low_revenue_high_itc': 0.5,  # ITC > 50% of revenue
        'frequent_amendments': 5,  # More than 5 amendments
        'round_figures': 0.3  # > 30% transactions in round figures
    }
    
    def __init__(
        self,
        purchases: List[PurchaseRecord],
        sales: List[SalesRecord]
    ):
        self.purchases = purchases
        self.sales = sales
    
    def assess_compliance_risk(self) -> ComplianceRiskResult:
        """Comprehensive compliance risk assessment"""
        
        # Calculate risk score
        risk_score = self._calculate_risk_score()
        
        # Determine risk level
        risk_level = self._determine_risk_level(risk_score)
        
        # Identify critical issues
        critical_issues = self._identify_critical_issues()
        
        # Identify warnings
        warnings = self._identify_warnings()
        
        # Calculate compliance score
        compliance_score = 100 - risk_score
        
        # Calculate audit probability
        audit_probability = self._calculate_audit_probability(risk_score, critical_issues)
        
        # Calculate potential penalties
        potential_penalties = self._calculate_potential_penalties(critical_issues)
        
        # Generate action items
        action_items = self._generate_action_items(critical_issues, warnings)
        
        # Get upcoming deadlines
        upcoming_deadlines = self._get_upcoming_deadlines()
        
        return ComplianceRiskResult(
            overall_risk_score=risk_score,
            risk_level=risk_level,
            critical_issues=critical_issues,
            warnings=warnings,
            compliance_score=compliance_score,
            audit_probability=audit_probability,
            potential_penalties=potential_penalties,
            action_items=action_items,
            upcoming_deadlines=upcoming_deadlines
        )
    
    def _calculate_risk_score(self) -> float:
        """Calculate overall compliance risk score (0-100)"""
        score = 0
        
        # Check 1: ITC to Output GST ratio
        output_gst = sum(s.total_gst for s in self.sales)
        input_gst = sum(p.total_gst for p in self.purchases if p.vendor_gstin)
        
        if output_gst > 0:
            itc_ratio = (input_gst / output_gst) * 100
            if itc_ratio > self.AUDIT_TRIGGERS['high_itc_ratio']:
                score += 25
            elif itc_ratio > 80:
                score += 15
        
        # Check 2: Missing vendor GSTIN
        no_gstin_count = len([p for p in self.purchases if not p.vendor_gstin])
        if no_gstin_count / len(self.purchases) > 0.3:
            score += 20
        elif no_gstin_count / len(self.purchases) > 0.1:
            score += 10
        
        # Check 3: Round figure transactions (potential estimation)
        round_purchases = len([p for p in self.purchases if p.total % 1000 == 0 and p.total > 10000])
        if round_purchases / len(self.purchases) > self.AUDIT_TRIGGERS['round_figures']:
            score += 15
        
        # Check 4: High value transactions without proper documentation
        high_value = [p for p in self.purchases if p.total > 200000]
        if len(high_value) > 0:
            score += 10
        
        # Check 5: CGST+SGST and IGST inconsistencies
        mixed_gst = [p for p in self.purchases if p.cgst > 0 and p.sgst > 0 and p.igst > 0]
        if len(mixed_gst) > 0:
            score += 15
        
        # Check 6: Unusual GST rates
        unusual_rates = self._count_unusual_gst_rates()
        if unusual_rates > 5:
            score += 10
        
        # Check 7: Data quality issues
        duplicate_invoices = self._check_duplicate_invoices()
        if len(duplicate_invoices) > 0:
            score += 15
        
        return min(score, 100)
    
    def _determine_risk_level(self, score: float) -> ComplianceRiskLevel:
        """Determine risk level based on score"""
        if score >= 80:
            return ComplianceRiskLevel.CRITICAL
        elif score >= 60:
            return ComplianceRiskLevel.HIGH
        elif score >= 40:
            return ComplianceRiskLevel.MEDIUM
        elif score >= 20:
            return ComplianceRiskLevel.LOW
        else:
            return ComplianceRiskLevel.SAFE
    
    def _identify_critical_issues(self) -> List[Dict]:
        """Identify critical compliance issues"""
        issues = []
        
        # Issue 1: High ITC ratio (audit trigger)
        output_gst = sum(s.total_gst for s in self.sales)
        input_gst = sum(p.total_gst for p in self.purchases if p.vendor_gstin)
        
        if output_gst > 0:
            itc_ratio = (input_gst / output_gst) * 100
            if itc_ratio > self.AUDIT_TRIGGERS['high_itc_ratio']:
                issues.append({
                    'type': 'High ITC Ratio',
                    'severity': 'Critical',
                    'description': f'ITC ratio of {itc_ratio:.1f}% exceeds audit trigger threshold of {self.AUDIT_TRIGGERS["high_itc_ratio"]}%',
                    'impact': 'High audit probability',
                    'penalty_risk': 0,  # No direct penalty, but audit risk
                    'action_required': 'Review ITC claims and ensure all have valid supporting documents'
                })
        
        # Issue 2: Large transactions without GSTIN
        no_gstin_high_value = [p for p in self.purchases if not p.vendor_gstin and p.total > 50000]
        if no_gstin_high_value:
            total_at_risk = sum(p.total_gst for p in no_gstin_high_value)
            issues.append({
                'type': 'Missing GSTIN on High-Value Purchases',
                'severity': 'Critical',
                'description': f'{len(no_gstin_high_value)} high-value transactions (₹{sum(p.total for p in no_gstin_high_value):,.0f}) without vendor GSTIN',
                'impact': f'₹{total_at_risk:,.0f} ITC at risk of disallowance',
                'penalty_risk': total_at_risk,
                'action_required': 'Obtain GSTIN from vendors immediately'
            })
        
        # Issue 3: Tax type inconsistencies
        mixed_gst = [p for p in self.purchases if p.cgst > 0 and p.sgst > 0 and p.igst > 0]
        if mixed_gst:
            issues.append({
                'type': 'Tax Type Mismatch',
                'severity': 'Critical',
                'description': f'{len(mixed_gst)} invoices have both intra-state (CGST+SGST) and inter-state (IGST) taxes',
                'impact': 'Invalid tax structure - ITC claim will be rejected',
                'penalty_risk': sum(p.total_gst for p in mixed_gst),
                'action_required': 'Correct invoice data before filing GSTR-3B'
            })
        
        # Issue 4: Duplicate invoices
        duplicates = self._check_duplicate_invoices()
        if duplicates:
            issues.append({
                'type': 'Duplicate Invoice Numbers',
                'severity': 'High',
                'description': f'{len(duplicates)} duplicate invoice numbers detected',
                'impact': 'May trigger audit or ITC disallowance',
                'penalty_risk': 0,
                'action_required': 'Verify with vendors and correct records'
            })
        
        # Issue 5: Overdue compliance filings (simulated)
        overdue_filings = self._check_overdue_filings()
        for filing in overdue_filings:
            issues.append({
                'type': f'Overdue Filing: {filing["return_type"]}',
                'severity': 'Critical',
                'description': f'{filing["return_type"]} for {filing["period"]} is overdue by {filing["days_overdue"]} days',
                'impact': f'Daily penalty of ₹{filing["penalty_per_day"]}/day',
                'penalty_risk': filing["total_penalty"],
                'action_required': f'File {filing["return_type"]} immediately to minimize penalties'
            })
        
        return issues
    
    def _identify_warnings(self) -> List[Dict]:
        """Identify warning-level issues"""
        warnings = []
        
        # Warning 1: High percentage of round-figure transactions
        round_purchases = [p for p in self.purchases if p.total % 1000 == 0 and p.total > 10000]
        if len(round_purchases) / len(self.purchases) > 0.2:
            warnings.append({
                'type': 'High Round-Figure Transactions',
                'severity': 'Medium',
                'description': f'{len(round_purchases)} transactions ({len(round_purchases)/len(self.purchases)*100:.1f}%) are in round figures',
                'recommendation': 'Verify these are actual values, not estimates'
            })
        
        # Warning 2: Unusual GST rates
        unusual_count = self._count_unusual_gst_rates()
        if unusual_count > 3:
            warnings.append({
                'type': 'Unusual GST Rates',
                'severity': 'Medium',
                'description': f'{unusual_count} transactions have non-standard GST rates',
                'recommendation': 'Verify HSN codes and applicable GST rates'
            })
        
        # Warning 3: Low B2B ratio
        b2b_sales = len([s for s in self.sales if s.buyer_gstin])
        if b2b_sales / len(self.sales) < 0.3:
            warnings.append({
                'type': 'Low B2B Transaction Ratio',
                'severity': 'Low',
                'description': f'Only {b2b_sales}/{len(self.sales)} sales are B2B with GSTIN',
                'recommendation': 'Collect buyer GSTIN for B2B transactions to enable them to claim ITC'
            })
        
        # Warning 4: Concentration risk (too many transactions from few vendors)
        vendor_concentration = self._check_vendor_concentration()
        if vendor_concentration > 50:
            warnings.append({
                'type': 'Vendor Concentration Risk',
                'severity': 'Medium',
                'description': f'{vendor_concentration:.0f}% of purchases from top 3 vendors',
                'recommendation': 'Diversify vendor base to reduce dependency risk'
            })
        
        return warnings
    
    def _calculate_audit_probability(self, risk_score: float, issues: List[Dict]) -> float:
        """Calculate probability of GST audit (0-100)"""
        # Base probability based on risk score
        probability = risk_score * 0.6
        
        # Increase for critical issues
        critical_count = len([i for i in issues if i['severity'] == 'Critical'])
        probability += critical_count * 10
        
        # High ITC ratio significantly increases audit risk
        output_gst = sum(s.total_gst for s in self.sales)
        input_gst = sum(p.total_gst for p in self.purchases if p.vendor_gstin)
        
        if output_gst > 0:
            itc_ratio = (input_gst / output_gst) * 100
            if itc_ratio > 90:
                probability += 20
        
        return min(probability, 100)
    
    def _calculate_potential_penalties(self, issues: List[Dict]) -> float:
        """Calculate potential penalty amount"""
        total_penalties = sum(issue.get('penalty_risk', 0) for issue in issues)
        
        # Add late filing penalties if applicable
        overdue_filings = self._check_overdue_filings()
        total_penalties += sum(f.get('total_penalty', 0) for f in overdue_filings)
        
        return total_penalties
    
    def _generate_action_items(
        self,
        critical_issues: List[Dict],
        warnings: List[Dict]
    ) -> List[Dict]:
        """Generate prioritized action items"""
        actions = []
        
        # Critical issues first
        for idx, issue in enumerate(critical_issues, 1):
            actions.append({
                'priority': 'Critical',
                'action': issue['action_required'],
                'issue': issue['type'],
                'deadline': self._get_action_deadline(issue['type']),
                'impact': issue['impact']
            })
        
        # Then warnings
        for idx, warning in enumerate(warnings, len(actions) + 1):
            actions.append({
                'priority': warning['severity'],
                'action': warning['recommendation'],
                'issue': warning['type'],
                'deadline': 'Next filing cycle',
                'impact': 'Compliance improvement'
            })
        
        # Sort by priority
        priority_order = {'Critical': 1, 'High': 2, 'Medium': 3, 'Low': 4}
        actions.sort(key=lambda x: priority_order.get(x['priority'], 5))
        
        return actions[:10]  # Top 10 actions
    
    def _get_upcoming_deadlines(self) -> List[Dict]:
        """Get upcoming compliance deadlines"""
        deadlines = []
        now = datetime.now()
        
        # GSTR-3B deadline (20th of next month)
        next_month = (now.replace(day=1) + timedelta(days=32)).replace(day=1)
        gstr3b_deadline = next_month.replace(day=self.DEADLINES['GSTR3B'])
        days_to_gstr3b = (gstr3b_deadline - now).days
        
        deadlines.append({
            'return_type': 'GSTR-3B',
            'period': now.strftime('%B %Y'),
            'deadline': gstr3b_deadline.strftime('%d %b %Y'),
            'days_remaining': days_to_gstr3b,
            'status': 'Overdue' if days_to_gstr3b < 0 else 'Upcoming',
            'importance': 'Critical'
        })
        
        # GSTR-1 deadline (11th of next month)
        gstr1_deadline = next_month.replace(day=self.DEADLINES['GSTR1'])
        days_to_gstr1 = (gstr1_deadline - now).days
        
        deadlines.append({
            'return_type': 'GSTR-1',
            'period': now.strftime('%B %Y'),
            'deadline': gstr1_deadline.strftime('%d %b %Y'),
            'days_remaining': days_to_gstr1,
            'status': 'Overdue' if days_to_gstr1 < 0 else 'Upcoming',
            'importance': 'High'
        })
        
        # Annual Return (if applicable)
        if now.month >= 4:  # FY started
            annual_deadline = datetime(now.year + 1, 12, 31)
            days_to_annual = (annual_deadline - now).days
            
            if days_to_annual < 180:  # Show if within 6 months
                deadlines.append({
                    'return_type': 'Annual Return (GSTR-9)',
                    'period': f'FY {now.year}-{now.year + 1}',
                    'deadline': annual_deadline.strftime('%d %b %Y'),
                    'days_remaining': days_to_annual,
                    'status': 'Upcoming',
                    'importance': 'High'
                })
        
        return deadlines
    
    def _count_unusual_gst_rates(self) -> int:
        """Count transactions with unusual GST rates"""
        standard_rates = [5, 12, 18, 28]
        unusual = 0
        
        for p in self.purchases:
            if p.taxable_value > 0:
                rate = (p.total_gst / p.taxable_value) * 100
                if not any(abs(rate - std) < 0.5 for std in standard_rates):
                    unusual += 1
        
        return unusual
    
    def _check_duplicate_invoices(self) -> List[str]:
        """Check for duplicate invoice numbers"""
        invoice_numbers = [p.invoice_no for p in self.purchases]
        duplicates = [inv for inv in set(invoice_numbers) if invoice_numbers.count(inv) > 1]
        return duplicates
    
    def _check_overdue_filings(self) -> List[Dict]:
        """Check for overdue compliance filings (simulated)"""
        # In production, this would check actual filing status from GSTN API
        # For now, simulate based on data dates
        
        overdue = []
        now = datetime.now()
        
        # Check if last month's GSTR-3B is overdue
        last_month = (now.replace(day=1) - timedelta(days=1))
        gstr3b_deadline = now.replace(day=self.DEADLINES['GSTR3B'])
        
        if now > gstr3b_deadline:
            days_overdue = (now - gstr3b_deadline).days
            overdue.append({
                'return_type': 'GSTR-3B',
                'period': last_month.strftime('%B %Y'),
                'days_overdue': days_overdue,
                'penalty_per_day': 50,
                'total_penalty': days_overdue * 50
            })
        
        return overdue
    
    def _check_vendor_concentration(self) -> float:
        """Check vendor concentration (% from top vendors)"""
        if not self.purchases:
            return 0
        
        vendor_totals = {}
        for p in self.purchases:
            key = p.vendor_gstin or p.vendor_name
            vendor_totals[key] = vendor_totals.get(key, 0) + p.total
        
        total_purchases = sum(vendor_totals.values())
        top_3_vendors = sorted(vendor_totals.values(), reverse=True)[:3]
        top_3_total = sum(top_3_vendors)
        
        return (top_3_total / total_purchases * 100) if total_purchases > 0 else 0
    
    def _get_action_deadline(self, issue_type: str) -> str:
        """Get deadline for action item"""
        if 'Overdue' in issue_type:
            return 'Immediate'
        elif 'GSTIN' in issue_type:
            return 'Before next filing'
        elif 'Mismatch' in issue_type:
            return 'Before GSTR-3B filing'
        else:
            return 'Within 7 days'
    
    def get_risk_summary(self) -> Dict:
        """Get quick risk summary for dashboard"""
        result = self.assess_compliance_risk()
        
        return {
            'risk_score': result.overall_risk_score,
            'risk_level': result.risk_level.value,
            'compliance_score': result.compliance_score,
            'audit_probability': result.audit_probability,
            'critical_issues': len(result.critical_issues),
            'next_deadline': result.upcoming_deadlines[0] if result.upcoming_deadlines else None
        }
