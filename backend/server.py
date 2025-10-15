from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, time, timedelta
from passlib.context import CryptContext
import jwt
from jwt.exceptions import InvalidTokenError
import googlemaps
import math

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Google Maps client
GOOGLE_MAPS_API_KEY = os.environ.get('GOOGLE_MAPS_API_KEY', '')
# Only initialize gmaps client if a valid API key is provided (not the placeholder)
gmaps = None
if GOOGLE_MAPS_API_KEY and GOOGLE_MAPS_API_KEY != 'YOUR_GOOGLE_MAPS_API_KEY_HERE':
    try:
        gmaps = googlemaps.Client(key=GOOGLE_MAPS_API_KEY)
    except Exception as e:
        logger.warning(f"Failed to initialize Google Maps client: {e}")

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = timedelta(days=30)) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(authorization: str = Header(None, alias="Authorization")):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(' ')[1]
    payload = decode_token(token)
    user = await db.users.find_one({"id": payload.get("user_id")}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Pydantic Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "customer"  # customer, vendor, rider, admin
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: str
    phone: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    push_token: Optional[str] = None
    push_platform: Optional[str] = None
    wallet_balance: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Restaurant(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    vendor_id: str
    name: str
    description: str
    cuisine: str
    image_url: Optional[str] = None
    rating: float = 0.0
    delivery_time: str = "7:00 AM - 11:00 AM"
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RestaurantCreate(BaseModel):
    name: str
    description: str
    cuisine: str
    image_url: Optional[str] = None

class MenuItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    restaurant_id: str
    name: str
    description: str
    price: float
    category: str
    image_url: Optional[str] = None
    is_available: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MenuItemCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    image_url: Optional[str] = None

class OrderItem(BaseModel):
    menu_item_id: str
    name: str
    quantity: int
    price: float

class OrderCreate(BaseModel):
    restaurant_id: str
    items: List[OrderItem]
    delivery_address: str
    delivery_latitude: Optional[float] = None
    delivery_longitude: Optional[float] = None
    special_instructions: Optional[str] = None
    cart_id: Optional[str] = None  # Links orders from same cart checkout

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    customer_name: str
    restaurant_id: str
    restaurant_name: str
    items: List[OrderItem]
    total_amount: float
    delivery_address: str
    delivery_latitude: Optional[float] = None
    delivery_longitude: Optional[float] = None
    special_instructions: Optional[str] = None
    status: str = "placed"  # placed, confirmed, preparing, ready, out-for-delivery, delivered, cancelled
    delivery_slot: str  # e.g., "2025-09-25 Morning (7-11 AM)"
    placed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    rider_id: Optional[str] = None
    delivery_sequence: Optional[int] = None
    rating: Optional[int] = None
    review: Optional[str] = None
    cart_id: Optional[str] = None  # Links multiple orders from same cart checkout
    delivery_fee: float = 0.0  # Delivery fee for the order

class OrderStatusUpdate(BaseModel):
    status: str

class OrderRating(BaseModel):
    rating: int
    review: Optional[str] = None

class RiderAssignment(BaseModel):
    rider_id: str

class LocationUpdate(BaseModel):
    address: str
    latitude: float
    longitude: float

class PushTokenUpdate(BaseModel):
    push_token: str
    platform: str  # 'ios' or 'android'

class RouteOptimizationRequest(BaseModel):
    order_ids: List[str]
    num_riders: int
    max_orders_per_rider: Optional[int] = None

class OptimizedRoute(BaseModel):
    rider_index: int
    order_ids: List[str]
    orders: List[dict]
    total_distance_km: float
    estimated_duration_minutes: int

class RouteOptimizationResponse(BaseModel):
    routes: List[OptimizedRoute]
    total_orders: int
    total_riders: int

class BatchRiderAssignment(BaseModel):
    rider_id: str
    order_ids: List[str]

class BatchAssignmentRequest(BaseModel):
    routes: List[BatchRiderAssignment]

# Admin Models
class AddWalletMoneyRequest(BaseModel):
    user_id: str
    amount: float
    description: Optional[str] = "Admin credit"

class MultiVendorOrderCreate(BaseModel):
    orders: List[OrderCreate]  # Multiple orders for different vendors
    delivery_fee: float = 11.0  # Fixed delivery fee per cart
    cart_id: str  # Unique cart ID to link all orders

# Wallet Models
class WalletTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    transaction_type: str  # deposit, debit, refund
    amount: float
    payment_method: Optional[str] = None  # paytm, order_debit
    paytm_order_id: Optional[str] = None
    paytm_txn_id: Optional[str] = None
    order_id: Optional[str] = None  # For order debits
    status: str = "pending"  # pending, completed, failed
    description: str
    balance_before: float
    balance_after: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None

class AddMoneyRequest(BaseModel):
    amount: float

class PaytmCallbackData(BaseModel):
    orderId: str
    txnToken: str
    txnAmount: str
    txnId: Optional[str] = None
    bankTxnId: Optional[str] = None
    txnDate: Optional[str] = None
    gatewayName: Optional[str] = None
    bankName: Optional[str] = None
    paymentMode: Optional[str] = None
    refundAmt: Optional[str] = None
    status: str  # TXN_SUCCESS, TXN_FAILURE, PENDING

# Helper function to check if orders are allowed (before midnight)
def is_ordering_allowed() -> bool:
    now = datetime.now(timezone.utc)
    # For demo purposes, always allow ordering
    # In production, you'd check if current time is before midnight
    return True

def get_next_delivery_slot() -> str:
    now = datetime.now(timezone.utc)
    tomorrow = now + timedelta(days=1)
    return f"{tomorrow.strftime('%Y-%m-%d')} Morning (7-11 AM)"

# Auth Routes
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        phone=user_data.phone
    )
    
    user_dict = user.model_dump()
    user_dict['password'] = hash_password(user_data.password)
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    # Auto-create restaurant for vendors
    if user_data.role == "vendor":
        restaurant = Restaurant(
            vendor_id=user.id,
            name=user_data.name,
            description="Welcome! Update your description in the menu management section.",
            cuisine="Various",
            image_url=None,
            rating=0.0,
            delivery_time="7:00 AM - 11:00 AM",
            is_active=True
        )
        
        restaurant_dict = restaurant.model_dump()
        restaurant_dict['created_at'] = restaurant_dict['created_at'].isoformat()
        await db.restaurants.insert_one(restaurant_dict)
    
    token = create_access_token({"user_id": user.id, "role": user.role})
    return {"token": token, "user": user}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"user_id": user['id'], "role": user['role']})
    
    # Remove password from response
    user.pop('password', None)
    return {"token": token, "user": user}

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

