import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin/is-admin"

type UpdatePayload = {
  price: number | null
  published: boolean
  sizes: string[]
  images: string[]
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  }

  const body = (await request.json()) as UpdatePayload
  const sanitizedImages = (body.images || []).filter(Boolean)
  const imageUrl = sanitizedImages[0] ?? null

  const admin = createAdminClient()
  const { error } = await admin
    .from("products")
    .update({
      price: body.price,
      published: body.published,
      sizes: body.sizes || [],
      images: sanitizedImages,
      image_url: imageUrl,
    })
    .eq("id", params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
