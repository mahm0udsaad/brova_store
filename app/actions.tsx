'use server'

import { createAI, getMutableAIState, streamUI } from '@ai-sdk/rsc'
import { nanoid } from 'nanoid';
import type { ReactNode } from 'react';

import { createManagerAgent } from '@/lib/agents/v2/manager-agent';
import type { AgentContext } from '@/lib/agents/v2/schemas';
import { createClient } from '@/lib/supabase/server';
import { updateOnboardingStatus } from '@/lib/actions/setup';
import { models } from '@/lib/ai/gateway';
import {
  createWorkflowState,
  advanceWorkflowStage,
  getWorkflowState,
  WORKFLOW_STAGES,
} from '@/lib/agents/v2/workflow-state';
import {
  createMemorySnapshot,
  shouldCreateSummary,
} from '@/lib/agents/v2/memory';

// Generative UI components for tool rendering
import { ClientDraftGrid } from '@/components/admin/generative-ui/client-draft-grid';
import { ClientQuestionCard } from '@/components/admin/generative-ui/client-question-card';
import { StatusCard } from "@/components/admin/generative-ui/status-card"
import { ConfirmationCard } from "@/components/admin/generative-ui/confirmation-card"
import { ProgressCard } from "@/components/admin/generative-ui/progress-card"

// Define the AI state and UI state types for our application.
export type AIState = Array<{
  id: string;
  name: 'assistant' | 'user' | 'system' | 'function' | 'tool';
  content: string;
  // Optional: A field to hold tool-specific results
  data?: any;
}>;

export type UIState = Array<{
  id: string;
  display: ReactNode;
  // Optional: A field for client-side only state, e.g. which options were selected
  state?: any;
}>;


