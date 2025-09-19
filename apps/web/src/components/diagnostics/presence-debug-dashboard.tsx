'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PresenceDiagnostics } from './presence-diagnostics'
import { PresenceTroubleshooter } from './presence-troubleshooter'
import { Button } from '@/components/ui/button'
import { useGlobalPresence } from '@/hooks/use-global-presence'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Bug, Settings } from 'lucide-react'

interface PresenceDebugDashboardProps {
  userId?: string
}

export function PresenceDebugDashboard({ userId }: PresenceDebugDashboardProps) {
  const { connectionStatus, isLoading } = useGlobalPresence({ userId })
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Presence System Debug Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            This dashboard helps diagnose and resolve WebSocket connection issues with the global presence system.
          </p>
          
          <div className="flex items-center gap-4">
            <div>
              <span className="text-sm font-medium">Current Status: </span>
              <span className={`text-sm font-mono ${
                connectionStatus === 'CONNECTED' ? 'text-green-600' : 
                connectionStatus === 'ERROR' ? 'text-red-600' : 
                'text-yellow-600'
              }`}>
                {connectionStatus}
              </span>
            </div>
            
            <div>
              <span className="text-sm font-medium">Loading: </span>
              <span className="text-sm font-mono">{isLoading ? 'Yes' : 'No'}</span>
            </div>

            <Button
              onClick={() => setShowAdvanced(!showAdvanced)}
              variant="outline"
              size="sm"
              className="ml-auto"
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="diagnostics" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="diagnostics" className="flex items-center gap-2">
            <Bug className="h-4 w-4" />
            Diagnostics
          </TabsTrigger>
          <TabsTrigger value="troubleshooter" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Troubleshooter
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="diagnostics">
          <PresenceDiagnostics userId={userId} />
        </TabsContent>
        
        <TabsContent value="troubleshooter">
          <PresenceTroubleshooter />
        </TabsContent>
      </Tabs>

      {showAdvanced && (
        <Card>
          <CardHeader>
            <CardTitle>Advanced Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs font-mono bg-muted/50 p-3 rounded-md">
              <div><strong>Environment:</strong></div>
              <div>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</div>
              <div>Site URL: {process.env.NEXT_PUBLIC_SITE_URL}</div>
              <div>User Agent: {navigator.userAgent.substring(0, 100)}...</div>
              <div>Timestamp: {new Date().toISOString()}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}