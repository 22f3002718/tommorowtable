# 🛒 Localtokri - Local Essentials, Delivered

<div align="center">
  <img src="frontend/public/logo.jpg" alt="Localtokri Logo" width="200"/>
  
  **Next-Morning Food Delivery Marketplace with Mobile App Support**
  
  [![React](https://img.shields.io/badge/React-19.0-blue.svg)](https://reactjs.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-Latest-green.svg)](https://fastapi.tiangolo.com/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-5.0+-brightgreen.svg)](https://www.mongodb.com/)
  [![Capacitor](https://img.shields.io/badge/Capacitor-7.4.3-blue.svg)](https://capacitorjs.com/)
</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [User Roles & Credentials](#-user-roles--credentials)
- [Mobile App Development](#-mobile-app-development)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Environment Configuration](#-environment-configuration)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Overview

**Localtokri** is a comprehensive food delivery marketplace designed for next-morning deliveries. Customers can order fresh local produce and meals before midnight and receive them between 7-11 AM the next morning.

### Key Highlights:
- ✅ Multi-role system (Customer, Vendor, Rider, Admin)
- ✅ Native mobile apps for iOS and Android (via Capacitor)
- ✅ Real-time order tracking
- ✅ Route optimization for delivery riders
- ✅ Wallet system for seamless payments
- ✅ Google Maps integration for location and navigation
- ✅ JWT-based authentication with 30-day token expiry
- ✅ Responsive design optimized for all screen sizes

---

## ✨ Features

### 👤 Customer Features
- 🍽️ **Browse Restaurants** - Search and filter restaurants by cuisine and ratings
- 🛒 **Shopping Cart** - Add items with quantity management
- 📍 **Location Selection** - Google Maps integration for precise delivery address
- 💰 **Wallet System** - Add money and pay seamlessly (mock Paytm integration)
- 📦 **Order Tracking** - Track orders through complete lifecycle
- ⭐ **Rate & Review** - Provide feedback on delivered orders
- 📱 **Mobile App** - Native iOS and Android apps

### 🏪 Vendor Features
- 📊 **Dashboard** - Real-time statistics and order overview
- 📝 **Order Management** - Confirm/reject orders, update preparation status
- 🚚 **Route Optimization** - Intelligent batch delivery planning
- 📈 **Analytics** - Track total orders, revenue, and performance
- 🍕 **Menu Management** - Add, edit, and manage menu items

### 🚴 Rider Features
- 📋 **Delivery Queue** - View and manage assigned deliveries
- 🗺️ **Navigation** - Google Maps integration for optimal routes
- 📦 **Delivery Sequence** - Optimized delivery order (#1, #2, #3...)
- 📍 **Customer Location** - View exact delivery locations on map
- ✅ **Status Updates** - Mark orders as picked up and delivered

### 👨‍💼 Admin Features
- 📊 **Complete Dashboard** - System-wide statistics and monitoring
- 📈 **Revenue Tracking** - Total revenue and average order value
- 👥 **User Management** - View all customers, vendors, and riders
- 🏪 **Restaurant Management** - Monitor all restaurants and their status
- 💳 **Wallet Management** - Add money to customer wallets
- 📦 **Order Oversight** - View and manage all orders across the platform

---

## 🛠️ Technology Stack

### Frontend
- **React 19** - Modern UI library with latest features
- **React Router v7** - Client-side routing
- **Capacitor 7.4.3** - Native mobile app framework (iOS & Android)
- **Shadcn/UI** - Beautiful, accessible component library
- **Tailwind CSS** - Utility-first CSS framework with custom mobile optimizations
- **Axios** - HTTP client for API calls
- **Google Maps JavaScript API** - Location selection and navigation
- **Sonner** - Toast notifications
- **Lucide React** - Modern icon library

### Backend
- **FastAPI** - High-performance Python web framework
- **Motor** - Async MongoDB driver for Python
- **PyJWT** - JWT authentication
- **Bcrypt** - Password hashing
- **Pydantic** - Data validation
- **Google Maps API** - Route optimization and distance calculations

### Database
- **MongoDB** - NoSQL database for flexible data storage
  - Collections: users, restaurants, menu_items, orders, wallet_transactions

### DevOps & Tools
- **Yarn** - Package manager (faster than npm)
- **Supervisor** - Process management for backend
- **Craco** - Create React App Configuration Override
- **ESLint** - Code linting

---

## 📋 Prerequisites

### Required for All Development

- **Node.js** v18+ - [Download](https://nodejs.org/)
- **Yarn** v1.22+ - Install: `npm install -g yarn`
- **Python** 3.11+ - [Download](https://www.python.org/)
- **MongoDB** v5.0+ - [Download](https://www.mongodb.com/try/download/community)

### For Mobile App Development

#### iOS (macOS only):
- **Xcode** 14.0+ - [Download from App Store](https://apps.apple.com/us/app/xcode/id497799835)
- **CocoaPods** - Install: `sudo gem install cocoapods`

#### Android (All platforms):
- **Android Studio** - [Download](https://developer.android.com/studio)
- **Android SDK** API Level 33+
- **Java JDK** 17+ - [Download](https://www.oracle.com/java/technologies/downloads/)

### API Keys Required

- **Google Maps API Key** - Required for location features
  - Enable: Maps JavaScript API, Geocoding API, Directions API, Places API
  - Get key: [Google Cloud Console](https://console.cloud.google.com/)

---

## 🚀 Quick Start

### 1. Clone and Navigate

```bash
git clone <repository-url>
cd localtokri
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
touch .env
```

**Configure `backend/.env`:**
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=localtokri
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
```

```bash
# Seed database with sample data
python seed_data.py

# Start backend server
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

Backend will be available at: `http://localhost:8001`  
API docs: `http://localhost:8001/docs`

### 3. Frontend Setup

```bash
# Open new terminal
cd frontend

# Install dependencies
yarn install

# Create .env file
touch .env
```

**Configure `frontend/.env`:**
```env
# For web development:
REACT_APP_BACKEND_URL=http://localhost:8001

# For mobile testing on same network:
# REACT_APP_BACKEND_URL=http://YOUR_LOCAL_IP:8001

REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
WDS_SOCKET_PORT=3000
```

```bash
# Start frontend development server
yarn start
```

Frontend will be available at: `http://localhost:3000`

### 4. Access the Application

Open your browser and go to: **http://localhost:3000**

---

## 🔑 User Roles & Credentials

The seeded database includes these test accounts:

### 👑 Admin
```
Email: admin@quickbite.com
Password: admin123
```
**Access:** Complete oversight of platform, manage users, orders, and wallets

### 🏪 Vendor
```
Email: vendor1@quickbite.com
Password: vendor123
```
**Access:** Manage restaurant, menu items, orders, and route optimization

### 🚴 Rider
```
Email: rider1@quickbite.com
Password: rider123
```
**Access:** View assigned deliveries, navigate to customers, update delivery status

### 👤 Customer
```
Email: customer@quickbite.com
Password: customer123
```
**Access:** Browse restaurants, place orders, track deliveries, manage wallet

---

## 📱 Mobile App Development

### Build React App

```bash
cd frontend
yarn build
```

### Sync with Capacitor

```bash
npx cap sync
```

### iOS Development (macOS only)

```bash
# Open iOS project in Xcode
npx cap open ios
```

In Xcode:
1. Select your development team
2. Choose a device/simulator
3. Click Run (▶️)

### Android Development

```bash
# Open Android project in Android Studio
npx cap open android
```

In Android Studio:
1. Wait for Gradle sync
2. Select device/emulator
3. Click Run (▶️)

**📱 For detailed Android setup instructions for beginners, see: [ANDROID_SETUP_GUIDE.md](ANDROID_SETUP_GUIDE.md)**

---

## 📡 API Documentation

### Base URL
```
http://localhost:8001/api
```

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Create new account | No |
| POST | `/auth/login` | Login (returns JWT token) | No |
| GET | `/auth/me` | Get current user | Yes |
| PATCH | `/auth/update-location` | Update user location | Yes |
| POST | `/auth/register-push-token` | Register push notification token | Yes |

### Restaurant Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/restaurants` | List all restaurants | No |
| GET | `/restaurants/{id}` | Get restaurant details | No |
| POST | `/restaurants` | Create restaurant | Yes (Vendor/Admin) |
| GET | `/restaurants/{id}/menu` | Get menu items | No |
| POST | `/restaurants/{id}/menu` | Add menu item | Yes (Vendor/Admin) |

### Order Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/orders` | Place order | Yes |
| GET | `/orders` | Get orders (filtered by role) | Yes |
| GET | `/orders/{id}` | Get order details | Yes |
| PATCH | `/orders/{id}/status` | Update order status | Yes |
| PATCH | `/orders/{id}/rider` | Assign rider | Yes (Vendor) |
| POST | `/orders/{id}/rating` | Rate delivered order | Yes (Customer) |

### Wallet Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/wallet/balance` | Get wallet balance | Yes |
| GET | `/wallet/transactions` | Get transaction history | Yes |
| POST | `/wallet/add-money` | Add money to wallet (MOCK) | Yes |

### Route Optimization Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/vendor/optimize-routes` | Optimize delivery routes | Yes (Vendor) |
| POST | `/vendor/batch-assign-riders` | Batch assign riders | Yes (Vendor) |

### Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/admin/customers` | Get all customers | Yes (Admin) |
| GET | `/admin/vendors` | Get all vendors | Yes (Admin) |
| GET | `/admin/riders` | Get all riders | Yes (Admin) |
| GET | `/admin/stats` | Get system statistics | Yes (Admin) |
| POST | `/admin/add-wallet-money` | Add money to customer wallet | Yes (Admin) |

**Full API Documentation:** Visit `http://localhost:8001/docs` when backend is running

---

## 📁 Project Structure

```
localtokri/
├── backend/
│   ├── server.py              # FastAPI main application
│   ├── seed_data.py           # Database seeding script
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Backend environment variables
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   │   ├── ui/           # Shadcn/UI components
│   │   │   ├── BottomNav.js  # Mobile bottom navigation
│   │   │   ├── FloatingCartButton.js
│   │   │   ├── GoogleLocationPicker.js
│   │   │   ├── GoogleMapView.js
│   │   │   └── RouteOptimizationDialog.js
│   │   ├── pages/            # Page components
│   │   │   ├── HomePage.js
│   │   │   ├── RestaurantPage.js
│   │   │   ├── OrdersPage.js
│   │   │   ├── VendorDashboard.js
│   │   │   ├── RiderDashboard.js
│   │   │   └── AdminDashboard.js
│   │   ├── contexts/         # React contexts
│   │   │   └── CartContext.js
│   │   ├── services/         # Service layer
│   │   │   ├── authService.js
│   │   │   └── pushNotificationService.js
│   │   ├── lib/             # Utilities
│   │   ├── App.js           # Main React component
│   │   ├── App.css          # Global styles
│   │   ├── mobile.css       # Mobile optimizations
│   │   └── index.js         # Entry point
│   ├── public/
│   │   ├── logo.jpg         # Localtokri logo
│   │   └── index.html       # HTML template
│   ├── ios/                 # iOS native project (Capacitor)
│   ├── android/             # Android native project (Capacitor)
│   ├── package.json         # Node dependencies
│   ├── capacitor.config.json # Capacitor configuration
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   └── .env                 # Frontend environment variables
├── ANDROID_SETUP_GUIDE.md   # Detailed Android testing guide
├── README.md                # This file
└── test_result.md           # Testing documentation
```

---

## 🔐 Environment Configuration

### Backend `.env` (Required)

**Location:** `/backend/.env`

```env
# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017
# Or for MongoDB Atlas:
# MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority

DB_NAME=localtokri

# JWT Configuration (generate with: openssl rand -hex 32)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-make-it-long-and-random

# Google Maps API Key
GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
```

### Frontend `.env` (Required)

**Location:** `/frontend/.env`

```env
# Backend API URL
REACT_APP_BACKEND_URL=http://localhost:8001

# For mobile testing on same WiFi network:
# REACT_APP_BACKEND_URL=http://192.168.1.100:8001
# (Replace 192.168.1.100 with your computer's local IP)

# Google Maps API Key (same as backend)
REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here

# Webpack Dev Server (for development)
WDS_SOCKET_PORT=3000
```

### Important Notes:

1. **Never commit `.env` files** to version control
2. **Generate unique JWT_SECRET** for production: `openssl rand -hex 32`
3. **Update URLs** for production deployment
4. **Restrict API keys** in Google Cloud Console for security

---

## 🐛 Troubleshooting

### MongoDB Connection Error

**Symptom:** Backend fails to start with "Connection refused"

**Solution:**
```bash
# Check if MongoDB is running
mongosh

# Start MongoDB service
# macOS (Homebrew):
brew services start mongodb-community

# Linux:
sudo systemctl start mongod

# Windows: MongoDB runs as a service automatically
```

### Backend Won't Start

**Symptom:** `ImportError` or `ModuleNotFoundError`

**Solution:**
```bash
# Ensure virtual environment is activated
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

### Frontend Won't Start

**Symptom:** Dependencies error or build issues

**Solution:**
```bash
cd frontend

# Clear cache and reinstall
rm -rf node_modules yarn.lock
yarn cache clean
yarn install

# Use Yarn, NOT npm
yarn start
```

### Google Maps Not Working

**Symptom:** Maps don't load or show blank

**Solution:**
1. Verify `REACT_APP_GOOGLE_MAPS_API_KEY` is set in `.env`
2. Check Google Cloud Console:
   - Enable required APIs (Maps JavaScript, Geocoding, Directions, Places)
   - Check API key restrictions
   - Ensure billing is enabled (free tier available)
3. Clear browser cache and reload

### Mobile App Not Connecting to Backend

**Symptom:** Network errors on mobile device

**Solution:**
1. Use **local IP address** instead of `localhost`:
   ```bash
   # Find your IP
   # macOS/Linux:
   ifconfig | grep "inet "
   
   # Windows:
   ipconfig
   ```
2. Update `REACT_APP_BACKEND_URL` in `frontend/.env`:
   ```env
   REACT_APP_BACKEND_URL=http://192.168.1.100:8001
   ```
3. Rebuild and resync:
   ```bash
   yarn build
   npx cap sync
   ```
4. Ensure backend is running with `--host 0.0.0.0`
5. Check firewall allows port 8001

### App Not Responsive on Mobile

**Symptom:** Layout issues on small screens

**Solution:**
- Clear React build and rebuild:
  ```bash
  rm -rf build
  yarn build
  npx cap sync
  ```
- Verify `mobile.css` is imported in `App.js`
- Check browser DevTools for responsive design

### Capacitor Sync Fails

**Symptom:** Error during `npx cap sync`

**Solution:**
```bash
# Build React app first
yarn build

# Force sync
npx cap sync --force

# For Android: Sync Gradle in Android Studio
# For iOS: Run pod install in ios/App directory
cd ios/App
pod install
```

---

## 🎨 Order Lifecycle

The order goes through these stages:

1. **placed** - Customer places order (before midnight)
2. **confirmed** - Vendor confirms the order
3. **preparing** - Vendor starts preparing food
4. **ready** - Food ready for pickup
5. **out-for-delivery** - Rider picks up and delivers
6. **delivered** - Customer receives order
7. **rated** (Optional) - Customer rates the experience

---

## 🔄 Development Workflow

### Running Everything Locally

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
yarn start
```

**Terminal 3 - MongoDB (if not running as service):**
```bash
mongod --dbpath /path/to/data
```

### Testing Workflow

1. **Test locally in browser:** `http://localhost:3000`
2. **Build for mobile:**
   ```bash
   cd frontend
   yarn build
   npx cap sync
   ```
3. **Test on emulator/device** using Android Studio or Xcode

### Making Changes

**After backend code changes:**
- Backend auto-reloads with `--reload` flag

**After frontend code changes:**
- React hot-reloads automatically for web
- For mobile: rebuild and resync
  ```bash
  yarn build
  npx cap sync
  ```

---

## 🔒 Security Notes

- JWT tokens expire after 30 days
- Passwords are hashed with bcrypt
- Admin credentials should be changed in production
- Never commit `.env` files
- Restrict Google Maps API keys by domain/app ID
- Use HTTPS in production
- Enable MongoDB authentication in production

---

## 📈 Performance Optimizations

- **Code Splitting:** React lazy loading for routes
- **Image Optimization:** Responsive images with proper sizing
- **API Caching:** Consider implementing Redis for production
- **Database Indexing:** MongoDB indexes on frequently queried fields
- **CDN:** Use CDN for static assets in production
- **Compression:** Gzip/Brotli compression enabled
- **Mobile Optimization:** Custom `mobile.css` for device-specific styles

---

## 🚢 Deployment Checklist

Before deploying to production:

- [ ] Update `REACT_APP_BACKEND_URL` to production URL
- [ ] Generate new `JWT_SECRET`
- [ ] Set up MongoDB Atlas or production database
- [ ] Restrict Google Maps API keys
- [ ] Enable HTTPS/SSL
- [ ] Set up environment variables in hosting platform
- [ ] Build production React app: `yarn build`
- [ ] Test on multiple devices
- [ ] Set up error monitoring (Sentry, LogRocket, etc.)
- [ ] Configure push notifications (Firebase for Android, APNS for iOS)
- [ ] Submit mobile apps to App Store and Google Play

---

## 📄 License

This project is built for educational and commercial purposes.

---

## 🙏 Acknowledgments

Built with modern technologies:
- **FastAPI** for robust, high-performance backend
- **React 19** for modern, efficient frontend
- **MongoDB** for flexible data storage
- **Capacitor** for native mobile apps
- **Google Maps Platform** for location services
- **Shadcn/UI** for beautiful, accessible components
- **Tailwind CSS** for utility-first styling

---

## 📞 Support

For issues and questions:

1. Check [Troubleshooting](#-troubleshooting) section
2. Review [ANDROID_SETUP_GUIDE.md](ANDROID_SETUP_GUIDE.md) for mobile issues
3. Check API docs at `http://localhost:8001/docs`
4. Review backend logs for API errors
5. Check browser console for frontend errors

---

## 🎯 Roadmap

Future enhancements:
- Real payment gateway integration (Stripe, Razorpay)
- Real-time order tracking with WebSockets
- Push notification implementation
- Multi-language support
- Dark mode
- Advanced analytics dashboard
- Restaurant review system
- Loyalty points program
- Promotional codes and discounts

---

**Happy Coding! 🚀**

Built with ❤️ for local food delivery excellence.
