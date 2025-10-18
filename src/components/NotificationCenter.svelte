<script>
  export let notifications = [];

  function getNotificationIcon(type) {
    switch (type) {
      case 'success':
        return 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z';
      case 'error':
        return 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z';
      case 'warning':
        return 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z';
      default:
        return 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z';
    }
  }
</script>

{#if notifications && notifications.length > 0}
  <div class="notification-center">
    {#each notifications as notification (notification.id)}
      <div class="notification notification-{notification.type}">
        <div class="notification-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d={getNotificationIcon(notification.type)}/>
          </svg>
        </div>
        <div class="notification-content">
          <p>{notification.message}</p>
          {#if notification.timestamp}
            <span class="notification-time">
              {new Date(notification.timestamp).toLocaleTimeString()}
            </span>
          {/if}
        </div>
      </div>
    {/each}
  </div>
{/if}

<style>
  @import './NotificationCenter.css';
</style>
