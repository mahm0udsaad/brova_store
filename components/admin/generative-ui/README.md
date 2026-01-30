# Generative UI Core Components (MVP-Critical)

These components form the **contract between AI agents and the UI**. They enable AI workflows to render interactive, user-friendly interfaces for decision-making, approval, and progress tracking.

## Why This Matters

Once Generative UI exists:
- ✅ **Workflow A** (AI Onboarding Concierge) becomes trivial
- ✅ **Workflow B** (Bulk Image → Products) plugs in cleanly
- ✅ **Workflow C** (Conversational Product Edit) becomes obvious
- ✅ Testing becomes meaningful

---

## Components

### 1. QuestionCard (MCQ / Decision Cards)

**Purpose**: Used by `askUser` agent tool for presenting choices to users.

**Features**:
- ✅ Single + multi-select support
- ✅ RTL/LTR aware
- ✅ Clear "Continue" CTA (for multi-select)
- ✅ Animated option selection

**Usage**:
```tsx
import { QuestionCard } from "@/components/admin/generative-ui"

<QuestionCard
  question="Which categories should this product belong to?"
  options={[
    { label: "T-Shirts", value: "tshirts" },
    { label: "Hoodies", value: "hoodies" },
    { label: "Accessories", value: "accessories" },
  ]}
  allowMultiple={true}
  onSelect={(values) => console.log("Selected:", values)}
  locale="en"
/>
```

**When to use**: AI asks user to choose between options (categories, styles, actions, etc.)

---

### 2. DraftProductCard

**Purpose**: Display AI-generated product drafts with confidence indicators.

**Features**:
- ✅ Image slider (multiple product images)
- ✅ Draft badge (AI confidence: high/medium/low)
- ✅ Primary image indicator
- ✅ Edit / Discard actions
- ✅ Bilingual support (en/ar)

**Usage**:
```tsx
import { DraftProductCard } from "@/components/admin/generative-ui"

<DraftProductCard
  draftId="draft_123"
  name="Classic White T-Shirt"
  nameAr="تيشيرت أبيض كلاسيكي"
  description="Premium cotton blend"
  imageUrls={["url1.jpg", "url2.jpg", "url3.jpg"]}
  primaryImageUrl="url1.jpg"
  suggestedPrice={299}
  category="T-Shirts"
  aiConfidence="high"
  onEdit={(id, field) => console.log("Edit", id, field)}
  onDiscard={(id) => console.log("Discard", id)}
  locale="en"
/>
```

**When to use**: Show AI-generated product drafts awaiting approval

---

### 3. DraftGrid

**Purpose**: Batch view for reviewing multiple AI-generated products.

**Features**:
- ✅ Grid layout with responsive columns
- ✅ Select all / Deselect all
- ✅ Bulk approve / Bulk discard
- ✅ Selection counter

**Usage**:
```tsx
import { DraftGrid } from "@/components/admin/generative-ui"

const drafts = [
  { draft_id: "1", name: "Product 1", ... },
  { draft_id: "2", name: "Product 2", ... },
]

<DraftGrid
  drafts={drafts}
  locale="en"
  onEdit={(id, field) => console.log("Edit", id)}
  onDiscard={(ids) => console.log("Discard", ids)}
  onApprove={(ids) => console.log("Approve", ids)}
/>
```

**When to use**: User needs to review and approve/reject multiple products at once

---

### 4. ConfirmationCard

**Purpose**: Prevent accidental bulk actions with clear confirmation UI.

**Features**:
- ✅ Warning-style design (amber accent)
- ✅ Clear count of affected items
- ✅ Confirm / Cancel actions
- ✅ No auto-apply (explicit user consent required)

**Usage**:
```tsx
import { ConfirmationCard } from "@/components/admin/generative-ui"

<ConfirmationCard
  action="create_products"
  description="You are about to add these products to your store"
  draftIds={["draft_1", "draft_2", "draft_3"]}
  totalProducts={3}
  locale="en"
  onConfirm={(ids) => console.log("Confirmed:", ids)}
  onCancel={() => console.log("Cancelled")}
/>
```

**When to use**: Before bulk operations (create, delete, publish multiple items)

---

### 5. StatusCard

**Purpose**: Display final operation results (success/failure).

**Features**:
- ✅ Success/error states with appropriate colors
- ✅ Detailed breakdown (created vs failed items)
- ✅ Bilingual messages

**Usage**:
```tsx
import { StatusCard } from "@/components/admin/generative-ui"

<StatusCard
  success={true}
  title="Products Created Successfully"
  message="All drafts have been published to your store"
  details={{
    created_product_ids: ["prod_1", "prod_2", "prod_3"],
    failed_draft_ids: [],
  }}
  locale="en"
/>
```

**When to use**: After operations complete (show results)

---

