/** Shared initials for avatars across header + profile. */
export function initialsForUser(
  displayName: string | undefined,
  email: string,
): string {
  const name = displayName?.trim()
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return (
        (parts[0]![0] ?? '') + (parts[parts.length - 1]![0] ?? '')
      ).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }
  const local = email.split('@')[0] ?? ''
  return local.slice(0, 2).toUpperCase() || '•'
}
