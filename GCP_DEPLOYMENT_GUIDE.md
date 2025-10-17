# 🚀 Complete GCP Deployment Guide for Localtokri

**Comprehensive guide to deploy Localtokri food delivery platform on Google Cloud Platform from scratch to production.**

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Setup GCP Project](#phase-1-setup-gcp-project)
4. [Phase 2: Database Setup (MongoDB Atlas)](#phase-2-database-setup-mongodb-atlas)
5. [Phase 3: Backend Deployment (Cloud Run)](#phase-3-backend-deployment-cloud-run)
6. [Phase 4: Frontend Web Deployment (Firebase Hosting)](#phase-4-frontend-web-deployment-firebase-hosting)
7. [Phase 5: Mobile App Deployment](#phase-5-mobile-app-deployment)
8. [Phase 6: Domain & SSL Configuration](#phase-6-domain--ssl-configuration)
9. [Phase 7: CI/CD Setup](#phase-7-cicd-setup)
10. [Phase 8: Monitoring & Maintenance](#phase-8-monitoring--maintenance)
11. [Cost Estimation](#cost-estimation)
12. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture Overview

### Recommended Production Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USERS                                   │
│  (Web Browsers • iOS App • Android App)                        │
└────────────────────┬─────────────────────────────────────────── ┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUD CDN / LOAD BALANCER                    │
└─────────────┬──────────────────────────────────┬────────────────┘
              │                                   │
              ▼                                   ▼
    ┌──────────────────┐              ┌────────────────────┐
    │  Firebase        │              │   Cloud Run        │
    │  Hosting         │              │   (Backend API)    │
    │  (React Web)     │◄─────API─────┤   FastAPI          │
    └──────────────────┘              └─────────┬──────────┘
                                                 │
                                                 ▼
                                      ┌────────────────────┐
                                      │  MongoDB Atlas     │
                                      │  (Database)        │
                                      └────────────────────┘
              │
              ▼
    ┌──────────────────┐
    │  Google Play     │
    │  App Store       │
    │  (Mobile Apps)   │
    └──────────────────┘
```

### Services Used

| Component | GCP Service | Purpose | Cost |
|-----------|------------|---------|------|
| Backend API | Cloud Run | Serverless container deployment | Pay per request |
| Database | MongoDB Atlas | Managed MongoDB database | Free tier available |
| Web Frontend | Firebase Hosting | Static site hosting with CDN | Free tier generous |
| Mobile Apps | EAS Build + Stores | Build and distribute mobile apps | $29/month (EAS) |
| Domain/SSL | Cloud DNS + Firebase | Domain management and SSL | ~$0.20/month |
| Container Registry | Artifact Registry | Store Docker images | Free tier available |
| CI/CD | Cloud Build | Automated deployments | Free tier: 120 min/day |

---

## 📋 Prerequisites

### Required Accounts

1. **Google Cloud Platform Account**
   - Sign up at https://cloud.google.com/
   - Free tier: $300 credit for 90 days
   - Credit card required (won't be charged without permission)

2. **MongoDB Atlas Account**
   - Sign up at https://www.mongodb.com/cloud/atlas
   - Free tier available (512MB storage)
   - No credit card required for free tier

3. **Expo Account** (for mobile apps)
   - Sign up at https://expo.dev/
   - Free for basic features
   - EAS Build: $29/month (or free tier with limits)

4. **Domain Name** (optional but recommended)
   - Purchase from Google Domains, Namecheap, GoDaddy, etc.
   - Example: `localtokri.com`

### Required Tools

Install these on your local machine:

```bash
# 1. Google Cloud SDK
# Download from: https://cloud.google.com/sdk/docs/install

# 2. Docker
# Download from: https://www.docker.com/products/docker-desktop

# 3. Git
# Download from: https://git-scm.com/

# 4. Node.js 20+
# Download from: https://nodejs.org/

# 5. Firebase CLI
npm install -g firebase-tools

# 6. EAS CLI (for mobile builds)
npm install -g eas-cli
```

### Verify Installation

```bash
# Check gcloud
gcloud --version

# Check Docker
docker --version

# Check Node.js
node --version  # Should be 20+

# Check Firebase CLI
firebase --version

# Check EAS CLI
eas --version
```

---

## 📁 Phase 1: Setup GCP Project

### Step 1: Create GCP Project

```bash
# Login to gcloud
gcloud auth login

# Create new project
gcloud projects create localtokri-prod --name="Localtokri Production"

# Set as default project
gcloud config set project localtokri-prod

# Enable billing (required for Cloud Run)
# Go to: https://console.cloud.google.com/billing
# Link your billing account to the project
```

### Step 2: Enable Required APIs

```bash
# Enable Cloud Run API
gcloud services enable run.googleapis.com

# Enable Artifact Registry API (for Docker images)
gcloud services enable artifactregistry.googleapis.com

# Enable Cloud Build API (for CI/CD)
gcloud services enable cloudbuild.googleapis.com

# Enable Cloud DNS API (for domain)
gcloud services enable dns.googleapis.com

# Verify enabled services
gcloud services list --enabled
```

### Step 3: Create Service Account

```bash
# Create service account for deployments
gcloud iam service-accounts create localtokri-deployer \
    --display-name="Localtokri Deployer"

# Grant necessary permissions
gcloud projects add-iam-policy-binding localtokri-prod \
    --member="serviceAccount:localtokri-deployer@localtokri-prod.iam.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding localtokri-prod \
    --member="serviceAccount:localtokri-deployer@localtokri-prod.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

# Create and download service account key
gcloud iam service-accounts keys create ~/localtokri-key.json \
    --iam-account=localtokri-deployer@localtokri-prod.iam.gserviceaccount.com

# Keep this file safe! You'll need it for CI/CD
```

### Step 4: Create Artifact Registry Repository

```bash
# Create repository for Docker images
gcloud artifacts repositories create localtokri-repo \
    --repository-format=docker \
    --location=us-central1 \
    --description="Localtokri Docker images"

# Configure Docker to use Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev
```

---

## 🗄️ Phase 2: Database Setup (MongoDB Atlas)

### Why MongoDB Atlas?

- ✅ Fully managed (no server maintenance)
- ✅ Automatic backups
- ✅ Built-in monitoring
- ✅ Free tier available (512MB)
- ✅ Easy to scale
- ✅ Works seamlessly with GCP

### Step 1: Create MongoDB Atlas Cluster

1. **Go to MongoDB Atlas:** https://www.mongodb.com/cloud/atlas

2. **Sign Up/Login**

3. **Create New Cluster:**
   - Click "Build a Database"
   - Select "Shared" (Free tier)
   - Choose "Google Cloud" as provider
   - Select region closest to your Cloud Run region (e.g., `us-central1`)
   - Cluster name: `localtokri-cluster`
   - Click "Create Cluster"

4. **Wait for cluster creation** (2-5 minutes)

### Step 2: Configure Database Access

1. **Create Database User:**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Authentication Method: Password
   - Username: `localtokri_user`
   - Password: Generate secure password (save it!)
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

2. **Configure Network Access:**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
     - ⚠️ This is needed for Cloud Run (dynamic IPs)
     - More secure alternative: Use VPC peering (paid feature)
   - Click "Confirm"

### Step 3: Get Connection String

1. **Go to "Database" → "Connect"**

2. **Choose "Connect your application"**

3. **Copy connection string:**
   ```
   mongodb+srv://localtokri_user:<password>@localtokri-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

4. **Replace `<password>` with your actual password**

5. **Add database name** (change to):
   ```
   mongodb+srv://localtokri_user:YOUR_PASSWORD@localtokri-cluster.xxxxx.mongodb.net/localtokri?retryWrites=true&w=majority
   ```

6. **Save this connection string securely!** You'll need it for backend deployment.

### Step 4: Create Collections (Optional - Auto-created by app)

The app will automatically create collections. If you want to pre-create them:

1. **Go to "Collections"**
2. **Click "Create Database"**
   - Database name: `localtokri`
3. **Create Collections:**
   - `users`
   - `restaurants`
   - `menu_items`
   - `orders`
   - `wallet_transactions`

---

## 🖥️ Phase 3: Backend Deployment (Cloud Run)

### Why Cloud Run?

- ✅ Serverless (no server management)
- ✅ Auto-scaling (0 to N containers)
- ✅ Pay only for actual usage
- ✅ Built-in HTTPS
- ✅ Custom domains
- ✅ Easy rollbacks

### Step 1: Prepare Backend Code

Navigate to backend directory:
```bash
cd /app/backend
```

### Step 2: Create Dockerfile

Check if `Dockerfile` exists in `/app/backend/`. If not, create it:

```dockerfile
# /app/backend/Dockerfile
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for better caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8080

# Set environment variable for production
ENV ENVIRONMENT=production

# Run the application
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8080"]
```

### Step 3: Create .dockerignore

```bash
# /app/backend/.dockerignore
__pycache__
*.pyc
*.pyo
*.pyd
.Python
env/
venv/
.env
.git
.gitignore
*.md
tests/
```

### Step 4: Update Backend for Production

**Important:** Update `server.py` to read environment variables:

```python
# In server.py, update these lines:

import os

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = MongoClient(MONGO_URL)

# JWT secret
SECRET_KEY = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')

# CORS origins (update for production)
origins = [
    "http://localhost:3000",
    "http://localhost:19006",
    os.environ.get('FRONTEND_URL', ''),  # Add your production frontend URL
]
```

### Step 5: Build and Push Docker Image

```bash
# Set variables
PROJECT_ID="localtokri-prod"
REGION="us-central1"
IMAGE_NAME="localtokri-backend"
TAG="v1.0.0"

# Build Docker image
docker build -t $IMAGE_NAME:$TAG .

# Tag for Artifact Registry
docker tag $IMAGE_NAME:$TAG \
    $REGION-docker.pkg.dev/$PROJECT_ID/localtokri-repo/$IMAGE_NAME:$TAG

# Push to Artifact Registry
docker push $REGION-docker.pkg.dev/$PROJECT_ID/localtokri-repo/$IMAGE_NAME:$TAG
```

### Step 6: Deploy to Cloud Run

```bash
# Deploy with environment variables
gcloud run deploy localtokri-backend \
    --image=$REGION-docker.pkg.dev/$PROJECT_ID/localtokri-repo/$IMAGE_NAME:$TAG \
    --platform=managed \
    --region=$REGION \
    --allow-unauthenticated \
    --set-env-vars="MONGO_URL=mongodb+srv://localtokri_user:YOUR_PASSWORD@localtokri-cluster.xxxxx.mongodb.net/localtokri?retryWrites=true&w=majority" \
    --set-env-vars="JWT_SECRET=$(openssl rand -base64 32)" \
    --set-env-vars="ENVIRONMENT=production" \
    --memory=1Gi \
    --cpu=1 \
    --timeout=300 \
    --max-instances=10 \
    --min-instances=0
```

**Important:** Replace `YOUR_PASSWORD` with your actual MongoDB password!

### Step 7: Get Backend URL

```bash
# Get the deployed service URL
gcloud run services describe localtokri-backend \
    --platform=managed \
    --region=$REGION \
    --format='value(status.url)'
```

Output will be something like:
```
https://localtokri-backend-xxxxx-uc.a.run.app
```

**Save this URL!** You'll need it for frontend configuration.

### Step 8: Test Backend

```bash
# Test health endpoint
curl https://localtokri-backend-xxxxx-uc.a.run.app/

# Test API endpoint
curl https://localtokri-backend-xxxxx-uc.a.run.app/api/restaurants
```

### Step 9: Update CORS Settings

Once you have your frontend URL, update the backend:

```bash
# Re-deploy with frontend URL
gcloud run deploy localtokri-backend \
    --image=$REGION-docker.pkg.dev/$PROJECT_ID/localtokri-repo/$IMAGE_NAME:$TAG \
    --region=$REGION \
    --update-env-vars="FRONTEND_URL=https://localtokri.web.app"
```

---

## 🌐 Phase 4: Frontend Web Deployment (Firebase Hosting)

### Why Firebase Hosting?

- ✅ Global CDN by default (fast worldwide)
- ✅ Free SSL certificates
- ✅ Easy deployments
- ✅ Automatic HTTPS redirect
- ✅ Free tier is very generous
- ✅ Perfect for React apps

### Step 1: Install Firebase Tools

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login
```

### Step 2: Create Firebase Project

```bash
# Create new Firebase project (use same name as GCP project)
firebase projects:create localtokri-prod

# Or link to existing GCP project
firebase projects:addfirebase localtokri-prod
```

### Step 3: Navigate to Frontend Directory

```bash
cd /app/frontend
```

### Step 4: Initialize Firebase

```bash
# Initialize Firebase in your project
firebase init hosting

# Answer the prompts:
# - Select "Use an existing project"
# - Choose "localtokri-prod"
# - Public directory: build
# - Configure as single-page app: Yes
# - Set up automatic builds with GitHub: No (we'll do CI/CD later)
# - Overwrite build/index.html: No
```

This creates `firebase.json` and `.firebaserc` files.

### Step 5: Update Frontend Environment

Create `.env.production` file:

```bash
# /app/frontend/.env.production
REACT_APP_BACKEND_URL=https://localtokri-backend-xxxxx-uc.a.run.app/api
```

**Replace with your actual Cloud Run backend URL!**

### Step 6: Build Frontend

```bash
# Install dependencies
yarn install

# Build for production
yarn build
```

This creates an optimized production build in the `build/` directory.

### Step 7: Deploy to Firebase

```bash
# Deploy to Firebase Hosting
firebase deploy --only hosting

# Output will show:
# Hosting URL: https://localtokri-prod.web.app
# and: https://localtokri-prod.firebaseapp.com
```

### Step 8: Test Frontend

Open the Hosting URL in your browser:
```
https://localtokri-prod.web.app
```

Test the following:
- ✅ Homepage loads
- ✅ Can register/login
- ✅ Can browse restaurants
- ✅ Can add items to cart
- ✅ All API calls work

---

## 📱 Phase 5: Mobile App Deployment

### Prerequisites

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login
```

### Step 1: Configure Mobile App

Navigate to React Native app:
```bash
cd /app/frontend_reactnative
```

### Step 2: Update API Configuration

Update `src/config/api.js`:

```javascript
// /app/frontend_reactnative/src/config/api.js
export const API_URL = 'https://localtokri-backend-xxxxx-uc.a.run.app/api';
export const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';
```

### Step 3: Create EAS Build Configuration

Create `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "simulator": false
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json"
      },
      "ios": {}
    }
  }
}
```

### Step 4: Configure Project

```bash
# Configure EAS build
eas build:configure

# This updates app.json with build configuration
```

### Step 5: Build Android App

```bash
# Build APK for testing
eas build --platform android --profile preview

# Build AAB for Google Play Store
eas build --platform android --profile production
```

**Build process:**
1. EAS uploads your code
2. Builds app in the cloud
3. Provides download link (takes 10-20 minutes)

### Step 6: Build iOS App

**Requirements:**
- Apple Developer Account ($99/year)
- macOS for final submission

```bash
# Build for TestFlight
eas build --platform ios --profile preview

# Build for App Store
eas build --platform ios --profile production
```

### Step 7: Submit to Google Play Store

#### 7.1 Create Google Play Console Account

1. Go to https://play.google.com/console
2. Sign up ($25 one-time fee)
3. Create new app: "Localtokri"

#### 7.2 Prepare Store Listing

Create these assets:

**App Icon:**
- 512x512 PNG

**Screenshots:**
- At least 2 screenshots per device type
- Phone: 1080x1920 to 1080x2340
- Tablet: 1200x1920 to 1600x2560

**Feature Graphic:**
- 1024x500 PNG

**App Description:**
```
Localtokri - Fresh Breakfast Delivered to Your Doorstep

Order delicious breakfast from local restaurants and get it delivered fresh every morning. Browse menus, track orders in real-time, and enjoy hassle-free payments with our integrated wallet.

Features:
• Browse local restaurants and menus
• Easy ordering and payment
• Real-time order tracking
• Integrated wallet system
• GPS-based delivery tracking
• Support for customers, vendors, and riders
```

#### 7.3 Submit via EAS

```bash
# Submit to Google Play
eas submit --platform android --latest
```

#### 7.4 Manual Submission

If you prefer manual submission:

1. Download AAB from EAS build
2. Go to Google Play Console
3. Navigate to your app → Production → Create new release
4. Upload AAB file
5. Fill in release notes
6. Submit for review

**Review time:** 1-7 days

### Step 8: Submit to Apple App Store

#### 8.1 Create App Store Connect Account

1. Enroll in Apple Developer Program ($99/year)
2. Go to https://appstoreconnect.apple.com
3. Create new app

#### 8.2 Prepare Store Listing

**Screenshots:**
- iPhone 8 Plus (1242x2208)
- iPhone 14 Pro Max (1290x2796)
- iPad Pro (2048x2732)

**App Preview Video:** (Optional but recommended)
- 15-30 seconds
- Show key features

#### 8.3 Submit via EAS

```bash
# Submit to App Store
eas submit --platform ios --latest
```

#### 8.4 Manual Submission via Xcode

If you prefer manual:

1. Download IPA from EAS
2. Open Xcode → Window → Organizer
3. Upload to App Store Connect
4. Go to App Store Connect
5. Submit for review

**Review time:** 1-3 days

---

## 🌐 Phase 6: Domain & SSL Configuration

### Step 1: Configure Custom Domain for Backend

```bash
# Map custom domain to Cloud Run
gcloud run domain-mappings create \
    --service=localtokri-backend \
    --domain=api.localtokri.com \
    --region=$REGION
```

### Step 2: Configure DNS Records

Add these DNS records to your domain registrar:

**For Backend (api.localtokri.com):**
```
Type: CNAME
Name: api
Value: ghs.googlehosted.com
TTL: 3600
```

**Verify mapping:**
```bash
gcloud run domain-mappings describe \
    --domain=api.localtokri.com \
    --region=$REGION
```

Wait for SSL certificate to provision (5-15 minutes).

### Step 3: Configure Custom Domain for Frontend

```bash
# Add custom domain to Firebase
firebase hosting:sites:create localtokri

# Connect custom domain
# Go to: Firebase Console → Hosting → Add custom domain
# Enter: localtokri.com
# Follow the verification steps
```

**Add DNS records:**
```
Type: A
Name: @
Value: (Firebase will provide IPs)

Type: A  
Name: www
Value: (Firebase will provide IPs)
```

Firebase automatically provisions SSL certificates.

### Step 4: Update Environment Variables

Update frontend `.env.production`:
```bash
REACT_APP_BACKEND_URL=https://api.localtokri.com/api
```

Update mobile app `src/config/api.js`:
```javascript
export const API_URL = 'https://api.localtokri.com/api';
```

Rebuild and redeploy!

---

## 🔄 Phase 7: CI/CD Setup

### Option 1: GitHub Actions (Recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy-backend:
    name: Deploy Backend to Cloud Run
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Google Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          project_id: localtokri-prod
      
      - name: Configure Docker for Artifact Registry
        run: gcloud auth configure-docker us-central1-docker.pkg.dev
      
      - name: Build Docker image
        working-directory: ./backend
        run: |
          docker build -t us-central1-docker.pkg.dev/localtokri-prod/localtokri-repo/localtokri-backend:${{ github.sha }} .
      
      - name: Push to Artifact Registry
        run: |
          docker push us-central1-docker.pkg.dev/localtokri-prod/localtokri-repo/localtokri-backend:${{ github.sha }}
      
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy localtokri-backend \
            --image=us-central1-docker.pkg.dev/localtokri-prod/localtokri-repo/localtokri-backend:${{ github.sha }} \
            --region=us-central1 \
            --platform=managed

  deploy-frontend:
    name: Deploy Frontend to Firebase
    runs-on: ubuntu-latest
    needs: deploy-backend
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        working-directory: ./frontend
        run: yarn install
      
      - name: Build frontend
        working-directory: ./frontend
        run: yarn build
        env:
          REACT_APP_BACKEND_URL: https://api.localtokri.com/api
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: localtokri-prod
```

**Setup secrets in GitHub:**
1. Go to repository → Settings → Secrets
2. Add these secrets:
   - `GCP_SA_KEY`: Content of `localtokri-key.json`
   - `FIREBASE_SERVICE_ACCOUNT`: Firebase service account JSON

### Option 2: Cloud Build

Create `cloudbuild.yaml`:

```yaml
steps:
  # Build backend Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'us-central1-docker.pkg.dev/$PROJECT_ID/localtokri-repo/localtokri-backend:$SHORT_SHA', './backend']
  
  # Push to Artifact Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'us-central1-docker.pkg.dev/$PROJECT_ID/localtokri-repo/localtokri-backend:$SHORT_SHA']
  
  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'localtokri-backend'
      - '--image=us-central1-docker.pkg.dev/$PROJECT_ID/localtokri-repo/localtokri-backend:$SHORT_SHA'
      - '--region=us-central1'
      - '--platform=managed'

  # Build frontend
  - name: 'node:20'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        cd frontend
        npm install
        npm run build

  # Deploy to Firebase
  - name: 'gcr.io/localtokri-prod/firebase'
    args: ['deploy', '--only', 'hosting']

images:
  - 'us-central1-docker.pkg.dev/$PROJECT_ID/localtokri-repo/localtokri-backend:$SHORT_SHA'
```

**Setup trigger:**
```bash
# Create Cloud Build trigger
gcloud builds triggers create github \
    --repo-name=localtokri \
    --repo-owner=YOUR_GITHUB_USERNAME \
    --branch-pattern="^main$" \
    --build-config=cloudbuild.yaml
```

---

## 📊 Phase 8: Monitoring & Maintenance

### Set Up Monitoring

#### 1. Cloud Run Monitoring

```bash
# Enable Cloud Monitoring API
gcloud services enable monitoring.googleapis.com

# View metrics in console:
# https://console.cloud.google.com/run
```

**Key metrics to monitor:**
- Request count
- Request latency (p50, p95, p99)
- Error rate
- Container CPU utilization
- Container memory utilization
- Billable instance time

#### 2. Create Alerts

Go to Cloud Console → Monitoring → Alerting → Create Policy:

**Alert 1: High Error Rate**
```
Condition: Cloud Run Request Count
Filter: response_code_class = "5xx"
Threshold: > 10 errors in 5 minutes
Notification: Email
```

**Alert 2: High Latency**
```
Condition: Cloud Run Request Latencies
Threshold: p99 > 2000ms for 5 minutes
Notification: Email
```

**Alert 3: High Memory Usage**
```
Condition: Cloud Run Memory Utilization
Threshold: > 80% for 10 minutes
Notification: Email
```

#### 3. Set Up Logging

```bash
# View logs
gcloud run services logs read localtokri-backend \
    --region=us-central1 \
    --limit=50

# Follow logs in real-time
gcloud run services logs tail localtokri-backend \
    --region=us-central1
```

**Create log-based metrics:**

Go to Logging → Logs Explorer → Create Metric:

**Metric 1: Order Creation Rate**
```
resource.type="cloud_run_revision"
jsonPayload.message=~"Order created"
```

**Metric 2: Failed Login Attempts**
```
resource.type="cloud_run_revision"
jsonPayload.message=~"Login failed"
```

### Set Up Backups

#### MongoDB Atlas Backups

Atlas provides automatic backups:

1. Go to Atlas → Backup
2. Configure backup policy:
   - Snapshot frequency: Every 6 hours
   - Retention: 7 days
3. Enable continuous backups (paid feature) for point-in-time recovery

#### Manual Backup Script

Create `backup.sh`:

```bash
#!/bin/bash

# Backup MongoDB to local file
mongodump --uri="$MONGO_URL" --out="./backups/backup-$(date +%Y%m%d-%H%M%S)"

# Upload to Google Cloud Storage (optional)
gsutil cp -r ./backups/backup-$(date +%Y%m%d-%H%M%S) gs://localtokri-backups/
```

### Set Up Uptime Checks

```bash
# Create uptime check
gcloud monitoring uptime create localtokri-backend-uptime \
    --resource-type=uptime-url \
    --host=api.localtokri.com \
    --path=/api/restaurants
```

### Security Best Practices

1. **Enable Cloud Armor (WAF):**
```bash
# Create security policy
gcloud compute security-policies create localtokri-waf \
    --description="WAF for Localtokri"

# Add rate limiting rule
gcloud compute security-policies rules create 1000 \
    --security-policy=localtokri-waf \
    --expression="true" \
    --action=rate-based-ban \
    --rate-limit-threshold-count=100 \
    --rate-limit-threshold-interval-sec=60
```

2. **Regular Security Audits:**
```bash
# Run security scan
gcloud security-scanner scans create https://localtokri.com
```

3. **Keep Dependencies Updated:**
```bash
# Backend
cd backend
pip list --outdated

# Frontend
cd frontend
yarn upgrade-interactive --latest

# Mobile
cd frontend_reactnative
npx expo install --fix
```

4. **Rotate Secrets Regularly:**
- MongoDB password: Every 90 days
- JWT secret: Every 180 days
- API keys: Every 180 days

### Cost Optimization

1. **Set Budget Alerts:**

Go to Billing → Budgets & Alerts:
- Set budget: $50/month
- Alert at 50%, 90%, 100%

2. **Optimize Cloud Run:**

```bash
# Reduce min instances if traffic is low
gcloud run services update localtokri-backend \
    --min-instances=0 \
    --region=us-central1

# Reduce memory if not needed
gcloud run services update localtokri-backend \
    --memory=512Mi \
    --region=us-central1
```

3. **Monitor Costs:**

```bash
# View cost breakdown
gcloud billing accounts list
gcloud beta billing projects describe localtokri-prod
```

Go to: https://console.cloud.google.com/billing/reports

---

## 💰 Cost Estimation

### Monthly Cost Breakdown (Estimated)

| Service | Tier | Usage | Monthly Cost |
|---------|------|-------|--------------|
| **Cloud Run (Backend)** | Free tier | 2M requests<br/>360,000 GB-seconds<br/>180,000 vCPU-seconds | **$0** (within free tier) |
| **Cloud Run (Above free tier)** | Paid | +1M requests<br/>+180,000 GB-seconds | **~$5-15** |
| **Artifact Registry** | Storage | 5 GB images | **$0.10** |
| **MongoDB Atlas** | M0 (Free) | 512 MB storage<br/>Shared RAM | **$0** |
| **MongoDB Atlas** | M10 (Paid) | 10 GB storage<br/>2 GB RAM | **$57** |
| **Firebase Hosting** | Free tier | 10 GB storage<br/>360 MB/day transfer | **$0** |
| **Firebase Hosting** | Above free | +10 GB<br/>+50 GB/month | **~$5** |
| **Cloud DNS** | Standard | Hosted zone | **$0.20** |
| **Cloud Build** | Free tier | 120 build-minutes/day | **$0** |
| **EAS Build** | Free tier | Limited builds | **$0** |
| **EAS Build** | Production | Unlimited builds | **$29** |
| **Domain Registration** | Annual | .com domain | **~$12/year** ($1/month) |
| **SSL Certificates** | Included | Let's Encrypt via Firebase/Cloud Run | **$0** |

### Total Estimated Monthly Cost

**Startup/Testing Phase (Low Traffic):**
- Cloud Run: Free tier
- MongoDB: Free tier (M0)
- Firebase: Free tier
- EAS: Free tier
- **Total: ~$1-2/month**

**Production (Medium Traffic - 100K requests/month):**
- Cloud Run: ~$10
- MongoDB: $57 (M10 cluster)
- Firebase: Free tier
- EAS: $29
- Domain: $1
- **Total: ~$97/month**

**Scale (High Traffic - 1M requests/month):**
- Cloud Run: ~$50
- MongoDB: $97 (M20 cluster)
- Firebase: ~$10
- EAS: $29
- CDN: ~$20
- **Total: ~$206/month**

### Free Tier Summary

**Cloud Run Free Tier (per month):**
- 2 million requests
- 360,000 GB-seconds of memory
- 180,000 vCPU-seconds of compute time
- 1 GB network egress

**Firebase Hosting Free Tier:**
- 10 GB storage
- 360 MB/day transfer (~10.8 GB/month)
- Free SSL certificates

**MongoDB Atlas Free Tier (M0):**
- 512 MB storage
- Shared RAM
- Shared CPU
- Good for 1,000-10,000 users

---

## 🔧 Troubleshooting

### Backend Issues

**Issue 1: Cloud Run deployment fails**

```bash
# Check build logs
gcloud builds list --limit=5

# View specific build
gcloud builds log BUILD_ID

# Common causes:
# - Dockerfile syntax error
# - Missing dependencies in requirements.txt
# - Port mismatch (must be 8080 in Cloud Run)
```

**Issue 2: Backend returns 500 errors**

```bash
# Check logs
gcloud run services logs read localtokri-backend \
    --region=us-central1 \
    --limit=100

# Common causes:
# - MongoDB connection string incorrect
# - Environment variables not set
# - CORS misconfiguration
```

**Issue 3: Can't connect to MongoDB**

```bash
# Test connection locally
mongosh "mongodb+srv://localtokri_user:PASSWORD@cluster.xxxxx.mongodb.net/localtokri"

# Check:
# - Password is correct
# - IP whitelist includes 0.0.0.0/0
# - Cluster is running
# - Network access configured
```

### Frontend Issues

**Issue 1: Firebase deploy fails**

```bash
# Re-authenticate
firebase login --reauth

# Check project
firebase projects:list

# Deploy with debug
firebase deploy --only hosting --debug
```

**Issue 2: API calls fail from frontend**

Check browser console for CORS errors:

```bash
# Update backend CORS
gcloud run services update localtokri-backend \
    --update-env-vars="FRONTEND_URL=https://localtokri.web.app" \
    --region=us-central1
```

**Issue 3: Environment variables not working**

```bash
# Verify .env.production exists
cat .env.production

# Rebuild
yarn build

# Check if variables are embedded
grep -r "REACT_APP_BACKEND_URL" build/
```

### Mobile App Issues

**Issue 1: EAS build fails**

```bash
# Check build logs
eas build:list

# View specific build
eas build:view BUILD_ID

# Common causes:
# - Incorrect app.json configuration
# - Google Maps API key missing
# - Bundle identifier conflicts
```

**Issue 2: App crashes on launch**

```bash
# Check crash logs
eas build:list --platform android
eas build:view BUILD_ID

# Common causes:
# - API URL incorrect
# - Missing permissions in app.json
# - React Native version mismatch
```

### Database Issues

**Issue 1: Slow queries**

```bash
# Enable profiling in MongoDB Atlas
# Go to Atlas → Performance Advisor
# Check slow queries

# Add indexes for common queries
db.orders.createIndex({ customer_id: 1, created_at: -1 })
db.orders.createIndex({ vendor_id: 1, status: 1 })
db.restaurants.createIndex({ location: "2dsphere" })
```

**Issue 2: Connection limit reached**

```bash
# Check connection pool settings in server.py
# Increase maxPoolSize if needed

client = MongoClient(
    MONGO_URL,
    maxPoolSize=50,  # Increase if needed
    minPoolSize=10
)
```

### Performance Issues

**Issue 1: High latency**

```bash
# Check Cloud Run metrics
gcloud run services describe localtokri-backend \
    --region=us-central1 \
    --format="get(status.latestReadyRevisionName)"

# Increase resources
gcloud run services update localtokri-backend \
    --memory=2Gi \
    --cpu=2 \
    --region=us-central1
```

**Issue 2: Cold starts**

```bash
# Set minimum instances
gcloud run services update localtokri-backend \
    --min-instances=1 \
    --region=us-central1

# Note: This costs money even with no traffic
```

### Security Issues

**Issue 1: Exposed secrets**

```bash
# Rotate MongoDB password immediately
# Go to Atlas → Database Access → Edit User

# Update Cloud Run with new password
gcloud run services update localtokri-backend \
    --update-env-vars="MONGO_URL=NEW_CONNECTION_STRING" \
    --region=us-central1

# Rotate JWT secret
gcloud run services update localtokri-backend \
    --update-env-vars="JWT_SECRET=$(openssl rand -base64 32)" \
    --region=us-central1
```

---

## 📚 Additional Resources

### Documentation

- **Google Cloud Run:** https://cloud.google.com/run/docs
- **Firebase Hosting:** https://firebase.google.com/docs/hosting
- **MongoDB Atlas:** https://docs.atlas.mongodb.com/
- **Expo EAS Build:** https://docs.expo.dev/build/introduction/
- **React Native:** https://reactnative.dev/docs/getting-started

### Support

- **GCP Support:** https://cloud.google.com/support
- **Firebase Support:** https://firebase.google.com/support
- **MongoDB Support:** https://support.mongodb.com/
- **Expo Forums:** https://forums.expo.dev/

### Community

- **GCP Slack:** https://googlecloud-community.slack.com/
- **Firebase Discord:** https://discord.gg/firebase
- **React Native Discord:** https://discord.gg/react-native
- **Stack Overflow:** Tag questions with `google-cloud-run`, `firebase-hosting`, `mongodb-atlas`

---

## ✅ Deployment Checklist

Use this checklist to ensure everything is properly deployed:

### Pre-Deployment

- [ ] GCP project created and billing enabled
- [ ] MongoDB Atlas cluster created
- [ ] Database user created with proper permissions
- [ ] Network access configured (0.0.0.0/0)
- [ ] Domain purchased (if using custom domain)
- [ ] Google Maps API key created and configured
- [ ] All environment variables documented

### Backend Deployment

- [ ] Dockerfile created and tested locally
- [ ] Docker image built successfully
- [ ] Image pushed to Artifact Registry
- [ ] Cloud Run service deployed
- [ ] Environment variables configured
- [ ] MongoDB connection working
- [ ] API endpoints responding correctly
- [ ] CORS configured for frontend domains
- [ ] Health check endpoint working
- [ ] Logs are readable and informative

### Frontend Deployment

- [ ] Firebase project created
- [ ] Firebase CLI installed and authenticated
- [ ] Frontend builds without errors
- [ ] Environment variables set correctly
- [ ] Backend API URL configured
- [ ] Deployed to Firebase Hosting
- [ ] All pages load correctly
- [ ] API integration working
- [ ] No console errors

### Mobile App Deployment

- [ ] EAS account created
- [ ] App configured with production API URL
- [ ] Google Maps API key configured
- [ ] Android build successful
- [ ] iOS build successful (if applicable)
- [ ] Google Play Console account created
- [ ] App Store Connect account created (if applicable)
- [ ] Store listings prepared (description, screenshots, etc.)
- [ ] Apps submitted for review

### Domain & SSL

- [ ] Custom domain configured for backend
- [ ] Custom domain configured for frontend
- [ ] DNS records added
- [ ] SSL certificates issued
- [ ] HTTPS working on all domains
- [ ] HTTP redirects to HTTPS

### Monitoring & Security

- [ ] Cloud Monitoring enabled
- [ ] Alerts configured
- [ ] Uptime checks configured
- [ ] Backups configured
- [ ] Secrets rotated from defaults
- [ ] Security best practices applied
- [ ] Budget alerts configured

### Documentation

- [ ] Deployment process documented
- [ ] Environment variables documented
- [ ] Rollback procedure documented
- [ ] Incident response plan created
- [ ] Team trained on deployment process

---

## 🎉 Congratulations!

Your Localtokri application is now fully deployed on Google Cloud Platform! 

**Your deployment includes:**
- ✅ Scalable serverless backend on Cloud Run
- ✅ Global CDN-powered frontend on Firebase
- ✅ Managed MongoDB database on Atlas
- ✅ Mobile apps on Play Store & App Store
- ✅ Custom domains with SSL
- ✅ Automated CI/CD pipeline
- ✅ Comprehensive monitoring and alerts

**Next steps:**
1. Monitor your application performance
2. Gather user feedback
3. Iterate and improve
4. Scale as needed

**Need help?** Refer to the troubleshooting section or reach out to the respective support channels.

---

**Built with ❤️ • Deployed with ☁️ • Powered by GCP**

**Happy Deploying! 🚀**
