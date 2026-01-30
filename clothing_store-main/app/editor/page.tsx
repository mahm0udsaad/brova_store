"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Transformer } from "react-konva"
import useImage from "use-image"
import { motion, AnimatePresence } from "framer-motion"
import { useSearchParams, useRouter } from "next/navigation"
import { TryOnSheetContent } from "@/components/try-on-sheet-content"
import { useModalStack } from "@/components/modal-stack/modal-stack-context"
import { useCart } from "@/hooks/use-cart"
import { 
  MousePointer2, 
  Sticker as StickerIcon, 
  ImageIcon, 
  Type, 
  Sparkles,
  Trash2,
  X,
  Download,
  Search,
  Upload,
  GripHorizontal,
  Move,
  Layers,
  Settings2,
  Minimize2,
  Maximize2,
  RotateCw,
  Loader2,
  Plus,
  ArrowRight,
  Shirt,
  Camera,
  ShoppingBag,
  Check
} from "lucide-react"
import { Header } from "@/components/header"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

// Types
interface EditorElement {
  id: string
  type: "text" | "sticker" | "image"
  content: string // text content, emoji, or image URL
  x: number
  y: number
  width?: number
  height?: number
  rotation: number
  scaleX: number
  scaleY: number
  // Text specific
  fontSize?: number
  fontFamily?: string
  fontStyle?: string
  fill?: string
  stroke?: string
  strokeWidth?: number
  align?: string
  shadowColor?: string
  shadowBlur?: number
  shadowOpacity?: number
  shadowOffsetX?: number
  shadowOffsetY?: number
  // Image specific
  opacity?: number
  cornerRadius?: number
  strokeEnabled?: boolean
  filters?: any[]
}

interface SideState {
  elements: EditorElement[]
  bakedBaseImage: string | null
}

const TOOLS = [
  { id: "select", icon: MousePointer2, label: "Select" },
  { id: "text", icon: Type, label: "Text" },
  { id: "image", icon: ImageIcon, label: "Image" },
  { id: "stickers", icon: StickerIcon, label: "Stickers" },
]

const FONTS = [
  { value: "Inter", label: "Inter" },
  { value: "Arial", label: "Arial" },
  { value: "Helvetica", label: "Helvetica" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Courier New", label: "Courier" },
  { value: "Impact", label: "Impact" },
]

const COLORS = [
  "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF", 
  "#FFFF00", "#00FFFF", "#FF00FF", "#FFA500", "#800080",
  "#FFC0CB", "#A52A2A", "#808080", "#FFD700", "#4B0082"
]

// Available hoodie colors
const HOODIE_COLORS = [
  { id: "black", name: "Black", front: "/2d/black.png", back: "/2d/black-back.png", preview: "/2d/black.png" },
  { id: "white", name: "White", front: "/2d/white.png", back: "/2d/white-back.png", preview: "/2d/white.png" },
  { id: "dark-blue", name: "Dark Blue", front: "/2d/dark-blue.png", back: "/2d/dark-blue-back.png", preview: "/2d/dark-blue.png" },
  { id: "sky", name: "Sky", front: "/2d/sky.png", back: "/2d/sky-back.png", preview: "/2d/sky.png" },
]

// Sticker library
const STICKERS_DATA = [
  { id: "fire", emoji: "🔥", tags: ["hot", "flame"] },
  { id: "heart", emoji: "💖", tags: ["love"] },
  { id: "party", emoji: "🎉", tags: ["celebrate"] },
  { id: "eyes", emoji: "👀", tags: ["watching"] },
  { id: "sparkles", emoji: "✨", tags: ["magic"] },
  { id: "rocket", emoji: "🚀", tags: ["space"] },
  { id: "skull", emoji: "💀", tags: ["edgy"] },
  { id: "rainbow", emoji: "🌈", tags: ["colorful"] },
  { id: "cap", emoji: "🧢", tags: ["streetwear"] },
  { id: "sneaker", emoji: "👟", tags: ["shoes"] },
  { id: "tshirt", emoji: "👕", tags: ["fashion"] },
  { id: "sunglasses", emoji: "🕶️", tags: ["cool"] },
  { id: "lightning", emoji: "⚡", tags: ["power"] },
  { id: "crown", emoji: "👑", tags: ["royalty"] },
  { id: "star", emoji: "⭐", tags: ["favorite"] },
  { id: "diamond", emoji: "💎", tags: ["luxury"] },
]

// Canvas dimensions (fixed for consistent export)
const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 800

// Hoodie image component
function HoodieImage({ src }: { src: string }) {
  const [image] = useImage(src)
  
  if (!image) return null
  
  // Calculate dimensions to maintain aspect ratio
  const imageAspectRatio = image.width / image.height
  const canvasAspectRatio = CANVAS_WIDTH / CANVAS_HEIGHT
  
  let width = CANVAS_WIDTH
  let height = CANVAS_HEIGHT
  
  // Fit image within canvas while maintaining aspect ratio
  if (imageAspectRatio > canvasAspectRatio) {
    // Image is wider - fit to width
    height = CANVAS_WIDTH / imageAspectRatio
  } else {
    // Image is taller - fit to height
    width = CANVAS_HEIGHT * imageAspectRatio
  }
  
  // Center the image
  const x = (CANVAS_WIDTH - width) / 2
  const y = (CANVAS_HEIGHT - height) / 2
  
  return (
    <KonvaImage 
      image={image} 
      x={x}
      y={y}
      width={width} 
      height={height} 
    />
  )
}

// Color preview card component
function ColorPreviewCard({ 
  color, 
  isSelected, 
  onSelect 
}: { 
  color: typeof HOODIE_COLORS[0]
  isSelected: boolean
  onSelect: () => void
}) {
  const [imageLoaded, setImageLoaded] = useState(false)
  
  return (
    <motion.button
      onClick={onSelect}
      className={cn(
        "group relative aspect-[3/4] rounded-3xl overflow-hidden transition-all duration-300",
        "bg-white border border-neutral-200 hover:border-neutral-300",
        "shadow-sm hover:shadow-lg",
        isSelected && "ring-2 ring-blue-600 ring-offset-4 ring-offset-white"
      )}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white to-neutral-50 z-0" />
      
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-500 rounded-full animate-spin" />
        </div>
      )}
      
      <img
        src={color.preview}
        alt={color.name}
        className={cn(
          "w-full h-full object-contain relative z-10 p-4 transition-transform duration-500 group-hover:scale-110",
          !imageLoaded && "opacity-0"
        )}
        onLoad={() => setImageLoaded(true)}
      />
      
      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-5 z-20 bg-gradient-to-t from-white via-white/90 to-transparent">
        <div className="space-y-1">
          <p className="text-neutral-900 font-black text-base tracking-tight uppercase">
            {color.name}
          </p>
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              color.id === 'black' ? "bg-black border border-white/20" : 
              color.id === 'white' ? "bg-white" :
              color.id === 'dark-blue' ? "bg-blue-900" : "bg-sky-300"
            )} />
            <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest">
              Available
            </p>
          </div>
        </div>
      </div>

      {/* Select button visible on hover */}
      <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
        <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center shadow-xl">
          <ArrowRight className="w-5 h-5" />
        </div>
      </div>

      {/* Selection indicator overlay */}
      {isSelected && (
        <div className="absolute inset-0 bg-blue-500/10 z-10 pointer-events-none" />
      )}
    </motion.button>
  )
}

