"""
TaxIQ CSV Validators - Production-ready data validation
Validates GST purchase register, sales register, and expense register
"""

import pandas as pd
from datetime import datetime
from typing import Dict, List, Tuple, Optional
import logging
from .tax_models import (
    PurchaseRecord, SalesRecord, ExpenseRecord,
    GSTINValidator
)

logger = logging.getLogger(__name__)


class TaxDataValidator:
    """Comprehensive tax data validation"""
    
    @staticmethod
    def validate_purchase_register(df: pd.DataFrame) -> Tuple[List[PurchaseRecord], List[str]]:
        """
        Validate purchase register CSV
        Returns: (valid_records, errors)
        """
        errors = []
        valid_records = []
        
        # Required columns
        required_columns = [
            'invoice_no', 'date', 'vendor_name', 'taxable_value', 'total'
        ]
        
        # Check required columns
        missing_cols = [col for col in required_columns if col not in df.columns]
        if missing_cols:
            errors.append(f"Missing required columns: {', '.join(missing_cols)}")
            return [], errors
        
        # Optional columns with defaults
        optional_columns = {
            'vendor_gstin': None,
            'cgst': 0.0,
            'sgst': 0.0,
            'igst': 0.0,
            'expense_category': None
        }
        
        for col, default in optional_columns.items():
            if col not in df.columns:
                df[col] = default
        
        # Validate each row
        for idx, row in df.iterrows():
            try:
                # Clean and convert data
                record_data = {
                    'invoice_no': str(row['invoice_no']).strip(),
                    'date': pd.to_datetime(row['date']),
                    'vendor_gstin': str(row['vendor_gstin']).strip().upper() if pd.notna(row['vendor_gstin']) else None,
                    'vendor_name': str(row['vendor_name']).strip(),
                    'taxable_value': float(row['taxable_value']),
                    'cgst': float(row.get('cgst', 0)),
                    'sgst': float(row.get('sgst', 0)),
                    'igst': float(row.get('igst', 0)),
                    'total': float(row['total']),
                    'expense_category': str(row['expense_category']).strip() if pd.notna(row['expense_category']) else None
                }
                
                # Validate with Pydantic model
                record = PurchaseRecord(**record_data)
                valid_records.append(record)
                
            except ValueError as e:
                errors.append(f"Row {idx + 2}: {str(e)}")
            except Exception as e:
                errors.append(f"Row {idx + 2}: Invalid data - {str(e)}")
        
        logger.info(f"Purchase register validation: {len(valid_records)} valid, {len(errors)} errors")
        return valid_records, errors
    
    @staticmethod
    def validate_sales_register(df: pd.DataFrame) -> Tuple[List[SalesRecord], List[str]]:
        """
        Validate sales register CSV
        Returns: (valid_records, errors)
        """
        errors = []
        valid_records = []
        
        # Required columns
        required_columns = [
            'invoice_no', 'date', 'buyer_name', 'taxable_value', 'total'
        ]
        
        # Check required columns
        missing_cols = [col for col in required_columns if col not in df.columns]
        if missing_cols:
            errors.append(f"Missing required columns: {', '.join(missing_cols)}")
            return [], errors
        
        # Optional columns with defaults
        optional_columns = {
            'buyer_gstin': None,
            'cgst': 0.0,
            'sgst': 0.0,
            'igst': 0.0,
            'state': None
        }
        
        for col, default in optional_columns.items():
            if col not in df.columns:
                df[col] = default
        
        # Validate each row
        for idx, row in df.iterrows():
            try:
                record_data = {
                    'invoice_no': str(row['invoice_no']).strip(),
                    'date': pd.to_datetime(row['date']),
                    'buyer_gstin': str(row['buyer_gstin']).strip().upper() if pd.notna(row['buyer_gstin']) else None,
                    'buyer_name': str(row['buyer_name']).strip(),
                    'taxable_value': float(row['taxable_value']),
                    'cgst': float(row.get('cgst', 0)),
                    'sgst': float(row.get('sgst', 0)),
                    'igst': float(row.get('igst', 0)),
                    'total': float(row['total']),
                    'state': str(row['state']).strip() if pd.notna(row['state']) else None
                }
                
                record = SalesRecord(**record_data)
                valid_records.append(record)
                
            except ValueError as e:
                errors.append(f"Row {idx + 2}: {str(e)}")
            except Exception as e:
                errors.append(f"Row {idx + 2}: Invalid data - {str(e)}")
        
        logger.info(f"Sales register validation: {len(valid_records)} valid, {len(errors)} errors")
        return valid_records, errors
    
    @staticmethod
    def validate_expense_register(df: pd.DataFrame) -> Tuple[List[ExpenseRecord], List[str]]:
        """
        Validate expense register CSV
        Returns: (valid_records, errors)
        """
        errors = []
        valid_records = []
        
        # Required columns
        required_columns = ['date', 'description', 'amount']
        
        # Check required columns
        missing_cols = [col for col in required_columns if col not in df.columns]
        if missing_cols:
            errors.append(f"Missing required columns: {', '.join(missing_cols)}")
            return [], errors
        
        # Optional columns with defaults
        optional_columns = {
            'category': None,
            'vendor_gstin': None,
            'payment_mode': None,
            'gst_amount': 0.0
        }
        
        for col, default in optional_columns.items():
            if col not in df.columns:
                df[col] = default
        
        # Validate each row
        for idx, row in df.iterrows():
            try:
                record_data = {
                    'date': pd.to_datetime(row['date']),
                    'description': str(row['description']).strip(),
                    'amount': float(row['amount']),
                    'category': str(row['category']).strip() if pd.notna(row['category']) else None,
                    'vendor_gstin': str(row['vendor_gstin']).strip().upper() if pd.notna(row['vendor_gstin']) else None,
                    'payment_mode': str(row['payment_mode']).strip() if pd.notna(row['payment_mode']) else None,
                    'gst_amount': float(row.get('gst_amount', 0))
                }
                
                record = ExpenseRecord(**record_data)
                valid_records.append(record)
                
            except ValueError as e:
                errors.append(f"Row {idx + 2}: {str(e)}")
            except Exception as e:
                errors.append(f"Row {idx + 2}: Invalid data - {str(e)}")
        
        logger.info(f"Expense register validation: {len(valid_records)} valid, {len(errors)} errors")
        return valid_records, errors
    
    @staticmethod
    def get_data_quality_report(records: List, data_type: str) -> Dict:
        """Generate data quality report"""
        if not records:
            return {
                'total_records': 0,
                'quality_score': 0,
                'issues': ['No valid records found']
            }
        
        issues = []
        total = len(records)
        
        if data_type == 'purchase':
            # Check GSTIN completeness
            with_gstin = sum(1 for r in records if r.vendor_gstin)
            if with_gstin / total < 0.8:
                issues.append(f"Only {with_gstin}/{total} records have vendor GSTIN")
            
            # Check tax consistency
            interstate = sum(1 for r in records if r.is_interstate)
            intrastate = total - interstate
            
            # Check for missing categories
            without_category = sum(1 for r in records if not r.expense_category)
            if without_category / total > 0.3:
                issues.append(f"{without_category} records missing expense category")
        
        elif data_type == 'sales':
            # Check B2B vs B2C ratio
            b2b = sum(1 for r in records if r.is_b2b)
            if b2b / total < 0.5:
                issues.append(f"Low B2B ratio: {b2b}/{total} have buyer GSTIN")
        
        quality_score = max(0, 100 - (len(issues) * 10))
        
        return {
            'total_records': total,
            'quality_score': quality_score,
            'issues': issues if issues else ['Data quality is good']
        }
    
    @staticmethod
    def detect_anomalies(records: List[PurchaseRecord]) -> List[Dict]:
        """Detect anomalies in purchase data"""
        anomalies = []
        
        if not records:
            return anomalies
        
        # Calculate statistics
        values = [r.total for r in records]
        mean_value = sum(values) / len(values)
        
        # Detect unusually large transactions
        threshold = mean_value * 5
        for r in records:
            if r.total > threshold:
                anomalies.append({
                    'invoice_no': r.invoice_no,
                    'type': 'Large Transaction',
                    'value': r.total,
                    'description': f'Transaction value ₹{r.total:,.0f} is {r.total/mean_value:.1f}x average'
                })
        
        # Detect round number transactions (potential estimation)
        for r in records:
            if r.total > 10000 and r.total % 10000 == 0:
                anomalies.append({
                    'invoice_no': r.invoice_no,
                    'type': 'Round Number',
                    'value': r.total,
                    'description': 'Exact round number - verify if actual or estimated'
                })
        
        # Detect same-day duplicate vendors
        vendor_dates = {}
        for r in records:
            key = (r.vendor_gstin or r.vendor_name, r.date.date())
            if key in vendor_dates:
                anomalies.append({
                    'invoice_no': r.invoice_no,
                    'type': 'Multiple Invoices Same Day',
                    'value': r.total,
                    'description': f'Multiple invoices from {r.vendor_name} on same day'
                })
            vendor_dates[key] = r.invoice_no
        
        return anomalies
