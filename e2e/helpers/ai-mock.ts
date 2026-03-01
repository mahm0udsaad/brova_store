/**
 * AI Stream Mock
 *
 * Produces a valid AI SDK v6 UI Message Stream (SSE) response that
 * makes the ConciergeConversation component reach `isSetupComplete = true`.
 *
 * The key trigger in the component:
 *   messages.some(msg => msg.parts.some(p =>
 *     p.type === "tool-complete_setup" && p.state === "output-available"
 *   ))
 *
 * Wire format: Server-Sent Events (SSE)
 *   data: {"type":"text-start","id":"..."}
 *   data: {"type":"text-delta","id":"...","delta":"..."}
 *   data: {"type":"text-end","id":"..."}
 *   data: {"type":"tool-input-available","toolCallId":"...","toolName":"...","input":{...}}
 *   data: {"type":"tool-output-available","toolCallId":"...","output":{...}}
 *   data: {"type":"finish","finishReason":"stop"}
 *   data: [DONE]
 */

import type { Route } from '@playwright/test'

/** Helper: wrap a JSON chunk as an SSE `data:` event */
function sse(obj: unknown): string {
  return `data: ${JSON.stringify(obj)}\n\n`
}

/**
 * Fulfills an intercepted /api/onboarding/chat route with a mock
 * SSE stream that immediately calls `complete_setup`, ending onboarding.
 *
 * @param storeName  Optional store name surfaced in the AI message text.
 */
export async function fulfillWithCompletedSetup(
  route: Route,
  storeName = 'My Test Store'
) {
  const textId = 'txt_e2e_1'

  const body = [
    // 1. Start the assistant message
    sse({ type: 'start', messageId: `mock-e2e-${Date.now()}` }),

    // 2. Text part lifecycle
    sse({ type: 'text-start', id: textId }),
    sse({
      type: 'text-delta',
      id: textId,
      delta: `Your store "${storeName}" is all set! Here is what I prepared for you.`,
    }),
    sse({ type: 'text-end', id: textId }),

    // 3. Tool call — complete_setup with input available
    sse({
      type: 'tool-input-available',
      toolCallId: 'tc_e2e_1',
      toolName: 'complete_setup',
      input: { summary: `Store ${storeName} configured successfully` },
    }),

    // 4. Tool output — triggers state "output-available" on the part
    sse({
      type: 'tool-output-available',
      toolCallId: 'tc_e2e_1',
      output: { success: true, summary: 'Store configured', type: 'complete' },
    }),

    // 5. Step + stream finish
    sse({ type: 'finish-step' }),
    sse({
      type: 'finish',
      finishReason: 'stop',
    }),

    // 6. SSE end sentinel
    'data: [DONE]\n\n',
  ].join('')

  await route.fulfill({
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'x-vercel-ai-ui-message-stream': 'v1',
    },
    body,
  })
}