// Element renderer
function ElementRenderer({
  element,
  isSelected,
  onSelect,
  onChange,
}: {
  element: EditorElement
  isSelected: boolean
  onSelect: () => void
  onChange: (newAttrs: Partial<EditorElement>) => void
}) {
  const shapeRef = useRef<any>(null)
  const trRef = useRef<any>(null)

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current])
      trRef.current.getLayer()?.batchDraw()
    }
  }, [isSelected])

  if (element.type === "text") {
    return (
      <>
        <KonvaText
          ref={shapeRef}
          text={element.content}
          x={element.x}
          y={element.y}
          fontSize={element.fontSize || 48}
          fontFamily={element.fontFamily || "Inter"}
          fontStyle={element.fontStyle || "normal"}
          fill={element.fill || "#000000"}
          stroke={element.stroke}
          strokeWidth={element.strokeWidth}
          align={element.align || "left"}
          rotation={element.rotation}
          scaleX={element.scaleX}
          scaleY={element.scaleY}
          shadowColor={element.shadowColor}
          shadowBlur={element.shadowBlur}
          shadowOpacity={element.shadowOpacity}
          shadowOffsetX={element.shadowOffsetX}
          shadowOffsetY={element.shadowOffsetY}
          draggable
          onClick={onSelect}
          onTap={onSelect}
          onDragEnd={(e) => {
            onChange({ x: e.target.x(), y: e.target.y() })
          }}
          onTransformEnd={() => {
            const node = shapeRef.current
            const scaleX = node.scaleX()
            const scaleY = node.scaleY()
            onChange({
              x: node.x(),
              y: node.y(),
              rotation: node.rotation(),
              scaleX,
              scaleY,
            })
          }}
        />
        {isSelected && (
          <Transformer
            ref={trRef}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox
              }
              return newBox
            }}
          />
        )}
      </>
    )
  }

  if (element.type === "sticker") {
    return (
      <>
        <KonvaText
          ref={shapeRef}
          text={element.content}
          x={element.x}
          y={element.y}
          fontSize={120}
          stroke={element.stroke}
          strokeWidth={element.strokeWidth}
          rotation={element.rotation}
          scaleX={element.scaleX}
          scaleY={element.scaleY}
          shadowColor={element.shadowColor}
          shadowBlur={element.shadowBlur}
          shadowOpacity={element.shadowOpacity}
          shadowOffsetX={element.shadowOffsetX}
          shadowOffsetY={element.shadowOffsetY}
          draggable
          onClick={onSelect}
          onTap={onSelect}
          onDragEnd={(e) => {
            onChange({ x: e.target.x(), y: e.target.y() })
          }}
          onTransformEnd={() => {
            const node = shapeRef.current
            onChange({
              x: node.x(),
              y: node.y(),
              rotation: node.rotation(),
              scaleX: node.scaleX(),
              scaleY: node.scaleY(),
            })
          }}
        />
        {isSelected && (
          <Transformer
            ref={trRef}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox
              }
              return newBox
            }}
          />
        )}
      </>
    )
  }

  // Image type
  const ImageElement = () => {
    const [img] = useImage(element.content)
    return img ? (
      <>
        <KonvaImage
          ref={shapeRef}
          image={img}
          x={element.x}
          y={element.y}
          width={element.width || 200}
          height={element.height || 200}
          rotation={element.rotation}
          scaleX={element.scaleX}
          scaleY={element.scaleY}
          opacity={element.opacity || 1}
          cornerRadius={element.cornerRadius || 0}
          strokeEnabled={element.strokeEnabled ?? true}
          stroke={element.stroke}
          strokeWidth={element.strokeWidth}
          shadowColor={element.shadowColor}
          shadowBlur={element.shadowBlur}
          shadowOpacity={element.shadowOpacity}
          shadowOffsetX={element.shadowOffsetX}
          shadowOffsetY={element.shadowOffsetY}
          draggable
          onClick={onSelect}
          onTap={onSelect}
          onDragEnd={(e) => {
            onChange({ x: e.target.x(), y: e.target.y() })
          }}
          onTransformEnd={() => {
            const node = shapeRef.current
            onChange({
              x: node.x(),
              y: node.y(),
              rotation: node.rotation(),
              scaleX: node.scaleX(),
              scaleY: node.scaleY(),
            })
          }}
        />
        {isSelected && (
          <Transformer
            ref={trRef}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox
              }
              return newBox
            }}
          />
        )}
      </>
    ) : null
  }

  return <ImageElement />
}

// Draggable Panel Component
function DraggablePanel({ 
  title, 
  onClose, 
  children,
  initialPosition = { x: 0, y: 0 },
  className
}: { 
  title: string
  onClose?: () => void
  children: ReactNode
  initialPosition?: { x: number, y: number }
  className?: string
}) {
  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.95, ...initialPosition }}
      animate={{ opacity: 1, scale: 1, ...initialPosition }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "absolute z-50 bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col",
        className
      )}
    >
      <div className="flex items-center justify-between p-3 border-b border-white/10 cursor-grab active:cursor-grabbing bg-white/5 select-none">
         <div className="flex items-center gap-2 text-white/80">
            <GripHorizontal className="w-4 h-4" />
            <span className="font-semibold text-xs uppercase tracking-wider">{title}</span>
         </div>
         {onClose && (
           <button 
             onClick={onClose} 
             className="p-1 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors"
           >
             <X className="w-4 h-4" />
           </button>
         )}
      </div>
      <div className="p-4 custom-scrollbar overflow-y-auto">
        {children}
      </div>
    </motion.div>
  )
}

function EditorPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const selectedColorParam = searchParams.get("color")
  const [selectedColorId, setSelectedColorId] = useState<string | null>(selectedColorParam)
  const selectedColor = HOODIE_COLORS.find(c => c.id === selectedColorId) || null
  
  const [currentSide, setCurrentSide] = useState<"front" | "back">("front")
  const [activeTool, setActiveTool] = useState("select")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { present } = useModalStack()
  
  // State per side
  const [frontState, setFrontState] = useState<SideState>({
    elements: [],
    bakedBaseImage: null,
  })
  const [backState, setBackState] = useState<SideState>({
    elements: [],
    bakedBaseImage: null,
  })

  // UI states
  const [showTextPanel, setShowTextPanel] = useState(false)
  const [showStickerPanel, setShowStickerPanel] = useState(false)
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [stickerSearch, setStickerSearch] = useState("")
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false)
  const [showHoodiePanel, setShowHoodiePanel] = useState(false)
  const [showLayersPanel, setShowLayersPanel] = useState(false)
  const [newTextValue, setNewTextValue] = useState("")
  const [textEditValue, setTextEditValue] = useState("")
  
  // AI state
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiReferenceImage, setAiReferenceImage] = useState<File | null>(null)

  // Transition state
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Order state
  const { addToCart } = useCart()
  const [showOrderPanel, setShowOrderPanel] = useState(false)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [bakedImages, setBakedImages] = useState<{front: string | null, back: string | null}>({ front: null, back: null })

  // Refs
  const stageRef = useRef<any>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const aiReferenceInputRef = useRef<HTMLInputElement>(null)
  const textEditInputRef = useRef<HTMLInputElement>(null)

  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Track window/container size for responsive canvas
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
         const { offsetWidth, offsetHeight } = containerRef.current
         setWindowSize({ width: offsetWidth, height: offsetHeight })
      }
    }
    
    handleResize() // Initial
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Calculate stage scale to fit container
  const scale = Math.min(
    (windowSize.width * 0.95) / CANVAS_WIDTH,
    (windowSize.height * 0.8) / CANVAS_HEIGHT
  ) || 1

  const getCurrentState = () => currentSide === "front" ? frontState : backState
  const setCurrentState = (state: SideState) => {
    if (currentSide === "front") {
      setFrontState(state)
    } else {
      setBackState(state)
    }
  }

  const baseHoodieImage = currentSide === "front" 
    ? (frontState.bakedBaseImage || selectedColor?.front || "/2d/black.png")
    : (backState.bakedBaseImage || selectedColor?.back || "/2d/black-back.png")

  // Add element
  const addElement = (element: Omit<EditorElement, "id">) => {
    const newElement: EditorElement = {
      ...element,
      id: Math.random().toString(36).substr(2, 9),
    }
    const state = getCurrentState()
    setCurrentState({
      ...state,
      elements: [...state.elements, newElement],
    })
    setSelectedId(newElement.id)
    setShowPropertiesPanel(true)
  }

  // Update element
  const updateElement = (id: string, updates: Partial<EditorElement>) => {
    const state = getCurrentState()
    setCurrentState({
      ...state,
      elements: state.elements.map(el => el.id === id ? { ...el, ...updates } : el),
    })
  }

  const duplicateElement = (id: string) => {
    const state = getCurrentState()
    const target = state.elements.find(el => el.id === id)
    if (!target) return
    const copy: EditorElement = {
      ...target,
      id: Math.random().toString(36).substr(2, 9),
      x: target.x + 24,
      y: target.y + 24,
    }
    setCurrentState({ ...state, elements: [...state.elements, copy] })
    setSelectedId(copy.id)
    setShowPropertiesPanel(true)
  }

  const moveLayer = (id: string, direction: "up" | "down" | "top" | "bottom") => {
    const state = getCurrentState()
    const idx = state.elements.findIndex(el => el.id === id)
    if (idx === -1) return
    const next = [...state.elements]

    const swap = (a: number, b: number) => {
      const tmp = next[a]
      next[a] = next[b]
      next[b] = tmp
    }

    if (direction === "up" && idx < next.length - 1) swap(idx, idx + 1)
    if (direction === "down" && idx > 0) swap(idx, idx - 1)
    if (direction === "top" && idx !== next.length - 1) {
      const [item] = next.splice(idx, 1)
      next.push(item)
    }
    if (direction === "bottom" && idx !== 0) {
      const [item] = next.splice(idx, 1)
      next.unshift(item)
    }

    setCurrentState({ ...state, elements: next })
  }

  // Delete element
  const deleteElement = (id: string) => {
    const state = getCurrentState()
    setCurrentState({
      ...state,
      elements: state.elements.filter(el => el.id !== id),
    })
    setSelectedId(null)
  }

  // Get selected element
  const selectedElement = getCurrentState().elements.find(el => el.id === selectedId)

  // Keep text editor input in sync + focused when selecting a text element
  useEffect(() => {
    if (selectedElement?.type === "text") {
      setTextEditValue(selectedElement.content)
      // Focus on next tick so the panel/input exists
      setTimeout(() => textEditInputRef.current?.focus(), 0)
    }
  }, [selectedId, selectedElement?.type])

  // Tool handlers
  const handleToolClick = (toolId: string) => {
    setActiveTool(toolId)
    // Don't close other panels automatically to allow multi-tasking, 
    // or close them if that's preferred. For "Figma-lite", keeping them open might be cool, 
    // but on mobile we might want to close. Let's close for clarity.
    if (toolId !== "select") {
       setShowTextPanel(false)
       setShowStickerPanel(false)
    }

    if (toolId === "text") {
      setShowTextPanel(true)
    } else if (toolId === "stickers") {
      setShowStickerPanel(true)
    } else if (toolId === "image") {
      imageInputRef.current?.click()
    }
  }

  // Add text
  const handleAddText = (text: string) => {
    if (!text.trim()) return
    addElement({
      type: "text",
      content: text,
      x: CANVAS_WIDTH / 2 - 100,
      y: CANVAS_HEIGHT / 2,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      fontSize: 48,
      fontFamily: "Inter",
      fontStyle: "bold",
      fill: "#000000",
      align: "center",
    })
    // setShowTextPanel(false) // Keep it open for multiple adds? Or close? User said "close it again while keep selecting".
  }

  // Add image
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          addElement({
            type: "image",
            content: event.target.result as string,
            x: CANVAS_WIDTH / 2 - 100,
            y: CANVAS_HEIGHT / 2 - 100,
            width: 200,
            height: 200,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
          })
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Add sticker
  const handleAddSticker = (emoji: string) => {
    addElement({
      type: "sticker",
      content: emoji,
      x: CANVAS_WIDTH / 2 - 60,
      y: CANVAS_HEIGHT / 2 - 60,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    })
    // setShowStickerPanel(false)
  }

  // Export
  const handleExport = () => {
    const stage = stageRef.current
    if (!stage) return

    const dataURL = stage.toDataURL({ pixelRatio: 2 })
    const link = document.createElement("a")
    link.download = `hoodie-${currentSide}-${Date.now()}.png`
    link.href = dataURL
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Exported ${currentSide} design!`)
  }

  // AI Magic
  const handleAIMagic = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please enter a prompt")
      return
    }

    setAiGenerating(true)
    setShowAIPanel(false)

    try {
      // Capture current canvas
      const stage = stageRef.current
      if (!stage) throw new Error("Canvas not available")

      const dataURL = stage.toDataURL({ pixelRatio: 2 })
      
      // Convert dataURL to blob
      const blob = await (await fetch(dataURL)).blob()
      const file = new File([blob], `hoodie-${currentSide}.png`, { type: "image/png" })

      // Prepare form data
      const formData = new FormData()
      formData.append("hoodieImage", file)
      formData.append("prompt", aiPrompt.trim())
      formData.append("side", currentSide)
      
      if (aiReferenceImage) {
        formData.append("referenceImage", aiReferenceImage)
      }

      // Call AI API
      const response = await fetch("/api/ai-designer", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "AI generation failed")
      }

      const data = await response.json()

      // Update baked base image for current side and remove all elements
      const state = getCurrentState()
      setCurrentState({
        ...state,
        bakedBaseImage: data.resultImage,
        elements: [] // Clear elements so only AI image exists
      })
      
      // Also clear selection
      setSelectedId(null)
      setShowPropertiesPanel(false)

      toast.success("AI design applied!")
      setAiPrompt("")
      setAiReferenceImage(null)
    } catch (error: any) {
      console.error("AI generation error:", error)
      toast.error(error.message || "Failed to generate design")
    } finally {
      setAiGenerating(false)
    }
  }

  // Handle Order Review
  const handleReviewOrder = async () => {
    const stage = stageRef.current
    if (!stage) return

    setIsTransitioning(true)
    
    // Deselect
    setSelectedId(null)
    await new Promise(resolve => setTimeout(resolve, 100))

    try {
      // Capture current side
      const currentDataURL = stage.toDataURL({ pixelRatio: 2 })
      
      // We need both sides. 
      // Ideally we should bake both sides. For now, let's assume we capture what we have.
      // If the user hasn't visited the other side, it might be empty/default.
      // A robust solution would render both stages off-screen, but that's complex.
      // Let's just capture the current side and use the baked/default for the other.
      
      const frontImg = currentSide === 'front' ? currentDataURL : (frontState.bakedBaseImage || selectedColor?.preview || "/2d/black.png")
      const backImg = currentSide === 'back' ? currentDataURL : (backState.bakedBaseImage || selectedColor?.back || "/2d/black-back.png")
      
      setBakedImages({ front: frontImg, back: backImg })
      setShowOrderPanel(true)
    } catch (e) {
      console.error("Error preparing order:", e)
      toast.error("Something went wrong preparing your design")
    } finally {
      setIsTransitioning(false)
    }
  }

  const handleAddToCart = async () => {
    if (!selectedSize) {
      toast.error("Please select a size")
      return
    }

    setIsAddingToCart(true)

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1500))

    const customProduct = {
      id: `custom-${Date.now()}`,
      name: `Custom ${selectedColor?.name || "Hoodie"} Design`,
      price: 1200, // Base price for custom hoodie
      category: "hoodies" as const,
      gender: "unisex" as const,
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      image: bakedImages.front || "/2d/black.png",
      images: [bakedImages.front!, bakedImages.back!].filter(Boolean),
      description: "Custom designed hoodie created with Brova Studio."
    }

    addToCart(customProduct, selectedSize, 1, {
      frontImage: bakedImages.front || undefined,
      backImage: bakedImages.back || undefined,
      color: selectedColor?.name || "Custom"
    })

    toast.success("Added to cart!")
    setIsAddingToCart(false)
    setShowOrderPanel(false)
    router.push("/cart")
  }

  // Try On Handler
  const handleTryOn = async () => {
    const stage = stageRef.current
    if (!stage) return

    try {
      // Deselect any selected element first
      setSelectedId(null)
      // Wait for React state update cycle
      await new Promise(resolve => setTimeout(resolve, 0))

      const dataURL = stage.toDataURL({ pixelRatio: 2 })
      const blob = await (await fetch(dataURL)).blob()
      const file = new File([blob], `try-on-${Date.now()}.png`, { type: "image/png" })
      
      present(
        <TryOnSheetContent
          productImage=""
          productName={`Your Custom ${selectedColor?.name || "Hoodie"} Design`}
          productImageFile={file}
          productId="custom"
        />
      )
    } catch (error) {
      console.error("Failed to prepare try-on:", error)
      toast.error("Failed to prepare try-on")
    }
  }

  const filteredStickers = STICKERS_DATA.filter(s => 
    s.emoji.includes(stickerSearch) || 
    s.tags.some(tag => tag.includes(stickerSearch.toLowerCase()))
  )

  // Color selection handler
  const handleColorSelect = async (
    colorId: string,
    opts?: { animate?: boolean }
  ) => {
    const shouldAnimate = opts?.animate ?? !selectedColorId
    if (shouldAnimate) {
      setIsTransitioning(true)
      // Small delay for animation
      await new Promise(resolve => setTimeout(resolve, 800))
    }
    setSelectedColorId(colorId)
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      url.searchParams.set("color", colorId)
      window.history.replaceState(null, "", url.toString())
    }
    setIsTransitioning(false)
  }

  // Show color selection if no color is selected
  if (!selectedColor) {
    return (
      <AnimatePresence mode="wait">
        {!isTransitioning ? (
          <motion.div 
            key="selection-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="h-[100dvh] w-full flex flex-col bg-gradient-to-b from-white to-neutral-50 relative overflow-hidden"
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/15 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-500/15 rounded-full blur-[100px] pointer-events-none" />

            {/* Background Dots */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
                 style={{
                   backgroundImage: "radial-gradient(#d4d4d4 1px, transparent 1px)",
                   backgroundSize: "32px 32px"
                 }}
            />

            {/* Header */}
            <div className="relative z-10 px-4 pt-4">
              <Header showBack showLogo />
            </div>

            {/* Color Selection Content */}
            <div className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
              <div className="w-full max-w-4xl space-y-12">
                <div className="text-center space-y-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h1 className="text-4xl md:text-6xl font-black text-neutral-900 tracking-tighter">
                      SELECT YOUR CANVAS
                    </h1>
                  </motion.div>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-neutral-600 text-base md:text-lg font-medium max-w-md mx-auto"
                  >
                    Choose a base color to begin your creative journey with Brova.
                  </motion.p>
                </div>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8"
                >
                  {HOODIE_COLORS.map((color, index) => (
                    <motion.div
                      key={color.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                    >
                      <ColorPreviewCard
                        color={color}
                        isSelected={selectedColorId === color.id}
                        onSelect={() => handleColorSelect(color.id)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>

            {/* Footer hint */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="absolute bottom-8 left-0 right-0 text-center"
            >
              <p className="text-neutral-500/70 text-xs font-mono uppercase tracking-[0.2em]">
                Brova Editor v1.0 • Precision Design
              </p>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="transitioning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          >
            <div className="relative">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-6"
              >
                <div className="w-24 h-24 relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-t-2 border-r-2 border-white rounded-full"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white animate-pulse" />
                  </div>
                </div>
                <motion.p
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-white font-mono text-xs uppercase tracking-[0.3em]"
                >
                  Initializing Editor...
                </motion.p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-white relative overflow-hidden font-sans text-neutral-900">
      
      {/* Background Dots */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
           style={{
             backgroundImage: "radial-gradient(#4a4a4a 1px, transparent 1px)",
             backgroundSize: "20px 20px"
           }}
      />

      {/* Hidden inputs */}
      <input 
        type="file" 
        ref={imageInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={handleImageUpload}
      />
      <input 
        type="file" 
        ref={aiReferenceInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={(e) => setAiReferenceImage(e.target.files?.[0] || null)}
      />

      {/* Header & Controls */}
      <div className="relative z-10 px-4 pt-4 flex items-center justify-between pointer-events-none">
         <div className="pointer-events-auto">
             <Header 
               showBack 
               showLogo
             />
         </div>
         
         {/* Side Toggle */}
         <div className="pointer-events-auto bg-black/40 backdrop-blur-md rounded-full p-1 border border-white/10 flex gap-1 absolute left-1/2 -translate-x-1/2 top-6">
            <button
              onClick={() => { setCurrentSide("front"); setSelectedId(null); }}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
                currentSide === "front" ? "bg-white text-black" : "text-white/60 hover:text-white hover:bg-white/10"
              )}
            >
              Front
            </button>
            <button
              onClick={() => { setCurrentSide("back"); setSelectedId(null); }}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
                currentSide === "back" ? "bg-white text-black" : "text-white/60 hover:text-white hover:bg-white/10"
              )}
            >
              Back
            </button>
         </div>

         <div className="pointer-events-auto flex items-center gap-2">
            <motion.button
              onClick={() => setShowLayersPanel(true)}
              className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors backdrop-blur-md"
              whileTap={{ scale: 0.9 }}
              aria-label="Layers"
            >
              <Layers className="w-5 h-5" />
            </motion.button>

            <motion.button
              onClick={() => setShowHoodiePanel(true)}
              className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors backdrop-blur-md"
              whileTap={{ scale: 0.9 }}
              aria-label="Change hoodie color"
            >
              <Shirt className="w-5 h-5" />
            </motion.button>

            <motion.button
              onClick={handleExport}
              className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors backdrop-blur-md"
              whileTap={{ scale: 0.9 }}
            >
              <Download className="w-5 h-5" />
            </motion.button>

            <motion.button
              onClick={handleReviewOrder}
              className="h-10 px-5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold flex items-center gap-2 shadow-lg shadow-blue-500/50 hover:shadow-blue-500/70 transition-all relative overflow-hidden group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <ShoppingBag className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Order Now</span>
            </motion.button>
         </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex items-center justify-center relative z-0 overflow-hidden" ref={containerRef}>
        <div 
          className="relative shadow-2xl transition-all duration-300"
          style={{
            width: CANVAS_WIDTH * scale,
            height: CANVAS_HEIGHT * scale,
          }}
        >
          {/* AI Generation Loading Overlay */}
          <AnimatePresence>
            {aiGenerating && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-black/80 backdrop-blur-md rounded-lg"
              >
                {/* Abstract Data Stream Background */}
                <div className="absolute inset-0 opacity-20">
                     {[...Array(20)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute bg-purple-500/40 w-[1px]"
                          style={{
                             left: `${Math.random() * 100}%`,
                             height: `${Math.random() * 50 + 20}%`,
                             top: -100
                          }}
                          animate={{
                             top: ["-20%", "120%"],
                             opacity: [0, 1, 0]
                          }}
                          transition={{
                             duration: Math.random() * 2 + 1,
                             repeat: Infinity,
                             delay: Math.random() * 2,
                             ease: "linear"
                          }}
                        />
                     ))}
                </div>

                {/* Central AI Core Animation */}
                <div className="relative mb-8">
                    {/* Rotating Rings */}
                    <motion.div 
                       className="absolute inset-0 border-2 border-purple-500/30 rounded-full w-24 h-24 -m-2"
                       animate={{ rotate: 360 }}
                       transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div 
                       className="absolute inset-0 border-2 border-pink-500/30 rounded-full w-20 h-20 top-0 left-0"
                       style={{ margin: 6 }}
                       animate={{ rotate: -360 }}
                       transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                    />

                    {/* Glowing Core */}
                    <motion.div 
                        className="w-20 h-20 bg-gradient-to-tr from-purple-600 to-pink-600 rounded-full flex items-center justify-center relative z-10 shadow-[0_0_50px_rgba(168,85,247,0.5)]"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <Sparkles className="w-8 h-8 text-white animate-pulse" />
                    </motion.div>
                </div>
                
                {/* Text Feedback */}
                <div className="text-center space-y-2 z-10 px-4">
                    <motion.h3 
                        className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400"
                        animate={{ opacity: [0.8, 1, 0.8] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        Creating Masterpiece
                    </motion.h3>
                    
                    <motion.p 
                        className="text-white/40 text-sm font-mono"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        Analyzing prompt structure...
                    </motion.p>
                    
                    <motion.p 
                        className="text-white/40 text-xs font-mono pt-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 3 }}
                    >
                        (This might take a moment for high detail...)
                    </motion.p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Stage
            ref={stageRef}
            width={CANVAS_WIDTH * scale}
            height={CANVAS_HEIGHT * scale}
            scaleX={scale}
            scaleY={scale}
            style={{
               touchAction: "none"
            }}
            onMouseDown={(e) => {
              if (e.target === e.target.getStage()) {
                setSelectedId(null)
              }
            }}
            onTouchStart={(e) => {
              if (e.target === e.target.getStage()) {
                setSelectedId(null)
              }
            }}
          >
            <Layer>
              {/* Bg color for export visibility if transparent */}
              <HoodieImage src={baseHoodieImage} />
              {getCurrentState().elements.map((element) => (
                <ElementRenderer
                  key={element.id}
                  element={element}
                  isSelected={element.id === selectedId}
                  onSelect={() => {
                    setSelectedId(element.id)
                    setShowPropertiesPanel(true)
                  }}
                  onChange={(updates) => updateElement(element.id, updates)}
                />
              ))}
            </Layer>
          </Stage>
        </div>
      </div>

      {/* Floating Toolbar (Dock) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-4 flex justify-center">
        <div className="flex items-center gap-2 p-2 rounded-2xl bg-neutral-900/80 backdrop-blur-xl border border-white/10 shadow-2xl">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.id)}
              className={cn(
                "flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all relative group",
                activeTool === tool.id
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              <tool.icon className="w-5 h-5" />
              {activeTool === tool.id && (
                <span className="absolute -bottom-6 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-black px-2 py-0.5 rounded-md border border-white/10">
                    {tool.label}
                </span>
              )}
            </button>
          ))}
          
          <div className="w-px h-8 bg-white/10 mx-1" />

          <button
            onClick={() => setShowAIPanel(true)}
            className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 transition-all hover:scale-105"
          >
            <Sparkles className="w-5 h-5" />
          </button>

          <button
            onClick={handleTryOn}
            className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50 transition-all hover:scale-105 ml-2"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Draggable Panels */}
      <AnimatePresence>
        {/* Layers Panel */}
        {showLayersPanel && (
          <DraggablePanel
            title="Layers"
            onClose={() => setShowLayersPanel(false)}
            initialPosition={{ x: 20, y: 220 }}
            className="w-80 max-h-[520px]"
          >
            <div className="space-y-3">
              <p className="text-xs text-white/50">
                Tap a layer to select. Top is front.
              </p>

              <div className="space-y-2">
                {[...getCurrentState().elements]
                  .map((el, index) => ({ el, index }))
                  .reverse()
                  .map(({ el }) => {
                    const label =
                      el.type === "text"
                        ? `Text: ${el.content.slice(0, 16)}${el.content.length > 16 ? "…" : ""}`
                        : el.type === "sticker"
                        ? `Sticker: ${el.content}`
                        : "Image"
                    return (
                      <div
                        key={el.id}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border p-2 bg-black/20",
                          selectedId === el.id ? "border-white/30" : "border-white/10"
                        )}
                      >
                        <button
                          className="flex-1 text-left min-w-0"
                          onClick={() => {
                            setSelectedId(el.id)
                            setShowPropertiesPanel(true)
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-white/90 truncate">{label}</span>
                            {selectedId === el.id && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                                Selected
                              </span>
                            )}
                          </div>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/80"
                            onClick={() => moveLayer(el.id, "up")}
                            aria-label="Bring forward"
                            title="Bring forward"
                          >
                            ↑
                          </button>
                          <button
                            className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/80"
                            onClick={() => moveLayer(el.id, "down")}
                            aria-label="Send backward"
                            title="Send backward"
                          >
                            ↓
                          </button>
                          <button
                            className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/80"
                            onClick={() => duplicateElement(el.id)}
                            aria-label="Duplicate layer"
                            title="Duplicate"
                          >
                            ⧉
                          </button>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          </DraggablePanel>
        )}

        {/* Hoodie Color Panel */}
        {showHoodiePanel && (
          <DraggablePanel
            title="Hoodie Color"
            onClose={() => setShowHoodiePanel(false)}
            initialPosition={{ x: 20, y: 120 }}
            className="w-80"
          >
            <div className="space-y-3">
              <p className="text-xs text-white/50">
                Pick a base color. Your design stays intact.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {HOODIE_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => handleColorSelect(color.id, { animate: false })}
                    className={cn(
                      "rounded-2xl overflow-hidden border transition-all bg-black/20",
                      selectedColorId === color.id
                        ? "border-white/40 ring-2 ring-blue-500/60"
                        : "border-white/10 hover:border-white/20"
                    )}
                  >
                    <div className="aspect-[3/4] p-3 flex items-center justify-center">
                      <img src={color.preview} alt={color.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="px-3 pb-3 -mt-1 flex items-center justify-between">
                      <span className="text-xs font-semibold text-white/90">{color.name}</span>
                      {selectedColorId === color.id && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                          Selected
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </DraggablePanel>
        )}

        {/* Text Panel */}
        {showTextPanel && (
          <DraggablePanel 
            title="Add Text" 
            onClose={() => setShowTextPanel(false)}
            initialPosition={{ x: 20, y: 100 }}
            className="w-72"
          >
            <div className="space-y-4">
              <div className="flex gap-2">
                  <Input
                    placeholder="Enter text..."
                    className="bg-black/20 border-white/10 text-white placeholder:text-white/30"
                    value={newTextValue}
                    onChange={(e) => setNewTextValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddText(e.currentTarget.value)
                        setNewTextValue("")
                      }
                    }}
                    id="text-input-field"
                  />
                  <Button 
                    size="icon"
                    className="shrink-0 bg-white/10 hover:bg-white/20 text-white"
                    onClick={() => {
                        handleAddText(newTextValue)
                        setNewTextValue("")
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
              </div>
              <p className="text-xs text-white/40 text-center">Press Enter or click + to add</p>
            </div>
          </DraggablePanel>
        )}

        {/* Stickers Panel */}
        {showStickerPanel && (
          <DraggablePanel 
             title="Stickers" 
             onClose={() => setShowStickerPanel(false)}
             initialPosition={{ x: 20, y: 100 }}
             className="w-80 max-h-[500px]"
          >
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  placeholder="Search stickers..."
                  value={stickerSearch}
                  onChange={(e) => setStickerSearch(e.target.value)}
                  className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-white/30"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                {filteredStickers.map(sticker => (
                  <button
                    key={sticker.id}
                    onClick={() => handleAddSticker(sticker.emoji)}
                    className="text-4xl hover:scale-110 transition-transform aspect-square flex items-center justify-center rounded-lg hover:bg-white/10"
                  >
                    {sticker.emoji}
                  </button>
                ))}
              </div>
            </div>
          </DraggablePanel>
        )}

        {/* Selected Element Properties Panel (Shows when element selected) */}
        {selectedId && selectedElement && showPropertiesPanel && (
           <DraggablePanel
             title="Properties"
             onClose={() => setShowPropertiesPanel(false)}
             initialPosition={{ x: typeof window !== 'undefined' ? window.innerWidth - 320 : 1000, y: 100 }}
             className="w-72"
           >
             <div className="space-y-4">
                {/* Quick actions (easy mode) */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                    onClick={() => duplicateElement(selectedElement.id)}
                  >
                    Duplicate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                    onClick={() => {
                      moveLayer(selectedElement.id, "up")
                      toast.success("Brought forward")
                    }}
                  >
                    Bring Front
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                    onClick={() => {
                      moveLayer(selectedElement.id, "down")
                      toast.success("Sent backward")
                    }}
                  >
                    Send Back
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                    onClick={() => {
                      setSelectedId(null)
                      setShowPropertiesPanel(false)
                    }}
                  >
                    Deselect
                  </Button>
                </div>

                {selectedElement.type === "text" && (
                    <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-white/60 mb-1 block">Text</label>
                          <Input
                            ref={textEditInputRef}
                            value={textEditValue}
                            onChange={(e) => {
                              setTextEditValue(e.target.value)
                              updateElement(selectedElement.id, { content: e.target.value })
                            }}
                            className="bg-black/20 border-white/10 text-white placeholder:text-white/30"
                            placeholder="Edit text..."
                          />
                        </div>

                        <div>
                        <label className="text-xs font-medium text-white/60 mb-1 block">Font</label>
                        <select
                            className="w-full p-2 rounded-lg border border-white/10 bg-black/20 text-white text-sm"
                            value={selectedElement.fontFamily}
                            onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                        >
                            {FONTS.map(font => (
                            <option key={font.value} value={font.value} className="bg-neutral-800">{font.label}</option>
                            ))}
                        </select>
                        </div>

                        <div>
                        <label className="text-xs font-medium text-white/60 mb-1 block">Size</label>
                        <div className="flex items-center gap-2">
                             <input
                                type="range"
                                min="12"
                                max="200"
                                value={selectedElement.fontSize}
                                onChange={(e) => updateElement(selectedElement.id, { fontSize: Number(e.target.value) })}
                                className="flex-1 accent-white"
                             />
                             <span className="text-xs w-8 text-right">{selectedElement.fontSize}</span>
                        </div>
                        </div>

                        <div>
                        <label className="text-xs font-medium text-white/60 mb-1 block">Color</label>
                        <div className="flex flex-wrap gap-2">
                            {COLORS.map(color => (
                            <button
                                key={color}
                                className={cn(
                                    "w-6 h-6 rounded-full border border-white/10 transition-transform hover:scale-110",
                                    selectedElement.fill === color && "ring-2 ring-white ring-offset-2 ring-offset-black"
                                )}
                                style={{ backgroundColor: color }}
                                onClick={() => updateElement(selectedElement.id, { fill: color })}
                            />
                            ))}
                        </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-medium text-white/60 mb-1 block">Outline</label>
                            <input
                              type="color"
                              value={selectedElement.stroke || "#000000"}
                              onChange={(e) => updateElement(selectedElement.id, { stroke: e.target.value })}
                              className="w-full h-9 rounded-lg bg-black/20 border border-white/10 p-1"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-white/60 mb-1 block">Outline Width</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min="0"
                                max="20"
                                value={selectedElement.strokeWidth ?? 0}
                                onChange={(e) =>
                                  updateElement(selectedElement.id, { strokeWidth: Number(e.target.value) })
                                }
                                className="flex-1 accent-white"
                              />
                              <span className="text-xs w-8 text-right">{selectedElement.strokeWidth ?? 0}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-medium text-white/60 block">Shadow</label>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="color"
                              value={selectedElement.shadowColor || "#000000"}
                              onChange={(e) => updateElement(selectedElement.id, { shadowColor: e.target.value })}
                              className="w-full h-9 rounded-lg bg-black/20 border border-white/10 p-1"
                            />
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min="0"
                                max="50"
                                value={selectedElement.shadowBlur ?? 0}
                                onChange={(e) =>
                                  updateElement(selectedElement.id, { shadowBlur: Number(e.target.value) })
                                }
                                className="flex-1 accent-white"
                              />
                              <span className="text-xs w-8 text-right">{selectedElement.shadowBlur ?? 0}</span>
                            </div>
                            <div className="flex items-center gap-2 col-span-2">
                              <span className="text-[10px] text-white/40 w-14">Opacity</span>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={selectedElement.shadowOpacity ?? 0}
                                onChange={(e) =>
                                  updateElement(selectedElement.id, { shadowOpacity: Number(e.target.value) })
                                }
                                className="flex-1 accent-white"
                              />
                              <span className="text-xs w-10 text-right">
                                {Math.round((selectedElement.shadowOpacity ?? 0) * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>
                    </div>
                )}

                {selectedElement.type === "image" && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-white/60 mb-1 block">Rounded Corners</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={selectedElement.cornerRadius ?? 0}
                          onChange={(e) =>
                            updateElement(selectedElement.id, { cornerRadius: Number(e.target.value) })
                          }
                          className="flex-1 accent-white"
                        />
                        <span className="text-xs w-10 text-right">{selectedElement.cornerRadius ?? 0}px</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-white/60 mb-1 block">Opacity</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={selectedElement.opacity ?? 1}
                          onChange={(e) =>
                            updateElement(selectedElement.id, { opacity: Number(e.target.value) })
                          }
                          className="flex-1 accent-white"
                        />
                        <span className="text-xs w-10 text-right">{Math.round((selectedElement.opacity ?? 1) * 100)}%</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-white/60 block">Border</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="color"
                          value={selectedElement.stroke || "#ffffff"}
                          onChange={(e) => updateElement(selectedElement.id, { stroke: e.target.value })}
                          className="w-full h-9 rounded-lg bg-black/20 border border-white/10 p-1"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="30"
                            value={selectedElement.strokeWidth ?? 0}
                            onChange={(e) =>
                              updateElement(selectedElement.id, { strokeWidth: Number(e.target.value) })
                            }
                            className="flex-1 accent-white"
                          />
                          <span className="text-xs w-8 text-right">{selectedElement.strokeWidth ?? 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-white/60 block">Shadow</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="color"
                          value={selectedElement.shadowColor || "#000000"}
                          onChange={(e) => updateElement(selectedElement.id, { shadowColor: e.target.value })}
                          className="w-full h-9 rounded-lg bg-black/20 border border-white/10 p-1"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="60"
                            value={selectedElement.shadowBlur ?? 0}
                            onChange={(e) =>
                              updateElement(selectedElement.id, { shadowBlur: Number(e.target.value) })
                            }
                            className="flex-1 accent-white"
                          />
                          <span className="text-xs w-8 text-right">{selectedElement.shadowBlur ?? 0}</span>
                        </div>
                        <div className="flex items-center gap-2 col-span-2">
                          <span className="text-[10px] text-white/40 w-14">Opacity</span>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={selectedElement.shadowOpacity ?? 0}
                            onChange={(e) =>
                              updateElement(selectedElement.id, { shadowOpacity: Number(e.target.value) })
                            }
                            className="flex-1 accent-white"
                          />
                          <span className="text-xs w-10 text-right">
                            {Math.round((selectedElement.shadowOpacity ?? 0) * 100)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2 col-span-2">
                          <span className="text-[10px] text-white/40 w-14">Offset</span>
                          <input
                            type="range"
                            min="-40"
                            max="40"
                            value={selectedElement.shadowOffsetX ?? 0}
                            onChange={(e) => {
                              const v = Number(e.target.value)
                              updateElement(selectedElement.id, { shadowOffsetX: v, shadowOffsetY: v })
                            }}
                            className="flex-1 accent-white"
                          />
                          <span className="text-xs w-10 text-right">{selectedElement.shadowOffsetX ?? 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedElement.type === "sticker" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-white/60 mb-1 block">Outline</label>
                        <input
                          type="color"
                          value={selectedElement.stroke || "#000000"}
                          onChange={(e) => updateElement(selectedElement.id, { stroke: e.target.value })}
                          className="w-full h-9 rounded-lg bg-black/20 border border-white/10 p-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-white/60 mb-1 block">Outline Width</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="20"
                            value={selectedElement.strokeWidth ?? 0}
                            onChange={(e) =>
                              updateElement(selectedElement.id, { strokeWidth: Number(e.target.value) })
                            }
                            className="flex-1 accent-white"
                          />
                          <span className="text-xs w-8 text-right">{selectedElement.strokeWidth ?? 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-white/60 block">Shadow</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="color"
                          value={selectedElement.shadowColor || "#000000"}
                          onChange={(e) => updateElement(selectedElement.id, { shadowColor: e.target.value })}
                          className="w-full h-9 rounded-lg bg-black/20 border border-white/10 p-1"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="50"
                            value={selectedElement.shadowBlur ?? 0}
                            onChange={(e) =>
                              updateElement(selectedElement.id, { shadowBlur: Number(e.target.value) })
                            }
                            className="flex-1 accent-white"
                          />
                          <span className="text-xs w-8 text-right">{selectedElement.shadowBlur ?? 0}</span>
                        </div>
                        <div className="flex items-center gap-2 col-span-2">
                          <span className="text-[10px] text-white/40 w-14">Opacity</span>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={selectedElement.shadowOpacity ?? 0}
                            onChange={(e) =>
                              updateElement(selectedElement.id, { shadowOpacity: Number(e.target.value) })
                            }
                            className="flex-1 accent-white"
                          />
                          <span className="text-xs w-10 text-right">
                            {Math.round((selectedElement.shadowOpacity ?? 0) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="pt-2 border-t border-white/10">
                    <label className="text-xs font-medium text-white/60 mb-1 block">Transform</label>
                    <div className="grid grid-cols-2 gap-2">
                         <div className="bg-black/20 rounded-lg p-2 border border-white/5">
                            <span className="text-[10px] text-white/40 block">Rotation</span>
                            <div className="flex items-center gap-1">
                                <RotateCw className="w-3 h-3 text-white/60" />
                                <span className="text-sm">{Math.round(selectedElement.rotation)}°</span>
                            </div>
                         </div>
                         <div className="bg-black/20 rounded-lg p-2 border border-white/5">
                            <span className="text-[10px] text-white/40 block">Scale</span>
                            <div className="flex items-center gap-1">
                                <Maximize2 className="w-3 h-3 text-white/60" />
                                <span className="text-sm">{selectedElement.scaleX.toFixed(2)}x</span>
                            </div>
                         </div>
                    </div>
                </div>

                <div className="pt-2">
                     <Button 
                       variant="destructive" 
                       size="sm" 
                       className="w-full"
                       onClick={() => deleteElement(selectedElement.id)}
                     >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Layer
                     </Button>
                </div>
             </div>
           </DraggablePanel>
        )}

        {/* AI Bottom Sheet / Modal */}
        <AnimatePresence>
        {showAIPanel && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAIPanel(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            
            {/* Modal Container */}
            <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none p-4 md:p-0">
                <motion.div
                initial={{ y: "100%", opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: "100%", opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-[#1A1A1A] w-full md:w-[500px] rounded-t-3xl md:rounded-3xl border border-white/10 shadow-2xl overflow-hidden pointer-events-auto max-h-[85vh] flex flex-col"
                >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 rounded-xl border border-white/5">
                            <Sparkles className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">AI Designer</h3>
                            <p className="text-xs text-white/50">Describe it, and we'll design it.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowAIPanel(false)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    <div className="bg-purple-900/20 border border-purple-500/20 rounded-xl p-3 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                        <p className="text-purple-300 font-medium text-xs">
                            Editing <span className="uppercase font-bold text-white">{currentSide}</span> side
                        </p>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-medium text-white/80 block">Prompt</label>
                        <Textarea
                            placeholder="E.g., A futuristic cyberpunk city with neon lights and flying cars..."
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            className="min-h-[120px] bg-black/40 border-white/10 text-white resize-none text-base focus:ring-purple-500/50 rounded-xl"
                            disabled={aiGenerating}
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-medium text-white/80 block">Reference Image (Optional)</label>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1 bg-black/40 border-white/10 text-white hover:bg-white/5 h-12 justify-start rounded-xl"
                                onClick={() => aiReferenceInputRef.current?.click()}
                                disabled={aiGenerating}
                            >
                                <Upload className="w-4 h-4 mr-2 text-white/60" />
                                <span className="truncate">
                                    {aiReferenceImage ? aiReferenceImage.name : "Upload image"}
                                </span>
                            </Button>
                            {aiReferenceImage && (
                                <Button
                                    variant="ghost"
                                    className="w-12 h-12 p-0 text-white/60 hover:text-white hover:bg-white/10 rounded-xl"
                                    onClick={() => {
                                        setAiReferenceImage(null)
                                        if (aiReferenceInputRef.current) aiReferenceInputRef.current.value = ""
                                    }}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    <Button
                        className="w-full h-14 text-base font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg shadow-purple-900/20 rounded-xl mt-4 relative overflow-hidden group"
                        onClick={handleAIMagic}
                        disabled={aiGenerating || !aiPrompt.trim()}
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        <span className="relative flex items-center justify-center">
                            {aiGenerating ? (
                                <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Generating Magic...
                                </>
                            ) : (
                                <>
                                <Sparkles className="w-5 h-5 mr-2" />
                                Generate Design
                                </>
                            )}
                        </span>
                    </Button>
                </div>
                </motion.div>
            </div>
          </>
        )}
        </AnimatePresence>

        {/* Order Review Modal */}
        <AnimatePresence>
        {showOrderPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOrderPanel(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
            />
            
            <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none p-4">
              <motion.div
                initial={{ y: "100%", opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: "100%", opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-[#1A1A1A] w-full max-w-lg rounded-t-3xl md:rounded-3xl border border-white/10 shadow-2xl overflow-hidden pointer-events-auto max-h-[90vh] flex flex-col"
              >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                  <h3 className="text-xl font-bold text-white">Review Design</h3>
                  <button 
                    onClick={() => setShowOrderPanel(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
                    {/* Previews */}
                    <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
                        <div className="snap-center shrink-0 w-48 aspect-[3/4] bg-neutral-900 rounded-2xl overflow-hidden border border-white/5 relative">
                             <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-md text-[10px] uppercase font-bold text-white/60">Front</div>
                             <img src={bakedImages.front || ""} className="w-full h-full object-contain p-2" />
                        </div>
                        <div className="snap-center shrink-0 w-48 aspect-[3/4] bg-neutral-900 rounded-2xl overflow-hidden border border-white/5 relative">
                             <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-md text-[10px] uppercase font-bold text-white/60">Back</div>
                             <img src={bakedImages.back || ""} className="w-full h-full object-contain p-2" />
                        </div>
                    </div>

                    {/* Size Selection */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-white">Select Size</label>
                            <button className="text-xs text-white/40 hover:text-white underline">Size Guide</button>
                        </div>
                        <div className="grid grid-cols-6 gap-2">
                            {["XS", "S", "M", "L", "XL", "2XL"].map(size => (
                                <button
                                    key={size}
                                    onClick={() => setSelectedSize(size)}
                                    className={cn(
                                        "h-10 rounded-lg text-sm font-semibold transition-all border",
                                        selectedSize === size 
                                            ? "bg-white text-black border-white" 
                                            : "bg-white/5 text-white border-transparent hover:bg-white/10"
                                    )}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Price & Action */}
                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between text-white">
                            <span className="text-sm text-white/60">Total Price</span>
                            <span className="text-2xl font-bold">EGP 1,200</span>
                        </div>
                        
                        <Button
                            className="w-full h-14 text-base font-bold bg-white text-black hover:bg-neutral-200 rounded-xl"
                            onClick={handleAddToCart}
                            disabled={!selectedSize || isAddingToCart}
                        >
                            {isAddingToCart ? (
                                <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Adding to Cart...
                                </>
                            ) : (
                                <>
                                <ShoppingBag className="w-5 h-5 mr-2" />
                                Add to Cart - EGP 1,200
                                </>
                            )}
                        </Button>
                    </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
        </AnimatePresence>

        {/* Selected Element Properties Panel (Shows when element selected) */}
      </AnimatePresence>
    </div>
  )
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[100dvh] w-full flex items-center justify-center bg-white text-neutral-900">
          Loading editor…
        </div>
      }
    >
      <EditorPageInner />
    </Suspense>
  )
}
