declare global {
    var __sessions: Map<string, string>
  }

globalThis.__sessions ??= new Map<string, string>()
export const sessions = globalThis.__sessions