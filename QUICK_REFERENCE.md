# 🚀 Localtokri - Quick Reference Guide

## ⚡ Quick Commands

### Start Development
```bash
# Backend
cd backend && source venv/bin/activate && uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend
cd frontend && yarn start

# MongoDB (if not running as service)
mongod --dbpath /path/to/data
```

### Build for Mobile
```bash
cd frontend
yarn build
npx cap sync
```

### Open Mobile Projects
```bash
# iOS
npx cap open ios

# Android
npx cap open android
```

## 🔐 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| 👑 Admin | admin@quickbite.com | admin123 |
| 🏪 Vendor | vendor1@quickbite.com | vendor123 |
| 🚴 Rider | rider1@quickbite.com | rider123 |
| 👤 Customer | customer@quickbite.com | customer123 |

## 🌐 URLs

- Frontend: http://localhost:3000
- Backend: http://localhost:8001
- API Docs: http://localhost:8001/docs
- MongoDB: mongodb://localhost:27017

## 📂 Key Files

```
.env files (MUST CREATE):
├── backend/.env
│   ├── MONGO_URL=mongodb://localhost:27017
│   ├── DB_NAME=localtokri
│   ├── JWT_SECRET=your-secret-key
│   └── GOOGLE_MAPS_API_KEY=your-key
│
└── frontend/.env
    ├── REACT_APP_BACKEND_URL=http://localhost:8001
    ├── REACT_APP_GOOGLE_MAPS_API_KEY=your-key
    └── WDS_SOCKET_PORT=3000
```

## 🛠️ Common Tasks

### Reset Database
```bash
cd backend
python seed_data.py
```

### Clear and Rebuild Frontend
```bash
cd frontend
rm -rf node_modules build
yarn install
yarn build
```

### Fix Capacitor Issues
```bash
cd frontend
yarn build
npx cap sync --force
```

### Check Backend Logs
```bash
# If running with supervisor
tail -f /var/log/supervisor/backend.*.log

# If running with uvicorn directly
# Logs appear in terminal
```

## 🐛 Quick Troubleshooting

### Backend won't start
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### Frontend won't start
```bash
cd frontend
rm -rf node_modules
yarn install
```

### MongoDB connection error
```bash
# Check MongoDB is running
mongosh

# Start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

### Mobile app not connecting
1. Update `REACT_APP_BACKEND_URL` to your local IP (not localhost)
2. Find IP: `ifconfig` (Mac/Linux) or `ipconfig` (Windows)
3. Rebuild: `yarn build && npx cap sync`

## 📱 Mobile Testing Tips

### Android Emulator
1. Create AVD in Android Studio
2. Start emulator
3. Run app from Android Studio

### Physical Device
1. Enable Developer Options (tap Build Number 7 times)
2. Enable USB Debugging
3. Connect via USB
4. Device appears in Android Studio

### iOS Simulator (macOS only)
1. Open Xcode
2. Select simulator
3. Click Run

## 🔑 Environment Variables

### Required for Backend
- `MONGO_URL` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `DB_NAME` - Database name (localtokri)

### Required for Frontend
- `REACT_APP_BACKEND_URL` - Backend API URL
- `REACT_APP_GOOGLE_MAPS_API_KEY` - Google Maps API key

### Optional
- `GOOGLE_MAPS_API_KEY` (Backend) - For route optimization

## 📊 Order Status Flow

```
placed → confirmed → preparing → ready → out-for-delivery → delivered
                                                                 ↓
                                                              rated
```

## 🎯 User Roles & Permissions

| Feature | Customer | Vendor | Rider | Admin |
|---------|----------|--------|-------|-------|
| Browse Restaurants | ✅ | ✅ | ✅ | ✅ |
| Place Orders | ✅ | ❌ | ❌ | ✅ |
| Manage Restaurant | ❌ | ✅ | ❌ | ✅ |
| Accept Deliveries | ❌ | ❌ | ✅ | ✅ |
| View All Users | ❌ | ❌ | ❌ | ✅ |
| Manage Wallets | ❌ | ❌ | ❌ | ✅ |

## 🗺️ API Routes Overview

### Public Routes (No Auth Required)
- `GET /api/restaurants` - List restaurants
- `GET /api/restaurants/{id}` - Restaurant details
- `GET /api/restaurants/{id}/menu` - Menu items
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login

### Protected Routes (Auth Required)
- `GET /api/auth/me` - Current user
- `POST /api/orders` - Place order
- `GET /api/orders` - Get user's orders
- `PATCH /api/orders/{id}/status` - Update order status
- `GET /api/wallet/balance` - Wallet balance
- `POST /api/wallet/add-money` - Add money to wallet

### Vendor Only
- `POST /api/vendor/optimize-routes` - Route optimization
- `POST /api/vendor/batch-assign-riders` - Assign riders

### Admin Only
- `GET /api/admin/customers` - All customers
- `GET /api/admin/vendors` - All vendors
- `GET /api/admin/riders` - All riders
- `GET /api/admin/stats` - System statistics
- `POST /api/admin/add-wallet-money` - Add money to any wallet

## 📦 Tech Stack Summary

**Frontend:**
- React 19 + React Router v7
- Capacitor 7.4.3 (iOS & Android)
- Tailwind CSS + Shadcn/UI
- Google Maps API
- Axios, Sonner

**Backend:**
- FastAPI (Python)
- Motor (async MongoDB)
- JWT authentication
- Google Maps API

**Database:**
- MongoDB (users, restaurants, menu_items, orders, wallet_transactions)

## 🔄 Development Workflow

1. Start MongoDB
2. Start Backend (`uvicorn server:app --reload`)
3. Start Frontend (`yarn start`)
4. Make changes (auto-reloads)
5. For mobile: `yarn build → npx cap sync → Run in Studio`

## 📱 Screen Size Breakpoints

```css
/* Mobile phones */
< 768px - Stack layout, full-width cards

/* Tablets */
768px - 1023px - 2-column grid

/* Desktop */
>= 1024px - 3+ column grid, sidebar layouts
```

## 🎨 Color Scheme

- Primary: Orange (#f97316) to Red (#ef4444)
- Success: Green (#10b981)
- Warning: Yellow (#f59e0b)
- Danger: Red (#ef4444)
- Info: Blue (#3b82f6)

## 📞 Support Resources

- Full README: `/README_COMPLETE.md`
- Android Setup: `/ANDROID_SETUP_GUIDE.md`
- API Docs: `http://localhost:8001/docs` (when backend running)
- Testing Data: `/test_result.md`

## ⚠️ Important Notes

1. **Never use npm** - Always use `yarn`
2. **Mobile testing** - Use local IP, not localhost
3. **Backend URL** - Must start with http:// or https://
4. **First build** - Takes longer (Gradle sync for Android)
5. **.env files** - Never commit to Git
6. **Google Maps** - Requires billing enabled (free tier available)

## 🚢 Production Checklist

- [ ] Update `REACT_APP_BACKEND_URL` to production URL
- [ ] Generate new `JWT_SECRET` (openssl rand -hex 32)
- [ ] Set up MongoDB Atlas
- [ ] Restrict Google Maps API keys
- [ ] Enable HTTPS/SSL
- [ ] Build production app: `yarn build`
- [ ] Test on multiple devices
- [ ] Configure push notifications
- [ ] Submit to App Store / Google Play

---

**Need more details?** Check the full guides:
- Complete README: `README_COMPLETE.md`
- Android Testing: `ANDROID_SETUP_GUIDE.md`

Happy Coding! 🚀
