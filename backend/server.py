import os
import uuid
from datetime import datetime, timedelta
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from pymongo import MongoClient
from passlib.context import CryptContext
import jwt
import requests

# Initialize FastAPI app
app = FastAPI(title="USDT BANC API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = MongoClient(MONGO_URL)
db = client.usdt_banc

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")

# Models
class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str
    wallet_withdrawal_password: str
    agree_terms: bool

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class PasswordReset(BaseModel):
    email: EmailStr

class WalletWithdraw(BaseModel):
    amount: float
    destination_address: str
    withdrawal_password: str

class CryptoPurchase(BaseModel):
    amount: float
    crypto_type: str
    payment_method: str
    card_details: dict

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=["HS256"])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = db.users.find_one({"email": email})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def generate_wallet():
    """Generate a new wallet address and private key"""
    # For demo purposes, generating a UUID-based wallet
    # In production, use proper crypto wallet generation
    wallet_address = f"0x{uuid.uuid4().hex[:40]}"
    private_key = f"{uuid.uuid4().hex}{uuid.uuid4().hex}"
    return {
        "address": wallet_address,
        "private_key": private_key,
        "balance": 0.0
    }

# API Endpoints

@app.post("/api/auth/signup")
async def signup(user_data: UserSignup):
    try:
        # Check if user already exists
        if db.users.find_one({"email": user_data.email}):
            raise HTTPException(status_code=400, detail="Email already registered")
        
        if not user_data.agree_terms:
            raise HTTPException(status_code=400, detail="Must agree to terms and conditions")
        
        # Generate wallet for user
        wallet_data = generate_wallet()
        
        # Create user document
        user_doc = {
            "user_id": str(uuid.uuid4()),
            "name": user_data.name,
            "email": user_data.email,
            "password_hash": hash_password(user_data.password),
            "wallet_withdrawal_password_hash": hash_password(user_data.wallet_withdrawal_password),
            "wallet": wallet_data,
            "created_at": datetime.utcnow(),
            "email_verified": False
        }
        
        db.users.insert_one(user_doc)
        
        return {
            "message": "Welcome to USDT BANC – Your Trusted Gateway to Stable Crypto Finance.",
            "user_id": user_doc["user_id"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/login")
async def login(user_data: UserLogin):
    try:
        user = db.users.find_one({"email": user_data.email})
        if not user or not verify_password(user_data.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        access_token = create_access_token(data={"sub": user["email"]})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "user_id": user["user_id"],
                "name": user["name"],
                "email": user["email"]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/forgot-password")
async def forgot_password(reset_data: PasswordReset):
    try:
        user = db.users.find_one({"email": reset_data.email})
        if not user:
            # Don't reveal if email exists or not for security
            return {"message": "If email exists, password reset instructions have been sent"}
        
        # In production, send actual email with reset link
        # For now, return success message
        return {"message": "Password reset instructions sent to your email"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/wallet")
async def get_wallet(current_user: dict = Depends(get_current_user)):
    try:
        return {
            "wallet": current_user["wallet"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/wallet/withdraw")
async def withdraw_crypto(withdraw_data: WalletWithdraw, current_user: dict = Depends(get_current_user)):
    try:
        # Verify withdrawal password
        if not verify_password(withdraw_data.withdrawal_password, current_user["wallet_withdrawal_password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid withdrawal password")
        
        # Check if user has sufficient balance
        if current_user["wallet"]["balance"] < withdraw_data.amount:
            raise HTTPException(status_code=400, detail="Insufficient balance")
        
        # Process withdrawal (mock implementation)
        new_balance = current_user["wallet"]["balance"] - withdraw_data.amount
        
        # Update user wallet balance
        db.users.update_one(
            {"email": current_user["email"]},
            {"$set": {"wallet.balance": new_balance}}
        )
        
        # Record transaction
        transaction = {
            "transaction_id": str(uuid.uuid4()),
            "user_id": current_user["user_id"],
            "type": "withdrawal",
            "amount": withdraw_data.amount,
            "destination_address": withdraw_data.destination_address,
            "timestamp": datetime.utcnow(),
            "status": "completed"
        }
        db.transactions.insert_one(transaction)
        
        return {
            "message": "Withdrawal successful",
            "transaction_id": transaction["transaction_id"],
            "new_balance": new_balance
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/crypto/buy")
async def buy_crypto(purchase_data: CryptoPurchase, current_user: dict = Depends(get_current_user)):
    try:
        # Mock payment processing
        # In production, integrate with actual payment processor
        
        # Record transaction
        transaction = {
            "transaction_id": str(uuid.uuid4()),
            "user_id": current_user["user_id"],
            "type": "purchase",
            "amount": purchase_data.amount,
            "crypto_type": purchase_data.crypto_type,
            "payment_method": purchase_data.payment_method,
            "timestamp": datetime.utcnow(),
            "status": "completed"
        }
        db.transactions.insert_one(transaction)
        
        # Add crypto to user wallet
        new_balance = current_user["wallet"]["balance"] + purchase_data.amount
        db.users.update_one(
            {"email": current_user["email"]},
            {"$set": {"wallet.balance": new_balance}}
        )
        
        return {
            "message": "Crypto purchase successful",
            "transaction_id": transaction["transaction_id"],
            "amount": purchase_data.amount,
            "crypto_type": purchase_data.crypto_type
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/crypto/top10")
async def get_top_cryptocurrencies():
    try:
        # Fetch from CoinGecko API
        response = requests.get(
            "https://api.coingecko.com/api/v3/coins/markets",
            params={
                "vs_currency": "usd",
                "order": "market_cap_desc",
                "per_page": 10,
                "page": 1,
                "sparkline": False
            }
        )
        
        if response.status_code == 200:
            return {"cryptocurrencies": response.json()}
        else:
            raise HTTPException(status_code=500, detail="Failed to fetch cryptocurrency data")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/user/profile")
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    try:
        return {
            "user": {
                "user_id": current_user["user_id"],
                "name": current_user["name"],
                "email": current_user["email"],
                "created_at": current_user["created_at"]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "USDT BANC API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)