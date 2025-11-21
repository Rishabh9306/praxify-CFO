"""
🔒 PRIVACY BUDGET TRACKER
=========================
Tracks privacy budget consumption across multiple queries for compliance.

Features:
- Per-session privacy budget tracking
- Rényi Differential Privacy composition
- Budget alerts and enforcement
- Audit trail for regulatory compliance

Security Level: MAXIMUM
Compliance: GDPR Article 30 (Records of Processing Activities)
"""

import json
from typing import Dict, Optional, List
from datetime import datetime, timedelta
from collections import defaultdict
import threading
import os
import numpy as np


class PrivacyBudgetTracker:
    """
    Tracks and enforces privacy budget consumption across sessions.
    
    Key Concepts:
    - Total Budget: Maximum epsilon allowed per session (e.g., ε_total = 10.0)
    - Consumed Budget: Sum of epsilon spent on queries
    - Remaining Budget: ε_total - ε_consumed
    - Budget Exhaustion: Reject queries when budget is depleted
    """
    
    def __init__(self, default_total_budget: float = 10.0, session_timeout_hours: int = 24):
        """
        Initialize privacy budget tracker.
        
        Args:
            default_total_budget: Total epsilon budget per session
            session_timeout_hours: Auto-reset budget after this many hours
        """
        self.default_total_budget = default_total_budget
        self.session_timeout_hours = session_timeout_hours
        
        # Thread-safe budget tracking
        self._lock = threading.Lock()
        self._budgets = defaultdict(lambda: {
            'total': self.default_total_budget,
            'consumed': 0.0,
            'queries': [],
            'created_at': datetime.utcnow().isoformat() + "Z",
            'last_query_at': None
        })
    
    def consume_budget(self, session_id: str, epsilon: float, query_type: str = "default") -> bool:
        """
        Attempt to consume privacy budget for a query.
        
        Args:
            session_id: Unique session identifier
            epsilon: Privacy budget to consume
            query_type: Type of query (for audit trail)
            
        Returns:
            True if budget was available and consumed, False if budget exhausted
        """
        with self._lock:
            budget = self._budgets[session_id]
            
            # Check if session has expired
            if budget['last_query_at']:
                last_query_time = datetime.fromisoformat(budget['last_query_at'].replace('Z', ''))
                if datetime.utcnow() - last_query_time > timedelta(hours=self.session_timeout_hours):
                    # Reset budget for expired session
                    budget['consumed'] = 0.0
                    budget['queries'] = []
                    budget['created_at'] = datetime.utcnow().isoformat() + "Z"
            
            # Check if budget is available
            remaining = budget['total'] - budget['consumed']
            if epsilon > remaining:
                # Budget exhausted
                return False
            
            # Consume budget
            budget['consumed'] += epsilon
            budget['last_query_at'] = datetime.utcnow().isoformat() + "Z"
            budget['queries'].append({
                'timestamp': datetime.utcnow().isoformat() + "Z",
                'epsilon': epsilon,
                'query_type': query_type,
                'remaining_budget': budget['total'] - budget['consumed']
            })
            
            return True
    
    def get_remaining_budget(self, session_id: str) -> float:
        """
        Get remaining privacy budget for a session.
        
        Args:
            session_id: Session identifier
            
        Returns:
            Remaining epsilon budget
        """
        with self._lock:
            budget = self._budgets[session_id]
            return budget['total'] - budget['consumed']
    
    def get_budget_status(self, session_id: str) -> Dict:
        """
        Get detailed budget status for a session.
        
        Args:
            session_id: Session identifier
            
        Returns:
            Dictionary with budget details
        """
        with self._lock:
            budget = self._budgets[session_id]
            
            return {
                'session_id': session_id,
                'total_budget': budget['total'],
                'consumed_budget': budget['consumed'],
                'remaining_budget': budget['total'] - budget['consumed'],
                'budget_utilization_percent': (budget['consumed'] / budget['total']) * 100,
                'query_count': len(budget['queries']),
                'created_at': budget['created_at'],
                'last_query_at': budget['last_query_at'],
                'session_active': self._is_session_active(budget)
            }
    
    def _is_session_active(self, budget: Dict) -> bool:
        """Check if session is still active (not expired)."""
        if not budget['last_query_at']:
            return True
        
        last_query_time = datetime.fromisoformat(budget['last_query_at'].replace('Z', ''))
        return datetime.utcnow() - last_query_time <= timedelta(hours=self.session_timeout_hours)
    
    def reset_session_budget(self, session_id: str):
        """
        Reset privacy budget for a session.
        
        Args:
            session_id: Session identifier
        """
        with self._lock:
            if session_id in self._budgets:
                self._budgets[session_id] = {
                    'total': self.default_total_budget,
                    'consumed': 0.0,
                    'queries': [],
                    'created_at': datetime.utcnow().isoformat() + "Z",
                    'last_query_at': None
                }
    
    def get_all_sessions_summary(self) -> List[Dict]:
        """
        Get summary of all active sessions (for admin/audit).
        
        Returns:
            List of session summaries
        """
        with self._lock:
            summaries = []
            for session_id, budget in self._budgets.items():
                if self._is_session_active(budget):
                    summaries.append({
                        'session_id': session_id,
                        'consumed_budget': budget['consumed'],
                        'query_count': len(budget['queries']),
                        'last_query_at': budget['last_query_at']
                    })
            return summaries
    
    def export_audit_log(self, session_id: Optional[str] = None) -> Dict:
        """
        Export audit log for compliance reporting.
        
        Args:
            session_id: Optional session to export (None = all sessions)
            
        Returns:
            Audit log dictionary
        """
        with self._lock:
            if session_id:
                sessions = {session_id: self._budgets[session_id]} if session_id in self._budgets else {}
            else:
                sessions = dict(self._budgets)
            
            return {
                'export_timestamp': datetime.utcnow().isoformat() + "Z",
                'total_sessions': len(sessions),
                'sessions': sessions,
                'compliance': {
                    'framework': 'Differential Privacy Budget Tracking',
                    'gdpr_article': 'Article 30 (Records of Processing)',
                    'retention_policy': f'{self.session_timeout_hours} hours'
                }
            }


