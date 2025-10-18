# 🚀 Localtokri - Complete Setup Guide

## 📖 Overview

Localtokri is a comprehensive food delivery platform with:
- **React Web App** - Customer-facing web interface
- **React Native Mobile App** - iOS and Android native apps
- **FastAPI Backend** - Python-based REST API
- **MongoDB Database** - NoSQL data storage

---

## 📋 Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   ```bash
   node --version  # Should show v18.x.x or higher
   ```

2. **Yarn** (v1.22+)
   ```bash
   npm install -g yarn
   yarn --version
   ```

3. **Python** (3.11 or higher)
   ```bash
   python --version  # Should show 3.11+
   ```

4. **MongoDB** (v5.0 or higher)
   - [Download MongoDB Community Server](https://www.mongodb.com/try/download/community)
   - Start MongoDB service

### For Mobile Development

#### iOS Development (macOS only)
- **Xcode** (14.0+) from App Store
- **CocoaPods**: `sudo gem install cocoapods`

#### Android Development (All platforms)
- **Android Studio** (2023.1.1+)
- **Android SDK** (API level 33+)
- **Java JDK** (17+)

---

## 🔧 Installation Steps

### 1. Clone and Navigate
```bash
cd /app
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Verify installation
python -c "import fastapi; import motor; print('Backend dependencies OK')"
```

**Environment Variables:**
The backend `.env` file is already configured with:
- `MONGO_URL` - MongoDB connection string
- `JWT_SECRET` - Authentication secret key

### 3. Frontend Web App Setup

```bash
# Navigate to frontend
cd /app/frontend

# Install dependencies
yarn install

# Verify installation
yarn --version
```

**Environment Variables:**
The frontend `.env` file contains:
- `REACT_APP_BACKEND_URL` - Backend API URL (already configured)

### 4. React Native Mobile App Setup

```bash
# Navigate to React Native app
cd /app/frontend_reactnative

# Install dependencies
yarn install

# For iOS (macOS only)
cd ios
pod install
cd ..

# Verify installation
yarn --version
```

**Important Files:**
- `app.json` - Capacitor configuration
- `src/config/api.js` - API endpoint configuration

---

## 🚀 Running the Application

### Start All Services (Recommended)

```bash
# From /app directory
sudo supervisorctl start all
sudo supervisorctl status
```

You should see:
```
backend                          RUNNING
frontend                         RUNNING
```

### Individual Service Management

**Backend:**
```bash
sudo supervisorctl restart backend
sudo supervisorctl status backend

# View logs
tail -f /var/log/supervisor/backend.out.log
tail -f /var/log/supervisor/backend.err.log
```

**Frontend Web:**
```bash
sudo supervisorctl restart frontend
sudo supervisorctl status frontend

# View logs
tail -f /var/log/supervisor/frontend.out.log
```

### Access the Applications

**Web App:**
- URL: Check the `REACT_APP_BACKEND_URL` environment variable for the correct port
- Default: `http://localhost:3000`

**API Documentation:**
- Swagger UI: `http://localhost:8001/docs`
- ReDoc: `http://localhost:8001/redoc`

---

## 📱 Running React Native Mobile App

### Option 1: Expo Go (Quick Testing)

```bash
cd /app/frontend_reactnative

# Start Metro bundler
yarn start
```

Scan the QR code with:
- **iOS**: Camera app
- **Android**: Expo Go app

### Option 2: iOS Simulator (macOS only)

```bash
cd /app/frontend_reactnative

# Start iOS simulator
yarn ios

# Or specific device
yarn ios --simulator="iPhone 15 Pro"
```

### Option 3: Android Emulator

```bash
cd /app/frontend_reactnative

# Make sure Android emulator is running
# Then start the app
yarn android
```

### Option 4: Physical Device

**iOS:**
1. Open `/app/frontend_reactnative/ios/App.xcworkspace` in Xcode
2. Select your device
3. Update Bundle ID and Signing Team
4. Press Run (⌘R)

**Android:**
1. Enable Developer Mode on your device
2. Enable USB Debugging
3. Connect device via USB
4. Run: `yarn android`

---

## 🗄️ Database Setup

### Seed Initial Data

```bash
cd /app/backend

# Run seed script to create sample data
python seed_data.py
```

This creates:
- Sample users (customers, vendors, riders, admin)
- Restaurants with menu items
- Demo orders

### Default User Accounts

After seeding, you can login with:

**Admin:**
- Email: `admin@localtokri.com`
- Password: `admin123`

**Customer:**
- Email: `customer@example.com`
- Password: `customer123`

**Vendor:**
- Email: `vendor@example.com`
- Password: `vendor123`

**Rider:**
- Email: `rider@example.com`
- Password: `rider123`

---

## 🔑 API Configuration

### Google Maps API (Required)

The app uses Google Maps for:
- Location selection
- Route optimization
- Navigation

**Setup:**
1. Get API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Directions API

**Update Configuration:**

For Web App:
```bash
# /app/frontend/.env
REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key_here
```

For Mobile App:
```bash
# /app/frontend_reactnative/src/config/api.js
export const GOOGLE_MAPS_API_KEY = 'your_api_key_here';
```

---

## 💰 Key Features Implementation

### Delivery Fee System
- **Flat Rs 11 delivery fee** applied to all orders
- Fee calculated at checkout
- Displayed separately in order summary
- Applied to both single and multi-vendor orders

