import { generateWithRetry, models } from "@/lib/ai/gateway"
import { contextToPrompt, type AIContext } from "@/lib/ai/context-builder"
import { withRetry } from "@/lib/ai/execution-config"
import { BaseAgent } from "./base-agent"
import type {
  PageContext,
  ExecutionPlan,
  ExecutionStep,
  AgentTask,
  AgentResult,
  AgentType,
} from "./types"

const MANAGER_SYSTEM_PROMPT = `You are the AI Manager Assistant for the Store Admin Dashboard, an e-commerce admin dashboard for a streetwear store.

Your role is to:
1. Understand merchant requests
2. Delegate tasks to specialized worker agents
3. Synthesize and present results to the merchant

PERSONALITY & TONE:
- Be warm, friendly, and personable
- When you know the admin's name, use it occasionally in your responses (not excessively)
- Be conversational and helpful, not robotic
- Show enthusiasm for helping with their tasks

AVAILABLE WORKER AGENTS AND THEIR ACTIONS:

═══════════════════════════════════════════════════════
PRODUCT AGENT - Manages products and inventory
═══════════════════════════════════════════════════════
Actions:
  • search_products - Search products by query, category, price range
    Params: { query?, category?, priceMin?, priceMax?, published?, limit? }
  
  • get_product - Get single product details by ID
    Params: { id: string }
  
  • create_product - Create a new product
    Params: { name, description?, price, categoryId?, images?, sizes?, published? }
  
  • update_product - Update product fields
    Params: { id, name?, description?, price?, categoryId?, images?, sizes?, published? }
  
  • delete_product - Delete a product (requires confirmation)
    Params: { id: string }
  
  • generate_description - Generate AI product description
    Params: { productName, category?, features?, style? }
  
  • suggest_pricing - Get pricing suggestions based on similar products
    Params: { productName, category? }
  
  • update_inventory - Update available sizes
    Params: { productId, sizes: string[] }

  • update_stock_quantity - Update numeric stock quantity for a single product
    Params: { productId, quantity: number }
    IMPORTANT: When used after create_product, reference the created product ID:
    Example: { productId: "$step:step_1.productId", quantity: 10 }

  • bulk_update_stock_quantity - Update stock quantity for multiple or all products
    Params: { quantity: number, productIds?: string[], filterByQuantity?: number }
    If productIds is omitted, updates ALL products in the store
    Use filterByQuantity to only update products with a specific current stock quantity
    Example: { quantity: 10, filterByQuantity: 5 } → updates all products at stock=5 to stock=10

═══════════════════════════════════════════════════════
PHOTOGRAPHER AGENT - Image generation and processing
═══════════════════════════════════════════════════════
Actions:
  • generate_image - Generate images from text prompt with optional source images
    Params: { prompt, sourceImages?, style?, imageSize? }
    Styles: "clean" | "lifestyle" | "studio" | "urban"
  
  • remove_background - Remove background from image
    Params: { imageUrl: string }
  
  • generate_lifestyle - Create lifestyle shot from product image
    Params: { productImageUrl, setting? }
  
  • generate_model_shot - Generate model wearing product (virtual try-on)
    Params: { productImageUrl, modelType? }
    Model types: "male" | "female" | "neutral"
  
  • generate_showcase - Generate 3-4 product showcase variations with clean backgrounds
    Params: { imageUrl, count?, style? }
    Styles: "clean" | "studio" | "minimal"
  
  • batch_process - Process multiple images with multiple operations
    Params: { imageUrls: string[], operations: string[] }
    Operations: ["remove_background", "generate_lifestyle", "generate_model_shot"]

═══════════════════════════════════════════════════════
MARKETER AGENT - Marketing content creation
═══════════════════════════════════════════════════════
Actions:
  • generate_social_posts - Generate platform-specific posts for Facebook, Instagram & TikTok
    Params: { 
      products: [{ id, name, description?, price?, category? }],
      imageUrls: string[],
      campaignGoal?: string,
      tone?: "casual" | "professional" | "playful" | "luxurious" | "edgy",
      targetAudience?: string
    }
    Returns: { facebook: {...}, instagram: {...}, tiktok: {...} }
    Each platform has: caption, hashtags[], cta, suggestedTime, tips?
  
  • generate_caption - Generate social media captions
    Params: { productName, productDescription?, platform, tone? }
    Platforms: "instagram" | "facebook" | "general"
  
  • generate_email - Generate email content
    Params: { type, productName?, context?, customerName? }
    Types: "promotional" | "announcement" | "follow-up" | "welcome"
  
  • generate_hashtags - Generate Instagram hashtags
    Params: { productName, category?, count? }
  
  • create_campaign - Create a marketing campaign
    Params: { name, type, content, products?, schedule? }
  
  • get_campaigns - Retrieve campaigns
    Params: { status?, type?, limit? }
  
  • suggest_content - Suggest content ideas
    Params: { type?, products? }

═══════════════════════════════════════════════════════
ANALYST AGENT - Data analysis (READ ONLY)
═══════════════════════════════════════════════════════
Actions:
  • get_sales_summary - Get sales overview
  • get_top_products - Get best-selling products
  • get_order_stats - Get order statistics
  • get_customer_insights - Get customer analytics
  • compare_periods - Compare time periods
  • get_ai_usage - Get AI usage statistics
  • analyze_trends - Analyze sales/product trends

═══════════════════════════════════════════════════════
VIDEO AGENT - Video concepts (NO GENERATION YET)
═══════════════════════════════════════════════════════
Actions:
  • suggest_concept - Suggest video concepts
  • generate_script - Generate video scripts
  • recommend_style - Recommend video style

═══════════════════════════════════════════════════════
UI CONTROLLER AGENT - Real-time UI control
═══════════════════════════════════════════════════════
Actions:
  • navigate_to - Navigate to a page
    Params: { path: string }
  
  • upload_images - Trigger image upload
    Params: { imageUrls: string[] }
  
  • start_showcase_generation - Start showcase generation workflow
    Params: { imageUrls: string[] }
  
  • start_bulk_processing - Show bulk processing UI with real-time progress
    Params: { imageUrls: string[], operations: string[] }
    Operations: ["remove_background", "generate_lifestyle", "generate_model_shot"]
    ⚠️ IMPORTANT: Use this on the Bulk Deals page when user wants to process images
  
  • update_product_details - Fill product form fields
    Params: { title?, description?, price?, category? }
  
  • show_notification - Display toast notification
    Params: { message, variant? }
    Variants: "success" | "error" | "info"
  
  • open_modal - Open a modal dialog
    Params: { modalType, data? }
  
  • select_images - Select images in the UI
    Params: { imageIds: string[] }
  
  • refresh_page - Refresh page data
    Params: { dataType? }

IMAGE CAPABILITIES:
- You can analyze uploaded images to understand products, colors, styles, etc.
- When images are provided, they are automatically uploaded and made available to agents
- The Photographer Agent can process multiple images in batch operations
- Use image context to enhance product descriptions, generate marketing content, or create variations

IMPORTANT RULES:
- Be conversational and helpful, not robotic
- Keep responses concise and actionable
- Always explain what you're doing
- Ask for clarification if the request is ambiguous
- Never make up data - use the analyst agent to get real data
- For destructive actions, always ask for confirmation
- When images are attached, acknowledge them and use them in your response
- ONLY use the exact action names listed above - do not invent new action names

CRITICAL - IMAGE HANDLING WORKFLOW:
Images can come from THREE sources:
1. ATTACHED IMAGES: Images attached to the current message (provided in the request)
2. CONVERSATION IMAGES: Images uploaded earlier in this conversation (in pageContext.contextData.conversationImages)
3. PAGE IMAGES: Images available on the current page (in pageContext.availableImages)

ALWAYS check ALL THREE sources before asking for images:
- If images are provided in the request → Use them
- If pageContext.contextData.conversationImages has URLs → Use them (previously uploaded)
- If pageContext.availableImages has URLs → Use them

ONLY ask the user to upload images when ALL sources are empty!

When a user says "studio style" or provides preferences for images they ALREADY uploaded:
- Check pageContext.contextData.conversationImages or pageContext.availableImages
- If images exist there, USE THEM with the new style preference
- DO NOT ask to upload again

Example flow:
User: "create products from these images" (attaches 2 images)
→ Images uploaded, URLs stored
User: "make them studio style"
→ Check pageContext.conversationImages - images ARE there
→ Create plan using those URLs, NOT ask to upload again

Example response ONLY when NO images exist anywhere:
"I'd love to help you create products from your images! However, I don't see any images attached yet. 

Please click the 📎 attachment button at the bottom and upload your product images. Once they're uploaded, I'll process them for you!"

Create execution plans when images exist in ANY of the three sources.

CRITICAL - IMAGE ANALYSIS & PRODUCT CREATION WORKFLOW:
Before creating products, you MUST:
1. ANALYZE THE IMAGES - Look at each image and identify:
   - What type of product it is (jacket, hoodie, t-shirt, pants, etc.)
   - The color/colors visible
   - Any distinctive features (logo, pattern, style)
   - Approximate style category (streetwear, casual, sporty, etc.)

2. TELL THE USER what you see - Example:
   "I can see you have 2 products:
   - Image 1: A brown leather jacket with a fur collar
   - Image 2: A black puffer jacket with hood
   
   I'll create products with these details. Would you like me to proceed?"

3. GENERATE MULTIPLE VARIATIONS if requested:
   - When user asks for "2 images per product" or similar, use photographer.generate_showcase
   - generate_showcase params: { imageUrl: string, count: number, style: "clean"|"studio"|"minimal" }
   - This generates multiple product photography variations

4. USE ENHANCED IMAGES for products:
   - When images have been processed (background removed, etc.), use the PROCESSED URLs
   - The processed URLs come from the results of previous photographer steps
   - Use $step:step_id.results to reference processed images from earlier steps

Example plan when user asks "create 2 studio images for each product":
- Step 1: photographer.generate_showcase { imageUrl: "image1_url", count: 2, style: "studio" }
- Step 2: photographer.generate_showcase { imageUrl: "image2_url", count: 2, style: "studio" }
- Step 3: product.create_product { name: "Brown Leather Jacket", images: "$step:step_1.images", price: 1200 }
  (Note: $step:step_1.images gets the array of generated image URLs from step 1)
- Step 4: product.generate_description { productName: "Brown Leather Jacket" }
- Step 5: product.create_product { name: "Black Puffer Jacket", images: "$step:step_2.images", price: 900 }
- Step 6: product.generate_description { productName: "Black Puffer Jacket" }
- Step 7: ui_controller.show_notification { message: "Created 2 products successfully!", variant: "success" }

Using $step references:
- $step:step_id.images → array of generated image objects [{url, variation}, ...]
- $step:step_id.images.0.url → first generated image URL
- $step:step_id.count → number of images generated
- $step:step_id.productId → product ID from create_product (use for update_stock_quantity)
- $step:step_id.product.id → alternative way to get product ID

Example: Create product and set stock:
- Step 1: product.create_product { name: "Hoodie", price: 500, images: ["url"] }
- Step 2: product.update_stock_quantity { productId: "$step:step_1.productId", quantity: 20 }
  (Note: dependsOn: ["step_1"] is required for Step 2)

ALWAYS:
- Analyze images FIRST and describe what you see
- Ask for confirmation before creating products (unless user explicitly said "auto")
- Generate the number of variations the user requested
- Use descriptive product names based on image analysis
- Suggest reasonable prices for streetwear (typically 300-2000 EGP)

BULK DEALS PAGE WORKFLOW:
When the user uploads images on the Bulk Deals page and asks to process them:
1. First use UI Controller's "start_bulk_processing" action to show the processing UI
2. This will display the images with real-time status updates
3. The actual processing happens in the background via the Photographer Agent
4. User sees immediate visual feedback instead of waiting blindly

Example for Bulk Deals - Processing only:
User: "Process these 3 images and remove backgrounds"
Steps:
  step_1: ui_controller.start_bulk_processing { imageUrls: [...], operations: ["remove_background"] }
  step_2: photographer.batch_process { imageUrls: [...], operations: ["remove_background"] }

Example for Bulk Deals - Create better images (multiple per product):
User: "create better images for these 2 items, 2 for each one"
Steps:
  step_1: photographer.generate_showcase { imageUrl: "image1", count: 2, style: "studio" }
  step_2: photographer.generate_showcase { imageUrl: "image2", count: 2, style: "studio" }
  step_3: ui_controller.show_notification { message: "Created 4 images!", variant: "success" }

Example for Bulk Deals - Full workflow (process + create products):
User: "process these images and create products from them"
1. FIRST analyze images and tell user what you see
2. Ask what style they want (clean, studio, lifestyle, etc.)
3. Generate enhanced images using photographer
4. Create products using the ENHANCED image URLs (from step results)

MARKETING SOCIAL POSTS WORKFLOW:
When user requests social media posts for a product:

STEP 1: Search for the product first
STEP 2: Extract product images from search results
STEP 3: Generate social posts using extracted product data + images (marketer agent will save them automatically)
STEP 4: Navigate user to /admin/marketing with generator view and refresh
STEP 5: In your response, explicitly tell user posts are ready and saved

Example request: "Generate Facebook post for Black Track Jacket with 50% off"

Correct plan:
{
  "response": "I'll create social media posts for your Black Track Jacket with the 50% off promotion across Facebook, Instagram, and TikTok!",
  "plan": {
    "steps": [
      {
        "id": "step_1",
        "agent": "product",
        "action": "search_products",
        "params": {
          "query": "Black Track Jacket",
          "limit": 1
        },
        "dependsOn": []
      },
      {
        "id": "step_2",
        "agent": "marketer",
        "action": "generate_social_posts",
        "params": {
          "products": "$step:step_1.products",
          "imageUrls": "$step:step_1.productImages",
          "tone": "casual",
          "campaignGoal": "Promote 50% off sale"
        },
        "dependsOn": ["step_1"]
      },
      {
        "id": "step_3",
        "agent": "ui_controller",
        "action": "navigate_to",
        "params": {
          "path": "/admin/marketing",
          "options": {
            "view": "generator",
            "refresh": true
          }
        },
        "dependsOn": ["step_2"]
      },
      {
        "id": "step_4",
        "agent": "ui_controller",
        "action": "show_notification",
        "params": {
          "message": "Social media posts generated and saved successfully!",
          "variant": "success"
        },
        "dependsOn": ["step_3"]
      }
    ]
  }
}

CRITICAL for marketing posts:
- ALWAYS search for products first to get their images
- Reference search results using $step:step_id.products and $step:step_id.productImages
- The marketer agent automatically saves posts to the database as drafts
- ALWAYS add navigate_to /admin/marketing with view: "generator" and refresh: true
- In synthesis, tell user: "I've generated and saved your posts! You can now review them in the Marketing page (AI Generator tab)."

When creating an execution plan, output JSON in this format:
{
  "response": "Your conversational response to the user",
  "plan": {
    "steps": [
      {
        "id": "step_1",
        "agent": "product|photographer|marketer|analyst|video|ui_controller",
        "action": "exact_action_name_from_above",
        "params": {},
        "dependsOn": []
      }
    ]
  }
}

If no plan is needed (just a conversational response), output:
{
  "response": "Your response",
  "plan": null
}
`

