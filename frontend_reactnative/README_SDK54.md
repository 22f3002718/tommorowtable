# Localtokri React Native Mobile App - SDK 54

A comprehensive React Native mobile application for the Localtokri food delivery platform built with **Expo SDK 54** and **React Native 0.81**. This app provides a full-featured mobile experience for customers, vendors, and riders with real-time order management, wallet integration, and location-based delivery tracking.

## 📱 Overview

Localtokri is a food delivery application that connects customers with local restaurants for fresh breakfast delivery. The mobile app offers native iOS and Android experiences with features like:

- **Customer App**: Browse restaurants, order food, manage wallet, track orders
- **Vendor Dashboard**: Manage orders, update order status in real-time
- **Rider Dashboard**: View assigned deliveries, navigate to customer locations, update delivery status

## 🚀 What's New in SDK 54

This app has been upgraded from **Expo SDK 51** to **SDK 54** with the following improvements:

### Core Updates
- ✅ **React Native 0.81** - Latest stable version with performance improvements
- ✅ **React 19.1.0** - Latest React with improved rendering and concurrent features
- ✅ **Reanimated v4** - Smooth 60 FPS animations and gestures
- ✅ **Precompiled iOS builds** - 40% faster iOS builds with precompiled XCFrameworks
- ✅ **Android 16 support** - API Level 36 compatibility
- ✅ **New Architecture Ready** - Prepared for React Native's New Architecture

### Performance Optimizations
- ✅ Optimized FlatList rendering with proper keys and memoization
- ✅ Improved image loading and caching
- ✅ Reduced re-renders with React.memo and useMemo
- ✅ Better state management patterns
- ✅ Smoother animations with Reanimated v4

### UI/UX Enhancements
- ✅ Enhanced visual design with better shadows and elevations
- ✅ Improved color gradients and visual hierarchy
- ✅ Better loading states and transitions
- ✅ Smoother gestures and interactions

## 📋 Prerequisites

### System Requirements

**Node.js:** Version 20.19.4 or higher (⚠️ **SDK 54 requirement**)
```bash
# Check your Node.js version
node --version

# If < 20.19.4, upgrade Node.js from https://nodejs.org/
```

**Package Manager:** Yarn (recommended) or npm
```bash
# Install Yarn globally
npm install -g yarn
```

**Expo CLI:** Install globally
```bash
npm install -g expo-cli
```

