// src/components/TestimonialsSection.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Star, Quote } from 'lucide-react';

interface Testimonial {
  name: string;
  handle: string;
  avatar: string;
  content: string;
  profit?: string;
  rating: number;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Jake M.',
    handle: '@jakebets',
    avatar: 'JM',
    content: "Finally an arb scanner that doesn't cost a fortune. Made back my first month's subscription in 2 hours. The UI is clean and the alerts are fast.",
    profit: '+$847',
    rating: 5
  },
  {
    name: 'Sarah T.',
    handle: '@saraht_sports',
    avatar: 'ST',
    content: "I've used OddsJam and RebelBetting before - Edge Maxxer is just as good at a fraction of the price. The stealth mode is a game changer for staying under the radar.",
    profit: '+$2,340',
    rating: 5
  },
  {
    name: 'Marcus L.',
    handle: '@marcuslimits',
    avatar: 'ML',
    content: "The multi-region support is perfect for me. I can scan AU books during the day and switch to US markets at night. Already up 3 units this month.",
    profit: '+$1,560',
    rating: 5
  },
  {
    name: 'David K.',
    handle: '@davidkarbs',
    avatar: 'DK',
    content: "Started with skepticism, now I'm a believer. The EV+ feature alone is worth the subscription. Finally found a tool that keeps up with line movements.",
    profit: '+$920',
    rating: 5
  },
  {
    name: 'Alex R.',
    handle: '@alexroi',
    avatar: 'AR',
    content: "Support team is incredible - they actually respond and help. The calculator saves so much time. Best $10 I spend each month.",
    profit: '+$1,200',
    rating: 5
  },
  {
    name: 'Chris B.',
    handle: '@chrisbets21',
    avatar: 'CB',
    content: "Switched from a $100/month scanner and haven't looked back. Edge Maxxer finds the same arbs. The BYOK model is genius.",
    profit: '+$3,100',
    rating: 5
  },
];

function TestimonialCard({ testimonial, delay, className = '' }: { testimonial: Testimonial; delay: number; className?: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  return (
    <div 
      ref={cardRef}
      className={`p-4 sm:p-6 rounded-xl border transition-all duration-500 flex flex-col ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${className}`}
      style={{ 
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)'
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div 
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium"
            style={{ 
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)'
            }}
          >
            {testimonial.avatar}
          </div>
          <div>
            <div className="font-medium text-xs sm:text-sm" style={{ color: 'var(--foreground)' }}>
              {testimonial.name}
            </div>
            <div className="text-[10px] sm:text-xs" style={{ color: 'var(--muted)' }}>
              {testimonial.handle}
            </div>
          </div>
        </div>
        <Quote className="w-4 h-4 sm:w-5 sm:h-5 hidden sm:block" style={{ color: 'var(--border)' }} />
      </div>

      {/* Stars */}
      <div className="flex gap-0.5 mb-2 sm:mb-3">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star 
            key={i} 
            className="w-3 h-3 sm:w-4 sm:h-4" 
            fill="#eab308" 
            style={{ color: '#eab308' }} 
          />
        ))}
      </div>

      {/* Content - flex-1 to fill available space and push profit to bottom */}
      <p 
        className="text-xs sm:text-sm leading-relaxed flex-1"
        style={{ color: 'var(--foreground)' }}
      >
        "{testimonial.content}"
      </p>

      {/* Profit badge - always at bottom with consistent top margin */}
      {testimonial.profit && (
        <div className="mt-4 pt-3 sm:pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div 
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] sm:text-xs font-medium"
            style={{ 
              backgroundColor: 'rgba(34, 197, 94, 0.15)',
              color: '#22c55e'
            }}
          >
            <span className="hidden sm:inline">Reported profit:</span>
            <span className="sm:hidden">Profit:</span>
            <span className="font-mono">{testimonial.profit}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section 
      className="py-16 sm:py-24 px-4 sm:px-6 border-t"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-16">
          <h2 
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4"
            style={{ color: 'var(--foreground)' }}
          >
            Trusted by 1,200+ Bettors
          </h2>
          <p className="text-sm sm:text-base" style={{ color: 'var(--muted)' }}>
            See what our users are saying about Edge Maxxer
          </p>
        </div>

        {/* Testimonials Grid - 2 cols on mobile (first 4 only), 3 cols lg (all 6) */}
        {/* Using grid with items-stretch ensures cards in each row have equal height */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 items-stretch">
          {TESTIMONIALS.map((testimonial, i) => (
            <TestimonialCard 
              key={i} 
              testimonial={testimonial} 
              delay={i * 100}
              // Hide 5th and 6th testimonials on mobile/tablet, show on lg+
              className={i >= 4 ? 'hidden lg:flex' : ''}
            />
          ))}
        </div>

        {/* Social proof stats - increased top margin for better spacing */}
        <div 
          className="mt-12 sm:mt-20 p-4 sm:p-8 rounded-2xl border"
          style={{ 
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)'
          }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 text-center">
            {[
              { value: '12,000+', label: 'Active Users' },
              { value: '$2.6M+', label: 'User Profits' },
              { value: '4.8/5', label: 'Avg. Rating' },
              { value: '96%', label: 'Would Recommend' },
            ].map((stat, i) => (
              <div key={i}>
                <div 
                  className="text-xl sm:text-3xl font-bold mb-1"
                  style={{ color: 'var(--foreground)' }}
                >
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}