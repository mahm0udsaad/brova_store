"use client"

import { useTranslations, useLocale } from "next-intl"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { 
  ArrowRight, 
  ShoppingBag, 
  Car, 
  Shield, 
  CheckCircle, 
  Zap, 
  BarChart3, 
  MessageSquare, 
  Sparkles,
  Smartphone,
  Globe,
  Layout,
  MousePointer2,
  Rocket,
  Palette,
  Bot,
  Flower2,
  Home,
  Utensils,
  Layers,
  Megaphone,
  Settings,
  Package,
  Blocks,
  Mic,
  ImageIcon,
  Wallet,
  Users,
  Wand2
} from "lucide-react"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { useRef, useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export default function LandingPageClient() {
  const t = useTranslations("landing")
  const locale = useLocale()
  const isRtl = locale === "ar"
  const heroRef = useRef<HTMLDivElement>(null)
  const [activeStep, setActiveStep] = useState(0)
  
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  })
  
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95])
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 100])

  const steps = [
    {
      title: isRtl ? "تحدث مع الذكاء الاصطناعي" : "Talk to AI",
      description: isRtl ? "أخبر مساعدنا عن رؤيتك لمتجرك." : "Tell our AI assistant about your store vision.",
      icon: MessageSquare,
      color: "bg-blue-500"
    },
    {
      title: isRtl ? "توليد تلقائي" : "Auto-Generation",
      description: isRtl ? "يقوم الذكاء الاصطناعي ببناء الكتالوج والسمات الخاصة بك." : "AI builds your catalog and theme instantly.",
      icon: Sparkles,
      color: "bg-purple-500"
    },
    {
      title: isRtl ? "انطلق عالمياً" : "Go Live",
      description: isRtl ? "انشر متجرك وابدأ في البيع فوراً." : "Publish your store and start selling immediately.",
      icon: Rocket,
      color: "bg-emerald-500"
    }
  ]

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      {/* Navigation */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link href={`/${locale}`} className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 transition-transform duration-300 group-hover:scale-110">
              <Image 
                src="/brova-logo-full.png" 
                alt="Brova" 
                fill 
                className="object-contain dark:invert"
                priority
              />
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Brova
            </span>
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1">
              <LanguageSwitcher />
              <ThemeToggle compact />
            </div>
            <Link href={`/${locale}/admin-login`}>
              <Button variant="ghost" className="font-semibold">{t("hero.signin")}</Button>
            </Link>
            <Link href={`/${locale}/signup`}>
              <Button className="rounded-full font-bold shadow-lg shadow-primary/20">
                {t("hero.cta")}
              </Button>
            </Link>
          </div>
        </div>
      </motion.header>
      
      <main>
        {/* Hero Section */}
        <section 
          ref={heroRef}
          className="relative min-h-screen flex flex-col items-center justify-center pt-20 overflow-hidden"
        >
          <motion.div 
            style={{ opacity, scale, y }}
            className="relative z-10 max-w-7xl mx-auto px-4 text-center space-y-12"
          >
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm"
              >
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  {isRtl ? "بناء المتاجر بالذكاء الاصطناعي" : "AI-Powered Store Builder"}
                </span>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-6xl sm:text-8xl lg:text-9xl font-black tracking-tight leading-[0.9] text-balance"
              >
                {isRtl ? "أنشئ وبع عبر الإنترنت" : "Build & sell online"}
                <span className="block text-primary">
                  {isRtl ? "بالذكاء الاصطناعي" : "with AI"}
                </span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl sm:text-2xl text-muted-foreground text-balance max-w-2xl mx-auto font-medium"
              >
                {t("hero.subtext")}
              </motion.p>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href={`/${locale}/signup`}>
                <Button
                  size="lg"
                  className="rounded-full px-12 h-16 text-xl font-bold shadow-2xl shadow-primary/40 hover:scale-105 transition-all group"
                >
                  {t("hero.cta")}
                  <ArrowRight className={cn("h-6 w-6 transition-transform group-hover:translate-x-1", isRtl ? "mr-2 rotate-180 group-hover:-translate-x-1" : "ml-2")} />
                </Button>
              </Link>
            </motion.div>

            {/* Floating Store Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="relative mt-20 max-w-5xl mx-auto"
            >
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-border/50 shadow-2xl bg-card">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-blue-500/5" />
                {/* Mockup Content */}
                <div className="p-4 sm:p-8 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/50" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                    </div>
                    <div className="h-6 w-1/3 bg-muted rounded-full animate-pulse" />
                  </div>
                  <div className="grid grid-cols-12 gap-6 flex-1">
                    <div className="col-span-3 space-y-4">
                      <div className="h-8 w-full bg-primary/20 rounded-lg" />
                      <div className="h-4 w-4/5 bg-muted rounded" />
                      <div className="h-4 w-full bg-muted rounded" />
                      <div className="h-4 w-3/4 bg-muted rounded" />
                    </div>
                    <div className="col-span-9 grid grid-cols-3 gap-4">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="aspect-square bg-muted/50 rounded-xl border border-border/50 flex flex-col p-3 gap-2">
                          <div className="flex-1 bg-muted rounded-lg" />
                          <div className="h-3 w-3/4 bg-muted rounded" />
                          <div className="h-3 w-1/2 bg-primary/20 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* AI Chat Bubble Overlay */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute bottom-10 right-10 bg-primary text-primary-foreground p-4 rounded-2xl rounded-tr-none shadow-2xl max-w-xs border border-white/20"
                >
                  <p className="text-sm font-bold flex items-center gap-2">
                    <Bot className="w-4 h-4" />
                    {isRtl ? "متجرك جاهز للنشر!" : "Your store is ready to go!"}
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Feature Bento Grid */}
        <section className="py-32 px-4 bg-muted/30 relative overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10 space-y-20">
            <div className="text-center space-y-4">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl sm:text-6xl font-black tracking-tight"
              >
                {isRtl ? "مميزات ذكية للمتاجر الحديثة" : "Smart Features for Modern Stores"}
              </motion.h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {isRtl ? "كل ما تحتاجه لإدارة وتوسيع نطاق عملك عبر الإنترنت مع قوة الذكاء الاصطناعي." : "Everything you need to manage and scale your business online with the power of AI."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Main Feature - Large */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="md:col-span-2 p-10 rounded-3xl bg-card border border-border/50 shadow-xl overflow-hidden relative group"
              >
                <div className="absolute top-0 right-0 p-8 text-primary/10">
                  <Bot className="w-64 h-64 -mr-20 -mt-20 rotate-12 transition-transform group-hover:rotate-6 duration-500" />
                </div>
                <div className="relative z-10 space-y-6 h-full flex flex-col justify-end">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                    <Zap className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold mb-4">{t("capabilities.aiOnboarding.title")}</h3>
                    <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
                      {t("capabilities.aiOnboarding.description")} {isRtl ? "نظامنا يفهم احتياجاتك ويقوم بتجهيز كل شيء لك تلقائياً." : "Our system understands your needs and sets up everything for you automatically."}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Multi-language - Portrait */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="p-10 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-xl overflow-hidden relative"
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10">
                  <Globe className="w-48 h-48" />
                </div>
                <div className="relative z-10 flex flex-col h-full">
                  <Globe className="w-12 h-12 mb-6" />
                  <h3 className="text-2xl font-bold mb-4">{isRtl ? "دعم كامل للغتين" : "Full Bilingual Support"}</h3>
                  <p className="text-blue-100 font-medium">
                    {isRtl ? "متجرك متاح باللغتين العربية والإنجليزية منذ اليوم الأول لجذب المزيد من العملاء." : "Your store is available in both Arabic and English from day one to attract more customers."}
                  </p>
                  <div className="mt-auto pt-8 flex gap-2">
                    <span className="px-3 py-1 rounded-full bg-white/20 text-sm font-bold">AR</span>
                    <span className="px-3 py-1 rounded-full bg-white/20 text-sm font-bold">EN</span>
                  </div>
                </div>
              </motion.div>

              {/* Dashboard - Portrait */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="p-10 rounded-3xl bg-card border border-border/50 shadow-xl overflow-hidden"
              >
                <BarChart3 className="w-12 h-12 text-primary mb-6" />
                <h3 className="text-2xl font-bold mb-4">{t("capabilities.dashboard.title")}</h3>
                <p className="text-muted-foreground font-medium mb-8">
                  {t("capabilities.dashboard.description")}
                </p>
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${Math.random() * 60 + 40}%` }}
                        className="h-full bg-primary/40"
                      />
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Theme & Customization - Large */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="md:col-span-2 p-10 rounded-3xl bg-card border border-border/50 shadow-xl overflow-hidden relative group"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center h-full">
                  <div className="space-y-6">
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                      <Palette className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold mb-4">{isRtl ? "تصميمات ذكية ومخصصة" : "Smart Custom Themes"}</h3>
                      <p className="text-muted-foreground text-lg leading-relaxed">
                        {isRtl ? "قوالب عصرية تتكيف مع هويتك التجارية. قم بتغيير الألوان والخطوط بضغطة زر واحدة." : "Modern themes that adapt to your brand identity. Change colors and fonts with a single click."}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="aspect-[4/5] bg-muted rounded-2xl border-2 border-primary/20 p-2 overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-b from-primary/10 to-transparent rounded-lg" />
                    </div>
                    <div className="aspect-[4/5] bg-muted rounded-2xl p-2 overflow-hidden opacity-50 translate-y-8">
                      <div className="w-full h-full bg-gradient-to-b from-purple-500/10 to-transparent rounded-lg" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* How it Works - Interactive */}
        <section className="py-32 px-4 relative overflow-hidden">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-12">
              <div className="space-y-4">
                <h2 className="text-4xl sm:text-6xl font-black tracking-tight">{isRtl ? "كيف يعمل النظام؟" : "How it Works"}</h2>
                <p className="text-xl text-muted-foreground">
                  {isRtl ? "ثلاث خطوات بسيطة تفصلك عن متجرك الجديد." : "Three simple steps to your brand new store."}
                </p>
              </div>

              <div className="space-y-6">
                {steps.map((step, idx) => (
                  <motion.div
                    key={idx}
                    onClick={() => setActiveStep(idx)}
                    className={cn(
                      "p-6 rounded-2xl border-2 cursor-pointer transition-all flex gap-6 items-start",
                      activeStep === idx 
                        ? "border-primary bg-primary/5 shadow-lg" 
                        : "border-transparent bg-muted/50 hover:bg-muted"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg",
                      step.color
                    )}>
                      <step.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="relative aspect-square">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 1.1, rotate: 5 }}
                  className="w-full h-full rounded-3xl bg-muted p-1 border border-border/50 shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-30" />
                  <div className="p-8 flex flex-col h-full">
                    {activeStep === 0 && (
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <Bot className="w-10 h-10 text-primary" />
                          <div className="p-4 bg-primary text-primary-foreground rounded-2xl rounded-tl-none font-bold">
                            {isRtl ? "ما هو اسم متجرك؟" : "What is your store name?"}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 justify-end">
                          <div className="p-4 bg-muted-foreground/10 rounded-2xl rounded-tr-none font-bold">
                            {isRtl ? "بروفا فاشون" : "Brova Fashion"}
                          </div>
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold">U</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Bot className="w-10 h-10 text-primary" />
                          <div className="p-4 bg-primary text-primary-foreground rounded-2xl rounded-tl-none font-bold">
                            {isRtl ? "رائع! سأقوم ببناء متجر لبيع الملابس." : "Great! I'll build a clothing store."}
                          </div>
                        </div>
                      </div>
                    )}
                    {activeStep === 1 && (
                      <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                        <div className="relative w-48 h-48">
                          <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 rounded-full border-4 border-dashed border-primary/30"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="w-20 h-20 text-primary animate-pulse" />
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="font-black text-2xl">{isRtl ? "جاري الإنشاء..." : "Generating..."}</p>
                          <p className="text-muted-foreground">{isRtl ? "توليد المنتجات والسمات" : "Generating products & themes"}</p>
                        </div>
                      </div>
                    )}
                    {activeStep === 2 && (
                      <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                        <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30">
                          <CheckCircle className="w-12 h-12" />
                        </div>
                        <div className="text-center">
                          <p className="font-black text-3xl">{isRtl ? "مبروك!" : "Congratulations!"}</p>
                          <p className="text-muted-foreground mb-6">{isRtl ? "متجرك متاح الآن للعالم." : "Your store is now live."}</p>
                          <Button className="rounded-full px-8 bg-emerald-600 hover:bg-emerald-700">
                            {isRtl ? "عرض المتجر" : "View Store"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* Industry Showcase - Modernized */}
        <section className="py-32 px-4 relative overflow-hidden bg-foreground text-background">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay" />
          <div className="max-w-7xl mx-auto space-y-20 relative z-10">
            <div className="text-center space-y-4">
              <h2 className="text-4xl sm:text-6xl font-black tracking-tight">{t("industry.title")}</h2>
              <p className="text-xl text-background/80 max-w-2xl mx-auto">{t("industry.explanation")}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[280px]">
              {[
                { 
                  key: "clothing", 
                  icon: ShoppingBag, 
                  className: "md:col-span-2 md:row-span-2 bg-gradient-to-br from-violet-600 to-fuchsia-600",
                  iconBg: "bg-white/20 text-white"
                },
                { 
                  key: "carCare", 
                  icon: Car, 
                  className: "col-span-1 row-span-1 bg-gradient-to-br from-blue-600 to-cyan-600",
                  iconBg: "bg-white/20 text-white"
                },
                { 
                  key: "beauty", 
                  icon: Sparkles, 
                  className: "col-span-1 row-span-1 bg-gradient-to-br from-amber-500 to-orange-600",
                  iconBg: "bg-white/20 text-white"
                },
                { 
                  key: "electronics", 
                  icon: Smartphone, 
                  className: "md:col-span-2 lg:col-span-2 row-span-1 bg-gradient-to-br from-slate-700 to-zinc-800",
                  iconBg: "bg-white/20 text-white"
                },
                { 
                  key: "home", 
                  icon: Home, 
                  className: "col-span-1 row-span-1 bg-gradient-to-br from-emerald-600 to-teal-700",
                  iconBg: "bg-white/20 text-white"
                },
                { 
                  key: "food", 
                  icon: Utensils, 
                  className: "col-span-1 row-span-1 bg-gradient-to-br from-red-600 to-rose-700",
                  iconBg: "bg-white/20 text-white"
                }
              ].map((ind, i) => (
                <motion.div 
                  key={ind.key}
                  whileHover={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className={cn(
                    "group relative overflow-hidden rounded-[2.5rem] border border-white/10 p-8 transition-all flex flex-col justify-end shadow-2xl",
                    ind.className
                  )}
                >
                  <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity group-hover:scale-110 duration-500 text-white">
                    <ind.icon className="w-48 h-48 -mr-16 -mt-16 rotate-12" />
                  </div>
                  <div className="relative z-10 space-y-4">
                    <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-md", ind.iconBg)}>
                      <ind.icon className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black tracking-tight text-white mb-2">{t(`industry.${ind.key}.title`)}</h3>
                      <p className="text-white/80 font-medium text-lg leading-snug">
                        {t(`industry.${ind.key}.description`)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
              <motion.div 
                whileHover={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
                className="col-span-1 md:col-span-3 lg:col-span-4 row-span-1 group relative overflow-hidden rounded-[2.5rem] bg-white/5 backdrop-blur border border-white/10 p-10 transition-all flex flex-col sm:flex-row items-center justify-center text-center sm:text-left gap-8"
              >
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-white/50 group-hover:bg-white/20 group-hover:text-white transition-colors shrink-0">
                  <Bot className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-3xl font-black tracking-tight text-white">{isRtl ? "وأكثر من ذلك بكثير..." : "And many more..."}</h3>
                  <p className="text-white/60 font-medium text-xl mt-2">
                    {isRtl ? "محركنا الذكي يتكيف مع أي نوع من الأعمال لإنشاء متجر مثالي لك." : "Our intelligent engine adapts to any business type to create the perfect store for you."}
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Admin Features Section */}
        <section className="py-32 px-4 bg-muted/30 relative overflow-hidden">
          <div className="max-w-7xl mx-auto space-y-20 relative z-10">
            <div className="text-center space-y-4">
              <h2 className="text-4xl sm:text-6xl font-black tracking-tight">{t("admin.title")}</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t("admin.subtitle")}</p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { key: "aiTools", icon: Wand2, gradient: "from-purple-500/20 to-pink-500/20", iconColor: "text-purple-500", ring: "ring-purple-500/20", badge: true },
                { key: "marketing", icon: Megaphone, gradient: "from-blue-500/20 to-cyan-500/20", iconColor: "text-blue-500", ring: "ring-blue-500/20", badge: true },
                { key: "inventory", icon: Package, gradient: "from-emerald-500/20 to-teal-500/20", iconColor: "text-emerald-500", ring: "ring-emerald-500/20" },
                { key: "analytics", icon: BarChart3, gradient: "from-amber-500/20 to-orange-500/20", iconColor: "text-amber-500", ring: "ring-amber-500/20" },
                { key: "customers", icon: Users, gradient: "from-rose-500/20 to-red-500/20", iconColor: "text-rose-500", ring: "ring-rose-500/20" },
                { key: "settings", icon: Settings, gradient: "from-slate-500/20 to-zinc-500/20", iconColor: "text-slate-500", ring: "ring-slate-500/20" },
              ].map((feature, index) => (
                <motion.div
                  key={feature.key}
                  whileHover={{ y: -5 }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative p-8 rounded-3xl bg-card border border-border/50 shadow-xl overflow-hidden group`}
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.gradient} rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity`} />
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className={`w-14 h-14 rounded-2xl bg-background/80 flex items-center justify-center ${feature.iconColor} ring-4 ${feature.ring} shadow-lg group-hover:scale-110 transition-transform`}>
                        <feature.icon className="w-7 h-7" />
                      </div>
                      {feature.badge && (
                        <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-primary/10 text-primary border border-primary/20">
                          {t(`admin.features.${feature.key}.badge`)}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-2xl mb-3">{t(`admin.features.${feature.key}.title`)}</h3>
                    <p className="text-muted-foreground leading-relaxed font-medium">{t(`admin.features.${feature.key}.description`)}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Admin Dashboard Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-20 rounded-3xl overflow-hidden border border-border/50 shadow-2xl bg-card relative aspect-[16/9] max-w-5xl mx-auto hidden md:block"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-muted to-background" />
              <div className="relative h-full flex flex-col p-6">
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                  </div>
                  <div className="h-8 w-64 bg-background rounded-lg border border-border/50 flex items-center px-3 gap-2">
                     <div className="w-4 h-4 rounded bg-muted-foreground/30" />
                     <div className="h-3 w-32 bg-muted-foreground/20 rounded" />
                  </div>
                </div>
                <div className="flex gap-8 flex-1">
                  {/* Sidebar */}
                  <div className="w-48 space-y-4">
                    <div className="h-8 w-full bg-primary/10 rounded-lg border border-primary/20" />
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="h-8 w-full bg-muted rounded-lg" />
                    ))}
                  </div>
                  {/* Main Content */}
                  <div className="flex-1 space-y-6">
                    <div className="flex gap-6 h-32">
                       {[1, 2, 3].map(i => (
                         <div key={i} className="flex-1 bg-background rounded-2xl border border-border/50 p-4 space-y-3">
                           <div className="w-8 h-8 rounded-lg bg-muted" />
                           <div className="h-4 w-24 bg-muted rounded" />
                           <div className="h-8 w-32 bg-primary/10 rounded" />
                         </div>
                       ))}
                    </div>
                    <div className="flex gap-6 flex-1">
                      <div className="flex-[2] bg-background rounded-2xl border border-border/50 p-6">
                         <div className="h-6 w-48 bg-muted rounded mb-6" />
                         <div className="space-y-4">
                           {[1, 2, 3, 4].map(i => (
                             <div key={i} className="h-12 w-full bg-muted/50 rounded-lg" />
                           ))}
                         </div>
                      </div>
                      <div className="flex-1 bg-background rounded-2xl border border-border/50 p-6">
                         <div className="h-6 w-32 bg-muted rounded mb-6" />
                         <div className="w-full aspect-square rounded-full border-[16px] border-muted" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-4 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-6xl mx-auto rounded-[4rem] bg-gradient-to-br from-card to-muted border border-border/50 p-12 sm:p-24 text-center space-y-12 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-grid-white/5" />
            <div className="relative z-10 space-y-8">
              <h2 className="text-5xl sm:text-7xl font-black tracking-tight leading-tight">
                {isRtl ? "هل أنت مستعد لإطلاق متجرك؟" : "Ready to launch your store?"}
              </h2>
              <p className="text-2xl text-muted-foreground max-w-2xl mx-auto font-medium">
                {isRtl ? "انضم إلى آلاف التجار الذين بدأوا رحلتهم معنا اليوم." : "Join thousands of merchants who started their journey with us today."}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
                <Link href={`/${locale}/signup`}>
                  <Button
                    size="lg"
                    className="rounded-full px-16 h-20 text-2xl font-black shadow-2xl shadow-primary/40 hover:scale-105 transition-all"
                  >
                    {isRtl ? "ابدأ مجاناً الآن" : "Start for Free Now"}
                  </Button>
                </Link>
              </div>
              <div className="flex items-center justify-center gap-12 pt-12 grayscale opacity-50">
                <Shield className="w-12 h-12" />
                <Lock className="w-12 h-12" />
                <CheckCircle className="w-12 h-12" />
              </div>
            </div>
          </motion.div>
        </section>
      </main>
      
      <footer className="py-20 border-t bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-4">
            <Image src="/brova-logo-full.png" alt="Brova" width={40} height={40} className="dark:invert" />
            <span className="text-2xl font-black tracking-tight">Brova</span>
          </div>
          <p className="text-lg text-muted-foreground font-medium">&copy; 2026 Brova. All rights reserved.</p>
          <div className="flex items-center gap-8">
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors font-bold">Twitter</Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors font-bold">LinkedIn</Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors font-bold">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Lock(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}
