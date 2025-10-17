# Localtokri React Native Mobile App

> **⚠️ IMPORTANT: This app has been upgraded to Expo SDK 54!**
> 
> **For complete SDK 54 setup instructions, please see:**
> 📖 **[README_SDK54.md](./README_SDK54.md)** - Comprehensive guide for SDK 54 setup and development
> 
> **For deployment instructions, see:**
> 🚀 **[GCP_DEPLOYMENT_GUIDE.md](../GCP_DEPLOYMENT_GUIDE.md)** - Complete production deployment guide

---

## 📱 Quick Start (SDK 54)

### System Requirements (Updated for SDK 54)

- **Node.js:** 20.19.4+ (⚠️ Required for SDK 54)
- **Xcode:** 16.1+ for iOS development (⚠️ Required for SDK 54)
- **Expo CLI:** Latest version

### Installation

```bash
# Navigate to app directory
cd frontend_reactnative

# Install dependencies
yarn install

# Verify setup
npx expo-doctor

# Start development server
yarn start
```

### What's New in SDK 54?

- ✅ **React Native 0.81** - Latest stable version
- ✅ **React 19.1.0** - Latest React with improved performance
- ✅ **Reanimated v4** - Smooth 60 FPS animations
- ✅ **40% faster iOS builds** - Precompiled XCFrameworks
- ✅ **Android 16 support** - Latest Android compatibility
- ✅ **Performance optimizations** - Better rendering and state management

---

## 📚 Documentation

### Complete Guides

1. **[README_SDK54.md](./README_SDK54.md)** - Full SDK 54 setup guide
   - System requirements
   - Installation steps
   - Configuration
   - Running the app
   - Troubleshooting
   - SDK 54 migration notes

2. **[GCP_DEPLOYMENT_GUIDE.md](../GCP_DEPLOYMENT_GUIDE.md)** - Production deployment
   - Backend deployment (Cloud Run)
   - Database setup (MongoDB Atlas)
   - Frontend deployment (Firebase Hosting)
   - Mobile app deployment (Play Store/App Store)
   - Domain & SSL configuration
   - CI/CD setup
   - Monitoring & maintenance

---

## 🚀 Quick Reference

### Run on Different Platforms

```bash
# Expo Go (easiest for testing)
yarn start

# iOS Simulator (macOS only)
yarn ios

# Android Emulator
yarn android

# Web
yarn web
```

### Clear Cache

```bash
# Clear Metro bundler cache
yarn clean

# Or
expo start --clear
```

### Build for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Build Android APK
eas build --platform android --profile preview

# Build iOS
eas build --platform ios --profile preview
```

---

## 🏗️ Project Structure

```
frontend_reactnative/
├── src/
│   ├── config/          # API configuration
│   ├── contexts/        # React contexts (Auth)
│   ├── navigation/      # Navigation setup
│   ├── screens/         # App screens
│   │   ├── Auth/        # Login/Register
│   │   ├── Customer/    # Customer screens
│   │   ├── Vendor/      # Vendor dashboard
│   │   └── Rider/       # Rider dashboard
│   └── services/        # API services
├── App.js              # Entry point
├── app.json            # Expo config (SDK 54)
├── package.json        # Dependencies (SDK 54)
├── babel.config.js     # Babel + Reanimated
└── README_SDK54.md     # Full documentation
```

---

## 🔧 Configuration

### API URL

Update `src/config/api.js`:

```javascript
export const API_URL = 'http://YOUR_IP:8001/api';
export const GOOGLE_MAPS_API_KEY = 'YOUR_API_KEY';
```

### Finding Your Local IP

```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
```

---

## 📦 Tech Stack (SDK 54)

- **Expo SDK:** 54.0
- **React:** 19.1.0
- **React Native:** 0.81.0
- **React Navigation:** 7.x
- **Reanimated:** 4.x
- **React Native Maps:** 1.20.1
- **Expo Location:** 19.x
- **Expo Notifications:** 0.32.x

---

## 🧪 Test Accounts

```
Customer: customer@test.com / test123
Vendor: vendor@test.com / test123
Rider: rider@test.com / test123
```

---

## ⚠️ Important Notes

### SDK 54 Requirements

- Node.js **must be** 20.19.4 or higher
- Xcode **must be** 16.1 or higher (for iOS)
- Some packages have breaking changes from SDK 51

### Migration from SDK 51

If you're upgrading from SDK 51:
1. Update Node.js to 20+
2. Update Xcode to 16.1+ (iOS)
3. Run `yarn install`
4. Run `npx expo-doctor`
5. Clear cache with `expo start --clear`

See [README_SDK54.md](./README_SDK54.md) for detailed migration notes.

---

## 🐛 Common Issues

### "Node.js version not supported"
**Solution:** Upgrade to Node.js 20.19.4+

### "Xcode version too old"
**Solution:** Update Xcode to 16.1+ from App Store

### "Unable to connect to backend"
**Solution:** 
1. Check API_URL in src/config/api.js
2. Ensure backend is running
3. Use IP address, not localhost
4. Check firewall settings

### "Metro bundler error"
**Solution:** Clear cache with `expo start --clear`

See [README_SDK54.md](./README_SDK54.md) for complete troubleshooting guide.

---

## 📚 Learn More

- [Expo SDK 54 Changelog](https://expo.dev/changelog/sdk-54)
- [React Native 0.81 Release](https://reactnative.dev/blog)
- [React 19 Documentation](https://react.dev)
- [Reanimated v4 Docs](https://docs.swmansion.com/react-native-reanimated/)

---

## 🤝 Support

For detailed documentation and troubleshooting:
- 📖 [README_SDK54.md](./README_SDK54.md)
- 🚀 [GCP_DEPLOYMENT_GUIDE.md](../GCP_DEPLOYMENT_GUIDE.md)

---

**Upgraded to SDK 54 • Built with ❤️ • Ready for Production 🚀**

