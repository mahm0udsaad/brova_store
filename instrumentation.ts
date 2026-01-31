export async function register() {
  if (process.env.NODE_ENV !== 'production') {
    return
  }

  if (typeof process !== 'undefined' && process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation.node')
  }
}