**Git:** [Download from git-scm.com](https://git-scm.com/)

### For iOS Development (macOS Only):

**Xcode:** Version 16.1 or higher (⚠️ **SDK 54 requirement**)
- Download from [Mac App Store](https://apps.apple.com/app/xcode/id497799835)
- SDK 54 requires Xcode 16.1 minimum
- Xcode 16.2+ recommended for optimal performance

**CocoaPods:** Install via Ruby gems
```bash
sudo gem install cocoapods
```

### For Android Development:

**Android Studio:** Latest version
- Download from [developer.android.com](https://developer.android.com/studio)
- Install Android SDK API Level 30 or higher
- Configure Android SDK in Android Studio → Preferences → Appearance & Behavior → System Settings → Android SDK

**Java Development Kit (JDK):** Version 11 or higher
```bash
# Check Java version
java -version
```

### For Testing on Physical Devices:

**Expo Go App:** 
- iOS: [Download from App Store](https://apps.apple.com/app/expo-go/id982107779)
- Android: [Download from Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

## 🛠️ Installation & Setup

### Step 1: Clone the Repository

```bash
# Navigate to the React Native app directory
cd frontend_reactnative
```

### Step 2: Install Dependencies

```bash
# Using Yarn (recommended)
yarn install

# OR using npm
npm install
```

### Step 3: Verify Installation

Run Expo Doctor to check for any issues:
```bash
npx expo-doctor
```

This will check:
- Node.js version compatibility
- Package version mismatches
- Configuration issues
- Platform-specific requirements

### Step 4: Configure API URL

Open `src/config/api.js` and update the API URL:

```javascript
// For local development on physical device or emulator
// Replace with your computer's local IP address
export const API_URL = 'http://192.168.1.100:8001/api';

// For production
export const API_URL = 'https://your-production-api.com/api';
```

**Finding your local IP address:**

**On macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
# OR
hostname -I
```

**On Windows:**
```bash
ipconfig
```

Look for your computer's IPv4 address (usually starts with 192.168.x.x or 10.0.x.x)

### Step 5: Configure Google Maps API Key

The app uses Google Maps for location features. Update the API key in two places:

#### 1. Get a Google Maps API Key:

- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Create a new project or select existing one
- Enable these APIs:
  - Maps SDK for Android
  - Maps SDK for iOS
  - Places API
  - Geocoding API
- Create credentials → API Key
- (Optional) Restrict the key to your app for security

#### 2. Update the API key:

**a. In `app.json`:**
```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_GOOGLE_MAPS_API_KEY_HERE"
        }
      }
    }
  }
}
```

**b. In `src/config/api.js`:**
```javascript
export const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY_HERE';
```

## 🏃 Running the App

### Option 1: Using Expo Go (Easiest for Testing)

1. **Start the development server:**
   ```bash
   yarn start
   # OR
   npm start
   # OR
   expo start
   ```

2. **Scan the QR code:**
   - Install **Expo Go** on your phone
   - iOS: Scan with Camera app
   - Android: Scan with Expo Go app
   - Make sure your phone and computer are on the same WiFi network

3. **Development Menu:**
   - iOS: Shake device or press ⌘D
   - Android: Shake device or press Ctrl+M

### Option 2: Running on iOS Simulator (macOS only)

```bash
# Start iOS simulator
yarn ios
# OR
expo run:ios
```

**Note:** First run will take longer as it builds the native app.

### Option 3: Running on Android Emulator

1. **Start Android Studio and open AVD Manager**
2. **Create and start an Android Virtual Device (AVD)**
3. **Run the app:**
   ```bash
   yarn android
   # OR
   expo run:android
   ```

### Option 4: Development Build (Better Performance)

For better performance and native features:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Configure the project
eas build:configure

# Build for Android
eas build --platform android --profile development

# Build for iOS (macOS with Xcode required)
eas build --platform ios --profile development
```

## 🔧 Development Commands

### Clear Cache and Restart

If you encounter issues:
```bash
# Clear Metro bundler cache
yarn clean
# OR
expo start --clear

# Delete node_modules and reinstall
rm -rf node_modules yarn.lock
yarn install
```

### Prebuild Native Projects

To generate native iOS and Android folders:
```bash
npx expo prebuild

# Clean prebuild (removes and regenerates)
npx expo prebuild --clean
```

### Update Dependencies

To update all dependencies to SDK 54 compatible versions:
```bash
npx expo install --fix
```

## 📱 Testing the App

### Test Accounts

You can create accounts directly in the app or use these test credentials:

**Customer Account:**
```
Email: customer@test.com
Password: test123
```

**Vendor Account:**
```
Email: vendor@test.com
Password: test123
```

**Rider Account:**
```
Email: rider@test.com
Password: test123
```

### Testing Workflow

1. **Customer Flow:**
   - Register/Login as customer
   - Browse restaurants
   - Add items to cart
   - Add money to wallet (mock payment)
   - Set delivery location (use GPS or manual entry)
   - Place order
   - Track order status in real-time

2. **Vendor Flow:**
   - Login as vendor
   - View incoming orders
   - Update order status: Placed → Confirmed → Preparing → Ready
   - Use batch optimization for multiple orders

3. **Rider Flow:**
   - Login as rider
   - View assigned deliveries with sequence numbers
   - Navigate to customer location using GPS
   - Mark orders as delivered

## 🏗️ Project Structure

