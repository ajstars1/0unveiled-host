"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Monitor, Moon, Sun, Laptop, LayoutGrid, List, Languages } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"

export function DisplaySettings() {
  const [fontSize, setFontSize] = useState([16])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Appearance</CardTitle>
          </div>
          <CardDescription>Customize how the dashboard looks and feels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Theme</h3>
            <RadioGroup defaultValue="system">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col items-center space-y-2 border rounded-md p-4 cursor-pointer hover:bg-muted/50">
                  <Laptop className="h-6 w-6 mb-2" />
                  <RadioGroupItem value="system" id="system" className="sr-only" />
                  <Label htmlFor="system" className="font-medium cursor-pointer">
                    System
                  </Label>
                  <span className="text-xs text-muted-foreground">Follow system theme</span>
                </div>
                <div className="flex flex-col items-center space-y-2 border rounded-md p-4 cursor-pointer hover:bg-muted/50">
                  <Sun className="h-6 w-6 mb-2" />
                  <RadioGroupItem value="light" id="light" className="sr-only" />
                  <Label htmlFor="light" className="font-medium cursor-pointer">
                    Light
                  </Label>
                  <span className="text-xs text-muted-foreground">Light theme</span>
                </div>
                <div className="flex flex-col items-center space-y-2 border rounded-md p-4 cursor-pointer hover:bg-muted/50">
                  <Moon className="h-6 w-6 mb-2" />
                  <RadioGroupItem value="dark" id="dark" className="sr-only" />
                  <Label htmlFor="dark" className="font-medium cursor-pointer">
                    Dark
                  </Label>
                  <span className="text-xs text-muted-foreground">Dark theme</span>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Font Size</h3>
              <span className="text-sm">{fontSize}px</span>
            </div>
            <Slider defaultValue={fontSize} max={24} min={12} step={1} onValueChange={setFontSize} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Small</span>
              <span>Medium</span>
              <span>Large</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Dashboard Layout</h3>
            <RadioGroup defaultValue="grid">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col items-center space-y-2 border rounded-md p-4 cursor-pointer hover:bg-muted/50">
                  <LayoutGrid className="h-6 w-6 mb-2" />
                  <RadioGroupItem value="grid" id="grid" className="sr-only" />
                  <Label htmlFor="grid" className="font-medium cursor-pointer">
                    Grid
                  </Label>
                  <span className="text-xs text-muted-foreground">Card-based grid layout</span>
                </div>
                <div className="flex flex-col items-center space-y-2 border rounded-md p-4 cursor-pointer hover:bg-muted/50">
                  <List className="h-6 w-6 mb-2" />
                  <RadioGroupItem value="list" id="list" className="sr-only" />
                  <Label htmlFor="list" className="font-medium cursor-pointer">
                    List
                  </Label>
                  <span className="text-xs text-muted-foreground">Compact list layout</span>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Language</h3>
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-muted-foreground" />
              <Select defaultValue="en">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6 flex justify-between">
          <Button variant="outline">Reset to Defaults</Button>
          <Button>Save Preferences</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
