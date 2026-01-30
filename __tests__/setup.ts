// Test setup file
// Add global test configuration here

// Mock environment variables
process.env.GEMINI_API_KEY = "test-gemini-key"
process.env.NANO_BANANA_API_KEY = "test-nano-banana-key"
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co"
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key"
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key"

// Suppress console errors in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
}
