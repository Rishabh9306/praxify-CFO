"""
TaxIQ Core Models - GST & Tax Intelligence Engine
Production-ready Pydantic models for tax data processing
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator
from enum import Enum
import re


class GSTINValidator:
    """GSTIN validation utilities"""
    
    @staticmethod
    def is_valid_gstin(gstin: str) -> bool:
        """Validate GSTIN format: 2 digits state code + 10 chars PAN + 1 entity code + 1 Z + 1 checksum"""
        if not gstin or len(gstin) != 15:
            return False
        
        pattern = r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'
        return bool(re.match(pattern, gstin))
    
    @staticmethod
    def extract_state_code(gstin: str) -> Optional[str]:
        """Extract state code from GSTIN"""
        if GSTINValidator.is_valid_gstin(gstin):
            return gstin[:2]
        return None
    
    @staticmethod
    def extract_pan(gstin: str) -> Optional[str]:
        """Extract PAN from GSTIN"""
        if GSTINValidator.is_valid_gstin(gstin):
            return gstin[2:12]
        return None


class ExpenseCategory(str, Enum):
    """Expense categories for RCM classification"""
    RAW_MATERIALS = "Raw Materials"
    PROFESSIONAL_FEES = "Professional Fees"
    LEGAL_SERVICES = "Legal Services"
    RENT = "Rent"
    FREIGHT = "Freight"
    GTA_SERVICES = "GTA Services"
    DIRECTOR_FEES = "Director Fees"
    SECURITY_SERVICES = "Security Services"
    MANPOWER_SUPPLY = "Manpower Supply"
    OTHER = "Other"


class RCMApplicability(str, Enum):
    """RCM Applicability status"""
    APPLICABLE = "Applicable"
    NOT_APPLICABLE = "Not Applicable"
    CONDITIONAL = "Conditional"


class ComplianceRiskLevel(str, Enum):
    """Risk levels for compliance"""
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"
    SAFE = "Safe"


class PurchaseRecord(BaseModel):
    """Purchase Register Record"""
    invoice_no: str = Field(..., description="Invoice number")
    date: datetime = Field(..., description="Invoice date")
    vendor_gstin: Optional[str] = Field(None, description="Vendor GSTIN")
    vendor_name: str = Field(..., description="Vendor name")
    taxable_value: float = Field(..., ge=0, description="Taxable value")
    cgst: float = Field(0, ge=0, description="CGST amount")
    sgst: float = Field(0, ge=0, description="SGST amount")
    igst: float = Field(0, ge=0, description="IGST amount")
    total: float = Field(..., ge=0, description="Total invoice value")
    expense_category: Optional[str] = Field(None, description="Expense category")
    
    @validator('vendor_gstin')
    def validate_gstin(cls, v):
        if v and not GSTINValidator.is_valid_gstin(v):
            # Allow null GSTIN for unregistered vendors, but validate if provided
            if v.strip():  # Only validate if not empty
                raise ValueError(f"Invalid GSTIN format: {v}")
        return v
    
    @validator('total')
    def validate_total(cls, v, values):
        """Validate total matches taxable + taxes"""
        expected = values.get('taxable_value', 0) + values.get('cgst', 0) + \
                   values.get('sgst', 0) + values.get('igst', 0)
        if abs(v - expected) > 1:  # Allow ₹1 rounding difference
            raise ValueError(f"Total {v} doesn't match sum of components {expected}")
        return v
    
    @property
    def total_gst(self) -> float:
        """Total GST amount"""
        return self.cgst + self.sgst + self.igst
    
    @property
    def is_interstate(self) -> bool:
        """Check if interstate transaction"""
        return self.igst > 0
    
    @property
    def state_code(self) -> Optional[str]:
        """Extract state code from GSTIN"""
        return GSTINValidator.extract_state_code(self.vendor_gstin) if self.vendor_gstin else None


class SalesRecord(BaseModel):
    """Sales Register Record"""
    invoice_no: str = Field(..., description="Invoice number")
    date: datetime = Field(..., description="Invoice date")
    buyer_gstin: Optional[str] = Field(None, description="Buyer GSTIN")
    buyer_name: str = Field(..., description="Buyer name")
    taxable_value: float = Field(..., ge=0, description="Taxable value")
    cgst: float = Field(0, ge=0, description="CGST amount")
    sgst: float = Field(0, ge=0, description="SGST amount")
    igst: float = Field(0, ge=0, description="IGST amount")
    total: float = Field(..., ge=0, description="Total invoice value")
    state: Optional[str] = Field(None, description="State of buyer")
    
    @validator('buyer_gstin')
    def validate_gstin(cls, v):
        if v and v.strip() and not GSTINValidator.is_valid_gstin(v):
            raise ValueError(f"Invalid GSTIN format: {v}")
        return v
    
    @property
    def total_gst(self) -> float:
        """Total GST amount"""
        return self.cgst + self.sgst + self.igst
    
    @property
    def is_interstate(self) -> bool:
        """Check if interstate transaction"""
        return self.igst > 0
    
    @property
    def is_b2b(self) -> bool:
        """Check if B2B transaction"""
        return bool(self.buyer_gstin and self.buyer_gstin.strip())


class ExpenseRecord(BaseModel):
    """Expense Register Record"""
    date: datetime = Field(..., description="Expense date")
    description: str = Field(..., description="Expense description")
    amount: float = Field(..., ge=0, description="Expense amount")
    category: Optional[str] = Field(None, description="Expense category")
    vendor_gstin: Optional[str] = Field(None, description="Vendor GSTIN")
    payment_mode: Optional[str] = Field(None, description="Payment mode")
    gst_amount: float = Field(0, ge=0, description="GST amount if any")
    
    @validator('vendor_gstin')
    def validate_gstin(cls, v):
        if v and v.strip() and not GSTINValidator.is_valid_gstin(v):
            raise ValueError(f"Invalid GSTIN format: {v}")
        return v


class ITCAnalysisResult(BaseModel):
    """ITC Recovery Analysis Result"""
    total_itc_available: float = Field(..., description="Total ITC available for current period (with valid GSTIN, non-RCM)")
    itc_claimed: float = Field(..., description="ITC actually claimed (filed in returns)")
    itc_unclaimed: float = Field(..., description="ITC eligible but not yet claimed (pending filing)")
    itc_at_risk: float = Field(..., description="ITC from vendors without GSTIN (cannot be claimed)")
    recovery_rate: float = Field(..., description="Percentage of available ITC already claimed")
    vendor_risks: List[Dict[str, Any]] = Field(default_factory=list, description="High-risk vendors affecting ITC")
    mismatches: List[Dict[str, Any]] = Field(default_factory=list, description="GSTR-2A mismatches")
    recommendations: List[str] = Field(default_factory=list, description="Action items to recover ITC")
    potential_savings: float = Field(..., description="Total ITC recovery potential (unclaimed + recoverable at-risk)")


class RCMAnalysisResult(BaseModel):
    """RCM Detection Analysis Result"""
    total_rcm_applicable: float = Field(..., description="Total RCM applicable amount")
    rcm_paid: float = Field(..., description="RCM paid")
    rcm_pending: float = Field(..., description="RCM pending payment")
    rcm_liability: float = Field(..., description="Current RCM liability")
    detected_expenses: List[Dict[str, Any]] = Field(default_factory=list, description="RCM applicable expenses")
    risk_score: float = Field(..., description="RCM compliance risk score 0-100")
    penalties_at_risk: float = Field(..., description="Potential penalties")
    recommendations: List[str] = Field(default_factory=list, description="Action recommendations")


class TaxOptimizationResult(BaseModel):
    """Tax Optimization Analysis Result"""
    current_tax_liability: float = Field(..., description="Current tax liability")
    optimized_tax_liability: float = Field(..., description="Optimized tax liability")
    potential_savings: float = Field(..., description="Potential tax savings")
    savings_percentage: float = Field(..., description="Savings as percentage")
    scenarios: List[Dict[str, Any]] = Field(default_factory=list, description="Optimization scenarios")
    recommendations: List[str] = Field(default_factory=list, description="Tax-saving recommendations")
    effective_tax_rate: float = Field(..., description="Current effective tax rate")
    industry_benchmark: float = Field(..., description="Industry benchmark tax rate")
    forecast_next_quarter: Dict[str, float] = Field(default_factory=dict, description="Next quarter forecast")


class ComplianceRiskResult(BaseModel):
    """Compliance Risk Assessment Result"""
    overall_risk_score: float = Field(..., description="Overall risk score 0-100")
    risk_level: ComplianceRiskLevel = Field(..., description="Risk level category")
    critical_issues: List[Dict[str, Any]] = Field(default_factory=list, description="Critical issues")
    warnings: List[Dict[str, Any]] = Field(default_factory=list, description="Warning issues")
    compliance_score: float = Field(..., description="Compliance score 0-100")
    audit_probability: float = Field(..., description="Audit probability 0-100")
    potential_penalties: float = Field(..., description="Potential penalty amount")
    action_items: List[Dict[str, Any]] = Field(default_factory=list, description="Prioritized action items")
    upcoming_deadlines: List[Dict[str, Any]] = Field(default_factory=list, description="Compliance deadlines")


class ReconciliationResult(BaseModel):
    """GSTR-2A/2B Reconciliation Result"""
    matched_invoices: int = Field(..., description="Number of matched invoices")
    unmatched_in_books: int = Field(..., description="Unmatched in books")
    unmatched_in_gstr: int = Field(..., description="Unmatched in GSTR")
    value_mismatch: float = Field(..., description="Total value mismatch")
    itc_impact: float = Field(..., description="ITC impact due to mismatches")
    match_rate: float = Field(..., description="Match rate percentage")
    discrepancies: List[Dict[str, Any]] = Field(default_factory=list, description="Detailed discrepancies")
    recommendations: List[str] = Field(default_factory=list, description="Reconciliation recommendations")


class TaxUploadRequest(BaseModel):
    """Request for tax data upload"""
    data_type: str = Field(..., description="Type: purchase_register, sales_register, expense_register")
    financial_year: str = Field(..., description="Financial year YYYY-YYYY")
    quarter: Optional[str] = Field(None, description="Quarter Q1/Q2/Q3/Q4")


class TaxAnalysisRequest(BaseModel):
    """Request for comprehensive tax analysis"""
    include_itc_analysis: bool = Field(True, description="Include ITC analysis")
    include_rcm_analysis: bool = Field(True, description="Include RCM analysis")
    include_optimization: bool = Field(True, description="Include optimization")
    include_risk_assessment: bool = Field(True, description="Include risk assessment")
    include_reconciliation: bool = Field(False, description="Include reconciliation")


class TaxDashboardResponse(BaseModel):
    """Complete TaxIQ Dashboard Response"""
    summary: Dict[str, Any] = Field(..., description="High-level summary")
    itc_analysis: Optional[ITCAnalysisResult] = None
    rcm_analysis: Optional[RCMAnalysisResult] = None
    optimization: Optional[TaxOptimizationResult] = None
    risk_assessment: Optional[ComplianceRiskResult] = None
    reconciliation: Optional[ReconciliationResult] = None
    generated_at: datetime = Field(default_factory=datetime.now)


class VendorRiskProfile(BaseModel):
    """Vendor Risk Scoring Profile"""
    vendor_gstin: str
    vendor_name: str
    risk_score: float = Field(..., ge=0, le=100, description="Risk score 0-100")
    risk_level: str = Field(..., description="Low/Medium/High/Critical")
    total_transactions: int
    total_value: float
    itc_at_risk: float
    issues: List[str] = Field(default_factory=list)
    compliance_indicators: Dict[str, Any] = Field(default_factory=dict)
    recommendation: str


class StateWiseAnalysis(BaseModel):
    """State-wise GST analysis for multi-state optimization"""
    state_code: str
    state_name: str
    total_purchases: float
    total_sales: float
    net_igst: float
    effective_tax_rate: float
    working_capital_impact: float
    optimization_suggestions: List[str] = Field(default_factory=list)
