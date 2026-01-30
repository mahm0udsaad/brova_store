import { NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { createClient } from "@/lib/supabase/server"
import { models } from "@/lib/ai/gateway"
import type { 
  ConciergeContext, 
  ConciergeResponse,
  DraftStoreState,
  ConciergeQuestion,
} from "@/lib/ai/concierge-context"

/**
 * AI Concierge API - READ-ONLY
 * 
 * CRITICAL SAFETY CONSTRAINTS:
 * - This endpoint does NOT write to any database
 * - This endpoint does NOT modify any user data
 * - This endpoint does NOT change any store settings
 * - All outputs are draft/preview only
 * 
 * The AI is aware, not watching.
 * It understands context because the UI tells it, not because it spies.
 */

// =============================================================================
// TYPES
// =============================================================================

interface ConciergeRequest {
  message: string
  context: ConciergeContext
  draftState: DraftStoreState
  conversationHistory: Array<{ role: string; content: string }>
}

// =============================================================================
// SYSTEM PROMPT
// =============================================================================

function buildSystemPrompt(locale: "ar" | "en", context: ConciergeContext): string {
  const isArabic = locale === "ar"
  
  const basePrompt = isArabic ? `
أنت مساعد إعداد المتجر. أسلوبك هادئ وواثق وواضح.

# السلوك
- أنت مدير منتجات هادئ، لست روبوت دردشة
- اطرح سؤالاً واحداً فقط في كل رد
- جمل قصيرة وواضحة
- لا مبالغة، لا اعتذارات
- المستخدم يتحكم دائماً

# السياق الحالي
- الصفحة: ${context.ui_context.page}
- حالة المتجر: ${context.ui_context.store_state}
- خطوة الإعداد: ${context.ui_context.onboarding_step || "البداية"}

# قواعد صارمة
- لا تكتب في قاعدة البيانات أبداً
- كل المخرجات للمعاينة فقط
- المستخدم يوافق قبل أي حفظ
- يمكن للمستخدم تخطي أي سؤال

# تنسيق الرد
أجب بـ JSON فقط:
{
  "message": "رسالتك للمستخدم",
  "next_question": {
    "id": "معرف_السؤال",
    "text": "السؤال بالإنجليزية",
    "text_ar": "السؤال بالعربية",
    "type": "open|choice|yes_no",
    "options": [{"id": "opt1", "text": "Option", "text_ar": "الخيار"}],
    "skippable": true
  },
  "draft_updates": {
    "store_name": {"value": "اسم مقترح", "confidence": "suggestion", "source": "ai"}
  }
}
` : `
You are a store setup assistant. Your tone is calm, confident, and clear.

# Behavior
- You are a calm product manager, not a chatbot
- Ask only one question per response
- Short, clear sentences
- No hype, no apologies
- The user is always in control

# Current Context
- Page: ${context.ui_context.page}
- Store state: ${context.ui_context.store_state}
- Onboarding step: ${context.ui_context.onboarding_step || "starting"}

# Strict Rules
- NEVER write to the database
- All outputs are for preview only
- User must approve before any save
- User can skip any question

# Response Format
Reply with JSON only:
{
  "message": "Your message to the user",
  "next_question": {
    "id": "question_id",
    "text": "Question in English",
    "text_ar": "Question in Arabic",
    "type": "open|choice|yes_no",
    "options": [{"id": "opt1", "text": "Option", "text_ar": "الخيار"}],
    "skippable": true
  },
  "draft_updates": {
    "store_name": {"value": "Suggested Name", "confidence": "suggestion", "source": "ai"}
  }
}
`

  // Add visible components context
  if (context.ui_context.visible_components.length > 0) {
    const componentsStr = context.ui_context.visible_components
      .map(c => `${c.type}${c.variant ? ` (${c.variant})` : ""}`)
      .join(", ")
    
    return basePrompt + `\n\n# Visible UI Components\n${componentsStr}`
  }
  
  return basePrompt
}

// =============================================================================
// ONBOARDING QUESTIONS
// =============================================================================

const ONBOARDING_QUESTIONS: Record<string, ConciergeQuestion> = {
  what_selling: {
    id: "what_selling",
    text: "What are you selling?",
    text_ar: "ماذا تبيع؟",
    type: "open",
    skippable: false,
  },
  product_type: {
    id: "product_type",
    text: "Physical or digital products?",
    text_ar: "منتجات مادية أم رقمية؟",
    type: "choice",
    options: [
      { id: "physical", text: "Physical products", text_ar: "منتجات مادية" },
      { id: "digital", text: "Digital products", text_ar: "منتجات رقمية" },
      { id: "both", text: "Both", text_ar: "كلاهما" },
    ],
    skippable: true,
  },
  brand_name: {
    id: "brand_name",
    text: "Do you have a brand name?",
    text_ar: "هل لديك اسم لعلامتك التجارية؟",
    type: "open",
    skippable: true,
  },
  brand_style: {
    id: "brand_style",
    text: "How would you describe your brand's style?",
    text_ar: "كيف تصف أسلوب علامتك التجارية؟",
    type: "choice",
    options: [
      { id: "minimal", text: "Minimal & Clean", text_ar: "بسيط ونظيف" },
      { id: "bold", text: "Bold & Vibrant", text_ar: "جريء ونابض بالحياة" },
      { id: "elegant", text: "Elegant & Luxurious", text_ar: "أنيق وفاخر" },
      { id: "playful", text: "Playful & Fun", text_ar: "مرح وممتع" },
      { id: "natural", text: "Natural & Organic", text_ar: "طبيعي وعضوي" },
    ],
    skippable: true,
  },
}

// =============================================================================
// HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Parse request
    const body: ConciergeRequest = await request.json()
    const { message, context, draftState, conversationHistory } = body
    
    // Validate context
    if (!context?.ui_context) {
      return NextResponse.json({ error: "Missing context" }, { status: 400 })
    }
    
    const locale = context.ui_context.locale || "en"
    
    // Build conversation messages
    const messages = [
      ...conversationHistory.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: message },
    ]
    
    // Generate response (READ-ONLY - no database operations)
    const result = await generateText({
      model: models.flash,
      system: buildSystemPrompt(locale, context),
      messages,
      temperature: 0.7,
      maxTokens: 1000,
    })
    
    // Parse AI response
    let response: ConciergeResponse
    
    try {
      // Try to parse as JSON
      const jsonMatch = result.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        response = JSON.parse(jsonMatch[0])
      } else {
        // Fallback: use text as message
        response = {
          message: result.text,
        }
      }
    } catch {
      // If JSON parsing fails, use the raw text
      response = {
        message: result.text,
      }
    }
    
    // SAFETY: Validate that no database operations are in the response
    // (This is a safeguard - the system prompt already prevents this)
    if (response.draft_updates) {
      // Ensure all draft updates are marked as AI-generated
      if (response.draft_updates.store_name) {
        response.draft_updates.store_name = {
          ...response.draft_updates.store_name,
          source: "ai",
          confidence: "suggestion",
        }
      }
      
      if (response.draft_updates.products) {
        response.draft_updates.products = response.draft_updates.products.map(p => ({
          ...p,
          confidence: "ai_generated" as const,
        }))
      }
    }
    
    // Log usage (READ-ONLY - this is just analytics, no user data affected)
    // We don't log to database here to maintain strict read-only
    console.log(`[Concierge] User: ${user.id}, Page: ${context.ui_context.page}, Locale: ${locale}`)
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error("[Concierge API Error]:", error)
    
    return NextResponse.json(
      { 
        error: "Failed to generate response",
        message: "Something went wrong. Try again.",
      },
      { status: 500 }
    )
  }
}

// =============================================================================
// OPTIONS (for CORS)
// =============================================================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
