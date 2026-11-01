import { router } from 'expo-router';
import { useEffect } from 'react';

// Malformed links fall back to the dashboard. Return to the existing one when
// it is underneath, because a Redirect would stack a second dashboard.
export function NotFoundRedirect() {
  useEffect(() => {
    if (router.canDismiss()) {
      router.dismissTo('/');
    } else {
      router.replace('/');
    }
  }, []);
  return null;
}
