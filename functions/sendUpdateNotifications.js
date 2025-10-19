/**
 * Firebase Cloud Function to send update notifications to all subscribed devices
 * Deploy with: firebase deploy --only functions:sendUpdateNotification
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Send update notification to all subscribed devices
 * Trigger: HTTPS callable function or schedule
 */
exports.sendUpdateNotification = functions.https.onCall(async (data, context) => {
  try {
    // Verify admin authentication
    if (!context.auth || !context.auth.token.admin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admins can send update notifications'
      );
    }

    const { version, releaseNotes } = data;

    if (!version) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Version is required'
      );
    }

    // Get all push subscriptions
    const subscriptionsSnapshot = await db.collection('pushSubscriptions').get();
    
    if (subscriptionsSnapshot.empty) {
      return {
        success: true,
        message: 'No subscriptions found',
        count: 0
      };
    }

    const notifications = [];
    const failedNotifications = [];

    // Send notification to each subscription
    for (const doc of subscriptionsSnapshot.docs) {
      const subscription = doc.data();
      
      try {
        const payload = {
          notification: {
            title: '🚀 Update Available!',
            body: `Version ${version} is ready. Tap to update Nebula Screen Capture now!`,
            icon: '/logo192.png',
            badge: '/logo192.png',
            tag: 'app-update',
            requireInteraction: true,
            data: {
              version,
              releaseNotes: releaseNotes || [],
              url: '/',
              action: 'update'
            }
          }
        };

        // Send push notification using Firebase Cloud Messaging
        await admin.messaging().send({
          token: subscription.token,
          ...payload
        });

        notifications.push(doc.id);
      } catch (error) {
        console.error(`Failed to send notification to ${doc.id}:`, error);
        failedNotifications.push({
          id: doc.id,
          error: error.message
        });

        // Remove invalid subscriptions
        if (error.code === 'messaging/registration-token-not-registered') {
          await doc.ref.delete();
        }
      }
    }

    // Log notification event
    await db.collection('updateNotifications').add({
      version,
      releaseNotes: releaseNotes || [],
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      sentTo: notifications.length,
      failed: failedNotifications.length,
      failures: failedNotifications
    });

    return {
      success: true,
      message: `Sent ${notifications.length} notifications`,
      count: notifications.length,
      failed: failedNotifications.length
    };

  } catch (error) {
    console.error('Error sending update notifications:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Subscribe device to push notifications
 */
exports.subscribeToUpdates = functions.https.onCall(async (data, context) => {
  try {
    const { subscription, version, userAgent } = data;

    if (!subscription || !subscription.endpoint) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Valid subscription is required'
      );
    }

    // Store subscription in Firestore
    const subscriptionDoc = {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      version: version || 'unknown',
      userAgent: userAgent || 'unknown',
      userId: context.auth ? context.auth.uid : null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Use endpoint as document ID to prevent duplicates
    const docId = Buffer.from(subscription.endpoint).toString('base64').substring(0, 100);
    await db.collection('pushSubscriptions').doc(docId).set(subscriptionDoc, { merge: true });

    return {
      success: true,
      message: 'Subscribed to update notifications'
    };

  } catch (error) {
    console.error('Error subscribing to updates:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Scheduled function to check for updates and notify users
 * Run every day at midnight
 */
exports.checkForUpdates = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      // Get the latest version from version.json
      // In production, this would check your deployment system
      
      // Get last notified version
      const configDoc = await db.collection('config').doc('updates').get();
      const lastNotifiedVersion = configDoc.exists ? configDoc.data().lastVersion : '0.0.0';

      // Compare versions (implement your version comparison logic)
      const currentVersion = '1.0.0'; // This should be fetched from your deployment

      if (currentVersion !== lastNotifiedVersion) {
        console.log(`New version detected: ${currentVersion}`);
        
        // Trigger notification
        // In a real scenario, you'd call sendUpdateNotification here
        
        // Update last notified version
        await db.collection('config').doc('updates').set({
          lastVersion: currentVersion,
          lastCheck: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }

      return null;
    } catch (error) {
      console.error('Error checking for updates:', error);
      return null;
    }
  });
