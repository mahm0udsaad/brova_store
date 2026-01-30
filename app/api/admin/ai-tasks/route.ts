import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - List AI tasks
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const agent = searchParams.get("agent")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    let query = supabase
      .from("ai_tasks")
      .select("*", { count: "exact" })
      .eq("merchant_id", user.id)

    if (status) {
      query = query.eq("status", status)
    }

    if (agent) {
      query = query.eq("agent", agent)
    }

    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      tasks: data,
      total: count,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Get AI tasks error:", error)
    return NextResponse.json(
      { error: "Failed to fetch AI tasks" },
      { status: 500 }
    )
  }
}

// POST - Create a new AI task
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { agent, taskType, input, parentTaskId } = body

    if (!agent || !taskType) {
      return NextResponse.json(
        { error: "Agent and taskType are required" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("ai_tasks")
      .insert({
        merchant_id: user.id,
        agent,
        task_type: taskType,
        status: "pending",
        input,
        parent_task_id: parentTaskId,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ task: data })
  } catch (error) {
    console.error("Create AI task error:", error)
    return NextResponse.json(
      { error: "Failed to create AI task" },
      { status: 500 }
    )
  }
}
