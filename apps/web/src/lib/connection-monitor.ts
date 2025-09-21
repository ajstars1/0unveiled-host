/**
 * Network and Supabase Connection Monitoring Utilities
 */

import { useState, useEffect, useCallback } from 'react'

interface ConnectionHealth {
  isOnline: boolean;
  latency?: number;
  supabaseReachable: boolean;
  lastChecked: Date;
}

class ConnectionMonitor {
  private healthData: ConnectionHealth = {
    isOnline: navigator.onLine,
    supabaseReachable: false,
    lastChecked: new Date()
  };

  private listeners: ((health: ConnectionHealth) => void)[] = [];
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupNetworkListeners();
    this.startHealthChecks();
  }

  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      // console.log('ConnectionMonitor: Network back online');
      this.healthData.isOnline = true;
      this.checkSupabaseHealth();
      this.notifyListeners();
    });

    window.addEventListener('offline', () => {
      // console.log('ConnectionMonitor: Network went offline');
      this.healthData.isOnline = false;
      this.healthData.supabaseReachable = false;
      this.notifyListeners();
    });
  }

  private async checkSupabaseHealth(): Promise<boolean> {
    try {
      const startTime = Date.now();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      
      if (!supabaseUrl) {
        console.error('ConnectionMonitor: No Supabase URL configured');
        return false;
      }

      // Simple health check to Supabase
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      const latency = Date.now() - startTime;
      const isHealthy = response.ok;

      this.healthData = {
        ...this.healthData,
        latency,
        supabaseReachable: isHealthy,
        lastChecked: new Date()
      };

      // console.log(`ConnectionMonitor: Supabase health check - ${isHealthy ? 'OK' : 'FAILED'} (${latency}ms)`);
      return isHealthy;
    } catch (error) {
      console.error('ConnectionMonitor: Health check failed:', error);
      this.healthData = {
        ...this.healthData,
        supabaseReachable: false,
        lastChecked: new Date()
      };
      return false;
    }
  }

  private startHealthChecks() {
    this.checkSupabaseHealth(); // Initial check
    
    this.checkInterval = setInterval(() => {
      if (this.healthData.isOnline) {
        this.checkSupabaseHealth().then(() => {
          this.notifyListeners();
        });
      }
    }, 30000); // Check every 30 seconds
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.healthData));
  }

  public subscribe(callback: (health: ConnectionHealth) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public getHealth(): ConnectionHealth {
    return { ...this.healthData };
  }

  public async forceHealthCheck(): Promise<ConnectionHealth> {
    await this.checkSupabaseHealth();
    this.notifyListeners();
    return this.getHealth();
  }

  public destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.listeners = [];
  }
}

// Singleton instance
let connectionMonitor: ConnectionMonitor | null = null;

export function getConnectionMonitor(): ConnectionMonitor {
  if (!connectionMonitor) {
    connectionMonitor = new ConnectionMonitor();
  }
  return connectionMonitor;
}

/**
 * React hook to use connection monitoring
 */
export function useConnectionHealth() {
  const [health, setHealth] = useState<ConnectionHealth>(() => 
    getConnectionMonitor().getHealth()
  );

  useEffect(() => {
    const monitor = getConnectionMonitor();
    const unsubscribe = monitor.subscribe(setHealth);
    
    // Get initial health data
    setHealth(monitor.getHealth());
    
    return unsubscribe;
  }, []);

  const forceCheck = useCallback(async () => {
    const monitor = getConnectionMonitor();
    const newHealth = await monitor.forceHealthCheck();
    setHealth(newHealth);
    return newHealth;
  }, []);

  return {
    health,
    forceCheck,
    isOnline: health.isOnline,
    isSupabaseReachable: health.supabaseReachable,
    latency: health.latency
  };
}