@api_router.patch("/auth/update-location")
async def update_location(location_data: LocationUpdate, current_user: dict = Depends(get_current_user)):
    """Update user's location"""
    await db.users.update_one(
        {"id": current_user['id']},
        {"$set": {
            "address": location_data.address,
            "latitude": location_data.latitude,
            "longitude": location_data.longitude
        }}
    )
    return {"message": "Location updated successfully"}

@api_router.post("/auth/register-push-token")
async def register_push_token(token_data: PushTokenUpdate, current_user: dict = Depends(get_current_user)):
    """Register push notification token for the user"""
    await db.users.update_one(
        {"id": current_user['id']},
        {"$set": {
            "push_token": token_data.push_token,
            "push_platform": token_data.platform
        }}
    )
    return {"message": "Push token registered successfully"}

# Wallet Routes
@api_router.get("/wallet/balance")
async def get_wallet_balance(current_user: dict = Depends(get_current_user)):
    """Get current wallet balance for the user"""
    user = await db.users.find_one({"id": current_user['id']}, {"_id": 0, "wallet_balance": 1})
    return {
        "balance": user.get('wallet_balance', 0.0),
        "currency": "INR"
    }

@api_router.get("/wallet/transactions")
async def get_wallet_transactions(current_user: dict = Depends(get_current_user)):
    """Get transaction history for the user"""
    transactions = await db.wallet_transactions.find(
        {"user_id": current_user['id']}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Convert datetime objects to ISO strings
    for txn in transactions:
        if isinstance(txn.get('created_at'), datetime):
            txn['created_at'] = txn['created_at'].isoformat()
        if isinstance(txn.get('completed_at'), datetime):
            txn['completed_at'] = txn['completed_at'].isoformat()
    
    return transactions

@api_router.post("/wallet/add-money")
async def add_money_to_wallet(request: AddMoneyRequest, current_user: dict = Depends(get_current_user)):
    """
    Initiate wallet top-up via Paytm
    For now, this is a mock implementation that directly credits the wallet
    Real Paytm integration requires merchant credentials
    """
    if request.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")
    
    if request.amount > 50000:
        raise HTTPException(status_code=400, detail="Maximum top-up amount is ₹50,000")
    
    # Get current wallet balance
    user = await db.users.find_one({"id": current_user['id']}, {"_id": 0})
    current_balance = user.get('wallet_balance', 0.0)
    
    # Create order ID for Paytm
    order_id = f"ORDER_{current_user['id'][:8]}_{int(datetime.now(timezone.utc).timestamp())}"
    
    # Create pending transaction
    transaction = WalletTransaction(
        user_id=current_user['id'],
        transaction_type="deposit",
        amount=request.amount,
        payment_method="paytm",
        paytm_order_id=order_id,
        status="pending",
        description=f"Wallet top-up of ₹{request.amount}",
        balance_before=current_balance,
        balance_after=current_balance + request.amount
    )
    
    txn_dict = transaction.model_dump()
    txn_dict['created_at'] = txn_dict['created_at'].isoformat()
    if txn_dict.get('completed_at'):
        txn_dict['completed_at'] = txn_dict['completed_at'].isoformat()
    
    await db.wallet_transactions.insert_one(txn_dict)
    
    # MOCK: For demonstration, auto-complete the transaction
    # In production, this would return Paytm payment token and customer would be redirected to Paytm
    # Payment completion would happen in the callback endpoint
    
    # Update wallet balance
    await db.users.update_one(
        {"id": current_user['id']},
        {"$set": {"wallet_balance": current_balance + request.amount}}
    )
    
    # Mark transaction as completed
    await db.wallet_transactions.update_one(
        {"id": transaction.id},
        {"$set": {
            "status": "completed",
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "paytm_txn_id": f"PAYTM_MOCK_{transaction.id[:8]}"
        }}
    )
    
    return {
        "message": "Money added successfully (MOCK MODE)",
        "order_id": order_id,
        "transaction_id": transaction.id,
        "amount": request.amount,
        "new_balance": current_balance + request.amount,
        "note": "This is a mock implementation. Real Paytm integration requires merchant credentials."
    }

@api_router.post("/wallet/payment-callback")
async def paytm_payment_callback(callback_data: PaytmCallbackData):
    """
    Handle Paytm payment callback
    This endpoint would be called by Paytm after payment completion
    """
    # Find the pending transaction
    transaction = await db.wallet_transactions.find_one(
        {"paytm_order_id": callback_data.orderId, "status": "pending"},
        {"_id": 0}
    )
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found or already processed")
    
    # In real implementation, verify checksum here
    # if not verify_paytm_checksum(callback_data):
    #     raise HTTPException(status_code=400, detail="Invalid checksum")
    
    if callback_data.status == "TXN_SUCCESS":
        # Get user's current balance
        user = await db.users.find_one({"id": transaction['user_id']}, {"_id": 0})
        current_balance = user.get('wallet_balance', 0.0)
        new_balance = current_balance + transaction['amount']
        
        # Update wallet balance
        await db.users.update_one(
            {"id": transaction['user_id']},
            {"$set": {"wallet_balance": new_balance}}
        )
        
        # Update transaction status
        await db.wallet_transactions.update_one(
            {"id": transaction['id']},
            {"$set": {
                "status": "completed",
                "paytm_txn_id": callback_data.txnId,
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "balance_after": new_balance
            }}
        )
        
        return {"message": "Payment successful", "new_balance": new_balance}
    else:
        # Mark transaction as failed
        await db.wallet_transactions.update_one(
            {"id": transaction['id']},
            {"$set": {
                "status": "failed",
                "completed_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {"message": "Payment failed", "status": callback_data.status}

# Restaurant Routes
@api_router.get("/restaurants", response_model=List[Restaurant])
async def get_restaurants():
    restaurants = await db.restaurants.find({"is_active": True}, {"_id": 0}).to_list(100)
    for restaurant in restaurants:
        if isinstance(restaurant.get('created_at'), str):
            restaurant['created_at'] = datetime.fromisoformat(restaurant['created_at'])
    return restaurants

@api_router.get("/restaurants/{restaurant_id}", response_model=Restaurant)
async def get_restaurant(restaurant_id: str):
    restaurant = await db.restaurants.find_one({"id": restaurant_id}, {"_id": 0})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    if isinstance(restaurant.get('created_at'), str):
        restaurant['created_at'] = datetime.fromisoformat(restaurant['created_at'])
    return restaurant

@api_router.post("/restaurants", response_model=Restaurant)
async def create_restaurant(restaurant_data: RestaurantCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['vendor', 'admin']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    restaurant = Restaurant(
        vendor_id=current_user['id'],
        name=restaurant_data.name,
        description=restaurant_data.description,
        cuisine=restaurant_data.cuisine,
        image_url=restaurant_data.image_url
    )
    
    restaurant_dict = restaurant.model_dump()
    restaurant_dict['created_at'] = restaurant_dict['created_at'].isoformat()
    
    await db.restaurants.insert_one(restaurant_dict)
    return restaurant

# Menu Routes
@api_router.get("/restaurants/{restaurant_id}/menu", response_model=List[MenuItem])
async def get_menu(restaurant_id: str):
    menu_items = await db.menu_items.find({"restaurant_id": restaurant_id, "is_available": True}, {"_id": 0}).to_list(100)
    for item in menu_items:
        if isinstance(item.get('created_at'), str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
    return menu_items

@api_router.post("/restaurants/{restaurant_id}/menu", response_model=MenuItem)
async def add_menu_item(restaurant_id: str, item_data: MenuItemCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['vendor', 'admin']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Verify restaurant ownership
    restaurant = await db.restaurants.find_one({"id": restaurant_id})
    if not restaurant or (restaurant['vendor_id'] != current_user['id'] and current_user['role'] != 'admin'):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    menu_item = MenuItem(
        restaurant_id=restaurant_id,
        name=item_data.name,
        description=item_data.description,
        price=item_data.price,
        category=item_data.category,
        image_url=item_data.image_url
    )
    
    item_dict = menu_item.model_dump()
    item_dict['created_at'] = item_dict['created_at'].isoformat()
    
    await db.menu_items.insert_one(item_dict)
    return menu_item

@api_router.delete("/menu-items/{item_id}")
async def delete_menu_item(item_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['vendor', 'admin']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get menu item
    menu_item = await db.menu_items.find_one({"id": item_id})
    if not menu_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    # Verify restaurant ownership
    restaurant = await db.restaurants.find_one({"id": menu_item['restaurant_id']})
    if not restaurant or (restaurant['vendor_id'] != current_user['id'] and current_user['role'] != 'admin'):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.menu_items.delete_one({"id": item_id})
    return {"message": "Menu item deleted successfully"}

@api_router.patch("/menu-items/{item_id}/availability")
async def toggle_menu_item_availability(item_id: str, current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['vendor', 'admin']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get menu item
    menu_item = await db.menu_items.find_one({"id": item_id})
    if not menu_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    # Verify restaurant ownership
    restaurant = await db.restaurants.find_one({"id": menu_item['restaurant_id']})
    if not restaurant or (restaurant['vendor_id'] != current_user['id'] and current_user['role'] != 'admin'):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Toggle availability
    new_availability = not menu_item.get('is_available', True)
    await db.menu_items.update_one(
        {"id": item_id}, 
        {"$set": {"is_available": new_availability}}
    )
    
    return {"message": "Availability updated", "is_available": new_availability}

@api_router.get("/vendor/restaurant", response_model=Restaurant)
async def get_vendor_restaurant(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'vendor':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    restaurant = await db.restaurants.find_one({"vendor_id": current_user['id']}, {"_id": 0})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    if isinstance(restaurant.get('created_at'), str):
        restaurant['created_at'] = datetime.fromisoformat(restaurant['created_at'])
    
    return restaurant

@api_router.get("/vendor/menu", response_model=List[MenuItem])
async def get_vendor_menu(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'vendor':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get vendor's restaurant
    restaurant = await db.restaurants.find_one({"vendor_id": current_user['id']})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    # Get all menu items (including unavailable ones for vendor view)
    menu_items = await db.menu_items.find({"restaurant_id": restaurant['id']}, {"_id": 0}).to_list(1000)
    for item in menu_items:
        if isinstance(item.get('created_at'), str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
    
    return menu_items

# Order Routes
@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate, current_user: dict = Depends(get_current_user)):
    if not is_ordering_allowed():
        raise HTTPException(status_code=400, detail="Orders closed for today. Please order tomorrow for next-morning delivery.")
    
    # Get restaurant details
    restaurant = await db.restaurants.find_one({"id": order_data.restaurant_id})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    # Calculate total
    total_amount = sum(item.price * item.quantity for item in order_data.items)
    
    # Check wallet balance
    user = await db.users.find_one({"id": current_user['id']}, {"_id": 0})
    wallet_balance = user.get('wallet_balance', 0.0)
    
    if wallet_balance < total_amount:
        raise HTTPException(
            status_code=400, 
            detail=f"Insufficient wallet balance. Required: ₹{total_amount}, Available: ₹{wallet_balance}"
        )
    
    order = Order(
        customer_id=current_user['id'],
        customer_name=current_user['name'],
        restaurant_id=order_data.restaurant_id,
        restaurant_name=restaurant['name'],
        items=order_data.items,
        total_amount=total_amount,
        delivery_address=order_data.delivery_address,
        delivery_latitude=order_data.delivery_latitude,
        delivery_longitude=order_data.delivery_longitude,
        special_instructions=order_data.special_instructions,
        delivery_slot=get_next_delivery_slot()
    )
    
    order_dict = order.model_dump()
    order_dict['placed_at'] = order_dict['placed_at'].isoformat()
    order_dict['updated_at'] = order_dict['updated_at'].isoformat()
    
    await db.orders.insert_one(order_dict)
    
    # Deduct amount from wallet
    new_balance = wallet_balance - total_amount
    await db.users.update_one(
        {"id": current_user['id']},
        {"$set": {"wallet_balance": new_balance}}
    )
    
    # Create debit transaction
    debit_transaction = WalletTransaction(
        user_id=current_user['id'],
        transaction_type="debit",
        amount=total_amount,
        payment_method="order_debit",
        order_id=order.id,
        status="completed",
        description=f"Order payment for {restaurant['name']}",
        balance_before=wallet_balance,
        balance_after=new_balance,
        completed_at=datetime.now(timezone.utc)
    )
    
    debit_dict = debit_transaction.model_dump()
    debit_dict['created_at'] = debit_dict['created_at'].isoformat()
    debit_dict['completed_at'] = debit_dict['completed_at'].isoformat()
    
    await db.wallet_transactions.insert_one(debit_dict)
    
    return order

@api_router.get("/orders", response_model=List[Order])
async def get_orders(current_user: dict = Depends(get_current_user)):
    if current_user['role'] == 'customer':
        query = {"customer_id": current_user['id']}
    elif current_user['role'] == 'vendor':
        # Get vendor's restaurant(s)
        restaurants = await db.restaurants.find({"vendor_id": current_user['id']}).to_list(100)
        restaurant_ids = [r['id'] for r in restaurants]
        query = {"restaurant_id": {"$in": restaurant_ids}}
    elif current_user['role'] == 'rider':
        query = {"rider_id": current_user['id']}
    else:  # admin
        query = {}
    
    orders = await db.orders.find(query, {"_id": 0}).sort("placed_at", -1).to_list(1000)
    for order in orders:
        if isinstance(order.get('placed_at'), str):
            order['placed_at'] = datetime.fromisoformat(order['placed_at'])
        if isinstance(order.get('updated_at'), str):
            order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    return orders

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check authorization
    if current_user['role'] == 'customer' and order['customer_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if isinstance(order.get('placed_at'), str):
        order['placed_at'] = datetime.fromisoformat(order['placed_at'])
    if isinstance(order.get('updated_at'), str):
        order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    
    return order

@api_router.patch("/orders/{order_id}/status")
async def update_order_status(order_id: str, status_update: OrderStatusUpdate, current_user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check authorization based on role
    if current_user['role'] == 'customer':
        raise HTTPException(status_code=403, detail="Customers cannot update order status")
    
    update_data = {
        "status": status_update.status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # If rider is picking up order (status = out-for-delivery), assign rider_id
    if status_update.status == "out-for-delivery" and current_user['role'] == 'rider':
        update_data["rider_id"] = current_user['id']
    
    await db.orders.update_one({"id": order_id}, {"$set": update_data})
    return {"message": "Order status updated", "status": status_update.status}

@api_router.post("/orders/{order_id}/rating")
async def rate_order(order_id: str, rating_data: OrderRating, current_user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order['customer_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if order['status'] != 'delivered':
        raise HTTPException(status_code=400, detail="Can only rate delivered orders")
    
    update_data = {
        "rating": rating_data.rating,
        "review": rating_data.review,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.update_one({"id": order_id}, {"$set": update_data})
    return {"message": "Rating submitted successfully"}

# Rider Routes
@api_router.get("/riders/available")
async def get_available_riders(current_user: dict = Depends(get_current_user)):
    """Get list of available riders (not currently on delivery)"""
    if current_user['role'] not in ['vendor', 'admin']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get all riders
    all_riders = await db.users.find({"role": "rider"}, {"_id": 0, "password": 0}).to_list(100)
    
    # Get riders currently on delivery (status = out-for-delivery)
    busy_orders = await db.orders.find({"status": "out-for-delivery"}, {"_id": 0, "rider_id": 1}).to_list(1000)
    busy_rider_ids = [order['rider_id'] for order in busy_orders if order.get('rider_id')]
    
    # Filter out busy riders
    available_riders = [rider for rider in all_riders if rider['id'] not in busy_rider_ids]
    
    return available_riders

@api_router.patch("/orders/{order_id}/assign-rider")
async def assign_rider_to_order(order_id: str, assignment: RiderAssignment, current_user: dict = Depends(get_current_user)):
    """Assign a rider to a ready order and change status to out-for-delivery"""
    # Get the order
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check if user is vendor and order belongs to their restaurant
    if current_user['role'] == 'vendor':
        restaurants = await db.restaurants.find({"vendor_id": current_user['id']}).to_list(100)
        restaurant_ids = [r['id'] for r in restaurants]
        if order['restaurant_id'] not in restaurant_ids:
            raise HTTPException(status_code=403, detail="Not authorized to assign riders to this order")
    elif current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Only vendors and admins can assign riders")
    
    # Verify the rider exists
    rider = await db.users.find_one({"id": assignment.rider_id, "role": "rider"})
    if not rider:
        raise HTTPException(status_code=404, detail="Rider not found")
    
    # Update order with rider assignment and change status to out-for-delivery
    update_data = {
        "rider_id": assignment.rider_id,
        "status": "out-for-delivery",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.update_one({"id": order_id}, {"$set": update_data})
    
    return {
        "message": "Rider assigned successfully",
        "rider_id": assignment.rider_id,
        "status": "out-for-delivery"
    }

# Route Optimization
@api_router.post("/vendor/optimize-routes", response_model=RouteOptimizationResponse)
async def optimize_delivery_routes(
    request: RouteOptimizationRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Optimize delivery routes for multiple orders using Google Maps Distance Matrix API.
    This creates balanced routes for each rider based on distances.
    """
    if current_user['role'] != 'vendor':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Note: This function works with or without Google Maps API key
    # It uses haversine distance calculation for route optimization
    
    # Fetch orders
    orders = await db.orders.find(
        {"id": {"$in": request.order_ids}, "status": "ready"},
        {"_id": 0}
    ).to_list(1000)
    
    if len(orders) == 0:
        raise HTTPException(status_code=404, detail="No ready orders found")
    
    # Filter orders with valid coordinates
    valid_orders = [
        o for o in orders 
        if o.get('delivery_latitude') and o.get('delivery_longitude')
    ]
    
    if len(valid_orders) == 0:
        raise HTTPException(status_code=400, detail="No orders with valid delivery locations")
    
    # Simplified routing algorithm using distance-based clustering
    # For production, you would use Google Cloud Fleet Routing API
    
    # Calculate distance matrix between all orders
    locations = [
        (order['delivery_latitude'], order['delivery_longitude']) 
        for order in valid_orders
    ]
    
    # Use simple clustering: assign orders to riders in a round-robin with nearest neighbor
    num_riders = request.num_riders
    max_orders = request.max_orders_per_rider or (len(valid_orders) // num_riders + 1)
    
    # Simple greedy nearest-neighbor assignment
    routes = [[] for _ in range(num_riders)]
    assigned = [False] * len(valid_orders)
    
    # Start with first order for each rider
    for rider_idx in range(min(num_riders, len(valid_orders))):
        routes[rider_idx].append(valid_orders[rider_idx])
        assigned[rider_idx] = True
    
    # Assign remaining orders to nearest existing route
    for order_idx in range(len(valid_orders)):
        if assigned[order_idx]:
            continue
            
        order = valid_orders[order_idx]
        order_loc = (order['delivery_latitude'], order['delivery_longitude'])
        
        # Find best rider (least orders or nearest)
        best_rider = 0
        min_dist = float('inf')
        
        for rider_idx in range(num_riders):
            if len(routes[rider_idx]) >= max_orders:
                continue
                
            if len(routes[rider_idx]) == 0:
                best_rider = rider_idx
                break
                
            # Calculate distance to last order in this route
            last_order = routes[rider_idx][-1]
            last_loc = (last_order['delivery_latitude'], last_order['delivery_longitude'])
            dist = haversine_distance(order_loc, last_loc)
            
            if dist < min_dist:
                min_dist = dist
                best_rider = rider_idx
        
        routes[best_rider].append(order)
        assigned[order_idx] = True
    
    # Calculate route statistics
    optimized_routes = []
    for rider_idx, route_orders in enumerate(routes):
        if not route_orders:
            continue
            
        # Calculate total distance for this route
        total_distance = 0
        for i in range(len(route_orders) - 1):
            loc1 = (route_orders[i]['delivery_latitude'], route_orders[i]['delivery_longitude'])
            loc2 = (route_orders[i+1]['delivery_latitude'], route_orders[i+1]['delivery_longitude'])
            total_distance += haversine_distance(loc1, loc2)
        
        # Estimate duration (assuming 30 km/h average speed + 5 min per stop)
        estimated_minutes = int((total_distance / 30) * 60 + len(route_orders) * 5)
        
        optimized_routes.append(OptimizedRoute(
            rider_index=rider_idx + 1,
            order_ids=[o['id'] for o in route_orders],
            orders=route_orders,
            total_distance_km=round(total_distance, 2),
            estimated_duration_minutes=estimated_minutes
        ))
    
    return RouteOptimizationResponse(
        routes=optimized_routes,
        total_orders=len(valid_orders),
        total_riders=len(optimized_routes)
    )

def haversine_distance(loc1: tuple, loc2: tuple) -> float:
    """Calculate distance between two lat/lng points in kilometers"""
    lat1, lon1 = loc1
    lat2, lon2 = loc2
    
    R = 6371  # Earth radius in kilometers
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

# Batch assign riders to optimized routes
@api_router.post("/vendor/batch-assign-riders")
async def batch_assign_riders(
    request: BatchAssignmentRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Assign riders to orders based on optimized routes.
    Each route should have: rider_id and order_ids
    """
    if current_user['role'] != 'vendor':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    assigned_count = 0
    errors = []
    
    for route in request.routes:
        rider_id = route.rider_id
        order_ids = route.order_ids
        
        if not rider_id or not order_ids:
            continue
        
        # Verify rider exists
        rider = await db.users.find_one({"id": rider_id, "role": "rider"})
        if not rider:
            errors.append(f"Rider {rider_id} not found")
            continue
        
        # Update all orders in this route with sequence
        for sequence_idx, order_id in enumerate(order_ids, start=1):
            try:
                await db.orders.update_one(
                    {"id": order_id},
                    {"$set": {
                        "rider_id": rider_id,
                        "status": "out-for-delivery",
                        "delivery_sequence": sequence_idx,
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                assigned_count += 1
            except Exception as e:
                errors.append(f"Failed to assign order {order_id}: {str(e)}")
    
    return {
        "message": f"Successfully assigned {assigned_count} orders",
        "assigned_count": assigned_count,
        "errors": errors if errors else None
    }

# Admin Routes
@api_router.get("/admin/customers")
async def get_all_customers(current_user: dict = Depends(get_current_user)):
    """Get all customers (admin only)"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    customers = await db.users.find({"role": "customer"}, {"_id": 0, "password": 0}).to_list(None)
    return customers

@api_router.get("/admin/vendors")
async def get_all_vendors(current_user: dict = Depends(get_current_user)):
    """Get all vendors with their restaurants (admin only)"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    vendors = await db.users.find({"role": "vendor"}, {"_id": 0, "password": 0}).to_list(None)
    
    # Get restaurants for each vendor
    for vendor in vendors:
        restaurant = await db.restaurants.find_one({"vendor_id": vendor['id']}, {"_id": 0})
        vendor['restaurant'] = restaurant
    
    return vendors

@api_router.get("/admin/riders")
async def get_all_riders(current_user: dict = Depends(get_current_user)):
    """Get all riders (admin only)"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    riders = await db.users.find({"role": "rider"}, {"_id": 0, "password": 0}).to_list(None)
    
    # Get delivery stats for each rider
    for rider in riders:
        total_deliveries = await db.orders.count_documents({"rider_id": rider['id'], "status": "delivered"})
        active_deliveries = await db.orders.count_documents({"rider_id": rider['id'], "status": "out-for-delivery"})
        rider['stats'] = {
            "total_deliveries": total_deliveries,
            "active_deliveries": active_deliveries
        }
    
    return riders

@api_router.get("/admin/stats")
async def get_admin_stats(current_user: dict = Depends(get_current_user)):
    """Get comprehensive system statistics (admin only)"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Count users by role
    total_customers = await db.users.count_documents({"role": "customer"})
    total_vendors = await db.users.count_documents({"role": "vendor"})
    total_riders = await db.users.count_documents({"role": "rider"})
    
    # Order statistics
    total_orders = await db.orders.count_documents({})
    delivered_orders = await db.orders.count_documents({"status": "delivered"})
    active_orders = await db.orders.count_documents({"status": {"$in": ["placed", "confirmed", "preparing", "ready", "out-for-delivery"]}})
    
    # Revenue calculation
    pipeline = [
        {"$match": {"status": "delivered"}},
        {"$group": {"_id": None, "total_revenue": {"$sum": "$total_amount"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(None)
    total_revenue = revenue_result[0]['total_revenue'] if revenue_result else 0
    
    # Restaurant count
    total_restaurants = await db.restaurants.count_documents({})
    active_restaurants = await db.restaurants.count_documents({"is_active": True})
    
    return {
        "users": {
            "total_customers": total_customers,
            "total_vendors": total_vendors,
            "total_riders": total_riders,
            "total_users": total_customers + total_vendors + total_riders
        },
        "orders": {
            "total_orders": total_orders,
            "delivered_orders": delivered_orders,
            "active_orders": active_orders,
            "cancelled_orders": await db.orders.count_documents({"status": "cancelled"})
        },
        "revenue": {
            "total_revenue": total_revenue,
            "average_order_value": total_revenue / delivered_orders if delivered_orders > 0 else 0
        },
        "restaurants": {
            "total_restaurants": total_restaurants,
            "active_restaurants": active_restaurants
        }
    }

@api_router.post("/admin/add-wallet-money")
async def admin_add_wallet_money(request: AddWalletMoneyRequest, current_user: dict = Depends(get_current_user)):
    """Add money to customer wallet (admin only)"""
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if request.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    
    # Get user
    user = await db.users.find_one({"id": request.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user['role'] != 'customer':
        raise HTTPException(status_code=400, detail="Can only add money to customer wallets")
    
    # Update wallet balance
    current_balance = user.get('wallet_balance', 0.0)
    new_balance = current_balance + request.amount
    
    await db.users.update_one(
        {"id": request.user_id},
        {"$set": {"wallet_balance": new_balance}}
    )
    
    # Create transaction record
    transaction = WalletTransaction(
        user_id=request.user_id,
        transaction_type="deposit",
        amount=request.amount,
        payment_method="admin_credit",
        status="completed",
        description=request.description or f"Admin credit by {current_user['name']}",
        balance_after=new_balance,
        created_at=datetime.now(timezone.utc)
    )
    
    await db.wallet_transactions.insert_one(transaction.model_dump())
    
    return {
        "message": "Wallet credited successfully",
        "user_id": request.user_id,
        "amount_added": request.amount,
        "new_balance": new_balance
    }

# Health check
@api_router.get("/")
async def root():
    return {"message": "Tomorrow's Table API", "status": "running"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()