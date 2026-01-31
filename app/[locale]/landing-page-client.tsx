"use client"

import { useTranslations, useLocale } from "next-intl"
import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowRight, ShoppingBag, Car, Shield, CheckCircle, Zap, BarChart3, MessageSquare, Sparkles } from "lucide-react"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { useRef } from "react"

export default function LandingPageClient() {
  const t = useTranslations("landing")
  const locale = useLocale()
  const isRtl = locale === "ar"
  const heroRef = useRef<HTMLDivElement>(null)
  
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  })
  
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Floating Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <div className="relative w-10 h-10">
              <Image 
                src="/brova-logo-full.png" 
                alt="Brova" 
                fill 
                className="object-contain dark:invert"
                priority
              />
            </div>
          </Link>
          
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle compact />
          </div>
        </div>
      </motion.header>
      
      <main className="pt-20">
        {/* Hero Section with Gradient Background */}
        <motion.section 
          ref={heroRef}
          style={{ opacity, scale }}
          className="relative min-h-[90vh] flex items-center justify-center px-4 overflow-hidden"
        >
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                rotate: [90, 0, 90],
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"
            />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Store Builder</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-balance leading-[1.1]"
            >
              {t("hero.headline")}
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl sm:text-2xl text-muted-foreground text-balance max-w-3xl mx-auto"
            >
              {t("hero.subtext")}
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Link href={`/${locale}/signup`}>
                <Button
                  size="lg"
                  className="rounded-full px-10 h-14 text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all"
                >
                  {t("hero.cta")}
                  <ArrowRight className={`h-5 w-5 ${isRtl ? 'mr-2 rotate-180' : 'ml-2'}`} />
                </Button>
              </Link>
              <Link href={`/${locale}/admin-login`}>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full px-10 h-14 text-lg font-bold"
                >
                  {t("hero.signin")}
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.section>

        {/* Industry Showcase */}
        <section className="py-20 px-4 relative">
          <div className="max-w-6xl mx-auto space-y-16">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center space-y-4"
            >
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">{t("industry.title")}</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("industry.explanation")}</p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02, y: -8 }}
                transition={{ duration: 0.3 }}
                className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/20 hover:border-primary/40 shadow-xl hover:shadow-2xl transition-all p-12"
              >
                <div className="absolute top-4 right-4 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
                <div className="relative space-y-6">
                  <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center text-primary ring-4 ring-primary/10">
                    <ShoppingBag className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold mb-2">{t("industry.clothing")}</h3>
                    <p className="text-muted-foreground">Fashion & Apparel Stores</p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02, y: -8 }}
                transition={{ duration: 0.3 }}
                className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border-2 border-blue-500/20 hover:border-blue-500/40 shadow-xl hover:shadow-2xl transition-all p-12"
              >
                <div className="absolute top-4 right-4 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl" />
                <div className="relative space-y-6">
                  <div className="w-20 h-20 rounded-3xl bg-blue-500/20 flex items-center justify-center text-blue-500 ring-4 ring-blue-500/10">
                    <Car className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold mb-2">{t("industry.carCare")}</h3>
                    <p className="text-muted-foreground">Automotive Services</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Capabilities Grid */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto space-y-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">{t("capabilities.title")}</h2>
            </motion.div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { key: "aiOnboarding", icon: Zap, gradient: "from-amber-500/20 to-orange-500/20", iconColor: "text-amber-500", ring: "ring-amber-500/20" },
                { key: "orders", icon: ShoppingBag, gradient: "from-blue-500/20 to-cyan-500/20", iconColor: "text-blue-500", ring: "ring-blue-500/20" },
                { key: "dashboard", icon: BarChart3, gradient: "from-emerald-500/20 to-green-500/20", iconColor: "text-emerald-500", ring: "ring-emerald-500/20" },
                { key: "support", icon: MessageSquare, gradient: "from-purple-500/20 to-pink-500/20", iconColor: "text-purple-500", ring: "ring-purple-500/20" },
              ].map((item, index) => (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className={`relative p-8 rounded-2xl bg-gradient-to-br ${item.gradient} backdrop-blur border border-white/10 hover:border-white/20 transition-all group`}
                >
                  <div className={`w-14 h-14 rounded-2xl bg-background/80 flex items-center justify-center mb-6 ${item.iconColor} ring-4 ${item.ring} group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-bold text-xl mb-3">{t(`capabilities.${item.key}.title`)}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(`capabilities.${item.key}.description`)}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-20 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-secondary via-secondary/80 to-secondary/60 p-12 sm:p-16 text-center space-y-12 border border-border/50 shadow-2xl"
          >
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{t("trust.title")}</h2>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-background/50 backdrop-blur border border-border/30">
                <CheckCircle className="w-12 h-12 text-primary" />
                <p className="font-semibold text-lg">{t("trust.approval")}</p>
              </div>
              <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-background/50 backdrop-blur border border-border/30">
                <Shield className="w-12 h-12 text-primary" />
                <p className="font-semibold text-lg">{t("trust.security")}</p>
              </div>
            </div>
          </motion.div>
        </section>
      </main>
      
      <footer className="py-12 border-t bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">&copy; 2026 Brova. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
