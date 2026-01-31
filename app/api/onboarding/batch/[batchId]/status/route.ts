import { createClient } from "@/lib/supabase/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const { batchId } = await params
  const supabase = await createClient()

  const { data: items } = await supabase
    .from("batch_items")
    .select("index, status, error_message")
    .eq("batch_id", batchId)
    .order("index")

  const statuses: Record<number, string> = {}
  items?.forEach((item) => {
    statuses[item.index] = item.status
  })

  return Response.json({ statuses })
}
