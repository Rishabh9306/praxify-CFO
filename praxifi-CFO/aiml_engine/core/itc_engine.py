"""
TaxIQ ITC Recovery Analysis Engine
AI-powered Input Tax Credit leakage detection and recovery optimization
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Tuple
from datetime import datetime, timedelta
from collections import defaultdict
import logging

from .tax_models import (
    PurchaseRecord, ITCAnalysisResult, VendorRiskProfile,
    GSTINValidator
)

logger = logging.getLogger(__name__)


class ITCRecoveryEngine:
    """Intelligent ITC Recovery and Leakage Detection"""
    
    # RCM-applicable service categories (ITC not available)
    RCM_CATEGORIES = {
        'Legal Services', 'Professional Fees', 'Director Fees',
        'Security Services', 'Manpower Supply', 'GTA Services'
    }
    
    # Time-barred period for ITC claim (as per GST rules - September of next FY or annual return, whichever is earlier)
    ITC_CLAIM_MONTHS = 10  # Approximate conservative limit
    
    def __init__(self, purchases: List[PurchaseRecord]):
        self.purchases = purchases
        self.df = pd.DataFrame([p.dict() for p in purchases])
        
    def analyze_itc_recovery(self) -> ITCAnalysisResult:
        """Comprehensive ITC recovery analysis"""
        
        # Calculate ITC metrics with clear definitions
        total_itc_eligible = self._calculate_total_itc()  # All non-RCM GST
        itc_claimed = self._calculate_claimed_itc()  # Already filed
        itc_at_risk = self._calculate_itc_at_risk()  # Vendors without GSTIN
        
        # Calculate unclaimed = eligible - claimed - at_risk
        # This is ITC from valid vendors that's pending filing
        itc_unclaimed = max(total_itc_eligible - itc_claimed - itc_at_risk, 0)
        
        # Analyze vendor risks
        vendor_risks = self._analyze_vendor_risks()
        
        # Detect mismatches
        mismatches = self._detect_mismatches()
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            itc_at_risk, itc_unclaimed, vendor_risks, mismatches
        )
        
        # Calculate recovery rate (what % has been claimed)
        recovery_rate = (itc_claimed / total_itc_eligible * 100) if total_itc_eligible > 0 else 0
        
        # Calculate potential savings
        # Unclaimed is fully recoverable (just need to file)
        # At-risk needs vendor GSTIN, assume 100% recoverable if obtained
        potential_savings = itc_unclaimed + itc_at_risk
        
        return ITCAnalysisResult(
            total_itc_available=total_itc_eligible,
            itc_claimed=itc_claimed,
            itc_unclaimed=itc_unclaimed,
            itc_at_risk=itc_at_risk,
            recovery_rate=recovery_rate,
            vendor_risks=vendor_risks,
            mismatches=mismatches,
            recommendations=recommendations,
            potential_savings=potential_savings
        )
    
    def _calculate_total_itc(self) -> float:
        """Calculate total ITC available from all purchases"""
        total = 0
        for p in self.purchases:
            # ITC not available on RCM transactions
            if p.expense_category not in self.RCM_CATEGORIES:
                total += p.total_gst
        return total
    
    def _calculate_claimed_itc(self) -> float:
        """Calculate ITC actually claimed (based on valid vendor GSTIN and non-RCM)"""
        claimed = 0
        for p in self.purchases:
            # ITC claimable only if:
            # 1. Vendor has valid GSTIN
            # 2. Not RCM applicable
            # 3. Within time limit
            if (p.vendor_gstin and 
                GSTINValidator.is_valid_gstin(p.vendor_gstin) and
                p.expense_category not in self.RCM_CATEGORIES and
                self._is_within_claim_period(p.date)):
                claimed += p.total_gst
        return claimed
    
    def _calculate_itc_at_risk(self) -> float:
        """Calculate ITC at risk due to vendor non-compliance or mismatches"""
        at_risk = 0
        
        for p in self.purchases:
            if not p.vendor_gstin or not GSTINValidator.is_valid_gstin(p.vendor_gstin):
                # No GSTIN = no ITC
                at_risk += p.total_gst
            elif self._is_vendor_high_risk(p.vendor_gstin):
                # High-risk vendor
                at_risk += p.total_gst
        
        return at_risk
    
    def _calculate_unclaimed_itc(self) -> float:
        """Calculate ITC unclaimed due to time-barring or other issues"""
        unclaimed = 0
        
        for p in self.purchases:
            # Time-barred ITC
            if not self._is_within_claim_period(p.date):
                if p.vendor_gstin and GSTINValidator.is_valid_gstin(p.vendor_gstin):
                    unclaimed += p.total_gst
        
        return unclaimed
    
    def _analyze_vendor_risks(self) -> List[Dict]:
        """Analyze vendor-wise risk for ITC claims"""
        vendor_data = defaultdict(lambda: {
            'transactions': 0,
            'total_value': 0,
            'total_itc': 0,
            'issues': []
        })
        
        for p in self.purchases:
            key = p.vendor_gstin or p.vendor_name
            vendor_data[key]['transactions'] += 1
            vendor_data[key]['total_value'] += p.total
            vendor_data[key]['total_itc'] += p.total_gst
            vendor_data[key]['vendor_name'] = p.vendor_name
            vendor_data[key]['vendor_gstin'] = p.vendor_gstin
            
            # Check for issues
            if not p.vendor_gstin:
                vendor_data[key]['issues'].append('No GSTIN provided')
            elif not GSTINValidator.is_valid_gstin(p.vendor_gstin):
                vendor_data[key]['issues'].append('Invalid GSTIN format')
        
        # Create risk profiles
        risk_profiles = []
        for vendor_key, data in vendor_data.items():
            risk_score = self._calculate_vendor_risk_score(data)
            
            if risk_score >= 50:  # Only include medium to high risk vendors
                risk_level = 'Critical' if risk_score >= 80 else 'High' if risk_score >= 60 else 'Medium'
                
                risk_profiles.append({
                    'vendor_gstin': data.get('vendor_gstin', 'N/A'),
                    'vendor_name': data['vendor_name'],
                    'risk_score': risk_score,
                    'risk_level': risk_level,
                    'total_transactions': data['transactions'],
                    'total_value': data['total_value'],
                    'itc_at_risk': data['total_itc'],
                    'issues': data['issues'],
                    'recommendation': self._get_vendor_recommendation(risk_score, data)
                })
        
        # Sort by ITC at risk (highest first)
        risk_profiles.sort(key=lambda x: x['itc_at_risk'], reverse=True)
        
        return risk_profiles[:10]  # Top 10 risky vendors
    
    def _calculate_vendor_risk_score(self, vendor_data: Dict) -> float:
        """Calculate risk score for a vendor (0-100)"""
        score = 0
        
        # No GSTIN = highest risk
        if 'No GSTIN provided' in vendor_data['issues']:
            score += 50
        
        # Invalid GSTIN = high risk
        if 'Invalid GSTIN format' in vendor_data['issues']:
            score += 40
        
        # High value without GSTIN = higher risk
        if vendor_data['total_value'] > 500000 and not vendor_data.get('vendor_gstin'):
            score += 30
        
        # Single large transaction = potential risk
        if vendor_data['transactions'] == 1 and vendor_data['total_value'] > 100000:
            score += 20
        
        return min(score, 100)
    
    def _get_vendor_recommendation(self, risk_score: float, vendor_data: Dict) -> str:
        """Get recommendation for vendor"""
        if risk_score >= 80:
            return f"URGENT: Obtain valid GSTIN immediately. ITC of ₹{vendor_data['total_itc']:,.0f} at critical risk."
        elif risk_score >= 60:
            return f"HIGH PRIORITY: Verify vendor GSTIN. Contact vendor to ensure GST compliance."
        else:
            return f"Monitor vendor compliance. Verify GSTR-2A matching."
    
    def _detect_mismatches(self) -> List[Dict]:
        """Detect potential ITC mismatches"""
        mismatches = []
        
        # Detect unusual GST rates
        for p in self.purchases:
            if p.taxable_value > 0:
                effective_rate = (p.total_gst / p.taxable_value) * 100
                
                # Standard GST rates: 5%, 12%, 18%, 28%
                standard_rates = [5, 12, 18, 28]
                if not any(abs(effective_rate - rate) < 0.5 for rate in standard_rates):
                    mismatches.append({
                        'type': 'Unusual GST Rate',
                        'invoice_no': p.invoice_no,
                        'vendor_name': p.vendor_name,
                        'effective_rate': round(effective_rate, 2),
                        'amount': p.total_gst,
                        'description': f'Effective GST rate of {effective_rate:.1f}% is unusual. Verify HSN code and rate.'
                    })
        
        # Detect CGST+SGST vs IGST inconsistency
        for p in self.purchases:
            if p.cgst > 0 and p.sgst > 0 and p.igst > 0:
                mismatches.append({
                    'type': 'Tax Type Mismatch',
                    'invoice_no': p.invoice_no,
                    'vendor_name': p.vendor_name,
                    'amount': p.total_gst,
                    'description': 'Invoice has both CGST+SGST and IGST. Should be either intra-state or inter-state.'
                })
        
        return mismatches
    
    def _generate_recommendations(
        self, 
        itc_at_risk: float, 
        itc_unclaimed: float,
        vendor_risks: List[Dict],
        mismatches: List[Dict]
    ) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        
        # High-risk ITC (vendors without GSTIN)
        if itc_at_risk > 50000:
            recommendations.append(
                f"🔴 CRITICAL: ₹{itc_at_risk:,.0f} ITC blocked - vendors missing GSTIN. Obtain GSTIN immediately."
            )
        elif itc_at_risk > 10000:
            recommendations.append(
                f"⚠️ ₹{itc_at_risk:,.0f} ITC cannot be claimed - vendors without GSTIN. Request GSTIN for future transactions."
            )
        
        # Unclaimed ITC (eligible but not filed)
        if itc_unclaimed > 10000:
            recommendations.append(
                f"💰 ₹{itc_unclaimed:,.0f} ITC eligible and ready to claim. File in next GSTR-3B return."
            )
        
        # Vendor-specific risks
        if len(vendor_risks) > 0:
            top_vendor = vendor_risks[0]
            recommendations.append(
                f"📞 Priority: Contact {top_vendor['vendor_name']} - ₹{top_vendor['itc_at_risk']:,.0f} ITC blocked."
            )
        
        # Mismatches
        if len(mismatches) > 5:
            recommendations.append(
                f"🔍 {len(mismatches)} data mismatches found. Review and correct before filing GSTR-3B."
            )
        
        # General best practices
        if not recommendations:
            recommendations.append(
                "✅ ITC compliance looks good! Continue monitoring GSTR-2A monthly."
            )
        else:
            recommendations.append(
                "✅ Enable GSTR-2A auto-reconciliation for monthly ITC verification."
            )
        
        if itc_at_risk < 10000 and len(vendor_risks) == 0:
            recommendations.append(
                "🎉 Good ITC health! Your vendor compliance is strong."
            )
        
        return recommendations
    
    def _is_within_claim_period(self, transaction_date: datetime) -> bool:
        """Check if ITC claim is within time limit"""
        months_old = (datetime.now() - transaction_date).days / 30
        return months_old <= self.ITC_CLAIM_MONTHS
    
    def _is_vendor_high_risk(self, gstin: str) -> bool:
        """Check if vendor is high risk (simplified - can be enhanced with API calls)"""
        # In production, this would check:
        # 1. GSTN API for vendor compliance status
        # 2. Historical filing patterns
        # 3. Blacklist databases
        
        # For now, basic validation
        return not gstin or not GSTINValidator.is_valid_gstin(gstin)
    
    def get_itc_summary(self) -> Dict:
        """Get quick ITC summary for dashboard"""
        result = self.analyze_itc_recovery()
        
        return {
            'total_itc': result.total_itc_available,
            'recovery_rate': result.recovery_rate,
            'potential_savings': result.potential_savings,
            'high_risk_vendors': len([v for v in result.vendor_risks if v['risk_level'] in ['High', 'Critical']]),
            'critical_issues': len([m for m in result.mismatches if m['type'] == 'Tax Type Mismatch'])
        }