// The primary server-side action that the client will call.
// It now accepts the full agent context.
async function submitUserMessage(userInput: string, context: AgentContext) {
  const aiState = getMutableAIState<typeof AI>();

  // Update the AI state with the new user message.
  aiState.update([
    ...aiState.get(),
    {
      id: nanoid(),
      name: 'user',
      content: userInput,
    },
  ]);

  // Check for initial greeting request (onboarding flow)
  if ('is_initial_greeting' in context && context.is_initial_greeting) {
    const greetingContent = context.locale === 'ar'
      ? 'مرحباً! أنا هنا لمساعدتك في إنشاء متجرك. دعنا نبدأ بتحميل بعض صور المنتجات.'
      : 'Welcome! I\'m here to help set up your store. Let\'s start by uploading some product images.'

    const greetingMessage = {
      id: nanoid(),
      name: 'assistant' as const,
      content: greetingContent,
    }

    aiState.update([...aiState.get(), greetingMessage])

    return {
      id: nanoid(),
      display: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{greetingContent}</p>
        </div>
      ),
    }
  }

  // Use the manager agent's generate method
  // NOTE: This is a simplified implementation. Full streamUI integration pending.
  const agent = createManagerAgent(context);

  try {
    const agentResult = await agent.generate({ prompt: userInput });

    // Extract tool results and render appropriate UI
    const toolCalls = agentResult.steps.flatMap((step: any) =>
      step.toolCalls?.map((tc: any) => ({
        toolName: tc.toolName,
        args: tc.args,
        result: step.toolResults?.find((tr: any) => tr.toolCallId === tc.toolCallId)?.result
      })) || []
    );

    // Check for specific tool calls and render UI accordingly
    const askUserCall = toolCalls.find((tc: any) => tc.toolName === 'ask_user');
    if (askUserCall) {
      return {
        id: nanoid(),
        display: <ClientQuestionCard
                  question={askUserCall.args?.question}
                  options={askUserCall.args?.options}
                  locale={context.locale as 'en' | 'ar'}
                  context={context}
                />
      };
    }

    const visionCall = toolCalls.find((tc: any) => tc.toolName === 'delegate_to_vision');
    if (visionCall && visionCall.result) {
      advanceWorkflowForContext(context, {
        stage_name: 'vision_complete',
        image_groups: visionCall.result?.groups,
      }).catch(err => console.error('Workflow error:', err));

      const groups = visionCall.result?.groups || [];
      return {
        id: nanoid(),
        display: <StatusCard
                  success={true}
                  title={context.locale === 'ar' ? 'تم التحليل' : 'Analysis Complete'}
                  message={context.locale === 'ar'
                    ? `تم العثور على ${groups.length} منتج(ات)`
                    : `Found ${groups.length} product(s)`}
                  locale={context.locale as 'en' | 'ar'}
                />
      };
    }

    const productIntelCall = toolCalls.find((tc: any) => tc.toolName === 'delegate_to_product_intel');
    if (productIntelCall && productIntelCall.result) {
      advanceWorkflowForContext(context, {
        stage_name: 'drafts_generated',
        draft_ids: productIntelCall.result?.drafts?.map((d: any) => d.draft_id),
      }).catch(err => console.error('Workflow error:', err));

      aiState.done([
        ...aiState.get(),
        {
          id: nanoid(),
          name: 'assistant',
          content: JSON.stringify(productIntelCall.result),
          data: productIntelCall.result,
        }
      ]);
      return {
        id: nanoid(),
        display: <ClientDraftGrid drafts={productIntelCall.result.drafts} context={context} />
      };
    }

    const confirmCall = toolCalls.find((tc: any) => tc.toolName === 'confirm_and_persist');
    if (confirmCall && confirmCall.result) {
      const success = confirmCall.result?.success || false;

      if (success) {
        updateOnboardingStatus('completed').catch((err) =>
          console.error('Failed to update onboarding status:', err)
        );

        advanceWorkflowForContext(context, {
          stage_name: 'persistence_complete',
          product_ids: confirmCall.result?.product_ids,
        }).catch(err => console.error('Workflow error:', err));
      }

      return {
        id: nanoid(),
        display: <StatusCard
                  success={success}
                  title={success
                    ? (context.locale === 'ar' ? 'تم الحفظ بنجاح' : 'Saved Successfully')
                    : (context.locale === 'ar' ? 'فشل الحفظ' : 'Save Failed')}
                  message={confirmCall.result?.message || ''}
                  details={confirmCall.result}
                  locale={context.locale as 'en' | 'ar'}
                />
      };
    }

    // Default response with agent text
    const responseText = agentResult.text || 'Processing...';
    return {
      id: nanoid(),
      display: <div className="text-muted-foreground italic">{responseText}</div>
    };

  } catch (error) {
    console.error('Agent error:', error);
    return {
      id: nanoid(),
      display: <StatusCard
                success={false}
                title={context.locale === 'ar' ? 'خطأ' : 'Error'}
                message={error instanceof Error ? error.message : 'Unknown error'}
                locale={context.locale as 'en' | 'ar'}
              />
    };
  } finally {
    // Check if we should create a memory snapshot
    const currentMessages = aiState.get();
    if (currentMessages.length > 0 && currentMessages.length % 10 === 0) {
      createMemorySnapshot({
        conversation_id: context.batch_id || nanoid(),
        merchant_id: context.merchant_id,
        snapshot_type: 'session_summary',
        messages: currentMessages.map((m: any) => ({
          id: m.id,
          role: m.name || 'user',
          content: m.content,
          created_at: new Date().toISOString(),
        })),
      }).catch((err) => console.error('Failed to create memory snapshot:', err));
    }
  }
}

// =============================================================================
// SERVER ACTION: Request approval (shows ConfirmationCard before persistence)
// =============================================================================
async function requestApproval(draftIds: string[], context: AgentContext) {
  const aiState = getMutableAIState<typeof AI>();
  const supabase = await createClient();

  // Fetch draft count for display
  const { count } = await supabase
    .from('product_drafts')
    .select('*', { count: 'exact', head: true })
    .in('id', draftIds)
    .eq('status', 'draft');

  const totalProducts = count || draftIds.length;

  return {
    id: nanoid(),
    display: (
      <ConfirmationCard
        action="create_products"
        description={
          context.locale === 'ar'
            ? `هل تريد إنشاء ${totalProducts} منتج(ات) في متجرك؟`
            : `Create ${totalProducts} product(s) in your store?`
        }
        draftIds={draftIds}
        totalProducts={totalProducts}
        locale={context.locale as 'en' | 'ar'}
        context={context}
      />
    ),
  };
}

