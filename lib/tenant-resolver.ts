import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

/**
 * Resolves the tenant slug from the request headers.
 * 
 * Strategy:
 * 1. Check x-tenant-override header (for testing/previews)
 * 2. Check host header:
 *    - localhost/127.0.0.1 -> 'brova' (default dev tenant)
 *    - [subdomain].localhost -> [subdomain]
 *    - [subdomain].brova.app -> [subdomain]
 * 3. DB Lookup for custom domains via store_domains table
 * 
 * @returns The resolved tenant slug (orgSlug)
 */
export async function resolveTenant(): Promise<string> {
  const headersList = await headers();
  const hostHeader = headersList.get('host') || '';
  const host = hostHeader.split(':')[0]; // Remove port if present
  
  // 1. Override via header (useful for middleware or testing)
  const override = headersList.get('x-tenant-override');
  if (override) {
    return override;
  }

  // 2. Localhost specific handling
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'brova';
  }
  
  // Handle subdomains on localhost (e.g. nike.localhost)
  if (host.endsWith('.localhost')) {
    const parts = host.split('.');
    // nike.localhost -> ['nike', 'localhost']
    if (parts.length >= 2) {
      if (parts[0] === 'www' && parts.length > 2) {
        return parts[1];
      }
      return parts[0];
    }
  }

  // 3. Subdomain resolution for main domain
  // Assumes format: [tenant].brova.app (or configured root domain)
  // We can check against a known list of suffixes or just try to resolve
  const isBrovaSubdomain = host.includes('brova.app') || host.includes('vercel.app');
  
  if (isBrovaSubdomain) {
    const parts = host.split('.');
    if (parts.length >= 3) {
      if (parts[0] === 'www' && parts.length > 3) {
        return parts[1];
      }
      if (parts[0] !== 'www') {
        return parts[0];
      }
    }
  }

  // 4. Custom Domain Resolution via DB
  // This handles cases like: store.custom-domain.com
  try {
      const supabase = await createClient();
      const { data: tenantSlug, error } = await supabase.rpc('get_tenant_slug_by_domain', {
          domain_name: host
      });

      if (!error && tenantSlug) {
          return tenantSlug;
      }
  } catch (e) {
      // Fail silently and fallback to default
      console.error('Error resolving tenant from DB:', e);
  }

  // Fallback to default tenant
  return 'brova';
}
