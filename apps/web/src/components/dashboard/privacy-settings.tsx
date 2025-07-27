"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Eye, Search, Download, Trash2 } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

export function PrivacySettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Profile Visibility</CardTitle>
          </div>
          <CardDescription>Control who can see your profile and information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Profile Privacy</h3>
            <RadioGroup defaultValue="public">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public">Public (Anyone can view your profile)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="connections" id="connections" />
                <Label htmlFor="connections">Connections only (Only your connections can view your profile)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="private" id="private" />
                <Label htmlFor="private">Private (Only you can view your profile)</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Information Visibility</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="email-visibility">Email Address</Label>
                </div>
                <Select defaultValue="connections">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="connections">Connections only</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="phone-visibility">Phone Number</Label>
                </div>
                <Select defaultValue="private">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="connections">Connections only</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="projects-visibility">Projects</Label>
                </div>
                <Select defaultValue="public">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="connections">Connections only</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="skills-visibility">Skills</Label>
                </div>
                <Select defaultValue="public">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="connections">Connections only</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6 flex justify-between">
          <Button variant="outline">Reset to Defaults</Button>
          <Button>Save Settings</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Search and Discovery</CardTitle>
          </div>
          <CardDescription>Control how others can find you on the platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="search-engines" className="block mb-1">
                Search Engine Indexing
              </Label>
              <p className="text-sm text-muted-foreground">Allow search engines to index your profile</p>
            </div>
            <Switch id="search-engines" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="profile-discovery" className="block mb-1">
                Profile Discovery
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow others to find your profile through skills and interests
              </p>
            </div>
            <Switch id="profile-discovery" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="project-suggestions" className="block mb-1">
                Project Suggestions
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow project leaders to discover and invite you to projects
              </p>
            </div>
            <Switch id="project-suggestions" defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Data Management</CardTitle>
          </div>
          <CardDescription>Manage your personal data and account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <Download className="mr-2 h-4 w-4" />
              Download Your Data
            </Button>
            <p className="text-xs text-muted-foreground">
              Download a copy of all the data we have stored for your account.
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Button variant="destructive" className="w-full justify-start">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Account
            </Button>
            <p className="text-xs text-muted-foreground">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