```
frontend_reactnative/
├── App.js                      # Main app entry point
├── app.json                    # Expo configuration (SDK 54)
├── package.json                # Dependencies (SDK 54 compatible)
├── babel.config.js             # Babel + Reanimated plugin
├── index.js                    # App registration
├── src/
│   ├── config/
│   │   └── api.js             # API configuration
│   ├── contexts/
│   │   └── AuthContext.js     # Authentication context
│   ├── navigation/
│   │   ├── RootNavigator.js   # Main navigation (React Navigation 7)
│   │   ├── AuthNavigator.js   # Auth screens navigation
│   │   ├── CustomerNavigator.js
│   │   ├── VendorNavigator.js
│   │   └── RiderNavigator.js
│   ├── screens/
│   │   ├── Auth/
│   │   │   ├── LoginScreen.js
│   │   │   └── RegisterScreen.js
│   │   ├── Customer/
│   │   │   ├── HomeScreen.js
│   │   │   ├── RestaurantScreen.js
│   │   │   ├── CheckoutScreen.js
│   │   │   ├── OrdersScreen.js
│   │   │   ├── WalletScreen.js
│   │   │   └── ProfileScreen.js
│   │   ├── Vendor/
│   │   │   └── VendorDashboardScreen.js
│   │   └── Rider/
│   │       └── RiderDashboardScreen.js
│   └── services/
│       └── api.js             # API service functions
└── assets/                    # Images, icons, fonts
    ├── icon.png
    ├── splash.png
    ├── adaptive-icon.png
    └── notification-icon.png
```

## 📦 Key Dependencies (SDK 54 Compatible)

```json
{
  "expo": "~54.0.0",
  "react": "19.1.0",
  "react-native": "0.81.0",
  "@react-navigation/native": "^7.1.18",
  "@react-navigation/bottom-tabs": "^7.4.9",
  "@react-navigation/stack": "^7.4.10",
  "react-native-reanimated": "~4.1.1",
  "react-native-maps": "1.20.1",
  "expo-location": "~19.0.7",
  "expo-notifications": "~0.32.12",
  "react-native-paper": "^5.14.5",
  "axios": "^1.7.9"
}
```

## 🔐 Environment Configuration

The app uses the following configuration in `src/config/api.js`:

- **API_URL**: Backend API endpoint
- **GOOGLE_MAPS_API_KEY**: Google Maps API key for location features

Update these before running the app in different environments.

## 🚀 Building for Production

### Create EAS Build Configuration

Create `eas.json` in the project root:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Android APK/AAB

```bash
# Build APK for testing
eas build --platform android --profile preview

# Build AAB for Google Play Store
eas build --platform android --profile production
```

### iOS IPA

```bash
# Build for TestFlight/Ad-hoc
eas build --platform ios --profile preview

# Build for App Store
eas build --platform ios --profile production
```

### Submit to Stores

```bash
# Submit to Google Play Store
eas submit --platform android

# Submit to App Store
eas submit --platform ios
```

## 🐛 Troubleshooting

### Common Issues

**1. Node.js Version Error**
```
Error: Expo SDK 54 requires Node.js 20.19.4 or higher
```
**Solution:** Upgrade Node.js from https://nodejs.org/

**2. Xcode Version Error (iOS)**
```
Error: Xcode 16.1 or higher is required
```
**Solution:** Update Xcode from the Mac App Store

**3. "Unable to connect to backend"**
- Ensure backend server is running on port 8001
- Check if API_URL in `src/config/api.js` is correct
- Verify your phone and computer are on the same network
- Try using your computer's IP address instead of `localhost`
- Check firewall settings

**4. "Network request failed"**
- Check internet connection
- Verify backend URL is accessible
- Test backend with curl: `curl http://YOUR_IP:8001/api/restaurants`

**5. "Google Maps not loading"**
- Verify Google Maps API key is correct in both `app.json` and `src/config/api.js`
- Enable required APIs in Google Cloud Console:
  - Maps SDK for Android
  - Maps SDK for iOS
  - Places API
  - Geocoding API
- Check API key restrictions
- Wait a few minutes after creating new API key

**6. "Location permission denied"**
- Go to phone Settings → Apps → Localtokri → Permissions
- Enable Location permission (When in use or Always)

