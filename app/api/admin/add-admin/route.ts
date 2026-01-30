import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/admin/is-admin.server"

/**
 * API endpoint to add a new admin
 * Only existing admins can add new admins
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check if the requesting user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if the requesting user is an admin
    const isUserAdmin = await isAdmin(user)
    if (!isUserAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    // Get the user ID to add as admin from request body
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    // Update the user's profile to set is_admin = true
    const { data, error } = await supabase
      .from("profiles")
      .update({ is_admin: true })
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      console.error("Error adding admin:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (error) {
    console.error("Error in add-admin API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
