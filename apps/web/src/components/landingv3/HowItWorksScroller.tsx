"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { motion, useAnimationControls, useInView } from "framer-motion";
import { 
  Upload, 
  Scan, 
  Trophy, 
  Users,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Memoized leaderboard data to prevent recreation
const INITIAL_LEADERBOARD = [
  { name: "Alex Chen", score: 85 },
  { name: "Sarah Kim", score: 82 },
  // { name: "Jordan Lee", score: 89 },
];

// Type for leaderboard items
type LeaderboardItem = {
  name: string;
  score: number;
};

// Structured data for SEO - moved outside component and simplified
const HOW_IT_WORKS_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Get Discovered by Companies on 0Unveiled",
  "description": "Learn how to connect your GitHub profile and get discovered by top companies in four simple steps",
  "totalTime": "PT10M",
  "step": [
    {
      "@type": "HowToStep",
      "position": 1,
      "name": "Connect GitHub Account",
      "text": "Link your GitHub account to showcase your coding projects and contributions"
    },
    {
      "@type": "HowToStep",
      "position": 2,
      "name": "AI Analysis",
      "text": "Our AI analyzes your repositories, commits, and code quality to create your developer profile"
    },
    {
      "@type": "HowToStep",
      "position": 3,
      "name": "Compare & Rank",
      "text": "See how you stack up against other developers and get personalized improvement insights"
    },
    {
      "@type": "HowToStep",
      "position": 4,
      "name": "Get Discovered",
      "text": "Companies find you through our matching algorithm based on your skills and project experience"
    }
  ]
} as const;

interface StepCardProps {
  step: {
    id: string;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    color: string;
  };
  isActive: boolean;
  onActivate: (index: number) => void;
  stepNumber: number;
}

