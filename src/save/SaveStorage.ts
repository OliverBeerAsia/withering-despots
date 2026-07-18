export interface SaveStorageAdapter {
  readonly read: (key: string) => string | null;
  readonly write: (key: string, value: string) => void;
  readonly remove: (key: string) => void;
}

function assertStorageKey(key: string): void {
  if (key.trim().length === 0) {
    throw new Error("Save storage key must not be empty.");
  }
}

export class MemorySaveStorage implements SaveStorageAdapter {
  private readonly values = new Map<string, string>();

  constructor(initialValues: Readonly<Record<string, string>> = {}) {
    for (const [key, value] of Object.entries(initialValues)) {
      assertStorageKey(key);
      this.values.set(key, value);
    }
  }

  read(key: string): string | null {
    assertStorageKey(key);
    return this.values.get(key) ?? null;
  }

  write(key: string, value: string): void {
    assertStorageKey(key);
    this.values.set(key, value);
  }

  remove(key: string): void {
    assertStorageKey(key);
    this.values.delete(key);
  }

  snapshot(): Readonly<Record<string, string>> {
    return Object.fromEntries(
      [...this.values.entries()].toSorted(([left], [right]) => left.localeCompare(right)),
    );
  }
}

export class LocalStorageSaveStorage implements SaveStorageAdapter {
  constructor(
    private readonly storage: Storage,
    private readonly namespace = "withering-despots.save",
  ) {
    if (namespace.trim().length === 0) {
      throw new Error("Save storage namespace must not be empty.");
    }
  }

  read(key: string): string | null {
    return this.storage.getItem(this.storageKey(key));
  }

  write(key: string, value: string): void {
    this.storage.setItem(this.storageKey(key), value);
  }

  remove(key: string): void {
    this.storage.removeItem(this.storageKey(key));
  }

  private storageKey(key: string): string {
    assertStorageKey(key);
    return `${this.namespace}:${key}`;
  }
}
