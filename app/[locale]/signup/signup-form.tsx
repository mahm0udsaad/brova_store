'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { signUp } from '@/lib/actions/auth'
import { GoogleSignInButton } from '@/components/auth/google-signin-button'

export default function SignupForm({ locale }: { locale: string }) {
  const t = useTranslations('auth.signup')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
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
    
    if (formData.password.length < 8) {
      setError(t('errors.passwordTooShort'))
      return false
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError(t('errors.passwordMismatch'))
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
      const result = await signUp(locale, formData.email, formData.password)
      
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
    <div className="w-full max-w-md relative z-10">
      <div className="bg-card/80 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-border/50 p-8 sm:p-10">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href={`/${locale}`} className="inline-block mb-6">
            <h2 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">Brova</h2>
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-3">
            {t('title')}
          </h1>
          <p className="text-muted-foreground font-medium">
            {t('subtitle')}
          </p>
        </div>

        {/* Google Sign-In */}
        <div className="mb-8">
          <GoogleSignInButton locale={locale} label={t('googleSignup')} />
        </div>

        {/* Divider */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-card text-muted-foreground font-medium">
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
              className="block text-sm font-semibold text-foreground mb-2"
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
              className="w-full px-4 py-3.5 rounded-xl border border-border bg-background/50 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              disabled={isPending}
            />
          </div>

          {/* Password */}
          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-semibold text-foreground mb-2"
            >
              {t('password')}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder={t('passwordPlaceholder')}
              className="w-full px-4 py-3.5 rounded-xl border border-border bg-background/50 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              disabled={isPending}
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label 
              htmlFor="confirmPassword" 
              className="block text-sm font-semibold text-foreground mb-2"
            >
              {t('confirmPassword')}
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder={t('confirmPasswordPlaceholder')}
              className="w-full px-4 py-3.5 rounded-xl border border-border bg-background/50 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              disabled={isPending}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
              <p className="text-sm font-medium text-destructive">
                {error}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-4 px-4 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-bold rounded-xl transition-all shadow-lg shadow-primary/25 mt-4"
          >
            {isPending ? t('signingUp') : t('signupButton')}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground font-medium">
            {t('haveAccount')}{' '}
            <Link 
              href={`/${locale}/login`}
              className="text-primary hover:text-primary/80 hover:underline font-bold transition-colors"
            >
              {t('loginLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
