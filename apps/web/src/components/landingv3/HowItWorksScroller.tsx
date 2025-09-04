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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

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
}

const StepCard = ({ step, isActive, onActivate }: StepCardProps) => {
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
  const isInView = useInView(cardRef, { threshold: 0.3 });

  useEffect(() => {
    if (isActive && isInView) {
      setIsDemoActive(true);
      controls.start({
        scale: 1.02,
        y: -8,
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
        transition: { duration: 0.3, ease: "easeOut" }
      });
    } else {
      setIsDemoActive(false);
      controls.start({
        scale: 1,
        y: 0,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
        transition: { duration: 0.3, ease: "easeOut" }
      });
    }
  }, [isActive, isInView, controls]);

  // Demo animations based on step type
  useEffect(() => {
    if (!isDemoActive) return;

    const runDemo = async () => {
      switch (step.id) {
        case 'upload':
          setUploadProgress(0);
          for (let i = 0; i <= 100; i += 10) {
            await new Promise(resolve => setTimeout(resolve, 50));
            setUploadProgress(i);
          }
          toast.success("Resume uploaded successfully!");
          break;

        case 'scan':
          setScanScore(0);
          for (let i = 0; i <= 87; i += 3) {
            await new Promise(resolve => setTimeout(resolve, 30));
            setScanScore(i);
          }
          break;

        case 'leaderboard':
          const newItems = [...leaderboardItems];
          newItems.unshift({ name: "You", score: 95 });
          setLeaderboardItems(newItems.slice(0, 3));
          break;

        case 'recruit':
          setRecruitMatch(0);
          for (let i = 0; i <= 95; i += 5) {
            await new Promise(resolve => setTimeout(resolve, 40));
            setRecruitMatch(i);
          }
          break;
      }
    };

    runDemo();
  }, [isDemoActive, step.id, leaderboardItems]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (step.id === 'upload') {
      setIsDemoActive(true);
    }
  }, [step.id]);

  const renderDemo = () => {
    switch (step.id) {
      case 'upload':
        return (
          <div 
            className="mt-4 p-4 border-2 border-dashed border-muted rounded-lg bg-muted/20 transition-colors hover:bg-muted/40"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className="flex flex-col items-center gap-2">
              <FileUp className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Drop resume here</p>
              {uploadProgress > 0 && (
                <div className="w-full mt-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-center mt-1">{uploadProgress}% uploaded</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'scan':
        return (
          <div className="mt-4 p-4 bg-primary/5 rounded-lg border">
            <div className="flex items-center gap-3">
              <motion.div
                animate={isDemoActive ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 2, repeat: isDemoActive ? Infinity : 0, ease: "linear" }}
              >
                <Zap className="h-6 w-6 text-accent" />
              </motion.div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">AI Analysis</span>
                  <span className="text-lg font-bold text-accent">{scanScore}/100</span>
                </div>
                <Progress value={scanScore} className="h-2" />
              </div>
            </div>
          </div>
        );

      case 'leaderboard':
        return (
          <div className="mt-4 space-y-2">
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
          </div>
        );

      case 'recruit':
        return (
          <div className="mt-4 p-4 bg-accent/10 rounded-lg border border-accent/30">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-accent" />
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Match Score</span>
                  <span className="text-lg font-bold text-accent">{recruitMatch}%</span>
                </div>
                <Progress value={recruitMatch} className="h-2" />
                {recruitMatch > 90 && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-accent mt-2 font-medium"
                  >
                    🎉 Perfect match found!
                  </motion.p>
                )}
              </div>
            </div>
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
      className="flex-shrink-0 w-80 h-96 p-6 bg-card border rounded-lg cursor-pointer"
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
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-lg ${step.color}`}>
            <step.icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-heading text-xl font-semibold">{step.title}</h3>
          </div>
        </div>
        
        <p className="text-muted-foreground text-sm mb-4 flex-shrink-0">
          {step.description}
        </p>
        
        <div className="flex-1">
          {renderDemo()}
        </div>

        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 pt-4 border-t"
          >
            <div className="flex items-center gap-2 text-accent">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-medium">Active</span>
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

  const steps = [
    {
      id: 'upload',
      icon: Upload,
      title: 'Upload Resume',
      description: 'Simply drag and drop your resume or upload it directly. Our system accepts all major file formats.',
      color: 'bg-blue-500'
    },
    {
      id: 'scan',
      icon: Scan,
      title: 'AI Scan',
      description: 'Our advanced AI analyzes your resume, identifying key skills, experience, and potential improvements.',
      color: 'bg-purple-500'
    },
    {
      id: 'leaderboard',
      icon: Trophy,
      title: 'Leaderboards',
      description: 'See how you rank against other candidates and discover areas where you can improve your profile.',
      color: 'bg-green-500'
    },
    {
      id: 'recruit',
      icon: Users,
      title: 'Get Recruited',
      description: 'Top companies find you based on your optimized profile and matching algorithm scores.',
      color: 'bg-orange-500'
    }
  ];

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    
    const container = scrollRef.current;
    const cardWidth = 320; // 80 * 4 (w-80 = 320px)
    const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
    
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

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
      const cardWidth = 320;
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
      <div className="mb-8 text-center">
        <h2 className="font-heading text-3xl font-bold mb-4">How It Works</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Transform your job search with our AI-powered platform in four simple steps
        </p>
      </div>

      <div className="relative">
        {/* Navigation buttons */}
        <Button
          variant="outline"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm"
          onClick={() => scroll('left')}
          disabled={activeStep === 0}
          aria-label="Previous step"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm"
          onClick={() => scroll('right')}
          disabled={activeStep === steps.length - 1}
          aria-label="Next step"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Scrollable container */}
        <ScrollArea className="w-full">
          <div
            ref={scrollRef}
            className="flex gap-6 px-16 py-8 overflow-x-auto scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            role="list"
            aria-live="polite"
            aria-label={`Step ${activeStep + 1} of ${steps.length}: ${steps[activeStep]?.title}`}
          >
            {steps.map((step, index) => (
              <div key={step.id} role="listitem">
                <StepCard
                  step={step}
                  isActive={index === activeStep}
                  onActivate={() => setActiveStep(index)}
                />
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Progress indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {steps.map((_, index) => (
            <button
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === activeStep ? 'w-8 bg-accent' : 'w-2 bg-muted'
              }`}
              onClick={() => {
                setActiveStep(index);
                if (scrollRef.current) {
                  scrollRef.current.scrollTo({
                    left: index * 320,
                    behavior: 'smooth'
                  });
                }
              }}
              aria-label={`Go to step ${index + 1}: ${steps[index].title}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}