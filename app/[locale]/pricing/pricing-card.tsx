'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { SubscriptionPlan } from '@/lib/stripe/client'

interface PricingCardProps {
  plan: SubscriptionPlan
  isPopular?: boolean
  delay?: number
}

/**
 * Pricing card component
 * Following Vercel best practices:
 * - Client component only for interactivity
 * - Animate on mount for better UX
 * - Accessible markup
 */
export function PricingCard({ plan, isPopular, delay = 0 }: PricingCardProps) {
  const [interval, setInterval] = useState<'month' | 'year'>('month')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  // Listen to global pricing interval changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pricing-interval' && e.newValue) {
        setInterval(e.newValue as 'month' | 'year')
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const price = interval === 'month' ? plan.monthly_price_usd : plan.yearly_price_usd
  const yearlyPrice = plan.yearly_price_usd / 12 // Monthly equivalent
  const savings = interval === 'year' ? ((plan.monthly_price_usd - yearlyPrice) / plan.monthly_price_usd * 100).toFixed(0) : 0

  return (
    <div
      className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 transition-all duration-300 ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${isPopular ? 'ring-2 ring-blue-600 scale-105' : 'hover:shadow-xl'}`}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full">
          Most Popular
        </div>
      )}

      {/* Plan Name */}
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {plan.name}
      </h3>

      {/* Description */}
      {plan.description && (
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {plan.description}
        </p>
      )}

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-gray-900 dark:text-white">
            ${(price / 100).toFixed(0)}
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            /{interval === 'month' ? 'month' : 'year'}
          </span>
        </div>
        {interval === 'year' && Number(savings) > 0 && (
          <p className="text-sm text-green-600 dark:text-green-400 mt-1">
            Save {savings}% with yearly billing
          </p>
        )}
      </div>

      {/* CTA Button */}
      <Link
        href={`/signup?plan=${plan.id}&interval=${interval}`}
        className={`block w-full text-center px-6 py-3 rounded-lg font-semibold transition-colors ${
          isPopular
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
      >
        Get Started
      </Link>

      {/* Features */}
      <ul className="mt-8 space-y-4">
        <li className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-gray-600 dark:text-gray-300">
            {plan.max_products == null ? 'Unlimited' : plan.max_products} Products
          </span>
        </li>

        <li className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-gray-600 dark:text-gray-300">
            {plan.max_ai_generations == null ? 'Unlimited' : plan.max_ai_generations} AI Generations/Month
          </span>
        </li>

        <li className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-gray-600 dark:text-gray-300">
            {(parseFloat(plan.transaction_fee_percent) * 100).toFixed(0)}% Transaction Fee
          </span>
        </li>

        {plan.features && Object.entries(plan.features)
          .filter(([, enabled]) => enabled)
          .map(([feature]) => (
          <li key={feature} className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-gray-600 dark:text-gray-300">{feature.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