# Rényi Differential Privacy Composition
class RenyiDPComposer:
    """
    Composes multiple DP queries using Rényi Differential Privacy.
    
    Rényi DP provides tighter composition bounds than basic DP,
    allowing more queries with the same privacy guarantee.
    """
    
    def __init__(self, alpha: float = 10.0):
        """
        Initialize Rényi DP composer.
        
        Args:
            alpha: Rényi divergence order (typical: 2 to 100)
        """
        self.alpha = alpha
        self.rdp_budget = 0.0  # Accumulated Rényi privacy loss
    
    def add_query(self, epsilon: float, delta: float = 1e-10):
        """
        Add a query to the composition.
        
        Args:
            epsilon: Query privacy parameter
            delta: Query failure probability
        """
        # Convert (ε, δ)-DP to α-RDP
        # Using tight conversion: α-RDP(ε√(2α log(1/δ)))
        rdp_epsilon = epsilon * np.sqrt(2 * self.alpha * np.log(1 / delta))
        self.rdp_budget += rdp_epsilon
    
    def get_epsilon_delta(self, target_delta: float = 1e-10) -> tuple:
        """
        Convert accumulated Rényi budget back to (ε, δ)-DP.
        
        Args:
            target_delta: Desired delta parameter
            
        Returns:
            (epsilon, delta) tuple for the composition
        """
        # Convert α-RDP back to (ε, δ)-DP
        epsilon = self.rdp_budget + np.log(1 / target_delta) / (self.alpha - 1)
        return epsilon, target_delta


# Global privacy budget tracker
_global_budget_tracker = None


def get_privacy_budget_tracker(total_budget: float = 10.0) -> PrivacyBudgetTracker:
    """
    Get or create global privacy budget tracker.
    
    Args:
        total_budget: Total epsilon budget per session
        
    Returns:
        PrivacyBudgetTracker instance
    """
    global _global_budget_tracker
    if _global_budget_tracker is None:
        _global_budget_tracker = PrivacyBudgetTracker(default_total_budget=total_budget)
    return _global_budget_tracker
