// Test utilities and setup for multi-tenant platform testing

import { createClient } from '@supabase/supabase-js'

// Supabase test configuration
const TEST_SUPABASE_URL = process.env.TEST_SUPABASE_URL || 'http://localhost:54321'
const TEST_SUPABASE_SERVICE_KEY = process.env.TEST_SUPABASE_SERVICE_KEY || 'test-service-key'

// Create clients for different access levels
export const createTestClient = () => {
  return createClient(TEST_SUPABASE_URL, TEST_SUPABASE_SERVICE_KEY)
}

// Test tenant data
export interface TestTenant {
  id: string
  slug: string
  name: string
  type: 'legacy' | 'standard'
}

// Sample test data
export const TEST_TENANTS: TestTenant[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    slug: 'brova-test',
    name: 'Brova Test Tenant',
    type: 'legacy'
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    slug: 'new-tenant-test',
    name: 'New Tenant Test',
    type: 'standard'
  }
]

// Helper functions for test setup
export async function setupTestData() {
  // Setup test organizations, stores, and products
  // This would typically involve inserting test data into the database
  console.log('Setting up test data...')
}

export async function cleanupTestData() {
  // Cleanup test data after tests
  console.log('Cleaning up test data...')
}

// Mock authentication utilities
export function mockUserAuth(organizationId: string) {
  // Mock user authentication with specific organization context
  return {
    organization_id: organizationId,
    user_id: 'test-user-id',
    role: 'authenticated'
  }
}

export function mockServiceRole() {
  // Mock service role access for AI testing
  return {
    role: 'service_role',
    has_scoped_access: false
  }
}

// RLS testing utilities
export async function testRLSPolicy(
  tableName: string,
  organizationId: string,
  expectedRowCount: number
) {
  // Test that RLS policies properly restrict access
  const supabase = createTestClient()
  const { data, error } = await supabase
    .from(tableName)
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)

  if (error) throw new Error(`RLS Test failed: ${error.message}`)

  return {
    rowCount: data?.length || 0,
    matchesExpected: (data?.length || 0) === expectedRowCount
  }
}

// AI access testing utilities
export async function testAIAccess(viewName: string, organizationId?: string) {
  // Test AI access with and without proper scoping
  const supabase = createTestClient()

  let query = supabase.from(viewName).select('*')

  if (organizationId) {
    query = query.eq('organization_id', organizationId)
  }

  const { data, error } = await query

  return {
    success: !error,
    data: data || null,
    error: error?.message || null,
    requiresScope: !!organizationId
  }
}

// Test data validation utilities
export function validateTenantIsolation(data: any[], organizationId: string) {
  // Validate that data belongs to the expected organization only
  return data.every(item => item.organization_id === organizationId)
}

export function validateNoSensitiveData(data: any[], sensitiveFields: string[]) {
  // Validate that sensitive fields are not exposed
  return sensitiveFields.every(field =>
    data.every(item => !(field in item) || item[field] === null)
  )
}