import type { User } from "@supabase/supabase-js"

function parseAllowlist() {
  return (process.env.ADMIN_ALLOWLIST || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
}

export function isAdmin(user: User | null) {
  if (!user) return false
  const allowlist = parseAllowlist()
  if (allowlist.length === 0) return false

  const candidates = [user.id, user.email, user.phone].filter(Boolean) as string[]
  return candidates.some((value) => allowlist.includes(value))
}