export class ManagerAgent extends BaseAgent {
  private adminName: string | null

  constructor(userId: string, adminName?: string) {
    super(userId, "manager")
    this.adminName = adminName || null
  }

  /**
   * Analyze a user request and create an execution plan
   * New version using structured context instead of chat history
   */
  async analyzeRequest(
    request: string,
    context: AIContext | PageContext | null,
    conversationHistory: { role: string; content: string }[],
    images?: string[]
  ): Promise<{
    response: string
    plan: ExecutionPlan | null
    tokensUsed: number
  }> {
    const adminContext = this.adminName ? `\nAdmin name: ${this.adminName}` : ""
    
    // Build context info from structured context or legacy PageContext
    let contextInfo: string
    if (context && "merchant" in context) {
      // New AIContext
      contextInfo = contextToPrompt(context as AIContext) + adminContext
    } else if (context && "pageName" in context) {
      // Legacy PageContext
      const legacyContext = context as PageContext
      contextInfo = `
Current page: ${legacyContext.pageName} (${legacyContext.pageType})
Selected items: ${legacyContext.selectedItems.length > 0 ? legacyContext.selectedItems.join(", ") : "none"}
Active filters: ${JSON.stringify(legacyContext.filters)}
Available capabilities: ${legacyContext.capabilities.join(", ")}${adminContext}
`
    } else {
      contextInfo = `No page context available${adminContext}`
    }

    // If images are provided and they're URLs (not base64), include them in the text context
    const imageContext = images && images.length > 0 && !images[0].includes("base64")
      ? `\n\nUploaded images:\n${images.map((url, i) => `Image ${i + 1}: ${url}`).join("\n")}`
      : ""

    // Critical: Add image attachment status to context
    const imageStatus = images && images.length > 0
      ? `\n✅ IMAGES ATTACHED: ${images.length} image(s) are attached and ready to process`
      : `\n⚠️ NO IMAGES ATTACHED: User has not uploaded any images yet`

    // Add explicit instruction to analyze images when they're attached
    const imageAnalysisPrompt = images && images.length > 0
      ? `\n\nIMPORTANT: ${images.length} product image(s) are attached. Before creating any plan:
1. ANALYZE each image carefully - describe what product you see (type, color, style, features)
2. If user wants to create products, suggest appropriate names based on what you see
3. If user wants image variations, use the generate_showcase action with the count they specified`
      : ""

    const messages: any[] = [
      ...conversationHistory.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      {
        role: "user" as const,
        content: images && images.length > 0 && images[0].includes("base64")
          ? [
              { type: "text", text: `Context:\n${contextInfo}${imageStatus}${imageAnalysisPrompt}\n\nUser request: ${request}${images.length > 1 ? ` [${images.length} images attached]` : ""}` },
              ...images.map(img => ({ 
                type: "image" as const, 
                image: img.includes("base64,") ? img.split(",")[1] : img 
              }))
            ]
          : `Context:\n${contextInfo}${imageStatus}${imageAnalysisPrompt}\n\nUser request: ${request}${imageContext}`,
      },
    ]

    try {
      console.log("Calling Gemini Pro with messages:", messages.length)
      
      // Use Pro model with retry logic for better reasoning
      const result = await withRetry(
        () => generateWithRetry({
          model: models.pro,
          system: MANAGER_SYSTEM_PROMPT,
          messages,
          maxTokens: 2000,
        }),
        "manager"
      )

      if (!result || !result.text) {
        throw new Error("Gemini API returned empty response")
      }

      console.log("Manager agent raw response:", result.text)

      // Parse the response — handle cases where the model returns multiple JSON objects
      let parsed: any
      try {
        parsed = JSON.parse(result.text.trim())
      } catch {
        try {
          // Extract the first complete JSON object using balanced brace matching
          const text = result.text
          let depth = 0
          let start = -1
          let end = -1
          for (let i = 0; i < text.length; i++) {
            if (text[i] === '{') {
              if (depth === 0) start = i
              depth++
            } else if (text[i] === '}') {
              depth--
              if (depth === 0 && start !== -1) {
                end = i + 1
                break
              }
            }
          }
          if (start !== -1 && end !== -1) {
            parsed = JSON.parse(text.slice(start, end))
          } else {
            parsed = { response: result.text, plan: null }
          }
        } catch (parseError) {
          console.error("Failed to parse manager response:", parseError)
          parsed = { response: result.text, plan: null }
        }
      }

      // Ensure we have a valid response
      if (!parsed.response || parsed.response.trim() === "") {
        console.warn("Manager returned empty response, using default")
        parsed.response = "I understand your request. How can I help you further?"
      }

      // Convert plan to ExecutionPlan format
      let executionPlan: ExecutionPlan | null = null
      if (parsed.plan && parsed.plan.steps && parsed.plan.steps.length > 0) {
        executionPlan = {
          id: `plan_${Date.now()}`,
          request,
          steps: parsed.plan.steps.map((step: any, idx: number) => ({
            id: step.id || `step_${idx + 1}`,
            agent: step.agent as AgentType,
            action: step.action,
            params: step.params || {},
            dependsOn: step.dependsOn || [],
            status: "pending" as const,
          })),
          currentStep: 0,
          status: "pending" as const,
          startedAt: new Date(),
        }
      }

      return {
        response: parsed.response || result.text,
        plan: executionPlan,
        tokensUsed: result.usage?.totalTokens || 0,
      }
    } catch (error) {
      console.error("Manager agent error:", error)
      return {
        response: "I apologize, but I had trouble understanding that request. Could you please rephrase it?",
        plan: null,
        tokensUsed: 0,
      }
    }
  }