### Wallet System
- Users can add money to wallet
- Orders are paid from wallet balance
- Transaction history tracking
- Admin can add money to user wallets

### Location Management
- Customers select delivery location on map
- Draggable map markers
- Address search with autocomplete
- Flat number and building name required
- Location saved to user profile

### Order Flow
1. Customer browses restaurants
2. Adds items to cart
3. Selects delivery location
4. Reviews order with delivery fee
5. Pays from wallet
6. Vendor receives and prepares order
7. Rider picks up and delivers
8. Customer confirms delivery

### Rider Features
- Active delivery tracking
- Past deliveries history
- Delivery sequence optimization
- Google Maps navigation
- Customer contact details
- Building and flat number display

---

## 🧪 Testing

### Backend API Testing

```bash
# Test server health
curl http://localhost:8001/health

# Test authentication
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@example.com","password":"customer123"}'
```

### Frontend Testing

**Web:**
1. Open browser to frontend URL
2. Register new account or use test credentials
3. Test order flow end-to-end

**Mobile:**
1. Run on simulator/emulator
2. Test all screens and navigation
3. Verify map functionality
4. Test order placement

---

## 📁 Project Structure

```
/app
├── backend/                 # FastAPI Backend
│   ├── server.py           # Main API server
│   ├── requirements.txt    # Python dependencies
│   ├── seed_data.py        # Database seeding script
│   └── .env                # Backend environment variables
│
├── frontend/                # React Web App
│   ├── src/                # Source code
│   ├── public/             # Static assets
│   ├── package.json        # Dependencies
│   └── .env                # Frontend environment variables
│
├── frontend_reactnative/    # React Native Mobile App
│   ├── src/
│   │   ├── screens/        # App screens
│   │   ├── components/     # Reusable components
│   │   ├── navigation/     # Navigation setup
│   │   ├── contexts/       # React contexts
│   │   └── services/       # API services
│   ├── ios/                # iOS native code
│   ├── android/            # Android native code
│   ├── app.json            # App configuration
│   └── package.json        # Dependencies
│
└── test_result.md          # Testing documentation
```

---

## 🐛 Troubleshooting

### Backend Issues

**MongoDB Connection Failed:**
```bash
# Check MongoDB is running
sudo systemctl status mongod  # Linux
brew services list            # macOS

# Start MongoDB
sudo systemctl start mongod   # Linux
brew services start mongodb   # macOS
```

**Port Already in Use:**
```bash
# Kill process on port 8001
lsof -ti:8001 | xargs kill -9
```

### Frontend Issues

**Port 3000 Already in Use:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**Dependencies Issue:**
```bash
# Clear cache and reinstall
cd /app/frontend
rm -rf node_modules yarn.lock
yarn install
```

### React Native Issues

**Metro Bundler Cache:**
```bash
cd /app/frontend_reactnative
yarn start --reset-cache
```

**iOS Pod Installation:**
```bash
cd /app/frontend_reactnative/ios
pod deintegrate
pod install
```

**Android Build Errors:**
```bash
cd /app/frontend_reactnative/android
./gradlew clean
```

### Common Errors

**"Cannot connect to backend":**
1. Check backend is running: `sudo supervisorctl status backend`
2. Verify REACT_APP_BACKEND_URL is correct
3. Check firewall settings

**"Insufficient wallet balance":**
1. Add money to wallet from Orders page
2. Or login as admin and add money to user wallet

**"Location not working":**
1. Ensure Google Maps API key is configured
2. Grant location permissions
3. Enable location services on device

---

## 📊 Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Backend API | http://localhost:8001 | REST API endpoints |
| API Docs | http://localhost:8001/docs | Swagger UI |
| Frontend Web | http://localhost:3000 | Customer web interface |
| MongoDB | mongodb://localhost:27017 | Database |

---

## 🔄 Development Workflow

### Making Changes

1. **Backend Changes:**
   ```bash
   # Edit files in /app/backend/
   # Restart backend
   sudo supervisorctl restart backend
   ```

2. **Frontend Web Changes:**
   ```bash
   # Edit files in /app/frontend/src/
   # Hot reload automatic
   # Or restart: sudo supervisorctl restart frontend
   ```

3. **Mobile App Changes:**
   ```bash
   # Edit files in /app/frontend_reactnative/src/
   # Press 'r' in Metro bundler to reload
   # Or shake device for dev menu
   ```

### Checking Logs

```bash
# Backend logs
tail -f /var/log/supervisor/backend.out.log
tail -f /var/log/supervisor/backend.err.log

# Frontend logs
tail -f /var/log/supervisor/frontend.out.log
tail -f /var/log/supervisor/frontend.err.log
```

---

## 📞 Support

For issues or questions:
1. Check logs for error messages
2. Verify all services are running
3. Ensure environment variables are set
4. Review this guide for troubleshooting steps

---

## ✅ Quick Start Checklist

- [ ] MongoDB installed and running
- [ ] Python 3.11+ installed
- [ ] Node.js 18+ and Yarn installed
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Environment variables configured
- [ ] Services started with supervisorctl
- [ ] Database seeded with initial data
- [ ] Google Maps API key configured
- [ ] Web app accessible in browser
- [ ] Mobile app running on simulator/device

---

## 🎉 Success!

If you see:
- ✅ Backend running on port 8001
- ✅ Frontend running on port 3000
- ✅ MongoDB connected
- ✅ Can login and place orders

**You're all set!** 🚀

---

*Last Updated: January 2025*
