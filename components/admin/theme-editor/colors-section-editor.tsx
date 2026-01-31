"use client"

import { useState, useCallback, memo } from "react"
import { useTranslations } from "next-intl"
import { Sparkles, Loader2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ColorConfig {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
}

interface ColorPalette {
  name: string
  colors: ColorConfig
}

interface ColorsSectionEditorProps {
  colors: ColorConfig
  onChange: (colors: ColorConfig) => void
  logoUrl?: string | null
}

export function ColorsSectionEditor({ colors, onChange, logoUrl }: ColorsSectionEditorProps) {
  const t = useTranslations("admin.themeEditor.colors")
  const [isExtracting, setIsExtracting] = useState(false)
  const [suggestedPalettes, setSuggestedPalettes] = useState<ColorPalette[]>([])

  const handleExtractColors = async () => {
    if (!logoUrl) return

    setIsExtracting(true)
    try {
      // TODO: Call AI service to extract colors from logo
      // For now, generate mock suggested palettes
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setSuggestedPalettes([
        {
          name: "Vibrant",
          colors: {
            primary: "#FF6B6B",
            secondary: "#4ECDC4",
            accent: "#FFE66D",
            background: "#FFFFFF",
            text: "#2C3E50",
          },
        },
        {
          name: "Professional",
          colors: {
            primary: "#2C3E50",
            secondary: "#3498DB",
            accent: "#E74C3C",
            background: "#ECF0F1",
            text: "#34495E",
          },
        },
        {
          name: "Elegant",
          colors: {
            primary: "#34495E",
            secondary: "#95A5A6",
            accent: "#E67E22",
            background: "#FAFAFA",
            text: "#2C3E50",
          },
        },
      ])
    } catch (error) {
      console.error("Failed to extract colors:", error)
    } finally {
      setIsExtracting(false)
    }
  }

  const handleApplyPalette = (palette: ColorPalette) => {
    onChange(palette.colors)
  }

  return (
    <div className="space-y-6">
      {/* Color Pickers */}
      <div className="grid grid-cols-2 gap-4">
        <ColorPicker
          label={t("primary")}
          value={colors.primary}
          onChange={(value) => onChange({ ...colors, primary: value })}
        />
        <ColorPicker
          label={t("secondary")}
          value={colors.secondary}
          onChange={(value) => onChange({ ...colors, secondary: value })}
        />
        <ColorPicker
          label={t("accent")}
          value={colors.accent}
          onChange={(value) => onChange({ ...colors, accent: value })}
        />
        <ColorPicker
          label={t("background")}
          value={colors.background}
          onChange={(value) => onChange({ ...colors, background: value })}
        />
        <ColorPicker
          label={t("text")}
          value={colors.text}
          onChange={(value) => onChange({ ...colors, text: value })}
        />
      </div>

      {/* Extract from Logo */}
      {logoUrl && (
        <div>
          <Button
            variant="outline"
            onClick={handleExtractColors}
            disabled={isExtracting}
            className="gap-2"
          >
            {isExtracting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Extracting...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Extract Colors from Logo
              </>
            )}
          </Button>
        </div>
      )}

      {/* Suggested Palettes */}
      {suggestedPalettes.length > 0 && (
        <div className="space-y-3">
          <Label className="text-lg font-semibold">{t("suggestedPalettes")}</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {suggestedPalettes.map((palette) => (
              <Card key={palette.name} className="p-4 hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <p className="font-medium text-sm">{palette.name}</p>
                  <div className="grid grid-cols-5 gap-2">
                    <ColorSwatch color={palette.colors.primary} label="P" />
                    <ColorSwatch color={palette.colors.secondary} label="S" />
                    <ColorSwatch color={palette.colors.accent} label="A" />
                    <ColorSwatch color={palette.colors.background} label="B" />
                    <ColorSwatch color={palette.colors.text} label="T" />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleApplyPalette(palette)}
                  >
                    {t("applyPalette")}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const ColorPicker = memo(function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-14 rounded border cursor-pointer"
          />
        </div>
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 font-mono"
          spellCheck={false}
        />
      </div>
    </div>
  )
})

const ColorSwatch = memo(function ColorSwatch({ color, label }: { color: string; label: string }) {
  const isLight = isLightColor(color)

  return (
    <div
      className="aspect-square rounded flex items-center justify-center text-xs font-medium border"
      style={{ backgroundColor: color, color: isLight ? "#000" : "#fff" }}
    >
      {label}
    </div>
  )
})

function isLightColor(color: string): boolean {
  const hex = color.replace("#", "")
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 155
}