// =============================================================================
// SERVER ACTION: Confirm and persist drafts
// =============================================================================
async function confirmAndPersistDrafts(draftIds: string[], context: AgentContext) {
  const supabase = await createClient();

  try {
    // 1. Fetch drafts
    const { data: drafts, error: fetchError } = await supabase
      .from('product_drafts')
      .select('*')
      .in('id', draftIds)
      .eq('status', 'draft');

    if (fetchError) throw new Error(`Failed to fetch drafts: ${fetchError.message}`);

    if (!drafts || drafts.length === 0) {
      return {
        success: false,
        error: 'No drafts found or all drafts already persisted',
      };
    }

    // 2. Transform drafts to store_products format
    const products = drafts.map((draft) => ({
      store_id: draft.store_id,
      name: draft.name,
      name_ar: draft.name_ar,
      description: draft.description,
      description_ar: draft.description_ar,
      category: draft.category,
      category_ar: draft.category_ar,
      tags: draft.tags || [],
      price: draft.suggested_price,
      image_url: draft.primary_image_url,
      images: draft.image_urls || [],
      status: 'draft' as const,
      ai_generated: true,
      ai_confidence: draft.ai_confidence || 'medium',
      inventory: 0,
      slug: `${draft.name?.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    }));

    // 3. Insert into store_products
    const { data: insertedProducts, error: insertError } = await supabase
      .from('store_products')
      .insert(products)
      .select('id');

    if (insertError) throw new Error(`Failed to insert products: ${insertError.message}`);

    // 4. Update draft status to 'persisted'
    await supabase
      .from('product_drafts')
      .update({ status: 'persisted' })
      .in('id', draftIds);

    // 5. Update onboarding status to completed
    await updateOnboardingStatus('completed');

    // 6. Advance workflow state
    advanceWorkflowForContext(context, {
      stage_name: 'persistence_complete',
      product_ids: insertedProducts?.map((p) => p.id),
    });

    // 7. Audit trail
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('ai_tasks').insert({
        merchant_id: user.id,
        agent: 'manager',
        task_type: 'confirm_and_persist',
        status: 'completed',
        input: { draft_ids: draftIds },
        output: { product_ids: insertedProducts?.map((p) => p.id) || [] },
        metadata: { draft_count: drafts.length, product_count: insertedProducts?.length || 0 },
      });
    }

    return {
      success: true,
      product_ids: insertedProducts?.map((p) => p.id) || [],
      count: insertedProducts?.length || 0,
      message: `Successfully added ${insertedProducts?.length || 0} products to your store`,
    };
  } catch (error: any) {
    console.error('confirmAndPersistDrafts error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
}

// =============================================================================
// SERVER ACTION: Update a single draft
// =============================================================================
async function updateDraftAction(draftId: string, updates: Record<string, any>) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('product_drafts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', draftId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update draft: ${error.message}`);

    return { success: true, draft: data, updated_fields: Object.keys(updates) };
  } catch (error: any) {
    console.error('updateDraftAction error:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}

// =============================================================================
// SERVER ACTION: Discard drafts
// =============================================================================
async function discardDraftsAction(draftIds: string[]) {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('product_drafts')
      .update({ status: 'discarded' })
      .in('id', draftIds);

    if (error) throw new Error(`Failed to discard drafts: ${error.message}`);

    // Audit trail
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('ai_tasks').insert({
        merchant_id: user.id,
        agent: 'manager',
        task_type: 'discard_drafts',
        status: 'completed',
        input: { draft_ids: draftIds },
        output: { discarded_count: draftIds.length },
      });
    }

    return {
      success: true,
      discarded_count: draftIds.length,
      message: `Discarded ${draftIds.length} draft${draftIds.length === 1 ? '' : 's'}`,
    };
  } catch (error: any) {
    console.error('discardDraftsAction error:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}

// =============================================================================
// HELPER: Advance workflow state for current context
// =============================================================================
async function advanceWorkflowForContext(
  context: AgentContext,
  stageData: Record<string, any>
) {
  try {
    // Try to find existing workflow
    const conversationId = context.batch_id || `onboarding-${context.merchant_id}`;
    let workflow = await getWorkflowState(conversationId);

    if (!workflow) {
      // Create workflow if it doesn't exist
      workflow = await createWorkflowState({
        conversation_id: conversationId,
        merchant_id: context.merchant_id,
        workflow_type: 'onboarding',
        total_stages: WORKFLOW_STAGES.onboarding.total,
        initial_data: stageData,
      });
      return;
    }

    await advanceWorkflowStage(workflow.id, stageData);
  } catch (err) {
    console.error('Failed to advance workflow:', err);
  }
}

// Export server actions individually
export {
  submitUserMessage,
  requestApproval,
  confirmAndPersistDrafts,
  updateDraftAction,
  discardDraftsAction,
};

// Export the AI provider
export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage,
    requestApproval,
    confirmAndPersistDrafts,
    updateDraftAction,
    discardDraftsAction,
  },
  initialUIState: [],
  initialAIState: [],
});
