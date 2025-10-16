# Localtokri React Native Mobile App

A comprehensive React Native mobile application for the Localtokri food delivery platform. This app provides a full-featured mobile experience for customers, vendors, and riders with real-time order management, wallet integration, and location-based delivery tracking.

## 📱 Overview

Localtokri is a food delivery application that connects customers with local restaurants for fresh breakfast delivery. The mobile app offers native iOS and Android experiences with features like:

- **Customer App**: Browse restaurants, order food, manage wallet, track orders
- **Vendor Dashboard**: Manage orders, update order status in real-time
- **Rider Dashboard**: View assigned deliveries, navigate to customer locations, update delivery status

## 🚀 Features

### Customer Features
- ✅ User authentication (Login/Register)
- ✅ Browse restaurants and menus
- ✅ Add items to cart and place orders
- ✅ Integrated wallet system with mock payments
- ✅ Location picker with GPS and manual address entry
- ✅ Order tracking and history
- ✅ Rating and review system
- ✅ Profile management

### Vendor Features
- ✅ View all restaurant orders
- ✅ Update order status (Placed → Confirmed → Preparing → Ready)
- ✅ Real-time order statistics
- ✅ Order management dashboard

### Rider Features
- ✅ View assigned deliveries
- ✅ Delivery sequence optimization
- ✅ GPS navigation to customer location
- ✅ Update delivery status
- ✅ Track completed deliveries

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Expo CLI** - Install globally: `npm install -g expo-cli`
- **Git** - [Download](https://git-scm.com/)

### For iOS Development:
- **macOS** (required for iOS development)
- **Xcode** (latest version) - [Download from App Store](https://apps.apple.com/app/xcode/id497799835)
- **CocoaPods** - Install: `sudo gem install cocoapods`

### For Android Development:
- **Android Studio** - [Download](https://developer.android.com/studio)
- **Android SDK** (API Level 30 or higher)
- **Java Development Kit (JDK)** 11 or higher

### For Testing on Physical Devices:
- **Expo Go App** - Download from [iOS App Store](https://apps.apple.com/app/expo-go/id982107779) or [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

## 🛠️ Installation & Setup

### Step 1: Clone the Repository

```bash
# Navigate to the React Native app directory
cd frontend_reactnative
```

### Step 2: Install Dependencies

```bash
# Using npm
npm install

# OR using yarn (recommended)
yarn install
```

### Step 3: Configure API URL

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
```

**On Windows:**
```bash
ipconfig
```

Look for your computer's IPv4 address (usually starts with 192.168.x.x or 10.0.x.x)

### Step 4: Configure Google Maps (Optional but Recommended)

The app uses Google Maps for location features. Update the Google Maps API key:

1. **Get a Google Maps API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable "Maps SDK for Android" and "Maps SDK for iOS"
   - Create credentials (API Key)
   - Restrict the key to your app (optional but recommended)

2. **Update the API key in two places:**

   a. In `app.json`:
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

   b. In `src/config/api.js`:
   ```javascript
   export const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY_HERE';
   ```

## 🏃 Running the App

### Option 1: Using Expo Go (Easiest for Testing)

1. **Start the development server:**
   ```bash
   npm start
   # OR
   yarn start
   # OR
   expo start
   ```

2. **Scan the QR code:**
   - Install **Expo Go** on your phone
   - iOS: Scan with Camera app
   - Android: Scan with Expo Go app
   - Make sure your phone and computer are on the same WiFi network

### Option 2: Running on iOS Simulator (macOS only)

```bash
# Start iOS simulator
npm run ios
# OR
yarn ios
```

### Option 3: Running on Android Emulator

1. **Start Android Studio and open AVD Manager**
2. **Create and start an Android Virtual Device (AVD)**
3. **Run the app:**
   ```bash
   npm run android
   # OR
   yarn android
   ```

### Option 4: Running on Physical Device (Development Build)

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
   - Add money to wallet
   - Set delivery location (use GPS or manual entry)
   - Place order
   - Track order status

2. **Vendor Flow:**
   - Login as vendor
   - View incoming orders
   - Update order status: Placed → Confirmed → Preparing → Ready

3. **Rider Flow:**
   - Login as rider
   - View assigned deliveries
   - Navigate to customer location
   - Mark orders as delivered

## 🏗️ Project Structure

```
frontend_reactnative/
├── App.js                      # Main app entry point
├── app.json                    # Expo configuration
├── package.json                # Dependencies
├── babel.config.js             # Babel configuration
├── src/
│   ├── config/
│   │   └── api.js             # API configuration
│   ├── contexts/
│   │   └── AuthContext.js     # Authentication context
│   ├── navigation/
│   │   ├── RootNavigator.js   # Main navigation
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
└── assets/                    # Images and fonts
```

## 🔧 Configuration Files

### package.json
Contains all project dependencies including React Native, Expo, navigation libraries, and UI components.

### app.json
Expo configuration including app name, icons, splash screen, and platform-specific settings.

### babel.config.js
Babel transpiler configuration for React Native.

## 📦 Key Dependencies

```json
{
  "expo": "~51.0.0",
  "react": "18.2.0",
  "react-native": "0.74.5",
  "@react-navigation/native": "^6.1.17",
  "@react-navigation/bottom-tabs": "^6.5.20",
  "axios": "^1.6.8",
  "@react-native-async-storage/async-storage": "1.23.1",
  "react-native-maps": "1.14.0",
  "expo-location": "~17.0.1",
  "expo-notifications": "~0.28.1",
  "react-native-paper": "^5.12.3",
  "expo-linear-gradient": "~13.0.2"
}
```

## 🔐 Environment Variables

The app uses the following configuration:

- **API_URL**: Backend API endpoint
- **GOOGLE_MAPS_API_KEY**: Google Maps API key for location features

Update these in `src/config/api.js`

## 📍 Location Features

The app uses Expo Location API for:
- Getting user's current GPS location
- Reverse geocoding (coordinates to address)
- Google Maps for navigation

**Permissions Required:**
- iOS: Location When In Use
- Android: Fine Location, Coarse Location

## 💰 Wallet System

The app includes a mock wallet system:
- Add money without real payment gateway
- Automatic balance deduction on orders
- Transaction history tracking
- Insufficient balance validation

**Note:** For production, integrate a real payment gateway like Razorpay, Stripe, or Paytm.

## 🚀 Building for Production

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

### Submitting to Stores

```bash
# Submit to Google Play Store
eas submit --platform android

# Submit to App Store
eas submit --platform ios
```

## 🐛 Troubleshooting

### Common Issues

**1. "Unable to connect to backend"**
- Ensure backend server is running
- Check if API_URL in `src/config/api.js` is correct
- Verify your phone and computer are on the same network
- Try using your computer's IP address instead of `localhost`

**2. "Network request failed"**
- Check internet connection
- Verify backend URL is accessible
- Check if firewall is blocking connections

**3. "Google Maps not loading"**
- Verify Google Maps API key is correct
- Enable Maps SDK for Android/iOS in Google Cloud Console
- Check API key restrictions

**4. "Location permission denied"**
- Go to phone Settings → Apps → Localtokri → Permissions
- Enable Location permission

**5. "Metro bundler connection timeout"**
- Clear Metro cache: `expo start -c`
- Restart Expo development server
- Check if port 19000/19001 is available

### Getting Help

If you encounter issues:
1. Check the error message in the terminal
2. Look for errors in the app's console (shake device → "Show Performance Monitor")
3. Clear cache: `expo start --clear`
4. Reinstall dependencies: `rm -rf node_modules && yarn install`

## 📚 Additional Resources

- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation Docs](https://reactnavigation.org/)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)

## 🤝 Backend Integration

This mobile app connects to the FastAPI backend located in `/app/backend/`. Ensure the backend is running before testing the mobile app.

**Backend Requirements:**
- Python 3.8+
- FastAPI
- MongoDB
- Running on port 8001 (default)

**API Endpoints Used:**
- `/api/auth/login` - User authentication
- `/api/auth/register` - User registration
- `/api/restaurants` - List restaurants
- `/api/restaurants/{id}` - Restaurant details
- `/api/restaurants/{id}/menu` - Menu items
- `/api/orders` - Create/list orders
- `/api/wallet/*` - Wallet operations
- `/api/vendor/*` - Vendor operations
- `/api/rider/*` - Rider operations

## 📝 Development Notes

### Code Style
- Use functional components with hooks
- Follow React Native best practices
- Use meaningful variable and function names
- Add comments for complex logic

### State Management
- Local state with useState for component-level state
- Context API for global state (Auth)
- AsyncStorage for persistent data

### API Integration
- All API calls are centralized in `src/services/api.js`
- Axios is used for HTTP requests
- JWT token is stored in AsyncStorage
- Automatic token attachment to requests

## 🔒 Security Considerations

- JWT tokens stored securely in AsyncStorage
- API requests over HTTPS in production
- Input validation on all forms
- Secure password handling (never stored locally)

## 🎨 UI/UX Design

The app uses a consistent design system:
- **Primary Color:** Orange (#F97316)
- **Secondary Color:** Red (#DC2626)
- **Background:** Light Gray (#F9FAFB)
- **Text:** Dark Gray (#1F2937)

UI Components:
- Linear gradients for headers and buttons
- Card-based layouts
- Icon-based navigation
- Responsive design for various screen sizes

## 📱 App Icons and Splash Screen

To customize app icons and splash screen:

1. Replace `assets/icon.png` with your app icon (1024x1024px)
2. Replace `assets/splash.png` with your splash screen (1242x2436px)
3. Run `expo prebuild` to generate platform-specific assets

## 🌍 Internationalization (i18n)

Currently, the app is in English. To add multi-language support:
1. Install `react-native-i18n`
2. Create translation files
3. Update UI components to use translated strings

## 🔄 Updates and Maintenance

### Over-the-Air (OTA) Updates

Expo supports OTA updates without app store submissions:

```bash
# Publish an update
eas update --branch production --message "Bug fixes"
```

### Version Management

Update version in `app.json`:
```json
{
  "expo": {
    "version": "1.0.0",
    "android": {
      "versionCode": 1
    },
    "ios": {
      "buildNumber": "1"
    }
  }
}
```

## 📄 License

This project is part of the Localtokri food delivery platform.

## 👨‍💻 Support

For technical support or questions:
- Check the troubleshooting section above
- Review backend API documentation
- Ensure all dependencies are properly installed

---

**Happy Coding! 🚀**
