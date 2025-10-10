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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(authorization: str = Header(None)):
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
    special_instructions: Optional[str] = None

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
    special_instructions: Optional[str] = None
    status: str = "placed"  # placed, confirmed, preparing, ready, out-for-delivery, delivered, cancelled
    delivery_slot: str  # e.g., "2025-09-25 Morning (7-11 AM)"
    placed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    rider_id: Optional[str] = None
    rating: Optional[int] = None
    review: Optional[str] = None

class OrderStatusUpdate(BaseModel):
    status: str

class OrderRating(BaseModel):
    rating: int
    review: Optional[str] = None

class RiderAssignment(BaseModel):
    rider_id: str

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
            name=f"{user_data.name}'s Restaurant",
            description="Welcome to our restaurant! Update your description in the menu management section.",
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
    
    order = Order(
        customer_id=current_user['id'],
        customer_name=current_user['name'],
        restaurant_id=order_data.restaurant_id,
        restaurant_name=restaurant['name'],
        items=order_data.items,
        total_amount=total_amount,
        delivery_address=order_data.delivery_address,
        special_instructions=order_data.special_instructions,
        delivery_slot=get_next_delivery_slot()
    )
    
    order_dict = order.model_dump()
    order_dict['placed_at'] = order_dict['placed_at'].isoformat()
    order_dict['updated_at'] = order_dict['updated_at'].isoformat()
    
    await db.orders.insert_one(order_dict)
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

# Health check
@api_router.get("/")
async def root():
    return {"message": "QuickBite API", "status": "running"}

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