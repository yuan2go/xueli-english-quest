// getRandomValues also works on LAN HTTP, where randomUUID is unavailable.
export function localId(): string {
  return [...crypto.getRandomValues(new Uint8Array(16))]
    .map(byte => byte.toString(16).padStart(2, '0')).join('');
}
