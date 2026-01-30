export async function register() {
  if (typeof process !== 'undefined' && process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation.node');
  }
}