**7. "Metro bundler connection timeout"**
```bash
# Clear Metro cache
expo start --clear

# Check if ports 19000/19001/8081 are available
lsof -ti:19000 | xargs kill -9
lsof -ti:19001 | xargs kill -9
lsof -ti:8081 | xargs kill -9
```

**8. "Invariant Violation: requireNativeComponent"**
- This usually means native modules aren't linked properly
```bash
# For development builds, rebuild the app
npx expo prebuild --clean
yarn ios  # or yarn android
```

**9. "Reanimated plugin not found"**
- Ensure `babel.config.js` includes the Reanimated plugin:
```javascript
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: ['react-native-reanimated/plugin'],
};
```
- Clear cache: `expo start --clear`

**10. Package version mismatch**
```bash
# Fix all package versions for SDK 54
npx expo install --fix

# Verify no issues
npx expo-doctor
```

### Getting Help

If you encounter issues:
1. Check error message in terminal
2. Run `npx expo-doctor` to diagnose issues
3. Clear cache: `expo start --clear`
4. Reinstall dependencies: `rm -rf node_modules && yarn install`
5. Check Expo documentation: https://docs.expo.dev/
6. Search Expo forums: https://forums.expo.dev/

## 📚 SDK 54 Migration Notes

### Breaking Changes from SDK 51

1. **Node.js Requirement:** Minimum version increased to 20.19.4
2. **Xcode Requirement:** Minimum version increased to 16.1 for iOS
3. **React 19:** Updated to React 19.1.0 with new features
4. **React Native 0.81:** Several API improvements and deprecations
5. **React Navigation 7:** Updated to v7 with improved TypeScript support
6. **Reanimated v4:** New worklets API and improved performance

### What Was Updated

- ✅ All Expo packages updated to SDK 54 compatible versions
- ✅ React Navigation updated from v6 to v7
- ✅ Reanimated plugin added to Babel config
- ✅ App version bumped to 2.0.0
- ✅ Android versionCode updated to 2
- ✅ iOS buildNumber updated to 2.0.0

### Performance Improvements

- **iOS Builds:** 40% faster with precompiled XCFrameworks
- **Android:** Better support for Android 16 (API 36)
- **Animations:** Smoother with Reanimated v4
- **Rendering:** Improved with React 19's concurrent features

## 🎨 UI/UX Design

The app uses a consistent design system:

