'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { logIn } from '@/lib/actions/auth'
import { GoogleSignInButton } from '@/components/auth/google-signin-button'

export default function LoginForm({ locale }: { locale: string }) {
  const t = useTranslations('auth.login')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const validateForm = () => {
    if (!formData.email) {
      setError(t('errors.emailRequired'))
      return false
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError(t('errors.emailInvalid'))
      return false
    }
    
    if (!formData.password) {
      setError(t('errors.passwordRequired'))
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!validateForm()) {
      return
    }

    startTransition(async () => {
      const result = await logIn(locale, formData.email, formData.password)
      
      if (!result.success) {
        const errorKey = result.errorCode || 'generic'
        setError(t(`errors.${errorKey}`))
        return
      }
      
      // Success - redirect to start page
      router.push(`/${locale}/start`)
    })
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('subtitle')}
          </p>
        </div>

        {/* Google Sign-In */}
        <div className="mb-6">
          <GoogleSignInButton locale={locale} label={t('googleSignin')} />
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              {t('orEmail')}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Email */}
          <div>
            <label 
              htmlFor="email" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              {t('email')}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder={t('emailPlaceholder')}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              disabled={isPending}
            />
          </div>

          {/* Password */}
          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              {t('password')}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder={t('passwordPlaceholder')}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              disabled={isPending}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isPending ? t('loggingIn') : t('loginButton')}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('noAccount')}{' '}
            <Link 
              href={`/${locale}/signup`}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {t('signupLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
