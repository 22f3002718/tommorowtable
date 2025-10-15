# 📱 Android Testing Guide for Localtokri App

## Complete Setup Guide for Beginners

This guide will walk you through setting up Android Studio and testing the Localtokri app on both an emulator and a physical Android device.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installing Android Studio](#installing-android-studio)
3. [Initial Android Studio Setup](#initial-android-studio-setup)
4. [Configuring the Localtokri App](#configuring-the-localtokri-app)
5. [Testing on Android Emulator](#testing-on-android-emulator)
6. [Testing on Physical Device](#testing-on-physical-device)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

Before you begin, ensure you have:

- ✅ **Computer Requirements:**
  - Windows 10/11, macOS 10.14+, or Linux (Ubuntu 18.04+)
  - Minimum 8GB RAM (16GB recommended)
  - At least 10GB of free disk space
  - Intel Core i5 or equivalent processor

- ✅ **Software Already Installed:**
  - Node.js (v18 or higher)
  - Yarn package manager
  - The Localtokri project files

- ✅ **Optional:**
  - Android device with USB cable (for physical device testing)

---

## 📥 Installing Android Studio

### Step 1: Download Android Studio

1. Visit the official Android Studio website: [https://developer.android.com/studio](https://developer.android.com/studio)
2. Click the **"Download Android Studio"** button
3. Accept the terms and conditions
4. The download should start automatically (approximately 1GB)

### Step 2: Install Android Studio

#### For Windows:

1. Locate the downloaded `.exe` file (usually in your Downloads folder)
2. Double-click the installer file
3. Follow the installation wizard:
   - Click **"Next"** on the welcome screen
   - Choose installation location (default is recommended)
   - Select **"Android Studio"** and **"Android Virtual Device"**
   - Click **"Next"** → **"Install"**
4. When installation completes, click **"Finish"**
5. Android Studio will launch automatically

#### For macOS:

1. Locate the downloaded `.dmg` file
2. Double-click to mount the disk image
3. Drag **Android Studio** to your **Applications** folder
4. Open **Applications** and double-click **Android Studio**
5. If you see a security warning, go to **System Preferences** → **Security & Privacy** → Click **"Open Anyway"**

#### For Linux:

```bash
# Extract the downloaded archive
sudo tar -xvzf android-studio-*.tar.gz -C /opt/

# Navigate to Android Studio bin directory
cd /opt/android-studio/bin

# Run the studio script
./studio.sh
```

---

## ⚙️ Initial Android Studio Setup

### Step 1: First Launch Configuration

1. When Android Studio launches for the first time, you'll see the **"Import Settings"** dialog
   - Select **"Do not import settings"** (if this is your first time)
   - Click **"OK"**

2. **Data Sharing:**
   - Choose whether to share usage statistics with Google
   - Click **"Next"**

3. **Android Studio Setup Wizard:**
   - Click **"Next"** on the welcome screen

4. **Install Type:**
   - Select **"Standard"** (recommended for beginners)
   - Click **"Next"**

5. **UI Theme:**
   - Choose between **Darcula** (dark) or **Light** theme
   - Click **"Next"**

6. **Verify Settings:**
   - Review the components that will be installed:
     - Android SDK
     - Android SDK Platform
     - Android Virtual Device
     - Performance (Intel HAXM for Windows/Linux, or Hypervisor.Framework for macOS)
   - Note the SDK installation location (you may need this later)
   - Click **"Finish"**

7. **Downloading Components:**
   - Android Studio will now download necessary components (this may take 15-30 minutes)
   - **Do not close Android Studio** during this process
   - Wait for all downloads to complete

8. When complete, click **"Finish"**

### Step 2: Install Additional SDK Components

1. On the Android Studio welcome screen, click **"More Actions"** → **"SDK Manager"**
   
   (Or if you have a project open: **Tools** → **SDK Manager**)

2. In the **SDK Platforms** tab:
   - Check **"Android 13.0 (Tiramisu)"** - API Level 33 ✅
   - Check **"Android 14.0 (UpsideDownCake)"** - API Level 34 ✅
   - Click **"Apply"** → **"OK"**
   - Wait for installation to complete

3. Switch to the **SDK Tools** tab:
   - Ensure these are checked:
     - ✅ Android SDK Build-Tools
     - ✅ Android SDK Command-line Tools
     - ✅ Android Emulator
     - ✅ Android SDK Platform-Tools
     - ✅ Intel x86 Emulator Accelerator (HAXM installer) - for Windows/Linux
     - ✅ Google Play services
   - Click **"Apply"** → **"OK"**
   - Accept licenses and wait for installation

---

## 🔨 Configuring the Localtokri App

### Step 1: Prepare the React App

1. Open a terminal/command prompt
2. Navigate to the frontend directory:
   ```bash
   cd /path/to/localtokri/frontend
   ```

3. Install dependencies (if not already installed):
   ```bash
   yarn install
   ```

4. **IMPORTANT:** Configure the backend URL for mobile testing:
   
   **Option A: Testing with Local Backend**
   
   Find your computer's local IP address:
   
   **Windows:**
   ```bash
   ipconfig
   # Look for "IPv4 Address" under your active network adapter
   # Example: 192.168.1.100
   ```
   
   **macOS/Linux:**
   ```bash
   ifconfig | grep "inet "
   # or
   ip addr show
   # Look for inet address like: 192.168.1.100
   ```
   
   Edit `frontend/.env` file:
   ```env
   REACT_APP_BACKEND_URL=http://YOUR_LOCAL_IP:8001
   # Example: REACT_APP_BACKEND_URL=http://192.168.1.100:8001
   
   REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
   WDS_SOCKET_PORT=3000
   ```
   
   **Option B: Testing with Production Backend**
   ```env
   REACT_APP_BACKEND_URL=https://your-production-api.com
   REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
   WDS_SOCKET_PORT=3000
   ```

5. Build the React app:
   ```bash
   yarn build
   ```
   
   Wait for the build to complete (this creates an optimized production build in the `build` folder)

6. Sync with Capacitor:
   ```bash
   npx cap sync android
   ```
   
   This command:
   - Copies the web build to the Android project
   - Updates native dependencies
   - Configures Capacitor plugins

### Step 2: Open the Project in Android Studio

1. In Android Studio, click **"Open"** on the welcome screen
   
   (Or **File** → **Open** if you have another project open)

2. Navigate to the Android project folder:
   ```
   /path/to/localtokri/frontend/android
   ```
   
3. Click **"OK"**

4. **First-time project opening:**
   - Android Studio will perform a **Gradle Sync**
   - This process downloads project dependencies
   - **Wait for Gradle sync to complete** (bottom right corner shows progress)
   - This may take 5-15 minutes on first run
   
   ⚠️ **If you see Gradle errors:**
   - Make sure you have a stable internet connection
   - Wait for sync to complete before making any changes

---

## 🖥️ Testing on Android Emulator

An emulator lets you test the app on a virtual Android device without needing a physical phone.

### Step 1: Create a Virtual Device

1. In Android Studio, click the **Device Manager** icon in the top-right toolbar
   
   (Or **Tools** → **Device Manager**)

2. Click **"Create Device"** (+ icon)

3. **Select Hardware:**
   - Category: **Phone**
   - Choose a device definition:
     - **Pixel 6** (recommended for modern apps)
     - or **Pixel 5** (for mid-range testing)
     - or **Pixel 3a** (for lower-end device testing)
   - Click **"Next"**

4. **Select System Image:**
   - Click the **"x86 Images"** tab (for faster performance)
   - Select **"Tiramisu"** (Android 13, API Level 33) with Google Play
     - If you see a **"Download"** link, click it and wait for download to complete
   - Click **"Next"**

5. **Verify Configuration:**
   - Give your AVD a name (e.g., "Localtokri Test Device")
   - **Advanced Settings:**
     - RAM: 2048 MB minimum (4096 MB recommended)
     - Internal Storage: 4096 MB minimum
     - SD Card: 512 MB (optional)
   - Click **"Finish"**

### Step 2: Start the Emulator

1. In the **Device Manager**, find your newly created virtual device
2. Click the **▶️ (Play/Launch)** icon next to the device name
3. The emulator will start (first launch takes 2-3 minutes)
4. Wait until you see the Android home screen

### Step 3: Run the Localtokri App

1. Ensure your emulator is running and showing the home screen
2. In Android Studio, look at the top toolbar:
   - Device dropdown should show your emulator name (e.g., "Pixel 6 API 33")
   - Configuration dropdown should show **"app"**
3. Click the **▶️ Run** button (green play icon) in the toolbar
   
   **Or press:** `Shift + F10` (Windows/Linux) or `Ctrl + R` (macOS)

4. Android Studio will:
   - Build the app (first build takes 2-5 minutes)
   - Install the app on the emulator
   - Launch the app automatically

5. **Success!** The Localtokri app should now open on the emulator

### Step 4: Testing the App

Now test the app functionality:

1. **Test Login:**
   - Try logging in with test credentials:
     - Customer: `customer@quickbite.com` / `customer123`
     - Vendor: `vendor1@quickbite.com` / `vendor123`
     - Rider: `rider1@quickbite.com` / `rider123`
     - Admin: `admin@quickbite.com` / `admin123`

2. **Test Navigation:**
   - Browse restaurants
   - Add items to cart
   - Test location selection

3. **Test Responsiveness:**
   - Rotate the device (Ctrl+Left/Right arrow keys)
   - Check if layouts adapt properly

4. **Check Logs:**
   - In Android Studio, open the **Logcat** tab (bottom panel)
   - Filter by app name to see console logs
   - Look for any errors (shown in red)

---

## 📱 Testing on Physical Device

Testing on a real device provides the most accurate experience.

### Step 1: Enable Developer Options on Your Android Device

1. On your Android phone/tablet:
   - Open **Settings**
   - Scroll to **About Phone** (or **About Device**)
   - Find **Build Number**
   - **Tap Build Number 7 times**
   - You'll see a message: "You are now a developer!"

### Step 2: Enable USB Debugging

1. Go back to **Settings**
2. Open **Developer Options** (now visible in Settings)
   
   (Location varies: might be under **System** → **Developer Options**)

3. Enable **USB Debugging**:
   - Toggle **USB Debugging** to ON
   - If prompted, tap **"OK"** to allow USB debugging

4. (Optional but Recommended) Enable:
   - **Stay Awake** - screen stays on while charging
   - **USB Installation** - allows app installation via USB

### Step 3: Connect Your Device

1. Connect your Android device to your computer using a USB cable

2. On your device:
   - You'll see a prompt: **"Allow USB debugging?"**
   - Check **"Always allow from this computer"**
   - Tap **"OK"** or **"Allow"**

3. On your computer:
   - Open Android Studio
   - Wait a moment for the device to be recognized
   - Your device should appear in the device dropdown (top toolbar)

**Troubleshooting Connection Issues:**

- **Device not showing up?**
  - Try a different USB cable (some cables are charge-only)
  - Try a different USB port on your computer
  - Make sure you tapped "Allow" on the USB debugging prompt
  
- **On Windows:** Install USB drivers
  - Download drivers from your phone manufacturer's website
  - Or install **Google USB Driver** via Android Studio SDK Manager
  
- **On macOS:** Usually works out of the box
  
- **On Linux:** Add udev rules
  ```bash
  # Create udev rules file
  sudo nano /etc/udev/rules.d/51-android.rules
  
  # Add this line (replace XXXX with your device's vendor ID from lsusb):
  SUBSYSTEM=="usb", ATTR{idVendor}=="XXXX", MODE="0666", GROUP="plugdev"
  
  # Reload udev rules
  sudo udevadm control --reload-rules
  sudo udevadm trigger
  ```

### Step 4: Run the App on Physical Device

1. In Android Studio:
   - Select your physical device from the device dropdown
   - It should show your device model (e.g., "Samsung Galaxy S22")

2. Click the **▶️ Run** button (green play icon)

3. Android Studio will:
   - Build the app
   - Install it on your device
   - Launch the app

4. **On your device:**
   - The app will install and open automatically
   - You may need to grant permissions (Location, Storage, etc.)

### Step 5: Testing Considerations for Physical Device

1. **Network Connectivity:**
   - Ensure your phone is on the **same WiFi network** as your computer
   - This is crucial for connecting to the local backend

2. **Location Services:**
   - Enable GPS/Location on your device
   - Grant location permission to the app when prompted

3. **Camera/Photos (if applicable):**
   - Grant camera and storage permissions if uploading images

4. **Background Testing:**
   - Press Home button and reopen app
   - Test app behavior when backgrounded
   - Test notifications if implemented

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Gradle Sync Failed

**Error:** "Gradle sync failed: Connection refused"

**Solution:**
```bash
# Clear Gradle cache
cd frontend/android
./gradlew clean

# Or in Android Studio:
# File → Invalidate Caches / Restart → Invalidate and Restart
```

#### 2. App Crashes on Launch

**Check:**
- Open **Logcat** in Android Studio
- Look for error messages (red text)
- Common causes:
  - Missing environment variables
  - Invalid backend URL
  - Google Maps API key issues

**Solution:**
```bash
# Rebuild the React app and resync
cd frontend
yarn build
npx cap sync android
```

#### 3. Cannot Connect to Backend

**Error:** "Network request failed" or "Connection refused"

**Solution:**
- Verify backend is running: `curl http://YOUR_IP:8001/api/restaurants`
- Check `.env` file has correct `REACT_APP_BACKEND_URL`
- Ensure phone and computer are on same WiFi network
- Check firewall settings allow port 8001
- Try: `ipconfig` (Windows) or `ifconfig` (Mac/Linux) to confirm IP

#### 4. Emulator is Very Slow

**Solution:**
- Ensure hardware acceleration is enabled:
  - Windows/Linux: Install Intel HAXM
  - macOS: Hypervisor.Framework should be enabled
- Increase emulator RAM in AVD settings (4GB recommended)
- Close other heavy applications
- Use x86 system images (faster than ARM)

#### 5. "ADB Server Version Mismatch"

**Solution:**
```bash
# Kill and restart ADB
adb kill-server
adb start-server

# Or in Android Studio Terminal:
cd frontend/android
./gradlew --stop
```

#### 6. Google Maps Not Loading

**Solution:**
- Verify `REACT_APP_GOOGLE_MAPS_API_KEY` is set in `.env`
- Check Google Cloud Console:
  - APIs are enabled (Maps JavaScript API, Geocoding API)
  - API key restrictions (add your app's package ID: `com.localtokri.app`)
  - Billing is enabled (free tier available)

#### 7. Build Failed: "Could not resolve dependencies"

**Solution:**
```bash
# Update Gradle wrapper
cd frontend/android
./gradlew wrapper --gradle-version=8.0

# Sync project with Gradle files in Android Studio
# Or run:
./gradlew sync
```

#### 8. Device Not Recognized

**Solution:**
- **Windows:** Install device-specific USB drivers
- **macOS:** Usually works automatically
- **Linux:** Configure udev rules (see Step 3 in Physical Device section)
- Try different USB cable and port
- Ensure USB debugging is enabled on device

#### 9. App Not Updating After Changes

**Solution:**
```bash
# Full rebuild process
cd frontend

# 1. Clean
rm -rf build

# 2. Rebuild React app
yarn build

# 3. Resync Capacitor
npx cap sync android

# 4. In Android Studio, run: Build → Clean Project
# 5. Then: Build → Rebuild Project
```

#### 10. Permission Denied Errors on Linux

**Solution:**
```bash
# Add yourself to plugdev group
sudo usermod -aG plugdev $USER

# Logout and login again for changes to take effect
```

---

## 📊 Performance Testing Tips

### Testing on Different Screen Sizes

1. **In Emulator:**
   - Test multiple device profiles (small, medium, large phones)
   - Test tablets (Pixel Tablet, Nexus 10)
   - Rotate device to test landscape mode

2. **Responsive Design Check:**
   - Open Chrome DevTools (if using web version)
   - Toggle device toolbar (Ctrl+Shift+M)
   - Test various screen sizes

### Network Conditions Testing

1. In Android Studio:
   - **Tools** → **Device Manager** → **Extended Controls** (⋮ icon)
   - Select **Cellular** → Change network speed
   - Test on 3G, 4G, and poor connections

### Memory and CPU Profiling

1. **Android Studio Profiler:**
   - **View** → **Tool Windows** → **Profiler**
   - Monitor CPU, Memory, Network, and Energy usage
   - Identify performance bottlenecks

---

## 🎯 Next Steps

After successfully testing the app:

1. **Test All User Flows:**
   - Customer journey: Browse → Add to Cart → Checkout → Track Order
   - Vendor flow: Manage orders, update status
   - Rider flow: Accept delivery, navigate, mark delivered
   - Admin panel: Monitor all operations

2. **Test Edge Cases:**
   - Poor network connectivity
   - App backgrounding and restoration
   - Push notifications (if implemented)
   - Location permission denied scenarios

3. **Prepare for Production:**
   - Update `REACT_APP_BACKEND_URL` to production URL
   - Generate signed APK for distribution
   - Test on multiple devices
   - Gather user feedback

---

## 📞 Getting Help

If you encounter issues not covered in this guide:

1. **Check Android Studio Logs:**
   - Logcat panel shows detailed error messages
   - Filter by "Error" or "Warning" severity

2. **Check Backend Logs:**
   - Ensure backend is running without errors
   - Check backend console for API request logs

3. **Common Resources:**
   - [Android Developer Documentation](https://developer.android.com/docs)
   - [Capacitor Documentation](https://capacitorjs.com/docs)
   - [Stack Overflow](https://stackoverflow.com/questions/tagged/android-studio)

---

## ✅ Checklist

Before you start development/testing:

- [ ] Android Studio installed and configured
- [ ] SDK Platform API 33+ installed
- [ ] Emulator created or physical device connected
- [ ] Backend server is running
- [ ] `.env` file configured with correct backend URL
- [ ] React app built (`yarn build`)
- [ ] Capacitor synced (`npx cap sync android`)
- [ ] Project opened in Android Studio
- [ ] Gradle sync completed successfully
- [ ] App successfully runs on emulator/device

---

**Happy Testing! 🚀**

The Localtokri app is now ready for mobile testing. Enjoy exploring the app on Android!
