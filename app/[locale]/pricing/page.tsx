import { Metadata } from 'next'
import Link from 'next/link'
import { getSubscriptionPlans } from '@/lib/stripe/client'
import { PricingCard } from './pricing-card'
import { PricingToggle } from './pricing-toggle'

export const metadata: Metadata = {
  title: 'Pricing - BROVA',
  description: 'Choose the perfect plan for your online store. Start with a free trial and scale as you grow.',
}

/**
 * Public pricing page
 * Following Vercel best practices:
 * - Server component for data fetching
 * - Client components only where needed (toggle, cards with interaction)
 * - Minimal JavaScript
 * - Accessible and responsive design
 */
export default async function PricingPage() {
  const plans = await getSubscriptionPlans()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
              BROVA
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          Choose the perfect plan for your business. Start with a free trial and scale as you grow.
        </p>

        {/* Pricing Toggle */}
        <PricingToggle />
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              isPopular={plan.id === 'pro'}
              delay={index * 100}
            />
          ))}
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="container mx-auto px-4 pb-24">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Compare Features
        </h2>

        <div className="max-w-6xl mx-auto overflow-x-auto">
          <table className="w-full border-collapse bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left p-4 font-semibold text-gray-900 dark:text-white">
                  Feature
                </th>
                {plans.map(plan => (
                  <th key={plan.id} className="text-center p-4 font-semibold text-gray-900 dark:text-white">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="p-4 text-gray-600 dark:text-gray-300">Products</td>
                {plans.map(plan => (
                  <td key={plan.id} className="text-center p-4 text-gray-900 dark:text-white">
                    {plan.max_products === -1 ? 'Unlimited' : plan.max_products}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="p-4 text-gray-600 dark:text-gray-300">AI Generations/Month</td>
                {plans.map(plan => (
                  <td key={plan.id} className="text-center p-4 text-gray-900 dark:text-white">
                    {plan.max_ai_generations === -1 ? 'Unlimited' : plan.max_ai_generations}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="p-4 text-gray-600 dark:text-gray-300">Transaction Fee</td>
                {plans.map(plan => (
                  <td key={plan.id} className="text-center p-4 text-gray-900 dark:text-white">
                    {plan.transaction_fee_percent}%
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 pb-24">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Frequently Asked Questions
        </h2>

        <div className="max-w-3xl mx-auto space-y-6">
          <details className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <summary className="font-semibold text-gray-900 dark:text-white cursor-pointer">
              Can I change plans later?
            </summary>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.
            </p>
          </details>

          <details className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <summary className="font-semibold text-gray-900 dark:text-white cursor-pointer">
              What payment methods do you accept?
            </summary>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              We accept all major credit cards through Stripe, including Visa, Mastercard, American Express, and Discover.
            </p>
          </details>

          <details className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <summary className="font-semibold text-gray-900 dark:text-white cursor-pointer">
              Is there a free trial?
            </summary>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              Yes! All plans come with a 14-day free trial. No credit card required to start.
            </p>
          </details>

          <details className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <summary className="font-semibold text-gray-900 dark:text-white cursor-pointer">
              Can I cancel anytime?
            </summary>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              Absolutely! You can cancel your subscription at any time. Your access will continue until the end of your current billing period.
            </p>
          </details>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Start Selling?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of merchants using BROVA to grow their business
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Start Your Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2024 BROVA. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