const StepCard = ({ step, isActive, onActivate, stepNumber }: StepCardProps) => {
  // Combine related state to reduce re-renders
  const [demoState, setDemoState] = useState<{
    isDemoActive: boolean;
    uploadProgress: number;
    scanScore: number;
    leaderboardItems: LeaderboardItem[];
    recruitMatch: number;
  }>({
    isDemoActive: false,
    uploadProgress: 0,
    scanScore: 0,
    leaderboardItems: INITIAL_LEADERBOARD,
    recruitMatch: 0,
  });

  const controls = useAnimationControls();
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { amount: 0.3, once: false });

  // Optimized demo animation logic - removed setTimeout loops
  const runDemo = useCallback(async (stepId: string) => {
    switch (stepId) {
      case 'github':
        // Simple state update instead of loop
        setDemoState(prev => ({ ...prev, uploadProgress: 25 }));
        await new Promise(resolve => setTimeout(resolve, 200));
        setDemoState(prev => ({ ...prev, uploadProgress: 50 }));
        await new Promise(resolve => setTimeout(resolve, 200));
        setDemoState(prev => ({ ...prev, uploadProgress: 75 }));
        await new Promise(resolve => setTimeout(resolve, 200));
        setDemoState(prev => ({ ...prev, uploadProgress: 100 }));
        break;

      case 'scan':
        // Simplified animation
        setDemoState(prev => ({ ...prev, scanScore: 20 }));
        await new Promise(resolve => setTimeout(resolve, 100));
        setDemoState(prev => ({ ...prev, scanScore: 45 }));
        await new Promise(resolve => setTimeout(resolve, 100));
        setDemoState(prev => ({ ...prev, scanScore: 72 }));
        await new Promise(resolve => setTimeout(resolve, 100));
        setDemoState(prev => ({ ...prev, scanScore: 87 }));
        break;

      case 'leaderboard':
        // Immediate state update
        setDemoState(prev => ({
          ...prev,
          leaderboardItems: [{ name: "You", score: 87 }, ...INITIAL_LEADERBOARD]
        }));
        break;

      case 'recruit':
        // Simplified animation
        setDemoState(prev => ({ ...prev, recruitMatch: 25 }));
        await new Promise(resolve => setTimeout(resolve, 120));
        setDemoState(prev => ({ ...prev, recruitMatch: 55 }));
        await new Promise(resolve => setTimeout(resolve, 120));
        setDemoState(prev => ({ ...prev, recruitMatch: 78 }));
        await new Promise(resolve => setTimeout(resolve, 120));
        setDemoState(prev => ({ ...prev, recruitMatch: 95 }));
        break;
    }
  }, []);

  useEffect(() => {
    if (isActive && isInView) {
      setDemoState(prev => ({ ...prev, isDemoActive: true }));
      controls.start({
        scale: 1.02,
        y: -4,
        transition: { duration: 0.2, ease: "easeOut" }
      });
    } else {
      setDemoState(prev => ({ ...prev, isDemoActive: false }));
      controls.start({
        scale: 1,
        y: 0,
        transition: { duration: 0.2, ease: "easeOut" }
      });
    }
  }, [isActive, isInView, controls]);

  // Only run demo when explicitly activated
  useEffect(() => {
    if (demoState.isDemoActive) {
      runDemo(step.id);
    }
  }, [demoState.isDemoActive, step.id, runDemo]);

  const handleDemoClick = useCallback(() => {
    setDemoState(prev => ({ ...prev, isDemoActive: true }));
  }, []);

  // Memoize demo render to prevent unnecessary re-renders
  const renderDemo = useMemo(() => {
    switch (step.id) {
      case 'github':
        return (
          <motion.div
            className="mt-4 p-5 border-2 border-dashed border-muted-foreground/40 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors duration-300 cursor-pointer"
            onClick={handleDemoClick}
            role="button"
            tabIndex={0}
            aria-label="Connect GitHub account demo"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex flex-col items-center gap-3">
              {/* GitHub icon with subtle animation */}
              <motion.div
                className="relative"
                animate={demoState.uploadProgress > 0 && demoState.uploadProgress < 100 ? {
                  scale: [1, 1.05, 1]
                } : {}}
                transition={{ duration: 2, repeat: demoState.uploadProgress < 100 ? Infinity : 0 }}
              >
                <motion.div
                  className={`h-10 w-10 rounded-full flex items-center justify-center shadow-md ${
                    demoState.uploadProgress === 100
                      ? 'bg-accent'
                      : 'bg-primary'
                  }`}
                  animate={demoState.uploadProgress === 100 ? {
                    scale: [1, 1.1, 1]
                  } : {}}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  {demoState.uploadProgress === 100 ? (
                    <motion.svg
                      className="h-5 w-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                    >
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </motion.svg>
                  ) : (
                    <span className="text-white text-sm font-bold">GH</span>
                  )}
                </motion.div>
              </motion.div>

              {/* Text with subtle animation */}
              <motion.p
                className={`text-sm font-medium text-center ${
                  demoState.uploadProgress === 100 ? 'text-accent' : 'text-muted-foreground'
                }`}
                animate={demoState.uploadProgress > 0 && demoState.uploadProgress < 100 ? {
                  opacity: [0.7, 1, 0.7]
                } : {}}
                transition={{ duration: 1.5, repeat: demoState.uploadProgress < 100 ? Infinity : 0 }}
              >
                {demoState.uploadProgress === 100 ? 'Connected Successfully!' : 'Connect GitHub Account'}
              </motion.p>

              {/* Progress bar with smooth animation */}
              {demoState.uploadProgress > 0 && (
                <motion.div
                  className="w-full mt-2"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Progress
                    value={demoState.uploadProgress}
                    className="h-2"
                    aria-label={`Connection progress: ${demoState.uploadProgress}%`}
                  />
                  <motion.p
                    className="text-xs text-center mt-2 text-muted-foreground"
                    aria-live="polite"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {demoState.uploadProgress < 100 ? 'Connecting...' : 'Connected!'}
                  </motion.p>
                </motion.div>
              )}
            </div>
          </motion.div>
        );

      case 'scan':
        return (
          <div className="mt-4 p-4 bg-primary/5 rounded-lg border" role="region" aria-label="AI analysis demo">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Scan className="h-6 w-6 text-accent" aria-hidden="true" />
                {demoState.isDemoActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-accent"
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "easeOut" }}
                    aria-hidden="true"
                  />
                )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Analyzing Repos</span>
                  <span className="text-lg font-bold text-accent" aria-live="polite">{demoState.scanScore}/100</span>
                </div>
                <Progress value={demoState.scanScore} className="h-2" aria-label={`Analysis progress: ${demoState.scanScore}%`} />
                <div className="flex gap-1 mt-2" role="list" aria-label="Detected skills">
                  {['React', 'TypeScript', 'Node.js'].map(skill => (
                    <span key={skill} className="text-xs bg-accent/10 text-accent px-2 py-1 rounded" role="listitem">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'leaderboard':
        return (
          <div className="mt-4 space-y-3" role="region" aria-label="Developer ranking demo">
            {/* Animated rank display */}
            <motion.div 
              className="text-center mb-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <motion.div 
                className="text-3xl font-bold text-accent mb-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                aria-live="polite"
              >
                1st
              </motion.div>
              <motion.div 
                className="text-xs text-muted-foreground"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                 Rank
              </motion.div>
            </motion.div>

            {/* Animated leaderboard */}
            <div className="space-y-2">
              {demoState.leaderboardItems.map((item, index) => (
                <motion.div
                  key={`${item.name}-${index}`}
                  initial={{ x: -30, opacity: 0, scale: 0.9 }}
                  animate={{ x: 0, opacity: 1, scale: 1 }}
                  transition={{ 
                    delay: index * 0.15 + 0.3,
                    type: "spring", 
                    stiffness: 100,
                    damping: 15
                  }}
                  className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 ${
                    item.name === "You" 
                      ? "bg-accent/20 border-2 border-accent shadow-lg shadow-accent/20" 
                      : "bg-muted/50 hover:bg-muted/70"
                  }`}
                  role="listitem"
                  aria-label={`${item.name} ranked #${index + 1} with score ${item.score}`}
                >
                  <div className="flex items-center gap-3">
                    {/* Trophy for top rank */}
                    {index === 0 && (
                      <motion.div
                        initial={{ rotate: -180, scale: 0 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ delay: index * 0.15 + 0.5, type: "spring" }}
                      >
                        <Trophy className="h-4 w-4 text-accent" />
                      </motion.div>
                    )}
                    
                    <motion.span 
                      className="text-sm font-bold text-muted-foreground min-w-[20px]"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.15 + 0.4 }}
                    >
                      #{index + 1}
                    </motion.span>
                    
                    <motion.span 
                      className={`text-sm font-medium ${item.name === "You" ? "text-accent font-bold" : ""}`}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.15 + 0.6 }}
                    >
                      {item.name}
                    </motion.span>
                  </div>
                  
                  <motion.div 
                    className="flex items-center gap-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.15 + 0.7, type: "spring" }}
                  >
                    <motion.span 
                      className={`text-sm font-bold ${item.name === "You" ? "text-accent" : "text-foreground"}`}
                      animate={item.name === "You" ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {item.score}
                    </motion.span>
                    
                    {/* Pulsing indicator for user's rank */}
                    {item.name === "You" && (
                      <motion.div
                        className="w-2 h-2 bg-accent rounded-full"
                        animate={{ 
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                  </motion.div>
                </motion.div>
              ))}
            </div>

            {/* Improvement suggestion with animation */}
            <motion.div 
              className="text-center mt-4 pt-3 border-t border-muted"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              <motion.div 
                className="text-xs text-accent font-medium flex items-center justify-center gap-1"
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
                >
                  ↑
                </motion.span>
                Improve 3 more repos to rank higher
              </motion.div>
            </motion.div>
          </div>
        );

      case 'recruit':
        return (
          <div className="mt-4 p-4 bg-accent/10 rounded-lg border border-accent/30" role="region" aria-label="Recruitment matching demo">
            <div className="flex items-center gap-3 mb-3">
              <Users className="h-6 w-6 text-accent" aria-hidden="true" />
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Profile Match</span>
                  <span className="text-lg font-bold text-accent" aria-live="polite">{demoState.recruitMatch}%</span>
                </div>
                <Progress value={demoState.recruitMatch} className="h-2" aria-label={`Match progress: ${demoState.recruitMatch}%`} />
              </div>
            </div>
            <div className="space-y-2" role="list" aria-label="Job match details">
              {[
                { role: "Frontend Dev", match: 95 },
                { role: "React Specialist", match: 92 },
                { role: "TypeScript Expert", match: 88 }
              ].map(({ role, match }) => (
                <div key={role} className="flex items-center justify-between text-xs" role="listitem">
                  <span>{role}</span>
                  <span className="text-accent font-medium">{match}% match</span>
                </div>
              ))}
            </div>
            {demoState.recruitMatch > 90 && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-accent mt-3 font-medium text-center"
                aria-live="polite"
              >
                💼 Companies are viewing your profile!
              </motion.p>
            )}
          </div>
        );

      default:
        return null;
    }
  }, [step.id, demoState, handleDemoClick]);

  return (
    <motion.div
      ref={cardRef}
      animate={controls}
      className="flex-shrink-0 w-full max-w-[280px] mx-auto sm:max-w-sm md:w-80 h-auto min-h-[280px] sm:min-h-[320px] md:h-full p-3 sm:p-4 md:p-6 bg-card border rounded-lg cursor-pointer relative overflow-hidden"
      onClick={() => onActivate(stepNumber - 1)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onActivate(stepNumber - 1);
        }
      }}
      aria-label={`Step ${step.title}: ${step.description}`}
    >
      {/* Step number indicator */}
      <div className="absolute top-3 right-3 w-6 h-6 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-xs font-bold">
        {stepNumber}
      </div>

      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 md:mb-4">
          <div className={`p-1.5 sm:p-2 md:p-3 rounded-lg ${step.color} shadow-sm`}>
            <step.icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-base sm:text-lg md:text-xl font-semibold leading-tight truncate">{step.title}</h3>
          </div>
        </div>
        
        <p className="text-muted-foreground text-xs sm:text-sm md:text-sm mb-3 sm:mb-4 md:mb-6 flex-shrink-0 leading-relaxed">
          {step.description}
        </p>
        
        <div className="flex-1">
          {renderDemo}
        </div>

        {isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 pt-4 border-t"
          >
            <div className="flex items-center gap-2 text-accent">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-medium">Active Step</span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default function HowItWorksScroller() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize steps data to prevent recreation
  const steps = useMemo(() => [
    {
      id: 'github',
      icon: Upload,
      title: 'Connect GitHub',
      description: 'Link your GitHub account to showcase your projects.',
      color: 'bg-primary/80'
    },
    {
      id: 'scan',
      icon: Scan,
      title: 'AI Analysis',
      description: 'AI analyzes your repos and creates your developer profile.',
      color: 'bg-accent/80'
    },
    {
      id: 'leaderboard',
      icon: Trophy,
      title: 'Compare & Rank',
      description: 'See how you rank against other developers.',
      color: 'bg-primary/80'
    },
    {
      id: 'recruit',
      icon: Users,
      title: 'Get Discovered',
      description: 'Companies find you based on your skills and experience.',
      color: 'bg-accent/80'
    }
  ], []);

  // Shared calculation function for consistent positioning
  const getScrollPositionForStep = useCallback((stepIndex: number, container: HTMLElement) => {
    const containerWidth = container.clientWidth;
    const isMobile = window.innerWidth < 768;

    // Responsive card width
    const cardWidth = isMobile ? Math.min(containerWidth - 32, 280) : 320; // 280px max on mobile, account for padding
    const gap = isMobile ? 12 : 24; // Smaller gap on mobile
    const padding = isMobile ? 16 : 64;

    // Calculate the position to center the card in the viewport
    const cardPosition = stepIndex * (cardWidth + gap);
    const centerOffset = (containerWidth - cardWidth) / 2;
    return Math.max(0, cardPosition - centerOffset + padding);
  }, []);

  const scrollToStep = useCallback((stepIndex: number) => {
    if (!scrollRef.current) return;

    const container = scrollRef.current;
    const scrollPosition = getScrollPositionForStep(stepIndex, container);

    container.scrollTo({
      left: scrollPosition,
      behavior: "smooth",
    });
  }, [getScrollPositionForStep]);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  }, []);

  // Auto-scroll functionality - optimized interval
  const startAutoScroll = useCallback(() => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
    }
    autoScrollIntervalRef.current = setInterval(() => {
      if (isAutoScrolling && !isHovered && !isDragging) {
        setActiveStep((prev) => {
          const next = (prev + 1) % steps.length;
          scrollToStep(next);
          return next;
        });
      }
    }, 3500); // Reduced from 4000ms to 3500ms for better engagement
  }, [isAutoScrolling, isHovered, isDragging, steps.length, scrollToStep]);

  useEffect(() => {
    startAutoScroll();
    return () => stopAutoScroll();
  }, [startAutoScroll, stopAutoScroll]);

  // Memoize step activation handler
  const handleStepActivate = useCallback((index: number) => {
    setActiveStep(index);
    setIsAutoScrolling(false);
    scrollToStep(index);
  }, [scrollToStep]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;

    const nextStep = direction === "left"
      ? Math.max(0, activeStep - 1)
      : Math.min(steps.length - 1, activeStep + 1);

    if (nextStep !== activeStep) {
      setActiveStep(nextStep);
      scrollToStep(nextStep);
    }
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault();
    },
    [isDragging]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;
      setIsDragging(false);

      const endX = e.changedTouches[0].clientX;
      const diffX = startX - endX;
      const threshold = 50;

      if (Math.abs(diffX) > threshold) {
        if (diffX > 0 && activeStep < steps.length - 1) {
          // Swipe left - next
          scroll("right");
          setActiveStep((prev) => prev + 1);
        } else if (diffX < 0 && activeStep > 0) {
          // Swipe right - previous
          scroll("left");
          setActiveStep((prev) => prev - 1);
        }
      }
    },
    [isDragging, startX, activeStep, steps.length]
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        scroll("left");
        setActiveStep((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        scroll("right");
        setActiveStep((prev) => Math.min(steps.length - 1, prev + 1));
      }
    },
    [steps.length]
  );

  // Optimized scroll handler with better performance
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    let rafId: number;

    const handleScroll = () => {
      // Use requestAnimationFrame for better performance
      if (rafId) cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          if (!scrollRef.current) return;

          const container = scrollRef.current;
          const currentScrollLeft = container.scrollLeft;

          // Find which step is closest to the current scroll position
          let closestStep = 0;
          let minDistance = Infinity;

          for (let i = 0; i < steps.length; i++) {
            const expectedScroll = getScrollPositionForStep(i, container);
            const distance = Math.abs(currentScrollLeft - expectedScroll);
            if (distance < minDistance) {
              minDistance = distance;
              closestStep = i;
            }
          }

          // Only update if we're reasonably close to a step position (within 25px on mobile, 40px on desktop)
          const threshold = window.innerWidth < 768 ? 25 : 40;
          if (minDistance < threshold) {
            setActiveStep(closestStep);
          }
        }, 50); // Reduced from 100ms to 50ms for better responsiveness
      });
    };

    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        if (rafId) cancelAnimationFrame(rafId);
        clearTimeout(scrollTimeout);
        scrollContainer.removeEventListener("scroll", handleScroll);
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [handleKeyDown, steps.length, getScrollPositionForStep]);

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(HOW_IT_WORKS_SCHEMA)
        }}
      />
      
      <section 
        className="w-full" 
        role="region" 
        aria-label="How it works process"
        itemScope 
        itemType="https://schema.org/HowTo"
      >
        <header className="mb-6 sm:mb-8 text-center px-4">
          <h2 
            className="font-heading text-2xl sm:text-3xl font-bold mb-3 sm:mb-4"
            itemProp="name"
          >
            How It Works
          </h2>
          <p 
            className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto"
            itemProp="description"
          >
            Get discovered by top companies through your GitHub profile in four
            simple steps
          </p>
        </header>

      <div
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Scrollable container */}
        <div className="relative w-full overflow-hidden">

          <div
            ref={scrollRef}
            className="flex gap-3 md:gap-6 px-4 md:px-16 py-6 md:py-8 overflow-x-auto scroll-smooth snap-x snap-mandatory"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            role="list"
            aria-live="polite"
            aria-label={`Step ${activeStep + 1} of ${steps.length}: ${steps[activeStep]?.title}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {steps.map((step, index) => (
              <div
                key={step.id}
                role="listitem"
                className="flex-shrink-0 snap-center"
                itemProp="itemListElement"
                itemScope
                itemType="https://schema.org/HowToStep"
              >
                <meta itemProp="position" content={(index + 1).toString()} />
                <StepCard
                  step={step}
                  isActive={index === activeStep}
                  onActivate={handleStepActivate}
                  stepNumber={index + 1}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Progress indicators */}
        <nav className="flex justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-4 md:mt-6 px-2 sm:px-4" role="tablist" aria-label="Step navigation">
          {steps.map((_, index) => (
            <motion.button
              key={index}
              className={`relative h-1.5 sm:h-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
                index === activeStep
                  ? "w-4 sm:w-6 md:w-8 bg-accent"
                  : "w-1.5 sm:w-2 bg-muted hover:bg-muted-foreground/50"
              }`}
              onClick={() => {
                setActiveStep(index);
                setIsAutoScrolling(false);
                scrollToStep(index);
              }}
              aria-label={`Go to step ${index + 1}: ${steps[index].title}`}
              aria-current={index === activeStep ? "step" : undefined}
              role="tab"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            >
              {/* Auto-scroll indicator */}
              {isAutoScrolling && index === activeStep && (
                <motion.div
                  className="absolute inset-0 bg-accent rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{
                    duration: 4,
                    ease: "linear",
                    repeat: Infinity,
                  }}
                  style={{ originX: 0 }}
                  aria-hidden="true"
                />
              )}
            </motion.button>
          ))}

        </nav>
      </div>
      </section>
    </>
  );
}
