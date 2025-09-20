"use client"

import { useEffect, useState } from 'react'

interface DeviceInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isTouch: boolean
  screenWidth: number
  screenHeight: number
}

export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouch: false,
    screenWidth: 1024,
    screenHeight: 768,
  })

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      // Touch detection
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      
      // Screen size based detection
      const isMobile = width < 768 && isTouch
      const isTablet = width >= 768 && width < 1024 && isTouch
      const isDesktop = width >= 1024 || !isTouch

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        isTouch,
        screenWidth: width,
        screenHeight: height,
      })
    }

    // Initial detection
    updateDeviceInfo()

    // Listen for resize events
    window.addEventListener('resize', updateDeviceInfo)
    
    return () => {
      window.removeEventListener('resize', updateDeviceInfo)
    }
  }, [])

  return deviceInfo
}
