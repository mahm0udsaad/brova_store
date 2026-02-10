import type { ReactNode, CSSProperties } from "react"
import type { ComponentNode, ComponentRegistry, ThemeSettings } from "@/types/theme"
import type { Locale } from "@/i18n"

interface ThemeRendererProps {
  nodes: ComponentNode[]
  registry: ComponentRegistry
  locale: Locale
  settings: ThemeSettings
  preview?: boolean
}

function applyThemeSettings(settings: ThemeSettings): CSSProperties {
  return {
    "--theme-primary": settings.palette.primary,
    "--theme-secondary": settings.palette.secondary,
    "--theme-accent": settings.palette.accent,
    "--theme-background": settings.palette.background,
    "--theme-foreground": settings.palette.foreground,
    "--theme-muted": settings.palette.muted,
    "--theme-border": settings.palette.border,
    "--theme-radius": settings.radius,
    "--theme-font-body": settings.typography.fontBody,
    "--theme-font-heading": settings.typography.fontHeading,
  } as CSSProperties
}

function renderNodes(params: {
  nodes: ComponentNode[]
  registry: ComponentRegistry
  locale: Locale
  settings: ThemeSettings
  preview?: boolean
}): ReactNode[] {
  const { nodes, registry, locale, settings, preview } = params

  return nodes
    .filter((node) => node.visible)
    .sort((a, b) => a.order - b.order)
    .map((node) => {
      const Component = registry[node.type]
      if (!Component) return null

      const children = node.children?.length
        ? renderNodes({
            nodes: node.children,
            registry,
            locale,
            settings,
            preview,
          })
        : undefined

      return (
        <Component
          key={node.id}
          config={node.config}
          locale={locale}
          theme={settings}
          preview={preview}
        >
          {children}
        </Component>
      )
    })
}

export function ThemeRenderer({
  nodes,
  registry,
  locale,
  settings,
  preview,
}: ThemeRendererProps) {
  return (
    <div
      className="min-h-screen bg-[var(--theme-background)] text-[var(--theme-foreground)]"
      style={applyThemeSettings(settings)}
    >
      {renderNodes({ nodes, registry, locale, settings, preview })}
    </div>
  )
}