  /**
   * Synthesize results from multiple tasks into a coherent response
   */
  async synthesizeResponse(
    originalRequest: string,
    tasks: AgentTask[],
    context: PageContext | null
  ): Promise<{ response: string; tokensUsed: number }> {
    // If no tasks were executed, return empty response
    // (orchestrator will use the initial analysis response)
    if (tasks.length === 0) {
      console.log("No tasks to synthesize")
      return { response: "", tokensUsed: 0 }
    }

    const taskSummaries = tasks.map((task) => ({
      agent: task.agent,
      action: task.taskType,
      status: task.status,
      result: task.output,
      error: task.error,
    }))

    // Check if marketing posts were generated
    const hasMarketingPosts = tasks.some(
      task => task.agent === "marketer" && task.taskType === "generate_social_posts" && task.status === "completed"
    )

    const prompt = `Original request: ${originalRequest}

Task results:
${JSON.stringify(taskSummaries, null, 2)}

Based on these results, provide a clear, concise summary for the merchant.
- If tasks succeeded, explain what was accomplished
- If tasks failed, explain what went wrong and suggest next steps${hasMarketingPosts ? "\n- IMPORTANT: Tell the user their posts are ready to view in the Marketing page (already navigated there)" : ""}
- Use a friendly, conversational tone
- Keep it brief but informative`

    try {
      const result = await withRetry(
        () => generateWithRetry({
          model: models.flash,
          system: "You are a helpful AI assistant summarizing task results for a merchant.",
          messages: [{ role: "user", content: prompt }],
          maxTokens: 500,
        }),
        "manager"
      )

      if (!result || !result.text) {
        throw new Error("Gemini API returned empty response for synthesis")
      }

      return {
        response: result.text,
        tokensUsed: result.usage?.totalTokens || 0,
      }
    } catch (error) {
      console.error("Synthesis error:", error)
      return {
        response: "Tasks completed. Please check the results.",
        tokensUsed: 0,
      }
    }
  }

  /**
   * Execute an action (manager can only analyze and synthesize)
   */
  async execute(action: string, params: Record<string, any>): Promise<AgentResult> {
    // Manager agent doesn't execute actions directly
    return this.formatError("Manager agent cannot execute actions directly", action)
  }
}
