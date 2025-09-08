# 🔔 Push Notifications Implementation Guide for Next.js 15 with Firebase

This comprehensive guide will help you implement Firebase push notifications in your Next.js 15 application, including service worker setup, token management, and real-time notifications.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Firebase Setup](#firebase-setup)
3. [Next.js 15 Configuration](#nextjs-15-configuration)
4. [Service Worker Implementation](#service-worker-implementation)
5. [Frontend Components](#frontend-components)
6. [API Integration](#api-integration)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)
9. [Backend Issues Found](#backend-issues-found)

## 🚀 Prerequisites

- Next.js 15 application
- Firebase project with Cloud Messaging enabled
- Node.js 18+ and npm/yarn
- HTTPS domain (required for service workers in production)

## 🔥 Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable **Cloud Messaging** in the project settings
4. Generate a **Web Push Certificate** (VAPID key)

### 2. Get Firebase Configuration

```javascript
// firebase-config.js
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

export default firebaseConfig;
```

### 3. Get VAPID Key

1. Go to Project Settings → Cloud Messaging
2. In "Web configuration" section, generate a new key pair
3. Copy the **Key pair** (VAPID key)

## ⚙️ Next.js 15 Configuration

### 1. Install Dependencies

```bash
npm install firebase
# or
yarn add firebase
```

### 2. Environment Variables

Create `.env.local` file:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key
```

### 3. Firebase Initialization

Create `lib/firebase.js`:

```javascript
// lib/firebase.js
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase Cloud Messaging and get a reference to the service
let messaging;
if (typeof window !== 'undefined') {
  messaging = getMessaging(app);
}

export { messaging };
export default app;
```

## 🔧 Service Worker Implementation

### 1. Create Service Worker

Create `public/firebase-messaging-sw.js`:

```javascript
// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png', // Add your app icon
    badge: '/badge-72x72.png', // Add your badge icon
    tag: payload.data?.tag || 'default',
    data: payload.data,
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    // Open the app
    event.waitUntil(
      clients.openWindow('/') // Change to your desired URL
    );
  }
});
```

### 2. Register Service Worker

Create `lib/serviceWorker.js`:

```javascript
// lib/serviceWorker.js
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
      
      console.log('Service Worker registered successfully:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  } else {
    throw new Error('Service Worker not supported');
  }
};

export const unregisterServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.unregister();
      console.log('Service Worker unregistered');
    }
  }
};
```

## 🎯 Frontend Components

### 1. Push Notification Hook

Create `hooks/usePushNotifications.js`:

```javascript
// hooks/usePushNotifications.js
import { useState, useEffect } from 'react';
import { messaging } from '../lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { registerServiceWorker } from '../lib/serviceWorker';

const usePushNotifications = () => {
  const [token, setToken] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // Check if notifications are supported
        if (!('Notification' in window) || !('serviceWorker' in navigator) || !messaging) {
          setError('Push notifications are not supported in this browser');
          setLoading(false);
          return;
        }

        setIsSupported(true);
        setPermission(Notification.permission);

        // Register service worker
        await registerServiceWorker();

        // Listen for foreground messages
        const unsubscribe = onMessage(messaging, (payload) => {
          console.log('Foreground message received:', payload);
          setNotification({
            title: payload.notification?.title,
            body: payload.notification?.body,
            data: payload.data,
            timestamp: Date.now()
          });
        });

        setLoading(false);
        return unsubscribe;
      } catch (err) {
        console.error('Error initializing notifications:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    initializeNotifications();
  }, []);

  const requestPermission = async () => {
    try {
      setLoading(true);
      setError(null);

      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        const currentToken = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
        });

        if (currentToken) {
          setToken(currentToken);
          console.log('FCM Token:', currentToken);
          return currentToken;
        } else {
          throw new Error('No registration token available');
        }
      } else {
        throw new Error('Notification permission denied');
      }
    } catch (err) {
      console.error('Error getting permission:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearNotification = () => {
    setNotification(null);
  };

  return {
    token,
    notification,
    isSupported,
    permission,
    loading,
    error,
    requestPermission,
    clearNotification
  };
};

