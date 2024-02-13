from fastapi import HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
import jwt # You might need to install PyJWT
import bcrypt
import os

def decodeJWT(token: str):
    try:
        # Assuming your secret key is stored in an environment variable
        secret_key = os.getenv('SECRET_KEY')
        # Decode the token
        decoded = jwt.decode(token, secret_key, algorithms=["HS256"])
        return decoded
    except jwt.ExpiredSignatureError:
        # Handle expired token
        return None
    except jwt.InvalidTokenError:
        # Handle invalid token
        return None

def create_supabase_client():
    print("SUPABASE_URL", os.getenv('SUPABASE_URL'))
    print("SUPABASE_API_KEY", os.getenv('SUPABASE_API_KEY'))
    supabase: Client = create_client(supabase_url=os.getenv('SUPABASE_URL'), 
                                    supabase_key=os.getenv('SUPABASE_API_KEY'))
    return supabase

supabase = create_supabase_client()

class JWTBearer(HTTPBearer):
    def __init__(self, auto_error: bool = True):
        super(JWTBearer, self).__init__(auto_error=auto_error)

    async def __call__(self, request: Request):
        credentials: HTTPAuthorizationCredentials = await super(JWTBearer, self).__call__(request)
        if credentials:
            if not credentials.scheme == "Bearer":
                raise HTTPException(status_code=403, detail="Invalid authentication scheme.")
            if not self.verify_jwt(credentials.credentials):
                raise HTTPException(status_code=403, detail="Invalid token or expired token.")
            return credentials.credentials
        else:
            raise HTTPException(status_code=403, detail="Invalid authorization code.")

    def verify_jwt(self, jwtoken: str) -> bool:
        isTokenValid: bool = False

        try:
            payload = decodeJWT(jwtoken)
        except:
            payload = None
        if payload:
            isTokenValid = True
        return isTokenValid