### Color Palette
- **Primary:** Orange (#F97316) - Brand color
- **Secondary:** Red (#DC2626) - Accents
- **Background:** Light Gray (#F9FAFB) - Main background
- **Card Background:** White (#FFFFFF)
- **Text Primary:** Dark Gray (#1F2937)
- **Text Secondary:** Medium Gray (#6B7280)
- **Success:** Green (#10B981)
- **Warning:** Yellow (#F59E0B)
- **Error:** Red (#EF4444)

### Design Principles
- Linear gradients for headers and primary buttons
- Card-based layouts with subtle shadows
- Icon-based navigation (React Native Vector Icons)
- Responsive design for various screen sizes
- Consistent spacing (8px grid system)
- Material Design principles

## 💰 Wallet System

The app includes a mock wallet system for development:

- Add money without real payment gateway
- Automatic balance deduction on orders
- Transaction history tracking
- Insufficient balance validation
- Real-time balance updates

**Note:** For production, integrate a real payment gateway like Razorpay, Stripe, or Paytm. See the main deployment guide for integration instructions.

## 🤝 Backend Integration

This mobile app connects to the FastAPI backend located in `/app/backend/`.

**Backend Requirements:**
- Python 3.8+
- FastAPI
- MongoDB
- Running on port 8001 (default)

**API Endpoints Used:**
- `/api/auth/login` - User authentication
- `/api/auth/register` - User registration
- `/api/auth/me` - Get current user
- `/api/restaurants` - List restaurants
- `/api/restaurants/{id}` - Restaurant details
- `/api/restaurants/{id}/menu` - Menu items
- `/api/orders` - Create/list orders
- `/api/wallet/*` - Wallet operations
- `/api/vendor/*` - Vendor operations
- `/api/rider/*` - Rider operations

## 📝 Code Quality

### Best Practices

- ✅ Functional components with hooks
- ✅ Proper component memoization (React.memo)
- ✅ Optimized re-renders (useMemo, useCallback)
- ✅ TypeScript ready (can migrate to TS)
- ✅ ESLint configured
- ✅ Proper error handling
- ✅ Loading states for all async operations
- ✅ Responsive layouts

### State Management
- Local state with `useState` for component-level state
- Context API for global state (Auth, User)
- AsyncStorage for persistent data (tokens, user prefs)
- No external state management library needed (app is small)

### API Integration
- All API calls centralized in `src/services/api.js`
- Axios for HTTP requests
- JWT token stored in AsyncStorage
- Automatic token attachment via Axios interceptors
- Proper error handling and user feedback

## 🔒 Security Considerations

- ✅ JWT tokens stored securely in AsyncStorage
- ✅ API requests over HTTPS in production
- ✅ Input validation on all forms
- ✅ Secure password handling (never stored locally)
- ✅ Google Maps API key restrictions
- ✅ Proper permission handling (Location, Notifications)

## 📱 App Icons and Splash Screen

To customize app icons and splash screen:

1. **App Icon:** Replace `assets/icon.png` with your icon (1024x1024px)
2. **Splash Screen:** Replace `assets/splash.png` with your splash (1242x2436px)
3. **Adaptive Icon (Android):** Replace `assets/adaptive-icon.png` (1024x1024px)
4. **Notification Icon:** Replace `assets/notification-icon.png` (96x96px, transparent)

Then run:
```bash
npx expo prebuild
```

## 🌍 Internationalization (i18n)

Currently, the app is in English. To add multi-language support:

1. Install i18n library:
```bash
yarn add i18n-js
```

2. Create translation files:
```javascript
// locales/en.json
{
  "welcome": "Welcome to Localtokri",
  "restaurants": "Restaurants",
  // ... more translations
}
```

3. Update components to use translations
4. Add language selector in settings

## 🔄 Over-the-Air (OTA) Updates

Expo supports OTA updates without app store submissions:

```bash
# Install EAS Update
npm install -g eas-cli

# Configure updates
eas update:configure

# Publish an update
eas update --branch production --message "Bug fixes and improvements"
```

Users will receive updates automatically without reinstalling the app!

## 📊 Analytics & Monitoring

To add analytics:

```bash
# Install Expo Analytics
npx expo install expo-firebase-analytics

# Or use other services
yarn add @react-native-firebase/analytics
```

## 🧪 Testing

### Manual Testing
- Test on both iOS and Android
- Test on different screen sizes
- Test with slow network (Dev Tools → Network Throttling)
- Test offline behavior
- Test with real backend

### Automated Testing (Optional)
```bash
# Install testing libraries
yarn add --dev jest @testing-library/react-native

# Run tests
yarn test
```

## 📄 License

This project is part of the Localtokri food delivery platform.

## 👨‍💻 Support

For technical support:
- Check troubleshooting section above
- Run `npx expo-doctor` for diagnostics
- Review Expo SDK 54 changelog: https://expo.dev/changelog/sdk-54
- Expo documentation: https://docs.expo.dev/
- React Native docs: https://reactnative.dev/

## 🎉 What's Next?

After getting the app running, consider:

1. **Deploy Backend:** See `GCP_DEPLOYMENT_GUIDE.md` for production deployment
2. **Build Production Apps:** Use EAS Build for app store submissions
3. **Add Real Payment:** Integrate Razorpay/Stripe/Paytm
4. **Add Push Notifications:** Configure FCM for real-time order updates
5. **Add Analytics:** Track user behavior and app performance
6. **Add Crash Reporting:** Use Sentry or Firebase Crashlytics
7. **Optimize Performance:** Use React DevTools to identify bottlenecks

---

**Built with ❤️ using Expo SDK 54 • React Native 0.81 • React 19**

**Happy Coding! 🚀**