export default usePushNotifications;
```

### 2. Notification Component

Create `components/NotificationManager.jsx`:

```jsx
// components/NotificationManager.jsx
import { useEffect, useState } from 'react';
import usePushNotifications from '../hooks/usePushNotifications';

const NotificationManager = ({ onTokenReceived }) => {
  const {
    token,
    notification,
    isSupported,
    permission,
    loading,
    error,
    requestPermission,
    clearNotification
  } = usePushNotifications();

  const [showInAppNotification, setShowInAppNotification] = useState(false);

  useEffect(() => {
    if (token && onTokenReceived) {
      onTokenReceived(token);
    }
  }, [token, onTokenReceived]);

  useEffect(() => {
    if (notification) {
      setShowInAppNotification(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setShowInAppNotification(false);
        clearNotification();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification, clearNotification]);

  const handleEnableNotifications = async () => {
    try {
      await requestPermission();
    } catch (err) {
      console.error('Failed to enable notifications:', err);
    }
  };

  if (loading) {
    return (
      <div className="notification-manager loading">
        <div className="spinner"></div>
        <p>Initializing notifications...</p>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="notification-manager error">
        <p>❌ Push notifications are not supported in this browser</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="notification-manager error">
        <p>❌ Error: {error}</p>
        <button onClick={handleEnableNotifications}>Retry</button>
      </div>
    );
  }

  return (
    <div className="notification-manager">
      {/* Permission Status */}
      <div className="permission-status">
        <h3>🔔 Push Notifications</h3>
        <p>Status: 
          <span className={`status ${permission}`}>
            {permission === 'granted' ? '✅ Enabled' : 
             permission === 'denied' ? '❌ Blocked' : '⏳ Not Set'}
          </span>
        </p>
        
        {permission !== 'granted' && (
          <button 
            onClick={handleEnableNotifications}
            className="enable-btn"
            disabled={loading}
          >
            {loading ? 'Requesting...' : 'Enable Notifications'}
          </button>
        )}
        
        {token && (
          <div className="token-info">
            <p>✅ Device registered for notifications</p>
            <details>
              <summary>View Token</summary>
              <code>{token}</code>
            </details>
          </div>
        )}
      </div>

      {/* In-App Notification Display */}
      {showInAppNotification && notification && (
        <div className="in-app-notification">
          <div className="notification-content">
            <h4>{notification.title}</h4>
            <p>{notification.body}</p>
            <button 
              onClick={() => {
                setShowInAppNotification(false);
                clearNotification();
              }}
              className="close-btn"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .notification-manager {
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          margin: 20px 0;
        }
        
        .loading {
          text-align: center;
        }
        
        .spinner {
          border: 2px solid #f3f3f3;
          border-top: 2px solid #3498db;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          animation: spin 1s linear infinite;
          margin: 0 auto 10px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .error {
          background-color: #fee;
          border-color: #fcc;
        }
        
        .status.granted {
          color: green;
          font-weight: bold;
        }
        
        .status.denied {
          color: red;
          font-weight: bold;
        }
        
        .status.default {
          color: orange;
          font-weight: bold;
        }
        
        .enable-btn {
          background-color: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          margin-top: 10px;
        }
        
        .enable-btn:hover {
          background-color: #0056b3;
        }
        
        .enable-btn:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        
        .token-info {
          margin-top: 15px;
          padding: 10px;
          background-color: #f8f9fa;
          border-radius: 5px;
        }
        
        .token-info code {
          word-break: break-all;
          background-color: #e9ecef;
          padding: 5px;
          border-radius: 3px;
          font-size: 12px;
        }
        
        .in-app-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          background-color: #fff;
          border: 1px solid #ddd;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 1000;
          max-width: 300px;
        }
        
        .notification-content {
          padding: 15px;
          position: relative;
        }
        
        .notification-content h4 {
          margin: 0 0 5px 0;
          font-size: 16px;
        }
        
        .notification-content p {
          margin: 0;
          font-size: 14px;
          color: #666;
        }
        
        .close-btn {
          position: absolute;
          top: 5px;
          right: 5px;
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          color: #999;
        }
        
        .close-btn:hover {
          color: #333;
        }
      `}</style>
    </div>
  );
};

export default NotificationManager;
```

### 3. Main App Integration

Update your `pages/_app.js` or main layout:

```jsx
// pages/_app.js or app/layout.js
import { useEffect, useState } from 'react';
import NotificationManager from '../components/NotificationManager';

function MyApp({ Component, pageProps }) {
  const [deviceToken, setDeviceToken] = useState(null);

  const handleTokenReceived = async (token) => {
    setDeviceToken(token);
    
    // Send token to your backend
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Your auth token
        },
        body: JSON.stringify({
          email: 'user@example.com', // Current user email
          password: 'password', // Or handle this differently
          deviceToken: token
        })
      });
      
      if (response.ok) {
        console.log('Device token sent to backend successfully');
      }
    } catch (error) {
      console.error('Failed to send device token to backend:', error);
    }
  };

  return (
    <>
      <NotificationManager onTokenReceived={handleTokenReceived} />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
```

## 🔗 API Integration

### 1. Login API Update

Update your login API to handle device tokens:

```javascript
// pages/api/auth/login.js or app/api/auth/login/route.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password, deviceToken } = req.body;

  try {
    // Your existing login logic
    const response = await fetch('http://your-backend-api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        deviceToken // Include device token
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      res.status(200).json(data);
    } else {
      res.status(response.status).json(data);
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
```

### 2. Logout API Update

```javascript
// pages/api/auth/logout.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { deviceToken } = req.body;
  const authToken = req.headers.authorization?.replace('Bearer ', '');

  try {
    const response = await fetch('http://your-backend-api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ deviceToken })
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
```

## 🧪 Testing

### 1. Test Notification Component

Create `components/TestNotifications.jsx`:

```jsx
// components/TestNotifications.jsx
import { useState } from 'react';

const TestNotifications = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const sendTestNotification = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: 'Test Notification',
          body: 'This is a test push notification!',
          data: { test: true }
        })
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="test-notifications">
      <h3>🧪 Test Notifications</h3>
      <button 
        onClick={sendTestNotification}
        disabled={loading}
        className="test-btn"
      >
        {loading ? 'Sending...' : 'Send Test Notification'}
      </button>
      
      {result && (
        <div className={`result ${result.error ? 'error' : 'success'}`}>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      <style jsx>{`
        .test-notifications {
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          margin: 20px 0;
        }
        
        .test-btn {
          background-color: #28a745;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
        }
        
        .test-btn:hover {
          background-color: #218838;
        }
        
        .test-btn:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        
        .result {
          margin-top: 15px;
          padding: 10px;
          border-radius: 5px;
          font-family: monospace;
        }
        
        .result.success {
          background-color: #d4edda;
          border: 1px solid #c3e6cb;
        }
        
        .result.error {
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
        }
      `}</style>
    </div>
  );
};

export default TestNotifications;
```

### 2. Test API Endpoint

Create `pages/api/test-notification.js`:

```javascript
// pages/api/test-notification.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { title, body, data } = req.body;
  const authToken = req.headers.authorization?.replace('Bearer ', '');

  try {
    // Send test notification through your backend
    const response = await fetch('http://your-backend-api/notifications/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ title, body, data })
    });

    const result = await response.json();
    res.status(response.status).json(result);
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
```

## 🐛 Troubleshooting

### Common Issues and Solutions

1. **Service Worker Not Registering**
   - Ensure HTTPS is enabled (required for service workers)
   - Check browser console for errors
   - Verify service worker file path is correct

2. **Token Not Generated**
   - Check VAPID key configuration
   - Ensure Firebase project has Cloud Messaging enabled
   - Verify user granted notification permission

3. **Notifications Not Received**
   - Check if service worker is active
   - Verify token is sent to backend correctly
   - Test with Firebase Console first

4. **CORS Issues**
   - Configure CORS properly in your backend
   - Ensure Firebase domains are whitelisted

### Debug Tools

```javascript
// Add to your component for debugging
const debugNotifications = () => {
  console.log('🔍 Notification Debug Info:');
  console.log('- Notification support:', 'Notification' in window);
  console.log('- Service Worker support:', 'serviceWorker' in navigator);
  console.log('- Permission:', Notification.permission);
  console.log('- Firebase messaging:', !!messaging);
  
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log('- Service Worker registrations:', registrations.length);
  });
};
```

## 🚨 Backend Issues Found

I found several issues in your current backend implementation:

### 1. Import Path Error

In `src/helpers/notificationsHelper.ts`, line 20:

```typescript
// ❌ WRONG - Case mismatch
import { pushNotificationHelper } from './pushnotificationHelper';

// ✅ CORRECT - Should match actual filename
import { pushNotificationHelper } from './pushNotificationHelper';
```

### 2. Missing Error Handling

In `src/helpers/pushNotificationHelper.ts`:

```typescript
// ❌ CURRENT - No error handling
const sendPushNotifications = async (
  values: admin.messaging.MulticastMessage
) => {
  const res = await admin.messaging().sendEachForMulticast(values);
  logger.info('Notifications sent successfully', res);
};

// ✅ IMPROVED - With error handling
const sendPushNotifications = async (
  values: admin.messaging.MulticastMessage
) => {
  try {
    const res = await admin.messaging().sendEachForMulticast(values);
    logger.info('Notifications sent successfully', res);
    
    // Check for failed tokens
    if (res.failureCount > 0) {
      const failedTokens = [];
      res.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(values.tokens[idx]);
          logger.error(`Failed to send to token ${idx}:`, resp.error);
        }
      });
      
      // Remove invalid tokens from database
      // You should implement this function
      // await removeInvalidTokens(failedTokens);
    }
    
    return res;
  } catch (error) {
    logger.error('Error sending push notifications:', error);
    throw error;
  }
};
```

### 3. Missing Token Validation

In `src/helpers/notificationsHelper.ts`:

```typescript
// ❌ CURRENT - No token validation
if (user?.deviceTokens) {
  const message = {
    notification: {
      title: 'New Notification Received',
      body: data?.text,
    },
    tokens: user?.deviceTokens,
  };
  pushNotificationHelper.sendPushNotifications(message);
}

// ✅ IMPROVED - With validation
if (user?.deviceTokens && user.deviceTokens.length > 0) {
  // Filter out empty/invalid tokens
  const validTokens = user.deviceTokens.filter(token => 
    token && typeof token === 'string' && token.trim().length > 0
  );
  
  if (validTokens.length > 0) {
    const message = {
      notification: {
        title: data?.title || 'New Notification Received',
        body: data?.text,
      },
      tokens: validTokens,
      data: {
        type: data?.type || 'SYSTEM',
        referenceId: data?.referenceId?.toString() || '',
        timestamp: new Date().toISOString()
      }
    };
    
    try {
      await pushNotificationHelper.sendPushNotifications(message);
    } catch (error) {
      logger.error('Failed to send push notification:', error);
      // Don't throw error to prevent notification creation failure
    }
  }
}
```

### 4. Notification Title Issue

The current implementation always uses "New Notification Received" as the title. It should use the actual notification title:

```typescript
// ❌ CURRENT
notification: {
  title: 'New Notification Received',
  body: data?.text,
}

// ✅ IMPROVED
notification: {
  title: data?.title || 'Task Titans Notification',
  body: data?.text,
}
```

## 📝 Next Steps

1. Fix the backend issues mentioned above
2. Implement the frontend components in your Next.js 15 app
3. Test notifications in development and production
4. Add proper error handling and logging
5. Implement notification preferences for users
6. Add notification history and management features

## 🔒 Security Considerations

- Never expose Firebase private keys in frontend code
- Validate all notification data on the backend
- Implement rate limiting for notification sending
- Use HTTPS in production
- Regularly clean up invalid device tokens

---

**Happy coding! 🚀** If you encounter any issues, refer to the troubleshooting section or check the browser console for detailed error messages.