"""
TaxIQ RCM (Reverse Charge Mechanism) Detection Engine
AI-powered RCM liability detection and compliance management
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Tuple, Optional
from datetime import datetime, timedelta
import re
import logging

from .tax_models import (
    PurchaseRecord, ExpenseRecord, RCMAnalysisResult,
    ExpenseCategory, RCMApplicability
)

logger = logging.getLogger(__name__)


class RCMDetectionEngine:
    """Intelligent RCM Detection and Compliance"""
    
    # RCM applicable categories as per GST Act Section 9(3) and 9(4)
    RCM_RULES = {
        # Services from unregistered persons
        'Legal Services': {
            'applicability': 'ALWAYS',
            'rate': 18.0,
            'keywords': ['legal', 'lawyer', 'advocate', 'attorney', 'law firm'],
            'threshold': 0
        },
        'Professional Fees': {
            'applicability': 'CONDITIONAL',  # If from unregistered
            'rate': 18.0,
            'keywords': ['consultant', 'consulting', 'advisory', 'professional'],
            'threshold': 0
        },
        'Director Fees': {
            'applicability': 'ALWAYS',
            'rate': 18.0,
            'keywords': ['director', 'board fees', 'director remuneration'],
            'threshold': 0
        },
        'Security Services': {
            'applicability': 'CONDITIONAL',  # If from unregistered
            'rate': 18.0,
            'keywords': ['security', 'guard', 'watchman'],
            'threshold': 0
        },
        'Manpower Supply': {
            'applicability': 'ALWAYS',
            'rate': 18.0,
            'keywords': ['manpower', 'labour', 'contract labour', 'staff supply'],
            'threshold': 0
        },
        'GTA Services': {  # Goods Transport Agency
            'applicability': 'CONDITIONAL',  # If GTA doesn't pay GST
            'rate': 5.0,  # Concessional rate for GTA
            'keywords': ['transport', 'freight', 'gta', 'logistics', 'cargo'],
            'threshold': 0
        },
        'Rent': {
            'applicability': 'CONDITIONAL',  # If landlord not registered
            'rate': 18.0,
            'keywords': ['rent', 'lease', 'rental'],
            'threshold': 0
        }
    }
    
    # Penalty calculation as per GST Act
    INTEREST_RATE = 18  # 18% per annum on delayed payment
    PENALTY_MULTIPLIER = 1.0  # 100% of tax for non-payment
    
    def __init__(
        self, 
        purchases: List[PurchaseRecord] = None,
        expenses: List[ExpenseRecord] = None
    ):
        self.purchases = purchases or []
        self.expenses = expenses or []
    
    def analyze_rcm_compliance(self) -> RCMAnalysisResult:
        """Comprehensive RCM compliance analysis"""
        
        # Detect RCM applicable transactions
        rcm_transactions = self._detect_rcm_transactions()
        
        # Calculate RCM liability
        total_rcm = self._calculate_total_rcm(rcm_transactions)
        rcm_paid = self._calculate_rcm_paid(rcm_transactions)
        rcm_pending = total_rcm - rcm_paid
        
        # Calculate current liability (pending + interest)
        rcm_liability = self._calculate_rcm_liability(rcm_transactions)
        
        # Calculate risk score
        risk_score = self._calculate_risk_score(
            total_rcm, rcm_pending, rcm_transactions
        )
        
        # Calculate potential penalties
        penalties = self._calculate_penalties(rcm_pending, rcm_transactions)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            rcm_pending, rcm_transactions, risk_score
        )
        
        return RCMAnalysisResult(
            total_rcm_applicable=total_rcm,
            rcm_paid=rcm_paid,
            rcm_pending=rcm_pending,
            rcm_liability=rcm_liability,
            detected_expenses=rcm_transactions,
            risk_score=risk_score,
            penalties_at_risk=penalties,
            recommendations=recommendations
        )
    
    def _detect_rcm_transactions(self) -> List[Dict]:
        """Detect RCM applicable transactions using AI classification"""
        rcm_transactions = []
        
        # Check purchase records
        for p in self.purchases:
            rcm_result = self._classify_rcm_applicability(
                description=p.expense_category or '',
                vendor_gstin=p.vendor_gstin,
                amount=p.taxable_value,
                gst_charged=p.total_gst
            )
            
            if rcm_result['applicable']:
                rcm_transactions.append({
                    'type': 'Purchase',
                    'invoice_no': p.invoice_no,
                    'date': p.date,
                    'vendor_name': p.vendor_name,
                    'vendor_gstin': p.vendor_gstin,
                    'category': rcm_result['category'],
                    'amount': p.taxable_value,
                    'rcm_liability': rcm_result['rcm_amount'],
                    'applicability': rcm_result['applicability'],
                    'confidence': rcm_result['confidence'],
                    'reason': rcm_result['reason'],
                    'gst_charged': p.total_gst,
                    'paid': self._is_rcm_paid(p)
                })
        
        # Check expense records
        for e in self.expenses:
            rcm_result = self._classify_rcm_applicability(
                description=f"{e.category or ''} {e.description}",
                vendor_gstin=e.vendor_gstin,
                amount=e.amount - e.gst_amount,  # Taxable amount
                gst_charged=e.gst_amount
            )
            
            if rcm_result['applicable']:
                rcm_transactions.append({
                    'type': 'Expense',
                    'date': e.date,
                    'description': e.description,
                    'vendor_gstin': e.vendor_gstin,
                    'category': rcm_result['category'],
                    'amount': e.amount - e.gst_amount,
                    'rcm_liability': rcm_result['rcm_amount'],
                    'applicability': rcm_result['applicability'],
                    'confidence': rcm_result['confidence'],
                    'reason': rcm_result['reason'],
                    'gst_charged': e.gst_amount,
                    'paid': False  # Assume unpaid unless verified
                })
        
        # Sort by date (oldest first)
        rcm_transactions.sort(key=lambda x: x['date'])
        
        return rcm_transactions
    
    def _classify_rcm_applicability(
        self,
        description: str,
        vendor_gstin: Optional[str],
        amount: float,
        gst_charged: float
    ) -> Dict:
        """Classify if transaction is RCM applicable using rule-based AI"""
        
        description_lower = description.lower()
        
        # Check each RCM category
        for category, rules in self.RCM_RULES.items():
            # Keyword matching
            if any(keyword in description_lower for keyword in rules['keywords']):
                
                # Check applicability conditions
                if rules['applicability'] == 'ALWAYS':
                    # Always RCM (e.g., Director Fees, Manpower Supply)
                    rcm_amount = amount * (rules['rate'] / 100)
                    
                    return {
                        'applicable': True,
                        'category': category,
                        'rcm_amount': rcm_amount,
                        'applicability': 'ALWAYS',
                        'confidence': 0.9,
                        'reason': f"{category} is always under RCM as per Section 9(3) of GST Act"
                    }
                
                elif rules['applicability'] == 'CONDITIONAL':
                    # Conditional RCM - check vendor GSTIN
                    if not vendor_gstin or not vendor_gstin.strip():
                        # No GSTIN = Unregistered = RCM applicable
                        rcm_amount = amount * (rules['rate'] / 100)
                        
                        return {
                            'applicable': True,
                            'category': category,
                            'rcm_amount': rcm_amount,
                            'applicability': 'UNREGISTERED_VENDOR',
                            'confidence': 0.85,
                            'reason': f"Vendor not registered - RCM applicable on {category}"
                        }
                    
                    elif gst_charged == 0:
                        # Vendor has GSTIN but didn't charge GST
                        rcm_amount = amount * (rules['rate'] / 100)
                        
                        return {
                            'applicable': True,
                            'category': category,
                            'rcm_amount': rcm_amount,
                            'applicability': 'NO_GST_CHARGED',
                            'confidence': 0.8,
                            'reason': f"GST not charged by vendor - verify if RCM applicable"
                        }
        
        # No RCM applicable
        return {
            'applicable': False,
            'category': None,
            'rcm_amount': 0,
            'applicability': 'NOT_APPLICABLE',
            'confidence': 1.0,
            'reason': 'Not an RCM category'
        }
    
    def _calculate_total_rcm(self, transactions: List[Dict]) -> float:
        """Calculate total RCM applicable amount"""
        return sum(t['rcm_liability'] for t in transactions)
    
    def _calculate_rcm_paid(self, transactions: List[Dict]) -> float:
        """Calculate RCM already paid"""
        return sum(t['rcm_liability'] for t in transactions if t['paid'])
    
    def _calculate_rcm_liability(self, transactions: List[Dict]) -> float:
        """Calculate current RCM liability including interest"""
        total_liability = 0
        
        for t in transactions:
            if not t['paid']:
                # Principal amount
                principal = t['rcm_liability']
                
                # Calculate interest on delayed payment
                days_delayed = (datetime.now() - t['date']).days
                if days_delayed > 30:  # Grace period of 1 month
                    interest = principal * (self.INTEREST_RATE / 100) * (days_delayed / 365)
                    total_liability += principal + interest
                else:
                    total_liability += principal
        
        return total_liability
    
    def _calculate_risk_score(
        self,
        total_rcm: float,
        rcm_pending: float,
        transactions: List[Dict]
    ) -> float:
        """Calculate RCM compliance risk score (0-100)"""
        score = 0
        
        # High pending RCM
        if rcm_pending > 100000:
            score += 40
        elif rcm_pending > 50000:
            score += 25
        elif rcm_pending > 10000:
            score += 15
        
        # Percentage pending
        if total_rcm > 0:
            pending_pct = (rcm_pending / total_rcm) * 100
            if pending_pct > 50:
                score += 30
            elif pending_pct > 25:
                score += 20
        
        # Old unpaid transactions
        old_transactions = [t for t in transactions if not t['paid'] and 
                          (datetime.now() - t['date']).days > 60]
        if len(old_transactions) > 5:
            score += 20
        elif len(old_transactions) > 0:
            score += 10
        
        # Low confidence detections
        low_conf = [t for t in transactions if t['confidence'] < 0.8]
        if len(low_conf) > 3:
            score += 10
        
        return min(score, 100)
    
    def _calculate_penalties(
        self,
        rcm_pending: float,
        transactions: List[Dict]
    ) -> float:
        """Calculate potential penalties for non-compliance"""
        penalties = 0
        
        for t in transactions:
            if not t['paid']:
                days_delayed = (datetime.now() - t['date']).days
                
                # Interest (18% p.a.)
                if days_delayed > 30:
                    interest = t['rcm_liability'] * (self.INTEREST_RATE / 100) * (days_delayed / 365)
                    penalties += interest
                
                # Late fee (₹100 per day per act, max ₹5000)
                if days_delayed > 30:
                    late_fee = min((days_delayed - 30) * 100, 5000)
                    penalties += late_fee
                
                # Penalty for non-payment (can be up to 100% of tax)
                if days_delayed > 180:  # 6 months
                    penalty = t['rcm_liability'] * self.PENALTY_MULTIPLIER
                    penalties += penalty
        
        return penalties
    
    def _generate_recommendations(
        self,
        rcm_pending: float,
        transactions: List[Dict],
        risk_score: float
    ) -> List[str]:
        """Generate actionable RCM compliance recommendations"""
        recommendations = []
        
        # Critical pending amount
        if rcm_pending > 50000:
            recommendations.append(
                f"🔴 URGENT: Pay pending RCM of ₹{rcm_pending:,.0f} immediately to avoid penalties."
            )
        
        # Upcoming deadlines
        current_month_txns = [
            t for t in transactions if not t['paid'] and 
            t['date'].month == datetime.now().month - 1
        ]
        if current_month_txns:
            amount = sum(t['rcm_liability'] for t in current_month_txns)
            recommendations.append(
                f"📅 Last month's RCM of ₹{amount:,.0f} due by 20th of this month. Pay before deadline."
            )
        
        # High risk vendors
        unregistered_vendors = set(
            t.get('vendor_name', t.get('description', ''))
            for t in transactions 
            if t['applicability'] == 'UNREGISTERED_VENDOR'
        )
        if unregistered_vendors:
            recommendations.append(
                f"⚠️ {len(unregistered_vendors)} unregistered vendors detected. Obtain their GSTIN or confirm RCM applicability."
            )
        
        # Category-wise analysis
        category_totals = {}
        for t in transactions:
            cat = t['category']
            category_totals[cat] = category_totals.get(cat, 0) + t['rcm_liability']
        
        if category_totals:
            top_category = max(category_totals, key=category_totals.get)
            recommendations.append(
                f"💡 Highest RCM category: {top_category} (₹{category_totals[top_category]:,.0f}). Review these transactions carefully."
            )
        
        # Compliance best practices
        if risk_score > 60:
            recommendations.append(
                "📋 Set up automated RCM tracking system to avoid future non-compliance."
            )
        
        if risk_score < 30:
            recommendations.append(
                "✅ Good RCM compliance! Continue monitoring unregistered vendor transactions."
            )
        
        # Low confidence detections
        low_conf_txns = [t for t in transactions if t['confidence'] < 0.8]
        if low_conf_txns:
            recommendations.append(
                f"🔍 {len(low_conf_txns)} transactions need manual verification for RCM applicability."
            )
        
        return recommendations
    
    def _is_rcm_paid(self, purchase: PurchaseRecord) -> bool:
        """Check if RCM was paid for this purchase"""
        # In production, this would check:
        # 1. GSTR-3B filed data
        # 2. Cash ledger entries
        # 3. Payment references
        
        # For now, assume paid if GST was charged separately (not under RCM)
        return purchase.total_gst > 0
    
    def get_rcm_calendar(self) -> List[Dict]:
        """Get RCM payment calendar with deadlines"""
        calendar = []
        
        # RCM needs to be paid by 20th of next month
        # Group transactions by month
        monthly_rcm = {}
        
        all_transactions = self._detect_rcm_transactions()
        
        for t in all_transactions:
            if not t['paid']:
                month_key = t['date'].strftime('%Y-%m')
                if month_key not in monthly_rcm:
                    monthly_rcm[month_key] = {
                        'month': t['date'].strftime('%B %Y'),
                        'transactions': 0,
                        'amount': 0,
                        'deadline': None
                    }
                
                monthly_rcm[month_key]['transactions'] += 1
                monthly_rcm[month_key]['amount'] += t['rcm_liability']
                
                # Deadline is 20th of next month
                deadline = (t['date'].replace(day=1) + timedelta(days=32)).replace(day=20)
                monthly_rcm[month_key]['deadline'] = deadline
        
        # Convert to list and sort
        for data in monthly_rcm.values():
            calendar.append({
                'month': data['month'],
                'transactions': data['transactions'],
                'amount': data['amount'],
                'deadline': data['deadline'].strftime('%d %b %Y'),
                'days_remaining': (data['deadline'] - datetime.now()).days,
                'status': 'Overdue' if data['deadline'] < datetime.now() else 'Upcoming'
            })
        
        calendar.sort(key=lambda x: x['days_remaining'])
        
        return calendar
    
    def get_rcm_summary(self) -> Dict:
        """Get quick RCM summary for dashboard"""
        result = self.analyze_rcm_compliance()
        
        return {
            'total_rcm': result.total_rcm_applicable,
            'pending_rcm': result.rcm_pending,
            'risk_score': result.risk_score,
            'potential_penalties': result.penalties_at_risk,
            'critical_issues': len([t for t in result.detected_expenses if not t['paid'] and 
                                   (datetime.now() - t['date']).days > 60])
        }
