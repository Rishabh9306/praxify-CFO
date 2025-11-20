"""
🔒 SECURE LOGGING WITH PII REDACTION
=====================================
Automatically redacts sensitive financial data from logs.

Features:
- Pattern-based PII detection and masking
- Audit trail with compliance logging
- Structured JSON logging for SIEM integration
- Automatic detection of financial data (amounts, SSN, credit cards, etc.)

Security Level: MAXIMUM
Compliance: GDPR Article 32, SOC 2, PCI-DSS
"""

import re
import logging
import json
from datetime import datetime
from typing import Any, Dict, Optional
import hashlib


class PIIRedactor:
    """
    Redacts personally identifiable information and sensitive financial data.
    """
    
    # Patterns for sensitive data detection
    PATTERNS = {
        'ssn': re.compile(r'\b\d{3}-\d{2}-\d{4}\b'),
        'credit_card': re.compile(r'\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b'),
        'email': re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'),
        'phone': re.compile(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b'),
        'api_key': re.compile(r'\b[A-Za-z0-9]{32,}\b'),
        'ip_address': re.compile(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b'),
        # Financial data patterns
        'currency': re.compile(r'[\$€£¥]\s*\d+(?:,\d{3})*(?:\.\d{2})?'),
        'large_number': re.compile(r'\b\d{1,3}(?:,\d{3})+(?:\.\d{2})?\b'),  # e.g., 1,234,567.89
    }
    
    # Financial keywords that indicate sensitive context
    SENSITIVE_KEYWORDS = [
        'revenue', 'expense', 'profit', 'loss', 'salary', 'wage', 'income',
        'cost', 'price', 'amount', 'balance', 'account', 'payment', 'debt',
        'cash', 'liability', 'asset', 'equity', 'margin', 'cashflow'
    ]
    
    @staticmethod
    def redact(text: str, redaction_char: str = '*') -> str:
        """
        Redact sensitive information from text.
        
        Args:
            text: Input text that may contain PII
            redaction_char: Character to use for redaction
            
        Returns:
            Text with sensitive data redacted
        """
        if not isinstance(text, str):
            text = str(text)
        
        redacted = text
        
        # Apply all patterns
        for pattern_name, pattern in PIIRedactor.PATTERNS.items():
            def replace_with_type(match):
                matched_text = match.group(0)
                # Keep first and last 2 characters for debugging, redact middle
                if len(matched_text) > 6:
                    return f"{matched_text[:2]}{redaction_char * (len(matched_text) - 4)}{matched_text[-2:]}"
                else:
                    return redaction_char * len(matched_text)
            
            redacted = pattern.sub(replace_with_type, redacted)
        
        # Check for sensitive keywords and redact nearby numbers
        text_lower = redacted.lower()
        for keyword in PIIRedactor.SENSITIVE_KEYWORDS:
            if keyword in text_lower:
                # Find numbers near this keyword (within 50 characters)
                keyword_positions = [m.start() for m in re.finditer(re.escape(keyword), text_lower)]
                for pos in keyword_positions:
                    # Look for numbers in a window around the keyword
                    start = max(0, pos - 50)
                    end = min(len(redacted), pos + 50)
                    window = redacted[start:end]
                    
                    # Redact floating point numbers in this window
                    def redact_number(match):
                        return f"[{keyword.upper()}_REDACTED]"
                    
                    window_redacted = re.sub(r'\d+\.?\d*', redact_number, window)
                    redacted = redacted[:start] + window_redacted + redacted[end:]
        
        return redacted
    
    @staticmethod
    def hash_sensitive_value(value: Any) -> str:
        """
        Create a consistent hash of sensitive value for audit trails.
        This allows tracking the same value across logs without exposing it.
        
        Args:
            value: Sensitive value to hash
            
        Returns:
            SHA-256 hash (first 16 characters)
        """
        value_str = str(value).encode('utf-8')
        return hashlib.sha256(value_str).hexdigest()[:16]


class SecureLogger:
    """
    Secure logging with automatic PII redaction and audit trails.
    """
    
    def __init__(self, name: str = "praxify_cfo", log_level: int = logging.INFO):
        """
        Initialize secure logger.
        
        Args:
            name: Logger name
            log_level: Logging level (default: INFO)
        """
        self.logger = logging.getLogger(name)
        self.logger.setLevel(log_level)
        
        # Remove existing handlers to avoid duplicates
        self.logger.handlers.clear()
        
        # Create console handler with redaction
        console_handler = logging.StreamHandler()
        console_handler.setLevel(log_level)
        
        # Secure formatter
        formatter = SecureFormatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        console_handler.setFormatter(formatter)
        
        self.logger.addHandler(console_handler)
        
        # Audit logger for compliance
        self.audit_logger = logging.getLogger(f"{name}.audit")
        self.audit_logger.setLevel(logging.INFO)
        self.audit_logger.handlers.clear()
    
    def info(self, message: str, **kwargs):
        """Log info message with PII redaction."""
        redacted_message = PIIRedactor.redact(message)
        self.logger.info(redacted_message, **kwargs)
    
    def warning(self, message: str, **kwargs):
        """Log warning message with PII redaction."""
        redacted_message = PIIRedactor.redact(message)
        self.logger.warning(redacted_message, **kwargs)
    
    def error(self, message: str, **kwargs):
        """Log error message with PII redaction."""
        redacted_message = PIIRedactor.redact(message)
        self.logger.error(redacted_message, **kwargs)
    
    def debug(self, message: str, **kwargs):
        """Log debug message with PII redaction."""
        redacted_message = PIIRedactor.redact(message)
        self.logger.debug(redacted_message, **kwargs)
    
    def audit(self, event_type: str, details: Dict[str, Any], user_id: str = "system"):
        """
        Log audit event for compliance.
        
        Args:
            event_type: Type of event (e.g., "data_upload", "model_training")
            details: Event details (will be redacted)
            user_id: User identifier
        """
        audit_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "event_type": event_type,
            "user_id": user_id,
            "details": {k: PIIRedactor.redact(str(v)) for k, v in details.items()}
        }
        
        self.audit_logger.info(json.dumps(audit_entry))
    
    def log_data_processing(self, operation: str, record_count: int, 
                           columns: list, success: bool = True):
        """
        Log data processing event with audit trail.
        
        Args:
            operation: Operation name (e.g., "csv_upload", "forecasting")
            record_count: Number of records processed
            columns: Column names (will be logged, not redacted as they're schema not data)
            success: Whether operation succeeded
        """
        self.audit(
            event_type="data_processing",
            details={
                "operation": operation,
                "record_count": record_count,
                "columns": columns,
                "success": success
            }
        )


class SecureFormatter(logging.Formatter):
    """
    Custom formatter that redacts PII from log records.
    """
    
    def format(self, record):
        # Redact message
        if hasattr(record, 'msg'):
            record.msg = PIIRedactor.redact(str(record.msg))
        
        # Redact args
        if hasattr(record, 'args') and record.args:
            record.args = tuple(PIIRedactor.redact(str(arg)) for arg in record.args)
        
        return super().format(record)


# Global logger instance
_global_logger = None


def get_secure_logger(name: str = "praxify_cfo") -> SecureLogger:
    """Get or create global secure logger instance."""
    global _global_logger
    if _global_logger is None:
        _global_logger = SecureLogger(name)
    return _global_logger


# Convenience functions
def log_info(message: str):
    """Log info message with PII redaction."""
    get_secure_logger().info(message)


def log_warning(message: str):
    """Log warning message with PII redaction."""
    get_secure_logger().warning(message)


def log_error(message: str):
    """Log error message with PII redaction."""
    get_secure_logger().error(message)


def log_audit(event_type: str, details: Dict[str, Any]):
    """Log audit event for compliance."""
    get_secure_logger().audit(event_type, details)
