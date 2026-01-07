# /aiml_engine/core/auth_middleware.py
"""
🔐 FIREBASE AUTH MIDDLEWARE

Middleware to extract and validate Firebase Auth tokens from requests.
Integrates with frontend Firebase Authentication.

Author: Praxifi Team
Created: 2026-01-06
"""

from fastapi import Header, HTTPException, status
from typing import Optional
import firebase_admin
from firebase_admin import auth
import os

async def get_current_user_email(
    authorization: Optional[str] = Header(None)
) -> Optional[str]:
    """
    Extract user email from Firebase Auth token.
    Returns None if no token provided (for backward compatibility).
    
    Args:
        authorization: Authorization header with Bearer token
    
    Returns:
        User email from Firebase Auth, or None if not authenticated
    
    Raises:
        HTTPException: If token is invalid or expired
    """
    if not authorization:
        # No auth token provided - allow anonymous access for backward compatibility
        return None
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Use 'Bearer <token>'"
        )
    
    token = authorization.split("Bearer ")[1]
    
    try:
        # Verify the Firebase ID token
        decoded_token = auth.verify_id_token(token)
        user_email = decoded_token.get('email')
        
        if not user_email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User email not found in token"
            )
        
        return user_email
        
    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired"
        )
    except Exception as e:
        print(f"❌ Auth error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )


def get_user_email_or_default(user_email: Optional[str]) -> str:
    """
    Get user email or return default for anonymous sessions.
    
    Args:
        user_email: User email from auth token, or None
    
    Returns:
        User email or 'anonymous' for backward compatibility
    """
    return user_email if user_email else "anonymous"
