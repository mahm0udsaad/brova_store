import type { Metadata } from "next"
import { notFound } from "next/navigation"
import ProductPageClient from "./product-page-client"
import { getStorefrontProductById } from "@/lib/supabase/queries/products"

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { data: product } = await getStorefrontProductById(id)

  if (!product) {
    return {
      title: "Product Not Found",
    }
  }

  const productImage = product.images && product.images.length > 0 ? product.images[0] : product.image
  const absoluteImageUrl = `https://brova.vercel.app${productImage}`
  const sizes = product.sizes.join(", ")

  return {
    title: product.name,
    description: `${product.description} Available sizes: ${sizes}`,
    openGraph: {
      title: product.name,
      description: `${product.description} Available sizes: ${sizes}`,
      images: [
        {
          url: absoluteImageUrl,
          width: 1200,
          height: 1600,
          alt: product.name,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: `${product.description} Available sizes: ${sizes}`,
      images: [absoluteImageUrl],
    },
    other: {
      "product:id": product.id,
      "product:category": product.category,
      "product:gender": product.gender,
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params
  const { data: product } = await getStorefrontProductById(id)

  if (!product) {
    notFound()
  }

  const productImage = product.images && product.images.length > 0 ? product.images[0] : product.image

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: `https://brova.vercel.app${productImage}`,
    category: product.category,
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    brand: {
      "@type": "Brand",
      name: "Brova",
    },
    size: product.sizes.join(", "),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductPageClient product={product} />
    </>
  )
}
