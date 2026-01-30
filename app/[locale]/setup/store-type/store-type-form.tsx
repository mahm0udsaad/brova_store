'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { saveStoreType } from '@/lib/actions/setup'

type StoreType = 'clothing' | 'car_care'

const ShirtIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
  </svg>
)

const CarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
    <circle cx="7" cy="17" r="2" />
    <path d="M9 17h6" />
    <circle cx="17" cy="17" r="2" />
  </svg>
)

export default function StoreTypeForm({ locale }: { locale: string }) {
  const t = useTranslations('setup.storeType')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<StoreType | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = () => {
    if (!selected) return
    setError(null)

    startTransition(async () => {
      const result = await saveStoreType(selected)
      if (!result.success) {
        setError(t('error'))
        return
      }
      router.push(`/${locale}/start`)
    })
  }

  const options: { type: StoreType; icon: React.ReactNode; labelKey: string; descKey: string }[] = [
    { type: 'clothing', icon: <ShirtIcon />, labelKey: 'clothing.label', descKey: 'clothing.description' },
    { type: 'car_care', icon: <CarIcon />, labelKey: 'carCare.label', descKey: 'carCare.description' },
  ]

  return (
    <div className="w-full max-w-lg">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('subtitle')}
        </p>
      </div>

      {/* Cards */}
      <div className="space-y-4 mb-8">
        {options.map(({ type, icon, labelKey, descKey }) => {
          const isSelected = selected === type
          return (
            <button
              key={type}
              type="button"
              onClick={() => setSelected(type)}
              disabled={isPending}
              className={`
                w-full flex items-center gap-4 p-5 rounded-xl border-2 text-start
                transition-all motion-reduce:transition-none
                ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                }
                disabled:opacity-60
              `}
              aria-pressed={isSelected}
            >
              <div
                className={`shrink-0 ${
                  isSelected
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {icon}
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t(labelKey)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {t(descKey)}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Continue */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!selected || isPending}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors motion-reduce:transition-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {isPending ? t('saving') : t('continue')}
      </button>
    </div>
  )
}
