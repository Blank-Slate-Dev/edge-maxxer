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

function TestimonialCard({ testimonial, delay }: { testimonial: Testimonial; delay: number }) {
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
      className={`p-6 rounded-xl border transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ 
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)'
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
            style={{ 
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)'
            }}
          >
            {testimonial.avatar}
          </div>
          <div>
            <div className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>
              {testimonial.name}
            </div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>
              {testimonial.handle}
            </div>
          </div>
        </div>
        <Quote className="w-5 h-5" style={{ color: 'var(--border)' }} />
      </div>

      {/* Stars */}
      <div className="flex gap-0.5 mb-3">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star 
            key={i} 
            className="w-4 h-4" 
            fill="#eab308" 
            style={{ color: '#eab308' }} 
          />
        ))}
      </div>

      {/* Content */}
      <p 
        className="text-sm leading-relaxed mb-4"
        style={{ color: 'var(--foreground)' }}
      >
        "{testimonial.content}"
      </p>

      {/* Profit badge */}
      {testimonial.profit && (
        <div 
          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
          style={{ 
            backgroundColor: 'rgba(34, 197, 94, 0.15)',
            color: '#22c55e'
          }}
        >
          <span>Reported profit:</span>
          <span className="font-mono">{testimonial.profit}</span>
        </div>
      )}
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section 
      className="py-24 px-6 border-t"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: 'var(--foreground)' }}
          >
            Trusted by 1,200+ Bettors
          </h2>
          <p style={{ color: 'var(--muted)' }}>
            See what our users are saying about Edge Maxxer
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((testimonial, i) => (
            <TestimonialCard 
              key={i} 
              testimonial={testimonial} 
              delay={i * 100} 
            />
          ))}
        </div>

        {/* Social proof stats */}
        <div 
          className="mt-16 p-8 rounded-2xl border"
          style={{ 
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border)'
          }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '1,200+', label: 'Active Users' },
              { value: '$127K+', label: 'User Profits' },
              { value: '4.9/5', label: 'Avg. Rating' },
              { value: '98%', label: 'Would Recommend' },
            ].map((stat, i) => (
              <div key={i}>
                <div 
                  className="text-3xl font-bold mb-1"
                  style={{ color: 'var(--foreground)' }}
                >
                  {stat.value}
                </div>
                <div className="text-sm" style={{ color: 'var(--muted)' }}>
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