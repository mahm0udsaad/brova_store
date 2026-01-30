export type HapticType =
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "warning"
  | "error"

export function triggerHaptic(type: HapticType = "medium") {
  if (typeof window === "undefined") return

  // Use Vibration API if available
  if ("vibrate" in navigator) {
    const patterns: Record<string, number | number[]> = {
      light: 10,
      medium: 25,
      heavy: 50,
      success: [50, 50, 100],
      warning: [25, 25, 25],
      error: [60, 60, 120],
    }
    navigator.vibrate(patterns[type])
  }
}

export function playSuccessSound() {
  if (typeof window === "undefined") return

  // Create a light success sound using Web Audio API
  try {
    const audioContext = new (
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    )()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // Light, pleasant success chime
    oscillator.type = "sine"
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime) // A5 note
    oscillator.frequency.setValueAtTime(1108, audioContext.currentTime + 0.1) // C#6 note

    gainNode.gain.setValueAtTime(0.08, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.2)
  } catch {
    // Audio not supported, fail silently
  }
}

export function playSound(type: "tap" | "success" | "add") {
  if (type === "success") {
    playSuccessSound()
  }
  // Other sounds are now silent - only haptic feedback
}
