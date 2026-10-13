import { VaultEntry } from '../types';

const VAULT_STORAGE_KEY = 'ravenclaw_vault_v1';

export function getVaultEntries(): VaultEntry[] {
  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load vault entries from localStorage:', err);
    return [];
  }
}

export function saveVaultEntry(
  entryData: Omit<VaultEntry, 'id' | 'createdAt'>
): VaultEntry {
  const existing = getVaultEntries();
  const newEntry: VaultEntry = {
    ...entryData,
    id: 'rc-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
    createdAt: new Date().toISOString(),
  };

  const updated = [newEntry, ...existing];
  try {
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save vault entry:', err);
  }

  return newEntry;
}

export function deleteVaultEntry(id: string): VaultEntry[] {
  const existing = getVaultEntries();
  const updated = existing.filter((item) => item.id !== id);
  try {
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete vault entry:', err);
  }
  return updated;
}

export function clearVault(): void {
  try {
    localStorage.removeItem(VAULT_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear vault:', err);
  }
}

export function exportVaultJson(): string {
  const entries = getVaultEntries();
  return JSON.stringify(
    {
      app: 'RavenClaw Web',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      entries,
    },
    null,
    2
  );
}

export function importVaultJson(jsonString: string): { success: boolean; count: number; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    const items: VaultEntry[] = Array.isArray(parsed) ? parsed : parsed.entries;
    if (!Array.isArray(items)) {
      return { success: false, count: 0, error: 'Invalid vault format' };
    }

    const current = getVaultEntries();
    const idMap = new Set(current.map(c => c.id));
    const toAdd = items.filter(item => item && item.compiledMarkdown && !idMap.has(item.id));
    const merged = [...toAdd, ...current];
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(merged));
    return { success: true, count: toAdd.length };
  } catch (e: any) {
    return { success: false, count: 0, error: e?.message || 'Failed to parse JSON' };
  }
}
