# 🍽️ Localtokri - Next-Morning Food Delivery Marketplace

A comprehensive food delivery marketplace with mobile app support (iOS & Android). Orders placed before midnight are delivered the next morning between 7-11 AM.

## 🌟 Key Features

### 🔐 Multi-Role Authentication System
- JWT-based authentication with 30-day token expiry
- Capacitor integration for native mobile apps (iOS & Android)
- Push notifications for order updates
- Four distinct user roles: Customer, Vendor, Rider, Admin
- Secure token storage (localStorage for web, Capacitor Preferences for mobile)

### 📱 Mobile App Support
- Native iOS and Android apps via Capacitor
- Push notification support
- Native storage for offline capability
- Optimized for mobile performance

### 👥 Customer Features
- Browse restaurants with beautiful food imagery
- Real-time search and filtering
- Add items to cart with quantity management
- Google Maps integration for location selection
- Place orders with delivery address and special instructions
- Track order status through complete lifecycle
- Rate and review delivered orders
- View order history

### 🏪 Vendor Dashboard
- View incoming orders for next-morning delivery
- Confirm or reject orders
- Update order preparation status (Preparing → Ready)
- Route optimization for batch deliveries
- Real-time statistics (Total, Pending, Active, Completed orders)
- Restaurant and menu management

### 🚴 Rider Dashboard
- View orders ready for pickup
- Google Maps integration for navigation
- Pick up orders and start delivery
- View customer delivery locations on map
- Mark orders as delivered
- Track daily delivery statistics

### 👨‍💼 Admin Dashboard
- Complete oversight of all orders
- View and manage all restaurants
- Real-time revenue tracking
- System-wide statistics
- Update order status manually when needed

## 🛠️ Technology Stack

**Frontend:**
- React 19 with React Router
- Capacitor 7 for mobile apps
- Shadcn/UI component library
- Tailwind CSS for styling
- Axios for API calls
- Sonner for toast notifications
- Google Maps JavaScript API
- Capacitor Push Notifications

**Backend:**
- FastAPI (Python 3.11+)
- Motor (Async MongoDB driver)
- JWT authentication with PyJWT & bcrypt
- Pydantic models for validation
- Google Maps API for route optimization

**Database:**
- MongoDB with collections:
  - users (with push token support)
  - restaurants
  - menu_items
  - orders

## 📋 Prerequisites

Before running this project locally, ensure you have the following installed:

