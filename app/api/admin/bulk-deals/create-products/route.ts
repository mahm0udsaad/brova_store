import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const admin = createAdminClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { products, groups } = body

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: "Products data is required" },
        { status: 400 }
      )
    }

    const createdProducts = []
    const errors = []

    // Create a batch record
    const { data: batch, error: batchError } = await (admin
      .from("bulk_deal_batches") as any)
      .insert({
        merchant_id: user.id,
        name: `Batch ${new Date().toLocaleString()}`,
        status: "completed",
        source_urls: [],
        total_images: products.reduce(
          (acc: number, p: any) => acc + p.selectedImages.length,
          0
        ),
        processed_count: products.reduce(
          (acc: number, p: any) => acc + p.selectedImages.length,
          0
        ),
        product_groups: groups,
        config: {
          generate_lifestyle: true,
          remove_background: true,
          create_products: true,
        },
        completed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (batchError) {
      console.error("Batch creation error:", batchError)
      return NextResponse.json(
        { error: "Failed to create batch" },
        { status: 500 }
      )
    }

    // Batch all product inserts with Promise.all
    const productResults = await Promise.allSettled(
      products.map(async (product) => {
        const { data: createdProduct, error: productError } = await (admin
          .from("products") as any)
          .insert({
            name: product.name,
            description: product.description,
            category_id: mapCategoryToId(product.category),
            image_url: product.selectedImages[0],
            images: product.selectedImages,
            sizes: product.sizes,
            price: parseFloat(product.price) || null,
            gender: product.gender,
            published: false, // Draft status
            merchant_id: user.id,
          })
          .select()
          .single()

        if (productError) {
          throw new Error(productError.message)
        }

        return {
          product,
          createdProduct,
        }
      })
    )

    // Process results and create AI task records in parallel
    const aiTaskPromises = []
    for (const result of productResults) {
      if (result.status === "fulfilled") {
        const { product, createdProduct } = result.value
        createdProducts.push(createdProduct)

        // Queue AI task creation
        aiTaskPromises.push(
          (admin.from("ai_tasks") as any).insert({
            merchant_id: user.id,
            agent: "product",
            task_type: "bulk_product_create",
            status: "completed",
            input: { groupId: product.groupId, batchId: batch?.id },
            output: { productId: createdProduct.id },
            metadata: {
              imageCount: product.selectedImages.length,
              category: product.category,
            },
          })
        )
      } else {
        // Extract product name from the error context if available
        const productIndex = productResults.indexOf(result)
        errors.push({
          product: products[productIndex]?.name || `Product ${productIndex + 1}`,
          error: result.reason?.message || "Unknown error",
        })
      }
    }

    // Execute all AI task inserts in parallel
    await Promise.allSettled(aiTaskPromises)

    return NextResponse.json({
      success: true,
      batchId: batch?.id,
      created: createdProducts.length,
      failed: errors.length,
      products: createdProducts,
      errors,
    })
  } catch (error) {
    console.error("Create products error:", error)
    return NextResponse.json(
      { error: "Failed to create products" },
      { status: 500 }
    )
  }
}

function mapCategoryToId(categoryName: string): string {
  const categoryMap: Record<string, string> = {
    "t-shirts": "t-shirts",
    tshirts: "t-shirts",
    shirts: "t-shirts",
    hoodies: "hoodies",
    sweaters: "hoodies",
    pants: "pants",
    jeans: "pants",
    jackets: "jackets",
    outerwear: "jackets",
    accessories: "accessories",
    hats: "accessories",
    bags: "accessories",
    shoes: "shoes",
    footwear: "shoes",
  }

  const normalized = categoryName.toLowerCase().trim()
  return categoryMap[normalized] || normalized
}
