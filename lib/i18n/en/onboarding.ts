/**
 * Onboarding Translations - English
 * 
 * Conversational, welcoming tone that guides without pressure.
 */

const onboarding = {
  // Navigation
  next: "Continue",
  skip: "Skip",
  skipForNow: "I'll do this later",
  back: "Back",

  // Slide 1: Welcome
  intro: {
    title: "Welcome",
    description: "Experience modern streetwear like never before. We're here to help you find your perfect fit.",
  },

  // Slide 2: AI Try-On
  tryOn: {
    title: "AI Try-On",
    description: "See exactly how clothes look on you before you buy. Our AI visualizes the fit perfectly on your body.",
  },

  // Slide 3: Measurements
  measure: {
    title: "Smart Sizing",
    description: "Get personalized size recommendations based on your exact body measurements. No more guessing.",
  },

  // Slide 4: CTA
  prompt: {
    title: "Ready to Start?",
    description: "To recommend the best products for you, we'll need your measurements. It only takes a minute.",
    cta: "Set Up My Fit",
  },
} as const

export default onboarding
