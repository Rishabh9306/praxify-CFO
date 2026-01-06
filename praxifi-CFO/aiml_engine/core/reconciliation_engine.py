"""
TaxIQ Reconciliation Engine
AI-powered GSTR-2A/2B reconciliation with fuzzy matching
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Tuple, Optional
from datetime import datetime
from difflib import SequenceMatcher
import re
import logging

from .tax_models import PurchaseRecord, ReconciliationResult

logger = logging.getLogger(__name__)


class ReconciliationEngine:
    """Intelligent GSTR-2A/2B Reconciliation"""
    
    # Matching thresholds
    GSTIN_MATCH = 1.0  # Perfect match required
    INVOICE_FUZZY_THRESHOLD = 0.85  # 85% similarity
    AMOUNT_TOLERANCE = 0.01  # 1% tolerance
    DATE_TOLERANCE_DAYS = 7  # 7 days tolerance
    
    def __init__(self, purchase_register: List[PurchaseRecord]):
        self.purchase_register = purchase_register
        self.gstr_data = []  # Would come from GSTN API in production
    
    def set_gstr_data(self, gstr_data: List[Dict]):
        """Set GSTR-2A/2B data for reconciliation"""
        self.gstr_data = gstr_data
    
    def reconcile(self) -> ReconciliationResult:
        """Perform comprehensive reconciliation"""
        
        # Perform matching
        matches, unmatched_books, unmatched_gstr = self._perform_matching()
        
        # Calculate metrics
        total_books = len(self.purchase_register)
        total_gstr = len(self.gstr_data)
        matched_count = len(matches)
        
        # Calculate value mismatch
        value_mismatch = sum(abs(m['amount_difference']) for m in matches if m.get('amount_difference', 0) != 0)
        
        # Calculate ITC impact
        itc_impact = self._calculate_itc_impact(unmatched_books, unmatched_gstr)
        
        # Calculate match rate
        match_rate = (matched_count / max(total_books, 1)) * 100
        
        # Generate discrepancies list
        discrepancies = self._generate_discrepancies(matches, unmatched_books, unmatched_gstr)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            matched_count, unmatched_books, unmatched_gstr, value_mismatch
        )
        
        return ReconciliationResult(
            matched_invoices=matched_count,
            unmatched_in_books=len(unmatched_books),
            unmatched_in_gstr=len(unmatched_gstr),
            value_mismatch=value_mismatch,
            itc_impact=itc_impact,
            match_rate=match_rate,
            discrepancies=discrepancies,
            recommendations=recommendations
        )
    
    def _perform_matching(self) -> Tuple[List[Dict], List[PurchaseRecord], List[Dict]]:
        """Perform fuzzy matching between purchase register and GSTR data"""
        matches = []
        unmatched_books = list(self.purchase_register)
        unmatched_gstr = list(self.gstr_data)
        
        if not self.gstr_data:
            logger.warning("No GSTR data available for reconciliation")
            return matches, unmatched_books, []
        
        # Create indices for faster lookup
        gstr_by_gstin = self._index_by_gstin(self.gstr_data)
        
        # Try to match each purchase record
        for purchase in self.purchase_register:
            if not purchase.vendor_gstin:
                continue
            
            # Get potential matches by GSTIN
            candidates = gstr_by_gstin.get(purchase.vendor_gstin, [])
            
            # Find best match
            best_match = None
            best_score = 0
            
            for candidate in candidates:
                score = self._calculate_match_score(purchase, candidate)
                if score > best_score and score >= 0.7:  # 70% threshold
                    best_score = score
                    best_match = candidate
            
            if best_match:
                # Found a match
                match_info = {
                    'purchase': purchase,
                    'gstr': best_match,
                    'match_score': best_score,
                    'match_type': self._get_match_type(best_score),
                    'amount_difference': purchase.total - best_match.get('total', 0),
                    'gst_difference': purchase.total_gst - best_match.get('gst_amount', 0)
                }
                matches.append(match_info)
                
                # Remove from unmatched lists
                if purchase in unmatched_books:
                    unmatched_books.remove(purchase)
                if best_match in unmatched_gstr:
                    unmatched_gstr.remove(best_match)
        
        return matches, unmatched_books, unmatched_gstr
    
    def _calculate_match_score(self, purchase: PurchaseRecord, gstr_record: Dict) -> float:
        """Calculate matching score between purchase and GSTR record"""
        score = 0
        weights = {
            'gstin': 0.3,
            'invoice_no': 0.2,
            'date': 0.15,
            'amount': 0.25,
            'gst': 0.1
        }
        
        # 1. GSTIN match (must match perfectly)
        if purchase.vendor_gstin == gstr_record.get('gstin'):
            score += weights['gstin']
        else:
            return 0  # No match if GSTIN doesn't match
        
        # 2. Invoice number match (fuzzy)
        purchase_inv = self._normalize_invoice_number(purchase.invoice_no)
        gstr_inv = self._normalize_invoice_number(gstr_record.get('invoice_no', ''))
        
        inv_similarity = self._string_similarity(purchase_inv, gstr_inv)
        if inv_similarity >= self.INVOICE_FUZZY_THRESHOLD:
            score += weights['invoice_no']
        elif inv_similarity >= 0.6:
            score += weights['invoice_no'] * 0.5
        
        # 3. Date match (with tolerance)
        purchase_date = purchase.date
        gstr_date = gstr_record.get('date')
        
        if gstr_date:
            if isinstance(gstr_date, str):
                gstr_date = pd.to_datetime(gstr_date)
            
            date_diff = abs((purchase_date - gstr_date).days)
            if date_diff <= self.DATE_TOLERANCE_DAYS:
                score += weights['date'] * (1 - date_diff / self.DATE_TOLERANCE_DAYS)
        
        # 4. Amount match (with tolerance)
        purchase_amt = purchase.total
        gstr_amt = gstr_record.get('total', 0)
        
        if gstr_amt > 0:
            amt_diff_pct = abs(purchase_amt - gstr_amt) / gstr_amt
            if amt_diff_pct <= self.AMOUNT_TOLERANCE:
                score += weights['amount']
            elif amt_diff_pct <= 0.05:  # 5% tolerance
                score += weights['amount'] * 0.5
        
        # 5. GST amount match
        purchase_gst = purchase.total_gst
        gstr_gst = gstr_record.get('gst_amount', 0)
        
        if gstr_gst > 0:
            gst_diff_pct = abs(purchase_gst - gstr_gst) / gstr_gst
            if gst_diff_pct <= self.AMOUNT_TOLERANCE:
                score += weights['gst']
        
        return score
    
    def _index_by_gstin(self, gstr_data: List[Dict]) -> Dict[str, List[Dict]]:
        """Create index of GSTR data by GSTIN for faster lookup"""
        index = {}
        for record in gstr_data:
            gstin = record.get('gstin', '')
            if gstin:
                if gstin not in index:
                    index[gstin] = []
                index[gstin].append(record)
        return index
    
    def _normalize_invoice_number(self, invoice_no: str) -> str:
        """Normalize invoice number for comparison"""
        # Remove common prefixes, spaces, special characters
        normalized = re.sub(r'[^a-zA-Z0-9]', '', invoice_no.upper())
        # Remove common prefixes like INV, INVOICE, etc.
        normalized = re.sub(r'^(INV|INVOICE|BILL|)', '', normalized)
        return normalized
    
    def _string_similarity(self, str1: str, str2: str) -> float:
        """Calculate string similarity using SequenceMatcher"""
        return SequenceMatcher(None, str1, str2).ratio()
    
    def _get_match_type(self, score: float) -> str:
        """Determine match type based on score"""
        if score >= 0.95:
            return 'Perfect Match'
        elif score >= 0.85:
            return 'Exact Match'
        elif score >= 0.75:
            return 'Good Match'
        elif score >= 0.7:
            return 'Probable Match'
        else:
            return 'No Match'
    
    def _calculate_itc_impact(
        self,
        unmatched_books: List[PurchaseRecord],
        unmatched_gstr: List[Dict]
    ) -> float:
        """Calculate ITC impact due to mismatches"""
        # ITC claimed in books but not in GSTR = at risk
        itc_at_risk = sum(p.total_gst for p in unmatched_books if p.vendor_gstin)
        
        # ITC in GSTR but not in books = opportunity
        itc_opportunity = sum(g.get('gst_amount', 0) for g in unmatched_gstr)
        
        # Net impact (negative = loss, positive = gain)
        return itc_at_risk  # Focus on at-risk amount
    
    def _generate_discrepancies(
        self,
        matches: List[Dict],
        unmatched_books: List[PurchaseRecord],
        unmatched_gstr: List[Dict]
    ) -> List[Dict]:
        """Generate detailed list of discrepancies"""
        discrepancies = []
        
        # 1. Value mismatches in matched records
        for match in matches:
            if abs(match.get('amount_difference', 0)) > 100:  # More than ₹100 difference
                discrepancies.append({
                    'type': 'Value Mismatch',
                    'severity': 'Medium',
                    'invoice_no': match['purchase'].invoice_no,
                    'vendor_name': match['purchase'].vendor_name,
                    'books_amount': match['purchase'].total,
                    'gstr_amount': match['gstr'].get('total', 0),
                    'difference': match['amount_difference'],
                    'description': f'Amount difference of ₹{abs(match["amount_difference"]):,.0f}',
                    'action': 'Verify invoice and correct before filing GSTR-3B'
                })
        
        # 2. Records in books but not in GSTR (ITC at risk)
        for purchase in unmatched_books[:20]:  # Top 20
            if purchase.vendor_gstin:
                discrepancies.append({
                    'type': 'Not in GSTR-2A/2B',
                    'severity': 'High',
                    'invoice_no': purchase.invoice_no,
                    'vendor_name': purchase.vendor_name,
                    'vendor_gstin': purchase.vendor_gstin,
                    'amount': purchase.total,
                    'itc_at_risk': purchase.total_gst,
                    'description': f'Invoice not found in GSTR-2A/2B - ITC of ₹{purchase.total_gst:,.0f} at risk',
                    'action': 'Verify vendor has filed GSTR-1 and uploaded invoice'
                })
        
        # 3. Records in GSTR but not in books (missed ITC)
        for gstr in unmatched_gstr[:10]:  # Top 10
            discrepancies.append({
                'type': 'Not in Purchase Register',
                'severity': 'Medium',
                'invoice_no': gstr.get('invoice_no'),
                'vendor_gstin': gstr.get('gstin'),
                'amount': gstr.get('total', 0),
                'itc_available': gstr.get('gst_amount', 0),
                'description': f'Invoice in GSTR-2A but not in books - ₹{gstr.get("gst_amount", 0):,.0f} ITC not claimed',
                'action': 'Verify if invoice was received and add to books if valid'
            })
        
        # Sort by severity and ITC impact
        severity_order = {'High': 1, 'Medium': 2, 'Low': 3}
        discrepancies.sort(key=lambda x: (
            severity_order.get(x['severity'], 4),
            -x.get('itc_at_risk', x.get('itc_available', 0))
        ))
        
        return discrepancies
    
    def _generate_recommendations(
        self,
        matched_count: int,
        unmatched_books: List[PurchaseRecord],
        unmatched_gstr: List[Dict],
        value_mismatch: float
    ) -> List[str]:
        """Generate reconciliation recommendations"""
        recommendations = []
        
        total_books = len(self.purchase_register)
        match_rate = (matched_count / total_books * 100) if total_books > 0 else 0
        
        # Match rate assessment
        if match_rate >= 95:
            recommendations.append(
                f"✅ Excellent reconciliation! {match_rate:.1f}% of invoices matched."
            )
        elif match_rate >= 85:
            recommendations.append(
                f"✅ Good reconciliation! {match_rate:.1f}% matched. Review unmatched items."
            )
        elif match_rate >= 70:
            recommendations.append(
                f"⚠️ Fair reconciliation. {match_rate:.1f}% matched. Significant discrepancies need attention."
            )
        else:
            recommendations.append(
                f"🔴 Poor reconciliation! Only {match_rate:.1f}% matched. Urgent review required."
            )
        
        # Unmatched in books (ITC at risk)
        if unmatched_books:
            itc_at_risk = sum(p.total_gst for p in unmatched_books if p.vendor_gstin)
            if itc_at_risk > 50000:
                recommendations.append(
                    f"🚨 CRITICAL: ₹{itc_at_risk:,.0f} ITC at risk from {len(unmatched_books)} unmatched invoices. Contact vendors immediately."
                )
            elif itc_at_risk > 10000:
                recommendations.append(
                    f"⚠️ ₹{itc_at_risk:,.0f} ITC at risk. Verify if vendors have filed GSTR-1."
                )
        
        # Unmatched in GSTR (missed ITC)
        if unmatched_gstr:
            itc_opportunity = sum(g.get('gst_amount', 0) for g in unmatched_gstr)
            if itc_opportunity > 10000:
                recommendations.append(
                    f"💡 ₹{itc_opportunity:,.0f} additional ITC available in GSTR-2A but not in books. Verify and claim if valid."
                )
        
        # Value mismatches
        if value_mismatch > 50000:
            recommendations.append(
                f"📊 Total value mismatch of ₹{value_mismatch:,.0f}. Correct before filing GSTR-3B."
            )
        
        # Best practices
        recommendations.append(
            "📅 Perform reconciliation monthly to avoid year-end surprises."
        )
        
        if len(unmatched_books) > 10:
            recommendations.append(
                "🔍 Implement automated vendor compliance tracking to reduce mismatches."
            )
        
        return recommendations
    
    def get_reconciliation_summary(self) -> Dict:
        """Get quick reconciliation summary"""
        if not self.gstr_data:
            return {
                'status': 'No GSTR data available',
                'match_rate': 0,
                'action_required': True
            }
        
        result = self.reconcile()
        
        return {
            'matched': result.matched_invoices,
            'unmatched_books': result.unmatched_in_books,
            'unmatched_gstr': result.unmatched_in_gstr,
            'match_rate': result.match_rate,
            'itc_impact': result.itc_impact,
            'action_required': result.unmatched_in_books > 0 or result.value_mismatch > 10000
        }
    
    def export_discrepancies_report(self) -> pd.DataFrame:
        """Export discrepancies as DataFrame for Excel/CSV export"""
        result = self.reconcile()
        
        df = pd.DataFrame(result.discrepancies)
        return df
