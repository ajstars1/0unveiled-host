'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useConnectionHealth } from '@/lib/connection-monitor'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Wifi, 
  Server,
  Clock,
  Info
} from 'lucide-react'

export function PresenceTroubleshooter() {
  const { health, forceCheck, isOnline, isSupabaseReachable, latency } = useConnectionHealth()
  const [isChecking, setIsChecking] = useState(false)

  const handleForceCheck = async () => {
    setIsChecking(true)
    try {
      await forceCheck()
    } finally {
      setIsChecking(false)
    }
  }

  const getNetworkStatus = () => {
    if (isOnline) {
      return {
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
        label: 'Online',
        variant: 'default' as const
      }
    } else {
      return {
        icon: <XCircle className="h-4 w-4 text-red-500" />,
        label: 'Offline',
        variant: 'destructive' as const
      }
    }
  }

  const getSupabaseStatus = () => {
    if (!isOnline) {
      return {
        icon: <XCircle className="h-4 w-4 text-gray-400" />,
        label: 'Unavailable',
        variant: 'outline' as const
      }
    } else if (isSupabaseReachable) {
      return {
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
        label: 'Connected',
        variant: 'default' as const
      }
    } else {
      return {
        icon: <XCircle className="h-4 w-4 text-red-500" />,
        label: 'Unreachable',
        variant: 'destructive' as const
      }
    }
  }

  const networkStatus = getNetworkStatus()
  const supabaseStatus = getSupabaseStatus()

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              {networkStatus.icon}
              <span className="text-sm font-medium">Network</span>
              <Badge variant={networkStatus.variant} className="ml-auto">
                {networkStatus.label}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              {supabaseStatus.icon}
              <span className="text-sm font-medium">Supabase</span>
              <Badge variant={supabaseStatus.variant} className="ml-auto">
                {supabaseStatus.label}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Latency</span>
              <Badge variant="outline" className="ml-auto">
                {latency ? `${latency}ms` : 'N/A'}
              </Badge>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleForceCheck}
              disabled={isChecking}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
              {isChecking ? 'Checking...' : 'Refresh Status'}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            Last checked: {health.lastChecked.toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>

      {(!isOnline || !isSupabaseReachable) && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Connection Issues Detected</strong>
            <div className="mt-2 space-y-1">
              {!isOnline && (
                <p>• Your device appears to be offline. Check your internet connection.</p>
              )}
              {isOnline && !isSupabaseReachable && (
                <p>• Cannot reach Supabase servers. This may be temporary.</p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Troubleshooting Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <h4 className="font-medium">If presence is not working:</h4>
              <ol className="list-decimal list-inside space-y-1 mt-2 text-muted-foreground">
                <li>Check your internet connection</li>
                <li>Refresh the page (F5 or Cmd+R)</li>
                <li>Clear browser cache and cookies</li>
                <li>Try opening the site in an incognito/private window</li>
                <li>Check if other users are experiencing similar issues</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium">For developers:</h4>
              <ol className="list-decimal list-inside space-y-1 mt-2 text-muted-foreground">
                <li>Check browser console for WebSocket errors</li>
                <li>Verify Supabase project status and quotas</li>
                <li>Check environment variables are correctly set</li>
                <li>Verify Realtime is enabled in Supabase project</li>
                <li>Monitor network tab for failed requests</li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium">Common solutions:</h4>
              <ul className="list-disc list-inside space-y-1 mt-2 text-muted-foreground">
                <li>Corporate firewalls may block WebSocket connections</li>
                <li>VPN connections can cause stability issues</li>
                <li>Browser extensions might interfere with WebSockets</li>
                <li>Ad blockers may block Supabase connections</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}