'use client'

import { useState, createContext, useContext } from 'react'

/**
 * Pricing interval context
 * Following Vercel composition patterns: context for shared state
 */
const PricingIntervalContext = createContext<{
  interval: 'month' | 'year'
  setInterval: (interval: 'month' | 'year') => void
}>({
  interval: 'month',
  setInterval: () => {},
})

export function usePricingInterval() {
  return useContext(PricingIntervalContext)
}

export function PricingIntervalProvider({ children }: { children: React.ReactNode }) {
  const [interval, setInterval] = useState<'month' | 'year'>('month')

  return (
    <PricingIntervalContext.Provider value={{ interval, setInterval }}>
      {children}
    </PricingIntervalContext.Provider>
  )
}

/**
 * Pricing toggle component
 * Following Vercel best practices: minimal client-side JavaScript
 */
export function PricingToggle() {
  const [interval, setInterval] = useState<'month' | 'year'>('month')

  return (
    <div className="flex items-center justify-center gap-4 mb-12">
      <span className={`text-lg font-medium transition-colors ${interval === 'month' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
        Monthly
      </span>

      <button
        onClick={() => setInterval(interval === 'month' ? 'year' : 'month')}
        className="relative inline-flex h-8 w-14 items-center rounded-full bg-gray-300 dark:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        role="switch"
        aria-checked={interval === 'year'}
        aria-label="Toggle pricing interval"
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
            interval === 'year' ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>

      <div className="flex items-center gap-2">
        <span className={`text-lg font-medium transition-colors ${interval === 'year' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
          Yearly
        </span>
        <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 text-sm font-semibold rounded-full">
          Save 20%
        </span>
      </div>
    </div>
  )
}
