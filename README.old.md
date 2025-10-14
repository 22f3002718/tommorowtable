# QuickBite - Next-Morning Delivery Marketplace

A comprehensive Zomato-style food delivery marketplace with a unique twist: Orders placed before midnight are delivered the next morning between 7-11 AM.

## 🎯 Key Features

### 🔐 Multi-Role Authentication System
- JWT-based authentication
- Four distinct user roles: Customer, Vendor, Rider, Admin
- Role-based access control and dashboards

### 👥 Customer Features
- Browse restaurants with beautiful food imagery
- Real-time search and filtering
- Add items to cart with quantity management
- Place orders with delivery address and special instructions
- Track order status through complete lifecycle
- Rate and review delivered orders
- View order history

### 🏪 Vendor Dashboard
- View incoming orders for next-morning delivery
- Confirm or reject orders
- Update order preparation status (Preparing → Ready)
- Real-time statistics (Total, Pending, Active, Completed orders)
- Restaurant and menu management

### 🚴 Rider Dashboard
- View orders ready for pickup
- Pick up orders and start delivery
- Navigate to delivery locations
- Mark orders as delivered
- Track daily delivery statistics

### 👨‍💼 Admin Dashboard
- Complete oversight of all orders
- View and manage all restaurants
- Real-time revenue tracking
- System-wide statistics
- Update order status manually when needed

## 📋 Order Lifecycle

1. **Placed** - Customer places order (before midnight)
2. **Confirmed** - Vendor confirms the order
3. **Preparing** - Vendor starts preparing food
4. **Ready** - Food ready for pickup
5. **Out-for-Delivery** - Rider picks up and delivers
6. **Delivered** - Customer receives order
7. **Rated** (Optional) - Customer rates the experience

## 🚀 Getting Started

### Test Accounts

```
Admin:
Email: admin@quickbite.com
Password: admin123

Vendor:
Email: vendor1@quickbite.com
Password: vendor123

Rider:
Email: rider1@quickbite.com
Password: rider123

Customer:
Email: customer@quickbite.com
Password: customer123
```

### Architecture

**Frontend:**
- React 19 with React Router
- Shadcn/UI component library
- Tailwind CSS for styling
- Axios for API calls
- Sonner for toast notifications

**Backend:**
- FastAPI (Python)
- Motor (Async MongoDB driver)
- JWT authentication with bcrypt
- Pydantic models for validation

**Database:**
- MongoDB with collections:
  - users
  - restaurants
  - menu_items
  - orders

## 🎨 Design Highlights

- Modern food-focused UI with warm color palette (orange/red tones)
- Smooth transitions and micro-interactions
- Mobile-first responsive design
- Card-based layouts for easy browsing
- Status badges with color coding
- Real-time notifications

## 🕒 Operational Model

### Midnight Cutoff System
- Orders accepted until 12:00 AM (midnight)
- All orders scheduled for next-morning delivery
- Fixed delivery window: 7:00 AM - 11:00 AM

### Benefits
- Optimized logistics (batch deliveries)
- Fresh morning food delivery
- Predictable preparation time for vendors
- Efficient route planning for riders

## 📊 Sample Data

The system comes pre-seeded with:

- 3 Restaurants:
  - Golden Spoon Breakfast (American)
  - Sunrise Cafe (Healthy & Organic)
  - Dragon Wok Morning (Asian Fusion)

- 12+ Menu items across categories
- Sample test accounts for all roles

## 🛠️ Technology Stack

- **Frontend:** React 19, Tailwind CSS, Shadcn/UI
- **Backend:** FastAPI, Python 3.11
- **Database:** MongoDB
- **Authentication:** JWT with bcrypt
- **Deployment:** Docker/Kubernetes ready

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Restaurants
- `GET /api/restaurants` - List all restaurants
- `GET /api/restaurants/{id}` - Get restaurant details
- `POST /api/restaurants` - Create restaurant (vendor/admin)

### Menu
- `GET /api/restaurants/{id}/menu` - Get menu items
- `POST /api/restaurants/{id}/menu` - Add menu item (vendor/admin)

### Orders
- `POST /api/orders` - Place order
- `GET /api/orders` - Get orders (filtered by role)
- `GET /api/orders/{id}` - Get order details
- `PATCH /api/orders/{id}/status` - Update order status
- `POST /api/orders/{id}/rating` - Rate delivered order

## 🌟 Future Enhancements

- Real-time order tracking with WebSockets
- Route optimization algorithm for riders
- Payment integration (Stripe)
- Push notifications
- Advanced analytics for vendors
- Promotional codes and discounts
- Multi-language support
- Mobile apps (iOS/Android)

## 📝 Notes

- Payment integration is not included in MVP (assumed pre-paid or cash on delivery)
- No actual route optimization - riders can use Google Maps integration
- Order cutoff time is configurable but set to midnight by default
- All times are in UTC, convert for local timezone as needed

## 🙏 Credits

Built with modern web technologies and best practices for a seamless food delivery experience.
