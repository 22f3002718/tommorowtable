import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
import uuid
from datetime import datetime, timezone
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed_database():
    print("Seeding database...")
    
    # Clear existing data
    await db.users.delete_many({})
    await db.restaurants.delete_many({})
    await db.menu_items.delete_many({})
    await db.orders.delete_many({})
    
    # Create users
    admin_id = str(uuid.uuid4())
    vendor1_id = str(uuid.uuid4())
    vendor2_id = str(uuid.uuid4())
    vendor3_id = str(uuid.uuid4())
    rider1_id = str(uuid.uuid4())
    rider2_id = str(uuid.uuid4())
    customer1_id = str(uuid.uuid4())
    
    users = [
        {
            "id": admin_id,
            "email": "admin@localtokri.com",
            "password": pwd_context.hash("admin123"),
            "name": "Admin User",
            "role": "admin",
            "phone": "+1234567890",
            "wallet_balance": 0.0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": vendor1_id,
            "email": "vendor1@tomorrowstable.com",
            "password": pwd_context.hash("vendor123"),
            "name": "Golden Spoon",
            "role": "vendor",
            "phone": "+1234567891",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": vendor2_id,
            "email": "vendor2@tomorrowstable.com",
            "password": pwd_context.hash("vendor123"),
            "name": "Sunrise Cafe",
            "role": "vendor",
            "phone": "+1234567892",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": vendor3_id,
            "email": "vendor3@tomorrowstable.com",
            "password": pwd_context.hash("vendor123"),
            "name": "Dragon Wok",
            "role": "vendor",
            "phone": "+1234567893",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": rider1_id,
            "email": "rider1@tomorrowstable.com",
            "password": pwd_context.hash("rider123"),
            "name": "John Rider",
            "role": "rider",
            "phone": "+1234567894",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": rider2_id,
            "email": "rider2@tomorrowstable.com",
            "password": pwd_context.hash("rider123"),
            "name": "Sarah Rider",
            "role": "rider",
            "phone": "+1234567895",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": customer1_id,
            "email": "customer@tomorrowstable.com",
            "password": pwd_context.hash("customer123"),
            "name": "Alice Customer",
            "role": "customer",
            "phone": "+1234567896",
            "wallet_balance": 500.0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.users.insert_many(users)
    print(f"Created {len(users)} users")
    
    # Create restaurants
    restaurant1_id = str(uuid.uuid4())
    restaurant2_id = str(uuid.uuid4())
    restaurant3_id = str(uuid.uuid4())
    
    restaurants = [
        {
            "id": restaurant1_id,
            "vendor_id": vendor1_id,
            "name": "Golden Spoon Breakfast",
            "description": "Start your day with our delicious breakfast classics - pancakes, eggs, and fresh coffee",
            "cuisine": "American Breakfast",
            "image_url": "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=500",
            "rating": 4.7,
            "delivery_time": "7:00 AM - 11:00 AM",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": restaurant2_id,
            "vendor_id": vendor2_id,
            "name": "Sunrise Cafe",
            "description": "Healthy breakfast options with fresh fruits, smoothies, and organic ingredients",
            "cuisine": "Healthy & Organic",
            "image_url": "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=500",
            "rating": 4.9,
            "delivery_time": "7:00 AM - 11:00 AM",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": restaurant3_id,
            "vendor_id": vendor3_id,
            "name": "Dragon Wok Morning",
            "description": "Asian breakfast delights - dim sum, congee, and traditional morning favorites",
            "cuisine": "Asian Fusion",
            "image_url": "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500",
            "rating": 4.6,
            "delivery_time": "7:00 AM - 11:00 AM",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.restaurants.insert_many(restaurants)
    print(f"Created {len(restaurants)} restaurants")
    
    # Create menu items for Restaurant 1 (Golden Spoon)
    menu_items_r1 = [
        {
            "id": str(uuid.uuid4()),
            "restaurant_id": restaurant1_id,
            "name": "Classic Pancake Stack",
            "description": "Fluffy pancakes with maple syrup and butter",
            "price": 8.99,
            "category": "Breakfast Classics",
            "image_url": "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=300",
            "is_available": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "restaurant_id": restaurant1_id,
            "name": "Eggs Benedict",
            "description": "Poached eggs on English muffin with hollandaise sauce",
            "price": 12.99,
            "category": "Breakfast Classics",
            "image_url": "https://images.unsplash.com/photo-1608039755401-742074f0548d?w=300",
            "is_available": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "restaurant_id": restaurant1_id,
            "name": "French Toast",
            "description": "Golden brown French toast with powdered sugar",
            "price": 9.99,
            "category": "Breakfast Classics",
            "image_url": "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=300",
            "is_available": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "restaurant_id": restaurant1_id,
            "name": "Coffee (Large)",
            "description": "Freshly brewed premium coffee",
            "price": 3.99,
            "category": "Beverages",
            "is_available": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Create menu items for Restaurant 2 (Sunrise Cafe)
    menu_items_r2 = [
        {
            "id": str(uuid.uuid4()),
            "restaurant_id": restaurant2_id,
            "name": "Acai Bowl",
            "description": "Acai berries topped with granola, banana, and honey",
            "price": 11.99,
            "category": "Healthy Bowls",
            "image_url": "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=300",
            "is_available": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "restaurant_id": restaurant2_id,
            "name": "Green Smoothie",
            "description": "Spinach, banana, mango, and almond milk",
            "price": 7.99,
            "category": "Smoothies",
            "image_url": "https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=300",
            "is_available": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "restaurant_id": restaurant2_id,
            "name": "Avocado Toast",
            "description": "Smashed avocado on sourdough with cherry tomatoes",
            "price": 10.99,
            "category": "Healthy Bowls",
            "image_url": "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=300",
            "is_available": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "restaurant_id": restaurant2_id,
            "name": "Protein Power Bowl",
            "description": "Quinoa, grilled chicken, eggs, and vegetables",
            "price": 13.99,
            "category": "Healthy Bowls",
            "is_available": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Create menu items for Restaurant 3 (Dragon Wok)
    menu_items_r3 = [
        {
            "id": str(uuid.uuid4()),
            "restaurant_id": restaurant3_id,
            "name": "Dim Sum Basket",
            "description": "Assorted steamed dumplings (6 pieces)",
            "price": 9.99,
            "category": "Dim Sum",
            "image_url": "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=300",
            "is_available": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "restaurant_id": restaurant3_id,
            "name": "Congee Bowl",
            "description": "Rice porridge with chicken and ginger",
            "price": 8.99,
            "category": "Traditional",
            "is_available": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "restaurant_id": restaurant3_id,
            "name": "Fried Noodles",
            "description": "Stir-fried noodles with vegetables and egg",
            "price": 10.99,
            "category": "Noodles",
            "is_available": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "restaurant_id": restaurant3_id,
            "name": "Jasmine Tea",
            "description": "Traditional Chinese jasmine tea",
            "price": 2.99,
            "category": "Beverages",
            "is_available": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    all_menu_items = menu_items_r1 + menu_items_r2 + menu_items_r3
    await db.menu_items.insert_many(all_menu_items)
    print(f"Created {len(all_menu_items)} menu items")
    
    print("Database seeded successfully!")
    print("\n=== Test Accounts ===")
    print("Admin: admin@localtokri.com / admin123")
    print("Vendor: vendor1@tomorrowstable.com / vendor123")
    print("Rider: rider1@tomorrowstable.com / rider123")
    print("Customer: customer@tomorrowstable.com / customer123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
