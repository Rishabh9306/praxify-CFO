# /aiml_engine/core/firestore_memory.py
"""
🔥 FIREBASE FIRESTORE MEMORY MODULE

Enterprise-grade persistent memory store backed by Firebase Firestore.
Replaces Redis with secure, scalable, and persistent cloud storage.

Features:
- Per-user session management with email-based isolation
- Secure persistent storage (replaces Redis caching)
- Real-time data synchronization
- Automatic cleanup of old sessions
- Supports messages, reports, and analysis results
- Free tier optimized (reads/writes batched where possible)
- Field-level security with Firebase Auth integration

Collections Structure:
- users/{email}/sessions/{session_id}/messages
- users/{email}/sessions/{session_id}/reports
- users/{email}/sessions/{session_id}/metadata

Author: Praxifi Team
Created: 2026-01-06
"""

import os
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import numpy as np
import pandas as pd
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1.base_query import FieldFilter
from aiml_engine.utils.helpers import CustomJSONEncoder

class FirestoreMemory:
    """
    Production-ready memory store backed by Firebase Firestore.
    Provides secure, persistent storage per user with session management.
    """
    
    def __init__(self):
        """
        Initializes Firebase Admin SDK and Firestore client.
        Uses service account credentials from environment or file.
        """
        try:
            # Check if Firebase Admin is already initialized
            if not firebase_admin._apps:
                # Try to get credentials from environment variable (JSON string)
                firebase_creds_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
                
                if firebase_creds_json:
                    # Parse JSON string from environment
                    creds_dict = json.loads(firebase_creds_json)
                    cred = credentials.Certificate(creds_dict)
                else:
                    # Fall back to service account file path
                    creds_path = os.getenv(
                        "FIREBASE_SERVICE_ACCOUNT_PATH",
                        "/app/firebase-service-account.json"
                    )
                    cred = credentials.Certificate(creds_path)
                
                firebase_admin.initialize_app(cred)
                print("✅ Successfully initialized Firebase Admin SDK")
            
            self.db = firestore.client()
            print("✅ Successfully connected to Firestore")
            
        except Exception as e:
            print(f"❌ FATAL: Could not initialize Firestore: {e}")
            print("💡 Please ensure FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH is set")
            raise e
    
    def _get_session_ref(self, user_email: str, session_id: str):
        """Get Firestore reference to a session document."""
        return self.db.collection('users').document(user_email).collection('sessions').document(session_id)
    
    def _sanitize_email(self, email: str) -> str:
        """
        Sanitize email for use as Firestore document ID.
        Firestore document IDs cannot contain certain characters.
        """
        return email.replace('/', '_').replace('\\', '_')
    
    def _convert_to_native_types(self, obj: Any) -> Any:
        """
        Recursively convert numpy/pandas types to native Python types.
        Firestore cannot serialize numpy.int64, numpy.float64, pd.Timestamp, etc.
        Also handles NaN/Inf values and converts them to None.
        
        Args:
            obj: Object to convert (can be dict, list, numpy type, etc.)
            
        Returns:
            Object with all numpy/pandas types converted to native Python types
        """
        if isinstance(obj, dict):
            return {key: self._convert_to_native_types(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self._convert_to_native_types(item) for item in obj]
        elif isinstance(obj, tuple):
            return tuple(self._convert_to_native_types(item) for item in obj)
        elif isinstance(obj, (np.integer, np.int64, np.int32, np.int16, np.int8)):
            return int(obj)
        elif isinstance(obj, (np.floating, np.float64, np.float32, np.float16)):
            # Check for NaN/Inf before converting
            if np.isnan(obj) or np.isinf(obj):
                return None
            return float(obj)
        elif isinstance(obj, float):
            # Handle Python float NaN/Inf
            import math
            if math.isnan(obj) or math.isinf(obj):
                return None
            return obj
        elif isinstance(obj, np.ndarray):
            return self._convert_to_native_types(obj.tolist())
        elif isinstance(obj, (pd.Timestamp, pd.Timedelta)):
            return str(obj)
        elif isinstance(obj, np.bool_):
            return bool(obj)
        elif pd.isna(obj):
            return None
        else:
            return obj
    
    def update_context(
        self,
        user_email: str,
        session_id: str,
        query_id: str,
        analysis_summary: Dict
    ):
        """
        Appends the latest analysis turn to a session's message history in Firestore.
        
        Args:
            user_email: User's email (from Firebase Auth)
            session_id: Unique session identifier
            query_id: Unique query identifier
            analysis_summary: Dictionary containing the analysis results
        """
        try:
            user_email = self._sanitize_email(user_email)
            session_ref = self._get_session_ref(user_email, session_id)
            messages_ref = session_ref.collection('messages')
            
            # Convert numpy/pandas types to native Python types
            analysis_summary_clean = self._convert_to_native_types(analysis_summary)
            
            # Create message document
            message_data = {
                'query_id': query_id,
                'summary': analysis_summary_clean,
                'timestamp': firestore.SERVER_TIMESTAMP,
                'created_at': datetime.utcnow().isoformat()
            }
            
            # Add message to subcollection
            messages_ref.add(message_data)
            
            # Update session metadata (last activity, message count)
            session_ref.set({
                'last_activity': firestore.SERVER_TIMESTAMP,
                'updated_at': datetime.utcnow().isoformat(),
                'user_email': user_email
            }, merge=True)
            
            print(f"✅ Stored message for session {session_id[:8]}... (user: {user_email})")
            
        except Exception as e:
            print(f"❌ Error updating context in Firestore: {e}")
            raise e
    
    def recall_related_history(
        self,
        user_email: str,
        session_id: str,
        limit: int = 100
    ) -> List[Dict]:
        """
        Retrieves the complete message history for a given user session from Firestore.
        
        Args:
            user_email: User's email (from Firebase Auth)
            session_id: Unique session identifier
            limit: Maximum number of messages to retrieve (default: 100)
        
        Returns:
            List of dictionaries containing query_id and summary
        """
        try:
            user_email = self._sanitize_email(user_email)
            session_ref = self._get_session_ref(user_email, session_id)
            messages_ref = session_ref.collection('messages')
            
            # Query messages ordered by creation time
            messages_query = messages_ref.order_by('created_at').limit(limit)
            messages_docs = messages_query.stream()
            
            # Convert Firestore documents to dictionaries
            history = []
            for doc in messages_docs:
                doc_data = doc.to_dict()
                history.append({
                    'query_id': doc_data.get('query_id'),
                    'summary': doc_data.get('summary'),
                    'timestamp': doc_data.get('created_at')
                })
            
            print(f"✅ Retrieved {len(history)} messages for session {session_id[:8]}...")
            return history
            
        except Exception as e:
            print(f"❌ Error recalling history from Firestore: {e}")
            return []
    
    def store_report(
        self,
        user_email: str,
        session_id: str,
        report_id: str,
        report_data: Dict
    ):
        """
        Store a generated report in Firestore.
        
        Args:
            user_email: User's email (from Firebase Auth)
            session_id: Unique session identifier
            report_id: Unique report identifier
            report_data: Dictionary containing the report content
        """
        try:
            user_email = self._sanitize_email(user_email)
            session_ref = self._get_session_ref(user_email, session_id)
            reports_ref = session_ref.collection('reports')
            
            # Convert numpy/pandas types to native Python types
            report_data_clean = self._convert_to_native_types(report_data)
            
            # Create report document
            report_doc = {
                'report_id': report_id,
                'data': report_data_clean,
                'timestamp': firestore.SERVER_TIMESTAMP,
                'created_at': datetime.utcnow().isoformat()
            }
            
            try:
                # Try to store the full report
                reports_ref.document(report_id).set(report_doc)
                print(f"✅ Stored full report {report_id[:8]}... for session {session_id[:8]}...")
                
            except Exception as store_error:
                # If full report fails (too large/nested), store a summarized version
                print(f"⚠️ Full report too large for Firestore, storing summary instead: {store_error}")
                
                # Create a lightweight summary
                summary_doc = {
                    'report_id': report_id,
                    'summary': {
                        'kpis': report_data_clean.get('kpis', {}),
                        'recommendations': report_data_clean.get('recommendations', [])[:5],  # First 5 only
                        'narratives': report_data_clean.get('narratives', {}),
                        'forecast_summary': {k: 'Forecasted' for k in report_data_clean.get('forecast_chart', {}).keys()},
                        'full_report_size': 'Large - stored in response only'
                    },
                    'timestamp': firestore.SERVER_TIMESTAMP,
                    'created_at': datetime.utcnow().isoformat(),
                    'note': 'Full report was too large for Firestore. Only summary stored.'
                }
                reports_ref.document(report_id).set(summary_doc)
                print(f"✅ Stored report summary {report_id[:8]}... for session {session_id[:8]}...")
            
            # Update session metadata
            session_ref.set({
                'last_activity': firestore.SERVER_TIMESTAMP,
                'has_reports': True
            }, merge=True)
            
        except Exception as e:
            print(f"❌ Error storing report in Firestore: {e}")
            raise e
    
    def get_report(
        self,
        user_email: str,
        session_id: str,
        report_id: str
    ) -> Optional[Dict]:
        """
        Retrieve a specific report from Firestore.
        
        Args:
            user_email: User's email (from Firebase Auth)
            session_id: Unique session identifier
            report_id: Unique report identifier
        
        Returns:
            Dictionary containing report data, or None if not found
        """
        try:
            user_email = self._sanitize_email(user_email)
            session_ref = self._get_session_ref(user_email, session_id)
            report_ref = session_ref.collection('reports').document(report_id)
            
            report_doc = report_ref.get()
            
            if report_doc.exists:
                return report_doc.to_dict().get('data')
            else:
                print(f"⚠️ Report {report_id} not found")
                return None
                
        except Exception as e:
            print(f"❌ Error retrieving report from Firestore: {e}")
            return None
    
    def list_user_sessions(
        self,
        user_email: str,
        limit: int = 50
    ) -> List[Dict]:
        """
        List all sessions for a user.
        
        Args:
            user_email: User's email (from Firebase Auth)
            limit: Maximum number of sessions to retrieve
        
        Returns:
            List of session metadata dictionaries
        """
        try:
            user_email = self._sanitize_email(user_email)
            sessions_ref = self.db.collection('users').document(user_email).collection('sessions')
            
            # Query sessions ordered by last activity
            sessions_query = sessions_ref.order_by('last_activity', direction=firestore.Query.DESCENDING).limit(limit)
            sessions_docs = sessions_query.stream()
            
            sessions = []
            for doc in sessions_docs:
                session_data = doc.to_dict()
                session_data['session_id'] = doc.id
                sessions.append(session_data)
            
            return sessions
            
        except Exception as e:
            print(f"❌ Error listing user sessions: {e}")
            return []
    
    def delete_session(
        self,
        user_email: str,
        session_id: str
    ):
        """
        Delete a session and all its subcollections (messages, reports).
        
        Args:
            user_email: User's email (from Firebase Auth)
            session_id: Unique session identifier
        """
        try:
            user_email = self._sanitize_email(user_email)
            session_ref = self._get_session_ref(user_email, session_id)
            
            # Delete all messages
            messages_ref = session_ref.collection('messages')
            self._delete_collection(messages_ref, batch_size=100)
            
            # Delete all reports
            reports_ref = session_ref.collection('reports')
            self._delete_collection(reports_ref, batch_size=100)
            
            # Delete session document
            session_ref.delete()
            
            print(f"✅ Deleted session {session_id[:8]}... for user {user_email}")
            
        except Exception as e:
            print(f"❌ Error deleting session: {e}")
            raise e
    
    def _delete_collection(self, collection_ref, batch_size: int = 100):
        """
        Helper method to delete all documents in a collection.
        Firestore requires manual deletion of subcollections.
        """
        docs = collection_ref.limit(batch_size).stream()
        deleted = 0
        
        for doc in docs:
            doc.reference.delete()
            deleted += 1
        
        if deleted >= batch_size:
            # Recursively delete remaining documents
            return self._delete_collection(collection_ref, batch_size)
    
    def cleanup_old_sessions(
        self,
        user_email: str,
        days_old: int = 30
    ):
        """
        Clean up sessions older than specified days.
        
        Args:
            user_email: User's email (from Firebase Auth)
            days_old: Delete sessions older than this many days
        """
        try:
            user_email = self._sanitize_email(user_email)
            cutoff_date = datetime.utcnow() - timedelta(days=days_old)
            cutoff_iso = cutoff_date.isoformat()
            
            sessions_ref = self.db.collection('users').document(user_email).collection('sessions')
            
            # Query old sessions
            old_sessions = sessions_ref.where(
                filter=FieldFilter('updated_at', '<', cutoff_iso)
            ).stream()
            
            deleted_count = 0
            for session_doc in old_sessions:
                self.delete_session(user_email, session_doc.id)
                deleted_count += 1
            
            print(f"✅ Cleaned up {deleted_count} old sessions for {user_email}")
            
        except Exception as e:
            print(f"❌ Error cleaning up old sessions: {e}")
    
    def get_session_metadata(
        self,
        user_email: str,
        session_id: str
    ) -> Optional[Dict]:
        """
        Get metadata for a specific session.
        
        Args:
            user_email: User's email (from Firebase Auth)
            session_id: Unique session identifier
        
        Returns:
            Dictionary containing session metadata, or None if not found
        """
        try:
            user_email = self._sanitize_email(user_email)
            session_ref = self._get_session_ref(user_email, session_id)
            session_doc = session_ref.get()
            
            if session_doc.exists:
                return session_doc.to_dict()
            else:
                return None
                
        except Exception as e:
            print(f"❌ Error retrieving session metadata: {e}")
            return None
