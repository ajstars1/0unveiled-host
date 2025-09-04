"use client";

import React, { useState } from 'react';
import { Check, Star, Zap, Users, Crown, ArrowRight, Shield, Sparkles } from 'lucide-react';
// import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface PricingTier {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
  icon: React.ElementType;
  buttonText: string;
  buttonVariant: "default" | "outline" | "secondary";
}

const pricingTiers: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Perfect for getting started with 0Unveiled',
    features: [
      'Basic profile creation',
      'Limited search visibility',
      'Basic messaging (10 messages/month)',
      'Community access',
      'Standard support'
    ],
    icon: Users,
    buttonText: 'Get Started Free',
    buttonVariant: 'outline'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 20,
    description: 'Enhanced features for active professionals',
    features: [
      'Enhanced profile with portfolio',
      'Priority search ranking',
      'Unlimited messaging',
      'Advanced filters',
      'Analytics dashboard',
      'Email support',
      'Portfolio showcase'
    ],
    popular: true,
    icon: Star,
    buttonText: 'Start Pro Trial',
    buttonVariant: 'default'
  },
  {
    id: 'recruiter',
    name: 'Recruiter',
    price: 25,
    description: 'Advanced tools for talent acquisition teams',
    features: [
      'Everything in Pro',
      'Advanced candidate search',
      'Bulk messaging tools',
      'Candidate tracking',
      'Interview scheduling',
      'Priority support',
      'Team collaboration',
      'Custom branding'
    ],
    icon: Zap,
    buttonText: 'Start Recruiting',
    buttonVariant: 'outline'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 60,
    description: 'Complete solution for large organizations',
    features: [
      'Everything in Recruiter',
      'Unlimited team members',
      'API access',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantee',
      'Advanced reporting',
      'White-label options'
    ],
    icon: Crown,
    buttonText: 'Contact Sales',
    buttonVariant: 'outline'
  }
];

const faqs = [
  {
    question: 'Can I switch between plans anytime?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.'
  },
  {
    question: 'Is there a free trial for paid plans?',
    answer: 'Yes, we offer a 14-day free trial for all paid plans. No credit card required to start.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards, PayPal, and bank transfers for Enterprise customers.'
  },
  {
    question: 'Do you offer discounts for annual billing?',
    answer: 'Yes, save 20% when you choose annual billing on any paid plan.'
  },
  {
    question: 'What happens if I exceed my plan limits?',
    answer: 'We\'ll notify you when approaching limits and offer options to upgrade or purchase additional resources.'
  }
];

const handlePlanSelect = (planName: string) => {
  toast.success(`${planName} plan selected! Redirecting to checkout...`);
};

export default function PricingPage() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[--bg-gradient-start] to-[--bg-gradient-end]">
      {/* <Navbar /> */}
      
      {/* Header Section */}
      <section className="pt-24 pb-16">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/5 border border-black/20 rounded-full">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-muted-foreground">Transparent Pricing</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-foreground tracking-tight">
              Choose Your Path to
              <span className="block text-accent">Success</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              From individual professionals to enterprise teams, find the perfect plan 
              to unlock your potential on the 0Unveiled platform.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards Section */}
      <section className="pb-20">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingTiers.map((tier) => {
              const Icon = tier.icon;
              const isHovered = hoveredCard === tier.id;
              
              return (
                <Card 
                  key={tier.id}
                  className={`relative border-2 border-black bg-white transition-all duration-300 ${
                    isHovered 
                      ? 'shadow-2xl -translate-y-2 border-accent' 
                      : 'shadow-lg hover:shadow-xl'
                  } ${tier.popular ? 'ring-2 ring-accent ring-offset-4' : ''}`}
                  onMouseEnter={() => setHoveredCard(tier.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-accent text-accent-foreground font-semibold px-4 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center space-y-4 pb-6">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl transition-colors ${
                      tier.popular ? 'bg-accent' : 'bg-black'
                    }`}>
                      <Icon className={`w-8 h-8 ${
                        tier.popular ? 'text-accent-foreground' : 'text-white'
                      }`} />
                    </div>
                    
                    <div>
                      <CardTitle className="text-2xl font-heading font-bold">
                        {tier.name}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground mt-2">
                        {tier.description}
                      </CardDescription>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-heading font-bold">
                          ${tier.price}
                        </span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                      {tier.price > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Billed monthly
                        </p>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <Button 
                      className={`w-full font-semibold transition-all duration-200 ${
                        tier.buttonVariant === 'default' 
                          ? 'bg-accent text-accent-foreground hover:bg-accent/90 border-2 border-accent' 
                          : 'bg-white text-foreground border-2 border-black hover:bg-black hover:text-white'
                      }`}
                      onClick={() => handlePlanSelect(tier.name)}
                    >
                      {tier.buttonText}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold text-foreground">
                        What's included:
                      </h4>
                      <ul className="space-y-2">
                        {tier.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-muted-foreground leading-relaxed">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white/50">
        <div className="container max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about our pricing plans
            </p>
          </div>
          
          <div className="grid gap-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="border-2 border-black bg-white">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg text-foreground mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container max-w-4xl mx-auto px-6">
          <Card className="border-2 border-black bg-black text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-black to-black/80" />
            <CardContent className="relative p-12 text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent mb-4">
                <Shield className="w-10 h-10 text-accent-foreground" />
              </div>
              
              <h2 className="text-3xl md:text-4xl font-heading font-bold">
                Ready to Transform Your Career?
              </h2>
              
              <p className="text-xl text-white/80 max-w-2xl mx-auto">
                Join thousands of professionals who have already discovered their true potential. 
                Start your journey with 0Unveiled today.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button 
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold border-2 border-accent"
                  onClick={() => handlePlanSelect('Free')}
                >
                  Start Free Today
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white hover:text-black"
                  onClick={() => toast.info('Contact sales form opening...')}
                >
                  Talk to Sales
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}