### 6. BeforeAfterPreview *(NEW)*

**Purpose**: Show edits before applying (text or image comparison).

**Features**:
- ✅ Text comparison (side-by-side)
- ✅ Image comparison (interactive slider)
- ✅ Accept / Reject actions
- ✅ RTL/LTR support

**Usage (Text)**:
```tsx
import { BeforeAfterPreview } from "@/components/admin/generative-ui"

<BeforeAfterPreview
  type="text"
  before={{
    title: "Original Name",
    content: "White T-Shirt"
  }}
  after={{
    title: "AI-Suggested Name",
    content: "Premium Cotton Classic White T-Shirt"
  }}
  fieldLabel="Product Name"
  onApprove={() => console.log("Approved")}
  onReject={() => console.log("Rejected")}
  locale="en"
/>
```

**Usage (Image)**:
```tsx
<BeforeAfterPreview
  type="image"
  beforeImageUrl="/original.jpg"
  afterImageUrl="/edited.jpg"
  fieldLabel="Background Removal"
  onApprove={() => console.log("Approved")}
  onReject={() => console.log("Rejected")}
  locale="en"
/>
```

**When to use**: AI suggests edits to product fields or images (requires user approval before persisting)

---

### 7. ProgressCard *(NEW)*

**Purpose**: Real-time progress feedback for long-running AI operations.

**Features**:
- ✅ Status-specific icons & colors
- ✅ Determinate progress (with percentage)
- ✅ Indeterminate progress (pulsing dots)
- ✅ Compact variant for inline use

**Usage (Determinate)**:
```tsx
import { ProgressCard } from "@/components/admin/generative-ui"

<ProgressCard
  status="generating"
  message="Generating products from images"
  current={3}
  total={8}
  details="Analyzing product features and creating descriptions"
  locale="en"
/>
```

**Usage (Indeterminate)**:
```tsx
<ProgressCard
  status="analyzing"
  message="Analyzing images..."
  locale="en"
/>
```

**Usage (Compact)**:
```tsx
<ProgressCard
  status="uploading"
  message="Uploading images"
  current={5}
  total={10}
  variant="compact"
  locale="en"
/>
```

**When to use**: Show progress during:
- Bulk image uploads
- AI product generation
- Background removal/image processing
- Any multi-step async operation

---

## Integration with AI Agents

### Example: AI Onboarding Concierge

```typescript
// Agent asks a question
await askUser({
  component: QuestionCard,
  props: {
    question: "What type of products do you sell?",
    options: [
      { label: "Clothing", value: "clothing" },
      { label: "Accessories", value: "accessories" },
    ],
  },
})

// Agent shows progress
await renderUI({
  component: ProgressCard,
  props: {
    status: "analyzing",
    message: "Analyzing uploaded images...",
  },
})

// Agent shows drafts for approval
await renderUI({
  component: DraftGrid,
  props: {
    drafts: generatedDrafts,
    onApprove: (ids) => createProducts(ids),
  },
})

// Agent confirms action
await renderUI({
  component: ConfirmationCard,
  props: {
    description: "You are about to add 5 products",
    totalProducts: 5,
  },
})

// Agent shows final status
await renderUI({
  component: StatusCard,
  props: {
    success: true,
    title: "Products Created",
    message: "Your products are now live!",
  },
})
```

---

## RTL/LTR Support

All components support **bidirectional text** via the `locale` prop:

```tsx
// English (LTR)
<QuestionCard locale="en" ... />

// Arabic (RTL)
<QuestionCard locale="ar" ... />
```

---

## Styling

Components use:
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Lucide Icons** for iconography
- **shadcn/ui** design tokens (via `@/lib/utils`)

All components are **dark mode compatible**.

---

## Testing

Components are designed to be testable:

```tsx
import { render, screen, fireEvent } from "@testing-library/react"
import { QuestionCard } from "@/components/admin/generative-ui"

test("QuestionCard handles multi-select", () => {
  const onSelect = jest.fn()
  render(
    <QuestionCard
      question="Pick options"
      options={[
        { label: "A", value: "a" },
        { label: "B", value: "b" },
      ]}
      allowMultiple
      onSelect={onSelect}
    />
  )

  fireEvent.click(screen.getByText("A"))
  fireEvent.click(screen.getByText("B"))
  fireEvent.click(screen.getByText("Confirm"))

  expect(onSelect).toHaveBeenCalledWith(["a", "b"])
})
```

---

## Next Steps

After implementing these components, the natural order is:

1. ✅ **Generative UI** (NOW - COMPLETE)
2. **Workflow A** – AI Onboarding Concierge
3. **Workflow B** – Bulk Image → Products
4. **Workflow C** – Conversational Product Edit
5. Tests (unit → integration)
6. Final MVP hardening

These components are now ready to be consumed by AI agents! 🚀
