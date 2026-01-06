"""
TaxIQ API Routes - GST & Tax Intelligence Endpoints
Production-ready FastAPI routes for tax analysis
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import List, Optional
import pandas as pd
import io
import logging
from datetime import datetime

from ..core.tax_models import (
    TaxUploadRequest, TaxAnalysisRequest, TaxDashboardResponse,
    ITCAnalysisResult, RCMAnalysisResult, TaxOptimizationResult,
    ComplianceRiskResult, ReconciliationResult
)
from ..core.tax_validators import TaxDataValidator
from ..core.itc_engine import ITCRecoveryEngine
from ..core.rcm_engine import RCMDetectionEngine
from ..core.tax_optimization_engine import TaxOptimizationEngine
from ..core.compliance_risk_engine import ComplianceRiskEngine
from ..core.reconciliation_engine import ReconciliationEngine

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/tax", tags=["TaxIQ"])

# In-memory storage for demo (replace with database in production)
TAX_DATA_STORE = {
    'purchases': [],
    'sales': [],
    'expenses': []
}


@router.post("/upload/purchase-register", summary="Upload Purchase Register CSV")
async def upload_purchase_register(file: UploadFile = File(...)):
    """
    Upload purchase register CSV for ITC and RCM analysis
    
    Required columns: invoice_no, date, vendor_name, taxable_value, total
    Optional: vendor_gstin, cgst, sgst, igst, expense_category
    """
    try:
        # Read CSV
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        # Validate data
        valid_records, errors = TaxDataValidator.validate_purchase_register(df)
        
        if not valid_records:
            raise HTTPException(
                status_code=400,
                detail=f"No valid records found. Errors: {'; '.join(errors[:5])}"
            )
        
        # Store data
        TAX_DATA_STORE['purchases'] = valid_records
        
        # Generate data quality report
        quality_report = TaxDataValidator.get_data_quality_report(valid_records, 'purchase')
        
        # Detect anomalies
        anomalies = TaxDataValidator.detect_anomalies(valid_records)
        
        logger.info(f"Purchase register uploaded: {len(valid_records)} records")
        
        return {
            'success': True,
            'records_uploaded': len(valid_records),
            'records_rejected': len(errors),
            'errors': errors[:10] if errors else [],
            'quality_report': quality_report,
            'anomalies': anomalies[:5],
            'message': f'Successfully uploaded {len(valid_records)} purchase records'
        }
        
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="Empty CSV file")
    except Exception as e:
        logger.error(f"Error uploading purchase register: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.post("/upload/sales-register", summary="Upload Sales Register CSV")
async def upload_sales_register(file: UploadFile = File(...)):
    """
    Upload sales register CSV for tax optimization analysis
    
    Required columns: invoice_no, date, buyer_name, taxable_value, total
    Optional: buyer_gstin, cgst, sgst, igst, state
    """
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        valid_records, errors = TaxDataValidator.validate_sales_register(df)
        
        if not valid_records:
            raise HTTPException(
                status_code=400,
                detail=f"No valid records found. Errors: {'; '.join(errors[:5])}"
            )
        
        TAX_DATA_STORE['sales'] = valid_records
        
        quality_report = TaxDataValidator.get_data_quality_report(valid_records, 'sales')
        
        logger.info(f"Sales register uploaded: {len(valid_records)} records")
        
        return {
            'success': True,
            'records_uploaded': len(valid_records),
            'records_rejected': len(errors),
            'errors': errors[:10] if errors else [],
            'quality_report': quality_report,
            'message': f'Successfully uploaded {len(valid_records)} sales records'
        }
        
    except Exception as e:
        logger.error(f"Error uploading sales register: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.post("/upload/expense-register", summary="Upload Expense Register CSV")
async def upload_expense_register(file: UploadFile = File(...)):
    """
    Upload expense register CSV for RCM detection
    
    Required columns: date, description, amount
    Optional: category, vendor_gstin, payment_mode, gst_amount
    """
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        valid_records, errors = TaxDataValidator.validate_expense_register(df)
        
        if not valid_records:
            raise HTTPException(
                status_code=400,
                detail=f"No valid records found. Errors: {'; '.join(errors[:5])}"
            )
        
        TAX_DATA_STORE['expenses'] = valid_records
        
        logger.info(f"Expense register uploaded: {len(valid_records)} records")
        
        return {
            'success': True,
            'records_uploaded': len(valid_records),
            'records_rejected': len(errors),
            'errors': errors[:10] if errors else [],
            'message': f'Successfully uploaded {len(valid_records)} expense records'
        }
        
    except Exception as e:
        logger.error(f"Error uploading expense register: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/analysis/itc-recovery", response_model=ITCAnalysisResult, summary="ITC Recovery Analysis")
async def analyze_itc_recovery():
    """
    Comprehensive ITC (Input Tax Credit) recovery analysis
    
    Provides:
    - Total ITC available vs claimed
    - ITC at risk due to vendor non-compliance
    - Vendor risk scoring
    - Potential ITC recovery opportunities
    """
    if not TAX_DATA_STORE['purchases']:
        raise HTTPException(
            status_code=400,
            detail="No purchase data available. Upload purchase register first."
        )
    
    try:
        engine = ITCRecoveryEngine(TAX_DATA_STORE['purchases'])
        result = engine.analyze_itc_recovery()
        
        logger.info(f"ITC analysis completed: ₹{result.potential_savings:,.0f} recovery potential")
        
        return result
        
    except Exception as e:
        logger.error(f"ITC analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/analysis/rcm-detection", response_model=RCMAnalysisResult, summary="RCM Detection & Compliance")
async def analyze_rcm_compliance():
    """
    RCM (Reverse Charge Mechanism) detection and compliance analysis
    
    Provides:
    - Auto-detection of RCM-applicable expenses
    - RCM liability calculation
    - Penalty risk assessment
    - Payment calendar with deadlines
    """
    if not TAX_DATA_STORE['purchases'] and not TAX_DATA_STORE['expenses']:
        raise HTTPException(
            status_code=400,
            detail="No purchase/expense data available. Upload data first."
        )
    
    try:
        engine = RCMDetectionEngine(
            purchases=TAX_DATA_STORE['purchases'],
            expenses=TAX_DATA_STORE['expenses']
        )
        result = engine.analyze_rcm_compliance()
        
        logger.info(f"RCM analysis completed: ₹{result.rcm_pending:,.0f} pending, Risk: {result.risk_score}/100")
        
        return result
        
    except Exception as e:
        logger.error(f"RCM analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/analysis/tax-optimization", response_model=TaxOptimizationResult, summary="Tax Optimization Scenarios")
async def analyze_tax_optimization(industry: str = "default"):
    """
    Tax optimization and planning analysis
    
    Provides:
    - Current vs optimized tax liability
    - Tax-saving scenarios (defer purchases, maximize ITC, etc.)
    - Next quarter forecast
    - Industry benchmarking
    
    Industry options: manufacturing, services, trading, retail, default
    """
    if not TAX_DATA_STORE['purchases'] or not TAX_DATA_STORE['sales']:
        raise HTTPException(
            status_code=400,
            detail="Need both purchase and sales data. Upload both registers."
        )
    
    try:
        engine = TaxOptimizationEngine(
            purchases=TAX_DATA_STORE['purchases'],
            sales=TAX_DATA_STORE['sales'],
            industry=industry
        )
        result = engine.analyze_tax_optimization()
        
        logger.info(f"Tax optimization completed: ₹{result.potential_savings:,.0f} potential savings")
        
        return result
        
    except Exception as e:
        logger.error(f"Tax optimization failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/analysis/compliance-risk", response_model=ComplianceRiskResult, summary="Compliance Risk Assessment")
async def assess_compliance_risk():
    """
    Comprehensive GST compliance risk assessment
    
    Provides:
    - Overall risk score and level
    - Critical issues and warnings
    - Audit probability calculation
    - Potential penalty amounts
    - Prioritized action items
    - Upcoming compliance deadlines
    """
    if not TAX_DATA_STORE['purchases'] or not TAX_DATA_STORE['sales']:
        raise HTTPException(
            status_code=400,
            detail="Need both purchase and sales data for risk assessment."
        )
    
    try:
        engine = ComplianceRiskEngine(
            purchases=TAX_DATA_STORE['purchases'],
            sales=TAX_DATA_STORE['sales']
        )
        result = engine.assess_compliance_risk()
        
        logger.info(f"Risk assessment completed: Risk Score {result.overall_risk_score}/100, Level: {result.risk_level}")
        
        return result
        
    except Exception as e:
        logger.error(f"Risk assessment failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/analysis/reconciliation", response_model=ReconciliationResult, summary="GSTR-2A/2B Reconciliation")
async def reconcile_gstr():
    """
    GSTR-2A/2B reconciliation with purchase register
    
    Note: In production, this would fetch GSTR-2A/2B data from GSTN API.
    For demo, use the /upload/gstr-data endpoint to provide GSTR data.
    
    Provides:
    - Matched vs unmatched invoices
    - Value mismatches
    - ITC impact analysis
    - Detailed discrepancy report
    """
    if not TAX_DATA_STORE['purchases']:
        raise HTTPException(
            status_code=400,
            detail="No purchase data available for reconciliation."
        )
    
    try:
        engine = ReconciliationEngine(TAX_DATA_STORE['purchases'])
        
        # In production, fetch GSTR-2A/2B data from GSTN API
        # For now, check if test data was uploaded
        if 'gstr_data' in TAX_DATA_STORE:
            engine.set_gstr_data(TAX_DATA_STORE['gstr_data'])
        
        result = engine.reconcile()
        
        logger.info(f"Reconciliation completed: {result.match_rate:.1f}% match rate")
        
        return result
        
    except Exception as e:
        logger.error(f"Reconciliation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Reconciliation failed: {str(e)}")


@router.get("/dashboard", response_model=TaxDashboardResponse, summary="Complete TaxIQ Dashboard")
async def get_tax_dashboard(
    include_itc: bool = True,
    include_rcm: bool = True,
    include_optimization: bool = True,
    include_risk: bool = True,
    include_reconciliation: bool = False,
    industry: str = "default"
):
    """
    Complete TaxIQ dashboard with all analysis modules
    
    Returns comprehensive tax intelligence including:
    - ITC recovery analysis
    - RCM detection and compliance
    - Tax optimization opportunities
    - Compliance risk assessment
    - GSTR reconciliation (optional)
    """
    if not TAX_DATA_STORE['purchases']:
        raise HTTPException(
            status_code=400,
            detail="No data available. Upload purchase and sales registers first."
        )
    
    try:
        # Calculate actual amounts from Pydantic models
        total_purchase_amount = sum(p.total for p in TAX_DATA_STORE['purchases'])
        total_sales_amount = sum(s.total for s in TAX_DATA_STORE['sales'])
        total_expense_amount = sum(e.amount for e in TAX_DATA_STORE['expenses'])
        
        # Calculate GST amounts
        total_purchase_gst = sum((p.cgst or 0) + (p.sgst or 0) + (p.igst or 0) for p in TAX_DATA_STORE['purchases'])
        total_sales_gst = sum((s.cgst or 0) + (s.sgst or 0) + (s.igst or 0) for s in TAX_DATA_STORE['sales'])
        
        dashboard_data = {
            'summary': {
                'total_purchases': total_purchase_amount,
                'total_sales': total_sales_amount,
                'total_expenses': total_expense_amount,
                'total_input_gst': total_purchase_gst,
                'total_output_gst': total_sales_gst,
                'net_gst_liability': total_sales_gst - total_purchase_gst,
                'purchase_count': len(TAX_DATA_STORE['purchases']),
                'sales_count': len(TAX_DATA_STORE['sales']),
                'expense_count': len(TAX_DATA_STORE['expenses']),
                'analysis_date': datetime.now().isoformat()
            }
        }
        
        # ITC Analysis
        if include_itc and TAX_DATA_STORE['purchases']:
            itc_engine = ITCRecoveryEngine(TAX_DATA_STORE['purchases'])
            dashboard_data['itc_analysis'] = itc_engine.analyze_itc_recovery()
            dashboard_data['summary']['itc_recovery_potential'] = dashboard_data['itc_analysis'].potential_savings
        
        # RCM Analysis
        if include_rcm:
            rcm_engine = RCMDetectionEngine(
                purchases=TAX_DATA_STORE['purchases'],
                expenses=TAX_DATA_STORE['expenses']
            )
            dashboard_data['rcm_analysis'] = rcm_engine.analyze_rcm_compliance()
            dashboard_data['summary']['rcm_pending'] = dashboard_data['rcm_analysis'].rcm_pending
        
        # Tax Optimization
        if include_optimization and TAX_DATA_STORE['sales']:
            opt_engine = TaxOptimizationEngine(
                purchases=TAX_DATA_STORE['purchases'],
                sales=TAX_DATA_STORE['sales'],
                industry=industry
            )
            dashboard_data['optimization'] = opt_engine.analyze_tax_optimization()
            dashboard_data['summary']['optimization_savings'] = dashboard_data['optimization'].potential_savings
        
        # Compliance Risk
        if include_risk and TAX_DATA_STORE['sales']:
            risk_engine = ComplianceRiskEngine(
                purchases=TAX_DATA_STORE['purchases'],
                sales=TAX_DATA_STORE['sales']
            )
            dashboard_data['risk_assessment'] = risk_engine.assess_compliance_risk()
            dashboard_data['summary']['risk_score'] = dashboard_data['risk_assessment'].overall_risk_score
            dashboard_data['summary']['compliance_score'] = dashboard_data['risk_assessment'].compliance_score
        
        # Reconciliation (optional)
        if include_reconciliation:
            recon_engine = ReconciliationEngine(TAX_DATA_STORE['purchases'])
            if 'gstr_data' in TAX_DATA_STORE:
                recon_engine.set_gstr_data(TAX_DATA_STORE['gstr_data'])
            dashboard_data['reconciliation'] = recon_engine.reconcile()
        
        # Calculate total potential savings
        total_savings = 0
        if 'itc_analysis' in dashboard_data:
            total_savings += dashboard_data['itc_analysis'].potential_savings
        if 'optimization' in dashboard_data:
            total_savings += dashboard_data['optimization'].potential_savings
        
        dashboard_data['summary']['total_potential_savings'] = total_savings
        
        logger.info(f"Dashboard generated: ₹{total_savings:,.0f} total savings potential")
        
        return TaxDashboardResponse(**dashboard_data)
        
    except Exception as e:
        logger.error(f"Dashboard generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Dashboard generation failed: {str(e)}")


@router.get("/summary", summary="Quick TaxIQ Summary")
async def get_quick_summary():
    """
    Quick summary of all TaxIQ metrics for dashboard display
    """
    if not TAX_DATA_STORE['purchases']:
        return {
            'status': 'No data',
            'message': 'Upload purchase and sales data to get started'
        }
    
    try:
        summary = {
            'data_loaded': {
                'purchases': len(TAX_DATA_STORE['purchases']),
                'sales': len(TAX_DATA_STORE['sales']),
                'expenses': len(TAX_DATA_STORE['expenses'])
            }
        }
        
        # ITC Summary
        if TAX_DATA_STORE['purchases']:
            itc_engine = ITCRecoveryEngine(TAX_DATA_STORE['purchases'])
            summary['itc'] = itc_engine.get_itc_summary()
        
        # RCM Summary
        if TAX_DATA_STORE['purchases'] or TAX_DATA_STORE['expenses']:
            rcm_engine = RCMDetectionEngine(
                purchases=TAX_DATA_STORE['purchases'],
                expenses=TAX_DATA_STORE['expenses']
            )
            summary['rcm'] = rcm_engine.get_rcm_summary()
        
        # Tax Optimization Summary
        if TAX_DATA_STORE['purchases'] and TAX_DATA_STORE['sales']:
            opt_engine = TaxOptimizationEngine(
                purchases=TAX_DATA_STORE['purchases'],
                sales=TAX_DATA_STORE['sales']
            )
            summary['optimization'] = opt_engine.get_optimization_summary()
        
        # Risk Summary
        if TAX_DATA_STORE['purchases'] and TAX_DATA_STORE['sales']:
            risk_engine = ComplianceRiskEngine(
                purchases=TAX_DATA_STORE['purchases'],
                sales=TAX_DATA_STORE['sales']
            )
            summary['risk'] = risk_engine.get_risk_summary()
        
        return summary
        
    except Exception as e:
        logger.error(f"Summary generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Summary generation failed: {str(e)}")


@router.delete("/data/clear", summary="Clear All Tax Data")
async def clear_all_data():
    """Clear all uploaded tax data (for testing/reset)"""
    TAX_DATA_STORE['purchases'] = []
    TAX_DATA_STORE['sales'] = []
    TAX_DATA_STORE['expenses'] = []
    if 'gstr_data' in TAX_DATA_STORE:
        del TAX_DATA_STORE['gstr_data']
    
    logger.info("All tax data cleared")
    
    return {'success': True, 'message': 'All tax data cleared'}


@router.get("/health", summary="TaxIQ Health Check")
async def health_check():
    """Check TaxIQ service health"""
    return {
        'status': 'healthy',
        'service': 'TaxIQ - GST & Tax Intelligence Engine',
        'version': '1.0.0',
        'data_loaded': {
            'purchases': len(TAX_DATA_STORE['purchases']),
            'sales': len(TAX_DATA_STORE['sales']),
            'expenses': len(TAX_DATA_STORE['expenses'])
        }
    }
