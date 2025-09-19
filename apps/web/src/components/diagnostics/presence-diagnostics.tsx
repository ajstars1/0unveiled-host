'use client'

import { useGlobalPresence } from '@/hooks/use-global-presence'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, Wifi, WifiOff, AlertTriangle, Clock } from 'lucide-react'

interface PresenceDiagnosticsProps {
  userId?: string
}

export function PresenceDiagnostics({ userId }: PresenceDiagnosticsProps) {
  const { presenceState, isLoading, connectionStatus } = useGlobalPresence({ userId })

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'CONNECTED':
        return <Wifi className="h-4 w-4 text-green-500" />
      case 'CONNECTING':
        return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />
      case 'DISCONNECTED':
        return <WifiOff className="h-4 w-4 text-gray-500" />
      case 'ERROR':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusVariant = () => {
    switch (connectionStatus) {
      case 'CONNECTED':
        return 'default' as const
      case 'CONNECTING':
        return 'secondary' as const
      case 'DISCONNECTED':
        return 'outline' as const
      case 'ERROR':
        return 'destructive' as const
      default:
        return 'outline' as const
    }
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  const totalUsers = Object.keys(presenceState).length
  const usersList = Object.entries(presenceState).map(([key, presences]) => ({
    userId: key,
    presences: presences
  }))

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Global Presence Diagnostics
          <Badge variant={getStatusVariant()}>
            {connectionStatus}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">Connection Status</p>
            <p className="text-sm text-muted-foreground">{connectionStatus}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Loading</p>
            <p className="text-sm text-muted-foreground">{isLoading ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Current User ID</p>
            <p className="text-sm text-muted-foreground">{userId || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Online Users</p>
            <p className="text-sm text-muted-foreground">{totalUsers}</p>
          </div>
        </div>

        {totalUsers > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Active Users:</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {usersList.map(({ userId: uId, presences }) => (
                <div key={uId} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                  <span className="text-sm font-mono">{uId}</span>
                  <Badge variant="outline" className="text-xs">
                    {presences.length} presence{presences.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Troubleshooting:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
            <li>• Check network connectivity</li>
            <li>• Verify Supabase project is active</li>
            <li>• Check browser developer tools for WebSocket errors</li>
            <li>• Try refreshing the page if connection issues persist</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Page
          </Button>
        </div>

        <div className="mt-4 p-3 bg-muted/30 rounded-md">
          <p className="text-xs text-muted-foreground">
            <strong>Debug Info:</strong> This component shows the real-time connection status 
            and helps diagnose WebSocket connectivity issues with Supabase Realtime.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}