### Required for All Development
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Yarn** (v1.22+) - Install with `npm install -g yarn`
- **Python** (3.11 or higher) - [Download](https://www.python.org/)
- **pip** (Python package manager)
- **MongoDB** (v5.0 or higher) - [Download](https://www.mongodb.com/try/download/community)

### Required for Mobile Development

#### For iOS Development (macOS only)
- **Xcode** (14.0 or higher) - [Download from App Store](https://apps.apple.com/us/app/xcode/id497799835)
- **Xcode Command Line Tools** - Run: `xcode-select --install`
- **CocoaPods** - Run: `sudo gem install cocoapods`

#### For Android Development (All platforms)
- **Android Studio** (2023.1.1 or higher) - [Download](https://developer.android.com/studio)
- **Android SDK** (API level 33 or higher)
- **Java JDK** (17 or higher) - [Download](https://www.oracle.com/java/technologies/downloads/)

### Optional but Recommended
- **Git** - [Download](https://git-scm.com/)
- **VS Code** or any code editor

## 🚀 Local Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd localtokri
```

### 2. Set Up MongoDB

#### Option A: Local MongoDB Installation

1. Install MongoDB Community Edition
2. Start MongoDB service:
   ```bash
   # macOS (with Homebrew)
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   
   # Windows
   # MongoDB runs as a service automatically after installation
   ```
3. Verify MongoDB is running:
   ```bash
   mongosh
   # Should connect to mongodb://localhost:27017
   ```

#### Option B: MongoDB Atlas (Cloud)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get your connection string
4. Whitelist your IP address

### 3. Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   
   # Activate it
   # macOS/Linux:
   source venv/bin/activate
   
   # Windows:
   venv\Scripts\activate
   ```

3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create `.env` file in the backend directory:
   ```bash
   cp .env.example .env  # If example exists, otherwise create manually
   ```

5. Configure backend `.env` file:
   ```env
   # MongoDB Configuration
   MONGO_URL=mongodb://localhost:27017
   DB_NAME=localtokri
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   
   # Google Maps API Key (required for route optimization)
   GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
   ```

   **Important:** Replace the values above with your actual configuration.

6. Seed the database with sample data:
   ```bash
   python seed_data.py
   ```

7. Start the backend server:
   ```bash
   uvicorn server:app --host 0.0.0.0 --port 8001 --reload
   ```

   Backend will be available at: `http://localhost:8001`
   API documentation: `http://localhost:8001/docs`

### 4. Frontend Setup

1. Open a new terminal and navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node.js dependencies:
   ```bash
   yarn install
   ```

3. Create `.env` file in the frontend directory:
   ```bash
   cp .env.example .env  # If example exists, otherwise create manually
   ```

4. Configure frontend `.env` file:
   ```env
   # Backend API URL
   REACT_APP_BACKEND_URL=http://localhost:8001
   
   # Google Maps API Key (same as backend)
   REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
   
   # Webpack Dev Server (for development)
   WDS_SOCKET_PORT=3000
   ```

   **Important Notes:**
   - For **local development**: Use `http://localhost:8001`
   - For **mobile apps**: Use your local machine's IP address (e.g., `http://192.168.1.100:8001`)
   - Find your local IP:
     - macOS/Linux: `ifconfig | grep "inet "`
     - Windows: `ipconfig`

5. Start the frontend development server:
   ```bash
   yarn start
   ```

   Frontend will be available at: `http://localhost:3000`

### 5. Getting Google Maps API Key

The app requires Google Maps API for location features and route optimization.

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Geocoding API
   - Directions API
   - Distance Matrix API
   - Places API
4. Go to "Credentials" and create an API key
5. (Recommended) Restrict the API key:
   - For development: Add `localhost` and your local IP
   - For production: Add your domain
6. Copy the API key and add it to both backend and frontend `.env` files

**Note:** Google Maps requires billing to be enabled, but they offer $200/month free credit.

## 📱 Building Mobile Apps

### Prerequisites
- Complete the frontend setup first
- Build the React app before syncing to mobile platforms

### Step 1: Build React App

```bash
cd frontend
yarn build
```

This creates an optimized production build in the `build` directory.

### Step 2: Sync with Capacitor

```bash
npx cap sync
```

This copies the web build to native iOS and Android projects and updates native dependencies.

### Step 3A: Build for iOS

**Requirements:** macOS with Xcode installed

1. Open the iOS project:
   ```bash
   npx cap open ios
   ```

2. In Xcode:
   - Select your development team in "Signing & Capabilities"
   - Choose a target device or simulator
   - Click the "Play" button to build and run

3. For production build:
   - Archive the app (Product > Archive)
   - Upload to App Store Connect

**Important:** Update `REACT_APP_BACKEND_URL` in `.env` to use your production API URL or local network IP before building.

### Step 3B: Build for Android

**Requirements:** Android Studio installed

1. Open the Android project:
   ```bash
   npx cap open android
   ```

2. In Android Studio:
   - Wait for Gradle sync to complete
   - Select a device or emulator
   - Click "Run" button to build and install

3. For production build:
   - Build > Generate Signed Bundle / APK
   - Follow the wizard to create a release APK

**Important:** Update `REACT_APP_BACKEND_URL` in `.env` to use your production API URL or local network IP before building.

### Push Notifications Setup

#### iOS Push Notifications

1. Create an App ID in Apple Developer Portal
2. Enable Push Notifications capability
3. Create APNs certificates (Development & Production)
4. Add Push Notifications capability in Xcode
5. Configure in `ios/App/App/Info.plist`:
   ```xml
   <key>UIBackgroundModes</key>
   <array>
       <string>remote-notification</string>
   </array>
   ```

#### Android Push Notifications

1. Create a Firebase project
2. Add your Android app to Firebase
3. Download `google-services.json`
4. Place it in `android/app/`
5. Enable Cloud Messaging API in Firebase Console

## 🔄 Development Workflow

### Running Everything Locally

1. **Terminal 1** - Start MongoDB:
   ```bash
   # If not running as a service
   mongod --dbpath /path/to/data
   ```

2. **Terminal 2** - Start Backend:
   ```bash
   cd backend
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   uvicorn server:app --host 0.0.0.0 --port 8001 --reload
   ```

3. **Terminal 3** - Start Frontend:
   ```bash
   cd frontend
   yarn start
   ```

4. Open browser: `http://localhost:3000`

### Testing on Mobile Device (Same Network)

1. Find your computer's local IP address:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet "
   # Look for something like: inet 192.168.1.100
   
   # Windows
   ipconfig
   # Look for IPv4 Address
   ```

2. Update `frontend/.env`:
   ```env
   REACT_APP_BACKEND_URL=http://192.168.1.100:8001
   ```
   (Replace `192.168.1.100` with your actual IP)

3. Ensure backend is binding to `0.0.0.0` (not `127.0.0.1`)

4. Rebuild and sync:
   ```bash
   cd frontend
   yarn build
   npx cap sync
   ```

5. Open in Xcode/Android Studio and run on device

## 🧪 Test Accounts

The seeded database includes these test accounts:

```
👑 Admin:
Email: admin@quickbite.com
Password: admin123

🏪 Vendor:
Email: vendor1@quickbite.com
Password: vendor123

🚴 Rider:
Email: rider1@quickbite.com
Password: rider123

👤 Customer:
Email: customer@quickbite.com
Password: customer123
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login (returns JWT token with 30-day expiry)
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/update-location` - Update user location
- `POST /api/auth/register-push-token` - Register push notification token

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
- `PATCH /api/orders/{id}/rider` - Assign rider
- `POST /api/orders/{id}/rating` - Rate delivered order

### Route Optimization
- `POST /api/vendor/optimize-routes` - Optimize delivery routes
- `POST /api/vendor/batch-assign-riders` - Batch assign riders

## 🔧 Common Issues & Solutions

### Issue: MongoDB Connection Error

**Solution:**
- Ensure MongoDB is running: `mongosh`
- Check `MONGO_URL` in backend `.env`
- For Atlas: Check IP whitelist and credentials

### Issue: Backend Won't Start

**Solution:**
- Activate virtual environment
- Install dependencies: `pip install -r requirements.txt`
- Check Python version: `python --version` (should be 3.11+)
- Check port 8001 is not in use: `lsof -i :8001` (macOS/Linux) or `netstat -ano | findstr :8001` (Windows)

### Issue: Frontend Won't Start

**Solution:**
- Delete `node_modules` and reinstall: `rm -rf node_modules && yarn install`
- Clear cache: `yarn cache clean`
- Check Node version: `node --version` (should be 18+)
- **Use yarn, not npm**: `yarn start` (not `npm start`)

### Issue: Google Maps Not Working

**Solution:**
- Check API key is set in both frontend and backend `.env` files
- Verify API key is valid in Google Cloud Console
- Enable required APIs (Maps JavaScript, Geocoding, Directions, Places)
- Check browser console for specific errors
- Ensure billing is enabled in Google Cloud (required for Maps API)

### Issue: Mobile App Not Connecting to Backend

**Solution:**
- Use local IP address instead of `localhost` in `REACT_APP_BACKEND_URL`
- Ensure backend is running with `--host 0.0.0.0`
- Check firewall settings allow connections on port 8001
- Ensure mobile device is on the same network as your computer
- Rebuild and sync after changing `.env`: `yarn build && npx cap sync`

### Issue: Push Notifications Not Working

**Solution:**
- iOS: Check Apple Developer Portal certificates and provisioning profiles
- Android: Ensure `google-services.json` is in `android/app/`
- Check push notification permissions are granted on device
- Verify user is logged in when initializing push notifications
- Check backend logs for token registration errors

### Issue: Capacitor Sync Fails

**Solution:**
- Build React app first: `yarn build`
- Clear Capacitor cache: `npx cap sync --force`
- Check `capacitor.config.json` has correct `webDir: "build"`
- For iOS: Run `pod install` in `ios/App` directory
- For Android: Click "Sync Project with Gradle Files" in Android Studio

### Issue: JWT Token Expired

**Solution:**
- Tokens expire after 30 days
- Log out and log in again to get a new token
- Check token expiry handling in axios interceptor
- Clear stored tokens: `localStorage.clear()` or reinstall app

## 📁 Project Structure

```
localtokri/
├── backend/
│   ├── server.py              # FastAPI main application
│   ├── seed_data.py          # Database seeding script
│   ├── requirements.txt      # Python dependencies
│   └── .env                  # Backend environment variables (create this)
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # Auth & push notification services
│   │   │   ├── authService.js          # Storage abstraction
│   │   │   └── pushNotificationService.js  # Push notifications
│   │   ├── lib/             # Utilities
│   │   ├── App.js           # Main React component
│   │   └── index.js         # Entry point
│   ├── public/              # Static assets
│   ├── ios/                 # iOS native project (generated by Capacitor)
│   ├── android/             # Android native project (generated by Capacitor)
│   ├── package.json         # Node dependencies
│   ├── capacitor.config.json # Capacitor configuration
│   └── .env                 # Frontend environment variables (create this)
├── test_result.md           # Testing documentation
└── README.md               # This file
```

## 🔐 Environment Variables Reference

### Backend `.env`

**File Location:** `/app/backend/.env`

```env
# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017          # For local MongoDB
# Or for MongoDB Atlas:
# MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority

DB_NAME=localtokri                          # Database name

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-make-it-long-and-random

# Google Maps API Key (required for route optimization and location features)
GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
```

### Frontend `.env`

**File Location:** `/app/frontend/.env`

```env
# Backend API URL
# For local development (web browser):
REACT_APP_BACKEND_URL=http://localhost:8001

# For mobile app testing on same network:
# REACT_APP_BACKEND_URL=http://192.168.1.100:8001
# (Replace with your computer's local IP)

# For production:
# REACT_APP_BACKEND_URL=https://your-api-domain.com

# Google Maps API Key (same as backend)
REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here

# Webpack Dev Server (for development)
WDS_SOCKET_PORT=3000
```

### Critical Changes Needed for Local Development:

1. **Backend `.env` must have:**
   - Valid `MONGO_URL` pointing to your MongoDB instance
   - Unique `JWT_SECRET` (generate with: `openssl rand -hex 32`)
   - Valid `GOOGLE_MAPS_API_KEY` if using location features

2. **Frontend `.env` must have:**
   - `REACT_APP_BACKEND_URL` pointing to your backend
   - For web: `http://localhost:8001`
   - For mobile on same network: `http://YOUR_LOCAL_IP:8001`
   - Same `REACT_APP_GOOGLE_MAPS_API_KEY` as backend

### Important Security Notes:
- **Never commit `.env` files to version control**
- Add `.env` to `.gitignore`
- Use different secrets for development and production
- Keep API keys secure and rotate them periodically

## 🚢 Deployment

### Backend Deployment
- Deploy to services like: Heroku, AWS, DigitalOcean, Railway, or Render
- Set environment variables in hosting platform
- Ensure MongoDB is accessible (use MongoDB Atlas for cloud)
- Use production-grade ASGI server:
  ```bash
  gunicorn server:app -w 4 -k uvicorn.workers.UvicornWorker
  ```

### Frontend Web Deployment
- Build: `yarn build`
- Deploy `build` folder to: Netlify, Vercel, or AWS S3 + CloudFront
- Update `REACT_APP_BACKEND_URL` to production API URL before building

### Mobile App Deployment
- iOS: Submit to App Store via App Store Connect
- Android: Submit to Google Play Console
- Update API URLs to production before building release versions

## 📝 Order Lifecycle

1. **Placed** - Customer places order (before midnight)
2. **Confirmed** - Vendor confirms the order
3. **Preparing** - Vendor starts preparing food
4. **Ready** - Food ready for pickup
5. **Out-for-Delivery** - Rider picks up and delivers
6. **Delivered** - Customer receives order
7. **Rated** (Optional) - Customer rates the experience

## 📄 License

This project is built for educational and commercial purposes.

## 🙏 Credits

Built with modern technologies:
- FastAPI & Python for robust backend
- React 19 for modern frontend
- MongoDB for flexible data storage
- Capacitor for native mobile apps
- Google Maps Platform for location services
- Shadcn/UI for beautiful components
- Tailwind CSS for styling

---

## 📞 Support & Troubleshooting

### Step-by-Step Troubleshooting:

1. **Check MongoDB is running:**
   ```bash
   mongosh
   ```

2. **Check backend is running:**
   ```bash
   curl http://localhost:8001/api/restaurants
   ```

3. **Check frontend can reach backend:**
   - Open browser console (F12)
   - Look for network errors
   - Verify `REACT_APP_BACKEND_URL` in frontend `.env`

4. **For mobile issues:**
   - Check device and computer are on same WiFi network
   - Verify firewall allows port 8001
   - Use IP address, not localhost
   - Check backend is bound to `0.0.0.0`

5. **Clear everything and start fresh:**
   ```bash
   # Backend
   cd backend
   rm -rf __pycache__
   pip install -r requirements.txt --force-reinstall
   
   # Frontend
   cd frontend
   rm -rf node_modules build
   yarn install
   yarn build
   npx cap sync
   ```

**Happy coding! 🚀**
