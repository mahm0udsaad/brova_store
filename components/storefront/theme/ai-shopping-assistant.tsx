import { getTranslations } from "next-intl/server"
import type { ThemeComponentProps } from "@/types/theme"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { MessageCircle, Send, Sparkles } from "lucide-react"

interface AIShoppingAssistantConfig {
  position?: "bottom-right" | "bottom-left"
  welcomeMessageKey?: string
  placeholderKey?: string
  showSuggestions?: boolean
  suggestions?: Array<{ labelKey: string }>
}

const defaultSuggestions: Array<{ labelKey: string }> = [
  { labelKey: "assistant.suggestionNewArrivals" },
  { labelKey: "assistant.suggestionDeals" },
  { labelKey: "assistant.suggestionHelp" },
]

export async function AIShoppingAssistant({
  config,
  locale,
}: ThemeComponentProps<AIShoppingAssistantConfig>) {
  const t = await getTranslations({ locale, namespace: "storefront" })
  const {
    position = "bottom-right",
    welcomeMessageKey = "assistant.welcome",
    placeholderKey = "assistant.placeholder",
    showSuggestions = true,
    suggestions = defaultSuggestions,
  } = config

  const isEnd = position === "bottom-right"

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {/* ---------- Chat panel (expanded-state preview) ---------- */}
      <div
        className={cn(
          "pointer-events-auto absolute bottom-20 flex w-[360px] flex-col overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-background)] shadow-xl",
          isEnd ? "end-4" : "start-4"
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-[var(--theme-border)] bg-[var(--theme-primary)] px-4 py-3 text-white">
          <Sparkles className="h-5 w-5 shrink-0" />
          <span className="text-sm font-semibold font-[var(--theme-font-heading)]">
            {t("assistant.title")}
          </span>
        </div>

        {/* Messages area */}
        <div className="flex flex-1 flex-col gap-3 p-4">
          {/* Welcome message bubble (assistant) */}
          <div className="flex items-start gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--theme-primary)]/10 text-[var(--theme-primary)]">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div className="max-w-[80%] rounded-2xl rounded-ss-sm bg-[var(--theme-primary)]/5 px-3.5 py-2.5 text-sm text-[var(--theme-foreground)]">
              {t(welcomeMessageKey)}
            </div>
          </div>

          {/* Suggestion chips */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 ps-9">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.labelKey}
                  type="button"
                  className="rounded-full border border-[var(--theme-border)] bg-transparent px-3 py-1.5 text-xs text-[var(--theme-foreground)] transition-colors hover:bg-[var(--theme-primary)]/5"
                >
                  {t(suggestion.labelKey)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-[var(--theme-border)] p-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder={t(placeholderKey)}
              className="h-10 flex-1 rounded-full border border-[var(--theme-border)] bg-transparent px-4 text-sm text-[var(--theme-foreground)] placeholder:text-[var(--theme-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-primary)]"
              readOnly
            />
            <Button
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full bg-[var(--theme-primary)] text-white hover:bg-[var(--theme-primary)]/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ---------- Floating chat button ---------- */}
      <Button
        size="icon"
        className={cn(
          "pointer-events-auto absolute bottom-4 h-14 w-14 rounded-full bg-[var(--theme-primary)] text-white shadow-lg hover:bg-[var(--theme-primary)]/90",
          isEnd ? "end-4" : "start-4"
        )}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </div>
  )
}
