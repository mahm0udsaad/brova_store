import { FooterProps } from "@/lib/themes/types"
import { Mail, Phone, MapPin, Globe2 } from "lucide-react"

export function DefaultFooter({ contact, storeName, locale }: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand & Copyright */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">{storeName}</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              © {currentYear} {storeName}. {locale === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
            </p>
          </div>

          {/* Contact Info */}
          {contact && (
             <div className="space-y-4">
               <h4 className="font-semibold text-sm uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                 {locale === 'ar' ? 'اتصل بنا' : 'Contact Us'}
               </h4>
               <ul className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
                 {contact.email && (
                   <li className="flex items-center gap-2">
                     <Mail className="w-4 h-4" />
                     <a href={`mailto:${contact.email}`} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                       {contact.email}
                     </a>
                   </li>
                 )}
                 {contact.phone && (
                   <li className="flex items-center gap-2">
                     <Phone className="w-4 h-4" />
                     <a href={`tel:${contact.phone}`} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                       {contact.phone}
                     </a>
                   </li>
                 )}
                 {contact.address && (
                   <li className="flex items-start gap-2">
                     <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                     <span>{contact.address}</span>
                   </li>
                 )}
                 {contact.country && (
                   <li className="flex items-center gap-2">
                     <Globe2 className="w-4 h-4" />
                     <span>{contact.country}</span>
                   </li>
                 )}
               </ul>
             </div>
          )}

          {/* Links (Placeholder) */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
              {locale === 'ar' ? 'روابط' : 'Links'}
            </h4>
            <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li>
                <a href="#" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                  {locale === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                  {locale === 'ar' ? 'شروط الخدمة' : 'Terms of Service'}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}
