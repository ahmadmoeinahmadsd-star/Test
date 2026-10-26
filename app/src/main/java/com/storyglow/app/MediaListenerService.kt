package com.storyglow.app

import android.service.notification.NotificationListenerService

/**
 * Empty on purpose. Android only lets apps read other apps' media sessions
 * (MediaSessionManager.getActiveSessions) if they hold Notification Access,
 * which is granted to a NotificationListenerService. We never read notifications.
 */
class MediaListenerService : NotificationListenerService()
