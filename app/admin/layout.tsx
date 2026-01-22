import { AdminAuthWrapper } from "@/components/admin-auth-wrapper"

export const metadata = {
  title: "Admin Panel | Brova",
  description: "Admin dashboard for managing products, orders, and inventory",
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminAuthWrapper>{children}</AdminAuthWrapper>
}
