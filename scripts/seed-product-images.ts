/**
 * Script to seed product images to Supabase Storage
 * Run with: npx tsx scripts/seed-product-images.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load .env.local if it exists
const envPath = path.join(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim()
    }
  }
}

// Supabase config
const SUPABASE_URL = 'https://alpozkmftvqjqozkkoyz.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  console.log('Usage: SUPABASE_SERVICE_ROLE_KEY=your_key npx tsx scripts/seed-product-images.ts')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const PRODUCTS_DIR = path.join(__dirname, '../public/products')
const BUCKET_NAME = 'products'

async function getAllImageFiles(dir: string): Promise<{ localPath: string; storagePath: string }[]> {
  const files: { localPath: string; storagePath: string }[] = []

  function walkDir(currentDir: string, relativePath: string = '') {
    const items = fs.readdirSync(currentDir)

    for (const item of items) {
      const itemPath = path.join(currentDir, item)
      const newRelativePath = relativePath ? `${relativePath}/${item}` : item
      const stat = fs.statSync(itemPath)

      if (stat.isDirectory()) {
        walkDir(itemPath, newRelativePath)
      } else if (stat.isFile() && /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(item)) {
        files.push({
          localPath: itemPath,
          storagePath: newRelativePath
        })
      }
    }
  }

  walkDir(dir)
  return files
}

async function uploadFile(localPath: string, storagePath: string): Promise<boolean> {
  try {
    const fileBuffer = fs.readFileSync(localPath)
    const ext = path.extname(localPath).toLowerCase()

    let contentType = 'image/png'
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg'
    else if (ext === '.gif') contentType = 'image/gif'
    else if (ext === '.webp') contentType = 'image/webp'
    else if (ext === '.svg') contentType = 'image/svg+xml'

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBuffer, {
        contentType,
        upsert: true
      })

    if (error) {
      console.error(`  ❌ Failed: ${storagePath} - ${error.message}`)
      return false
    }

    console.log(`  ✅ Uploaded: ${storagePath}`)
    return true
  } catch (err) {
    console.error(`  ❌ Error uploading ${storagePath}:`, err)
    return false
  }
}

async function main() {
  console.log('🚀 Starting product images seeding to Supabase Storage...\n')
  console.log(`📁 Source: ${PRODUCTS_DIR}`)
  console.log(`☁️  Bucket: ${BUCKET_NAME}\n`)

  // Check if products directory exists
  if (!fs.existsSync(PRODUCTS_DIR)) {
    console.error('❌ Products directory not found:', PRODUCTS_DIR)
    process.exit(1)
  }

  // Get all image files
  const files = await getAllImageFiles(PRODUCTS_DIR)
  console.log(`📊 Found ${files.length} images to upload\n`)

  if (files.length === 0) {
    console.log('No images found to upload')
    return
  }

  // Upload files with progress
  let uploaded = 0
  let failed = 0
  const batchSize = 10 // Upload in batches to avoid rate limiting

  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize)
    const results = await Promise.all(
      batch.map(file => uploadFile(file.localPath, file.storagePath))
    )

    uploaded += results.filter(Boolean).length
    failed += results.filter(r => !r).length

    console.log(`\n📈 Progress: ${i + batch.length}/${files.length} processed\n`)
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`✅ Successfully uploaded: ${uploaded}`)
  console.log(`❌ Failed: ${failed}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  if (failed === 0) {
    console.log('🎉 All images seeded successfully!')
    console.log('\n📌 Next steps:')
    console.log('   1. Add "public/products" to .gitignore')
    console.log('   2. Remove the folder from git: git rm -r --cached public/products')
    console.log('   3. Commit and push the changes')
  }
}

main().catch(console.error)
