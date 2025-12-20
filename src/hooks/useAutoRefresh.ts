/**
 * ═══════════════════════════════════════════════════════════
 * HOOK: useAutoRefresh
 * ═══════════════════════════════════════════════════════════
 * Auto-refresh com controle manual
 */

import { useEffect, useRef, useState } from 'react';

interface UseAutoRefreshProps {
  onRefresh: () => void | Promise<void>;
  interval?: number; // milliseconds
  enabled?: boolean;
}

export function useAutoRefresh({ onRefresh, interval = 60000, enabled = false }: UseAutoRefreshProps) {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [countdown, setCountdown] = useState(interval / 1000);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isEnabled) {
      // Reset countdown
      setCountdown(interval / 1000);

      // Setup refresh interval
      intervalRef.current = setInterval(() => {
        onRefresh();
        setCountdown(interval / 1000);
      }, interval);

      // Setup countdown interval
      countdownRef.current = setInterval(() => {
        setCountdown(prev => Math.max(0, prev - 1));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isEnabled, interval, onRefresh]);

  const toggle = () => setIsEnabled(!isEnabled);
  
  const reset = () => {
    setCountdown(interval / 1000);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        onRefresh();
        setCountdown(interval / 1000);
      }, interval);
    }
  };

  return {
    isEnabled,
    countdown,
    toggle,
    reset
  };
}
