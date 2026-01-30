/**
 * AI Concierge Translations - English
 * 
 * Tone: Calm, confident, clear. No hype, no apologies.
 * Like a thoughtful product manager helping you set up.
 */

const concierge = {
  // ==========================================================================
  // CORE IDENTITY
  // ==========================================================================
  name: "Concierge",
  role: "Your store setup assistant",
  
  // ==========================================================================
  // WELCOME & INTRO
  // ==========================================================================
  welcome: {
    greeting: "Welcome to your store",
    subtitle: "Let's set up your store together.",
    reassurance: "Nothing will be published without your approval.",
    startButton: "Let's begin",
    skipButton: "Skip for now",
    continueButton: "Continue",
    backButton: "Back",
  },
  
  // ==========================================================================
  // ONBOARDING STEPS
  // ==========================================================================
  steps: {
    welcome: "Welcome",
    brand: "Your Brand",
    products: "Products",
    appearance: "Appearance",
    review: "Review",
  },
  
  progress: {
    step: "Step {current} of {total}",
    almostDone: "Almost done",
    complete: "Setup complete",
  },
  
  // ==========================================================================
  // QUESTIONS (High-signal, minimal)
  // ==========================================================================
  questions: {
    whatSelling: {
      text: "What are you selling?",
      hint: "A few words is enough.",
      placeholder: "e.g., Handmade jewelry, Vintage clothing",
    },
    productType: {
      text: "Physical or digital products?",
      physical: "Physical products",
      digital: "Digital products",
      both: "Both",
    },
    brandName: {
      text: "Do you have a brand name?",
      hint: "We can suggest one if you'd like.",
      placeholder: "Your brand name",
      suggestButton: "Suggest a name",
    },
    brandStyle: {
      text: "How would you describe your brand's style?",
      hint: "This helps us suggest colors and fonts.",
      options: {
        minimal: "Minimal & Clean",
        bold: "Bold & Vibrant",
        elegant: "Elegant & Luxurious",
        playful: "Playful & Fun",
        natural: "Natural & Organic",
      },
    },
    hasProducts: {
      text: "Do you have products ready to add?",
      yes: "Yes, I have some",
      no: "Not yet",
      hint: "You can always add them later.",
    },
  },
  
  // ==========================================================================
  // AI RESPONSES (Calm, contextual)
  // ==========================================================================
  responses: {
    // Acknowledgments
    gotIt: "Got it.",
    understood: "Understood.",
    perfectChoice: "Good choice.",
    noted: "Noted.",
    
    // Progress
    goodProgress: "Making good progress.",
    almostThere: "Almost there.",
    oneMoreThing: "One more thing.",
    
    // Contextual responses
    emptyStoreContext: "I see your store is empty. Let's add some personality.",
    draftStoreContext: "Your store is taking shape. A few more details.",
    productsPageContext: "You're on the products page. Want to add your first product?",
    
    // Suggestions
    nameSuggestion: "Based on what you're selling, here's a name idea: {name}",
    colorSuggestion: "These colors match your style: ",
    
    // Completion
    reviewReady: "Your store preview is ready. Take a look.",
    nothingSaved: "Remember: nothing is saved yet. You're in control.",
  },
  
  // ==========================================================================
  // DRAFT PREVIEW
  // ==========================================================================
  draft: {
    label: "Draft",
    previewTitle: "Store Preview",
    previewHint: "This is how your store might look.",
    notSaved: "Not saved",
    editButton: "Edit",
    approveButton: "Looks good",
    changeButton: "Change",
    
    // Preview sections
    storeName: "Store Name",
    storeNamePlaceholder: "Your Store",
    products: "Products",
    noProducts: "No products yet",
    addProduct: "Add a product",
    appearance: "Appearance",
    colors: "Colors",
    fonts: "Fonts",
  },
  
  // ==========================================================================
  // ACTIONS & CONTROL
  // ==========================================================================
  actions: {
    skip: "Skip",
    skipThisStep: "Skip this step",
    goBack: "Go back",
    continue: "Continue",
    finish: "Finish setup",
    startOver: "Start over",
    
    // Final actions (require explicit approval)
    saveDraft: "Save as draft",
    publish: "Publish store",
    confirmPublish: "Are you sure? This will make your store live.",
    
    // User control messaging
    inControl: "You're always in control.",
    canChangeLater: "You can change this anytime.",
    nothingPermanent: "Nothing is permanent until you say so.",
  },
  
  // ==========================================================================
  // APPROVAL SCREEN
  // ==========================================================================
  approval: {
    title: "Review your draft",
    subtitle: "This is what will be saved.",
    explanation: "Nothing has been saved yet. Review your draft and approve to save it to your store.",
    
    // Summary sections
    summary: {
      title: "What will be saved",
      storeName: "Store name",
      products: "Draft products",
      appearance: "Store appearance",
      noStoreName: "No store name set",
      noProducts: "No products",
      noAppearance: "Default appearance",
    },
    
    // Product list
    productList: {
      count: "{count} product",
      count_plural: "{count} products",
      viewAll: "View all",
      collapse: "Show less",
    },
    
    // Actions
    approveButton: "Approve & Save",
    cancelButton: "Cancel",
    goBackButton: "Go back",
    
    // States
    saving: "Saving...",
    saved: "Saved successfully",
    error: "Failed to save",
    
    // Safety reminders
    reminder: {
      title: "Important",
      draftOnly: "This saves as a draft only",
      noPublish: "Your store won't be published yet",
      canEdit: "You can edit everything later",
      canCancel: "Cancel to go back without saving",
    },
    
    // Post-approval
    success: {
      title: "Draft saved",
      message: "Your draft has been saved. You can continue editing or publish when ready.",
      continueButton: "Go to dashboard",
    },
  },
  
  // ==========================================================================
  // SAFETY & GUARDRAILS
  // ==========================================================================
  safety: {
    draftOnly: "This is a draft. Nothing has been saved.",
    noAutoSave: "We don't auto-save. You decide when to save.",
    yourControl: "You're in control.",
    canSkip: "You can skip any question.",
    canUndo: "You can undo any change.",
  },
  
  // ==========================================================================
  // ERROR & EDGE CASES
  // ==========================================================================
  errors: {
    connectionLost: "Connection lost. Your draft is safe locally.",
    tryAgain: "Something went wrong. Try again.",
    inputTooLong: "That's a bit long. Keep it shorter.",
  },
  
  // ==========================================================================
  // LOADING & THINKING STATES
  // ==========================================================================
  loading: {
    thinking: "Thinking...",
    generating: "Generating preview...",
    updating: "Updating...",
  },
  
  // ==========================================================================
  // PAGE CONTEXT AWARENESS
  // ==========================================================================
  pageContext: {
    dashboard: "You're on the dashboard.",
    products: "You're viewing your products.",
    orders: "You're checking orders.",
    settings: "You're in settings.",
    onboarding: "Let's set up your store.",
  },
  
  // ==========================================================================
  // BILINGUAL HINTS
  // ==========================================================================
  language: {
    switchPrompt: "Would you prefer Arabic?",
    switchToArabic: "التبديل إلى العربية",
    switchToEnglish: "Switch to English",
  },
} as const

export default concierge
