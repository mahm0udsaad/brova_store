import { notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import ProductEditor from "./product-editor"

type AdminProduct = {
  id: string
  name: string
  price: number | null
  sizes: string[] | null
  images: string[] | null
  image_url: string | null
  published: boolean | null
  category_id: string | null
}

type Props = {
  params: Promise<{ id: string }>
}

export default async function AdminProductPage({ params }: Props) {
  const { id } = await params
  const admin = createAdminClient()
  const { data } = await admin
    .from("products")
    .select("id,name,price,sizes,images,image_url,published,category_id")
    .eq("id", id)
    .single()

  if (!data) {
    notFound()
  }

  return <ProductEditor product={data as AdminProduct} />
}
