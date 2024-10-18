// src/hooks/useOnlineStatus.js

import { useState, useEffect } from 'react';

const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState([]);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      console.log('Back online.');

      if (offlineQueue.length > 0) {
        const queuedActions = [...offlineQueue];
        setOfflineQueue([]);
        for (const action of queuedActions) {
          try {
            await action();
          } catch (error) {
            console.error('Error processing queued action:', error);
          }
        }
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('Offline.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineQueue]);

  return { isOnline, setOfflineQueue };
};

export default useOnlineStatus;
