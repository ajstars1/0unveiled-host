"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useAnimation, useInView } from "framer-motion";
import { 
  Upload, 
  Scan, 
  Trophy, 
  Users,
  ChevronLeft,
  ChevronRight,
  FileUp,
  Zap,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface StepCardProps {
  step: {
    id: string;
    icon: React.ElementType;
    title: string;
    description: string;
    color: string;
  };
  isActive: boolean;
  onActivate: () => void;
  stepNumber: number;
}

const StepCard = ({ step, isActive, onActivate, stepNumber }: StepCardProps) => {
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [scanScore, setScanScore] = useState(0);
  const [leaderboardItems, setLeaderboardItems] = useState([
    { name: "Alex Chen", score: 94 },
    { name: "Sarah Kim", score: 92 },
    { name: "Jordan Lee", score: 89 },
  ]);
  const [recruitMatch, setRecruitMatch] = useState(0);

  const controls = useAnimation();
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { amount: 0.3 });

  useEffect(() => {
    if (isActive && isInView) {
      setIsDemoActive(true);
      controls.start({
        scale: 1.02,
        y: -4,
        transition: { duration: 0.2, ease: "easeOut" }
      });
    } else {
      setIsDemoActive(false);
      controls.start({
        scale: 1,
        y: 0,
        transition: { duration: 0.2, ease: "easeOut" }
      });
    }
  }, [isActive, isInView, controls]);

  // Simplified demo animations - only run when card is clicked
  useEffect(() => {
    if (!isDemoActive) return;

    const runDemo = async () => {
      switch (step.id) {
        case 'github':
          setUploadProgress(0);
          for (let i = 0; i <= 100; i += 25) {
            await new Promise(resolve => setTimeout(resolve, 150));
            setUploadProgress(i);
          }
          break;

        case 'scan':
          setScanScore(0);
          for (let i = 0; i <= 87; i += 10) {
            await new Promise(resolve => setTimeout(resolve, 80));
            setScanScore(i);
          }
          break;

        case 'leaderboard':
          const newItems = [...leaderboardItems];
          newItems.unshift({ name: "You", score: 87 });
          setLeaderboardItems(newItems.slice(0, 3));
          break;

        case 'recruit':
          setRecruitMatch(0);
          for (let i = 0; i <= 95; i += 15) {
            await new Promise(resolve => setTimeout(resolve, 100));
            setRecruitMatch(i);
          }
          break;
      }
    };

    runDemo();
  }, [isDemoActive, step.id]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (step.id === 'github') {
      setIsDemoActive(true);
    }
  }, [step.id]);

  const renderDemo = () => {
    switch (step.id) {
      case 'github':
        return (
          <div 
            className="mt-4 p-4 border-2 border-dashed border-muted rounded-lg bg-muted/20 transition-colors hover:bg-muted/40 cursor-pointer"
            onClick={() => setIsDemoActive(true)}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 bg-gray-800 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">GH</span>
              </div>
              <p className="text-sm text-muted-foreground">Connect GitHub Account</p>
              {uploadProgress > 0 && (
                <div className="w-full mt-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-center mt-1">
                    {uploadProgress < 100 ? 'Connecting...' : 'Connected! ✅'}
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 'scan':
        return (
          <div className="mt-4 p-4 bg-primary/5 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Scan className="h-6 w-6 text-accent" />
                {isDemoActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-accent"
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Analyzing Repos</span>
                  <span className="text-lg font-bold text-accent">{scanScore}/100</span>
                </div>
                <Progress value={scanScore} className="h-2" />
                <div className="flex gap-1 mt-2">
                  <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded">React</span>
                  <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded">TypeScript</span>
                  <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded">Node.js</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'leaderboard':
        return (
          <div className="mt-4 space-y-2">
            <div className="text-center mb-3">
              <div className="text-2xl font-bold text-accent">87th</div>
              <div className="text-xs text-muted-foreground">Your Rank</div>
            </div>
            {leaderboardItems.map((item, index) => (
              <motion.div
                key={`${item.name}-${index}`}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center justify-between p-2 rounded ${
                  item.name === "You" ? "bg-accent/20 border border-accent" : "bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">#{index + 1}</span>
                  <span className="text-sm">{item.name}</span>
                </div>
                <span className="text-sm font-bold">{item.score}</span>
              </motion.div>
            ))}
            <div className="text-center mt-3">
              <div className="text-xs text-accent font-medium">↑ Improve 3 more repos to rank higher</div>
            </div>
          </div>
        );

      case 'recruit':
        return (
          <div className="mt-4 p-4 bg-accent/10 rounded-lg border border-accent/30">
            <div className="flex items-center gap-3 mb-3">
              <Users className="h-6 w-6 text-accent" />
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Profile Match</span>
                  <span className="text-lg font-bold text-accent">{recruitMatch}%</span>
                </div>
                <Progress value={recruitMatch} className="h-2" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>Frontend Dev</span>
                <span className="text-accent font-medium">95% match</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>React Specialist</span>
                <span className="text-accent font-medium">92% match</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>TypeScript Expert</span>
                <span className="text-accent font-medium">88% match</span>
              </div>
            </div>
            {recruitMatch > 90 && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-accent mt-3 font-medium text-center"
              >
                � Companies are viewing your profile!
              </motion.p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      ref={cardRef}
      animate={controls}
      className="flex-shrink-0 w-full max-w-sm mx-auto sm:w-80 h-auto min-h-[320px] sm:h-96 p-4 sm:p-6 bg-card border rounded-lg cursor-pointer relative overflow-hidden"
      onClick={onActivate}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onActivate();
        }
      }}
      aria-label={`Step ${step.title}: ${step.description}`}
    >
      {/* Step number indicator */}
      <div className="absolute top-3 right-3 w-6 h-6 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-xs font-bold">
        {stepNumber}
      </div>

      <div className="h-full flex flex-col">
        <div className="flex items-center gap-3 mb-3 sm:mb-4">
          <div className={`p-2 sm:p-3 rounded-lg ${step.color} shadow-sm`}>
            <step.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-heading text-lg sm:text-xl font-semibold leading-tight">{step.title}</h3>
          </div>
        </div>
        
        <p className="text-muted-foreground text-sm mb-4 sm:mb-6 flex-shrink-0 leading-relaxed">
          {step.description}
        </p>
        
        <div className="flex-1">
          {renderDemo()}
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

  const steps = [
    {
      id: 'github',
      icon: Upload,
      title: 'Connect GitHub',
      description: 'Link your GitHub account to showcase your coding projects and contributions.',
      color: 'bg-gray-800'
    },
    {
      id: 'scan',
      icon: Scan,
      title: 'AI Analysis',
      description: 'Our AI analyzes your repositories, commits, and code quality to create your developer profile.',
      color: 'bg-purple-500'
    },
    {
      id: 'leaderboard',
      icon: Trophy,
      title: 'Compare & Rank',
      description: 'See how you stack up against other developers and get personalized improvement insights.',
      color: 'bg-green-500'
    },
    {
      id: 'recruit',
      icon: Users,
      title: 'Get Discovered',
      description: 'Companies find you through our matching algorithm based on your skills and project experience.',
      color: 'bg-orange-500'
    }
  ];

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    
    const container = scrollRef.current;
    const cardWidth = container.offsetWidth || 320;
    const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
    
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
  }, [isDragging]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    const endX = e.changedTouches[0].clientX;
    const diffX = startX - endX;
    const threshold = 50;

    if (Math.abs(diffX) > threshold) {
      if (diffX > 0 && activeStep < steps.length - 1) {
        // Swipe left - next
        scroll('right');
        setActiveStep(prev => prev + 1);
      } else if (diffX < 0 && activeStep > 0) {
        // Swipe right - previous
        scroll('left');
        setActiveStep(prev => prev - 1);
      }
    }
  }, [isDragging, startX, activeStep, steps.length]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scroll('left');
      setActiveStep(prev => Math.max(0, prev - 1));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      scroll('right');
      setActiveStep(prev => Math.min(steps.length - 1, prev + 1));
    }
  }, [steps.length]);

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;
      
      const container = scrollRef.current;
      const cardWidth = container.offsetWidth || 320;
      const currentIndex = Math.round(container.scrollLeft / cardWidth);
      setActiveStep(currentIndex);
    };

    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      window.addEventListener('keydown', handleKeyDown);
      
      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [handleKeyDown]);

  return (
    <div className="w-full" role="region" aria-label="How it works process">
      <div className="mb-6 sm:mb-8 text-center px-4">
        <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">How It Works</h2>
        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
          Get discovered by top companies through your GitHub profile in four simple steps
        </p>
      </div>

      <div className="relative">
        {/* Navigation buttons */}
        <Button
          variant="outline"
          size="icon"
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm h-8 w-8 sm:h-10 sm:w-10"
          onClick={() => scroll('left')}
          disabled={activeStep === 0}
          aria-label="Previous step"
        >
          <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm h-8 w-8 sm:h-10 sm:w-10"
          onClick={() => scroll('right')}
          disabled={activeStep === steps.length - 1}
          aria-label="Next step"
        >
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>

        {/* Scrollable container */}
        <div className="w-full overflow-hidden">
          <div
            ref={scrollRef}
            className="flex gap-4 md:gap-6 px-4 md:px-16 py-8 overflow-x-auto scroll-smooth snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            role="list"
            aria-live="polite"
            aria-label={`Step ${activeStep + 1} of ${steps.length}: ${steps[activeStep]?.title}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {steps.map((step, index) => (
              <div key={step.id} role="listitem" className="flex-shrink-0 snap-center">
                <StepCard
                  step={step}
                  isActive={index === activeStep}
                  onActivate={() => setActiveStep(index)}
                  stepNumber={index + 1}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Progress indicators */}
        <div className="flex justify-center gap-2 mt-4 sm:mt-6 px-4">
          {steps.map((_, index) => (
            <button
              key={index}
              className={`h-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
                index === activeStep ? 'w-6 sm:w-8 bg-accent' : 'w-2 bg-muted hover:bg-muted-foreground/50'
              }`}
              onClick={() => {
                setActiveStep(index);
                if (scrollRef.current) {
                  scrollRef.current.scrollTo({
                    left: index * (scrollRef.current.offsetWidth || 320),
                    behavior: 'smooth'
                  });
                }
              }}
              aria-label={`Go to step ${index + 1}: ${steps[index].title}`}
              aria-current={index === activeStep ? 'step' : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}