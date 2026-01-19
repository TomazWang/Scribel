# Frontend Development Tasks - Epic 2 (Vault Integration)

**Status**: ⏳ READY TO START (can begin with mocks)
**Tech Stack**: React 19, TypeScript 5.x, Tailwind CSS 4, Tauri API
**Priority**: P0 (MVP Blocker)
**Estimated Duration**: 3-4 days total

---

## Overview

Epic 2 consists of two features:
1. **epic-2-feat-001**: Vault Configuration (2-3 days frontend work)
2. **epic-2-feat-002**: File Watcher - Jots Folder (1 day frontend work)

**Work Strategy**: You can start Feature 001 with mocked commands while BE_GEEKS implements backend.

---

## Feature 001: Vault Configuration

**Goal**: User-facing UI for vault selection and management

**Your Tasks**: T019-T030, T033-T035, T036 (partial)

**Duration**: 2-3 days

**Files You Own**:
- `src/components/OnboardingScreen.tsx`
- `src/components/settings/VaultSettings.tsx`
- `src/App.tsx` (settings route)

### Phase 4: Frontend Onboarding (Day 1-2)

**Tasks**: T019-T024

**Can Start Immediately**: Mock backend commands for development

#### Mocking Backend Commands

Create `src/api/__mocks__/vault.ts`:
```typescript
// Mock for development
export const mockDetectVaults = async () => [
  { name: 'My Vault', path: '/Users/test/Obsidian/My Vault', last_modified: Date.now() },
  { name: 'Work Notes', path: '/Users/test/Documents/Work Notes', last_modified: Date.now() - 86400000 },
];

export const mockValidatePath = async (path: string) => {
  return path.includes('Obsidian') || path.includes('Vault');
};
```

---

- [ ] **T019**: Create OnboardingScreen component
  - File: `src/components/OnboardingScreen.tsx`
  - Props: None (full-screen modal)
  - State:
    ```typescript
    const [detectedVaults, setDetectedVaults] = useState<VaultInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    ```

- [ ] **T020**: Implement auto-detection UI
  - On mount, call `invoke('detect_vaults')`
  - Show loading spinner during detection (3s max)
  - Display detected vaults in list:
    - Vault icon + name (bold)
    - Full path (muted, truncated if >50 chars)
    - "Most Recent" badge on first item
  - Each vault is clickable card
  - Example layout:
    ```tsx
    <div className="vault-card" onClick={() => handleVaultSelect(vault.path)}>
      <div className="vault-icon">📁</div>
      <div className="vault-info">
        <h3>{vault.name}</h3>
        <p className="text-sm text-neutral-400">{vault.path}</p>
      </div>
      {index === 0 && <span className="badge">Most Recent</span>}
    </div>
    ```

- [ ] **T021**: Implement manual browse button
  - Button: "Browse for Vault..." (secondary style)
  - Click handler:
    ```typescript
    import { open } from '@tauri-apps/api/dialog';

    const handleBrowse = async () => {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Your Obsidian Vault'
      });

      if (selected) {
        await handleVaultSelect(selected as string);
      }
    };
    ```

- [ ] **T022**: Implement `handleVaultSelect()`
  - Function signature: `async function handleVaultSelect(path: string)`
  - Steps:
    1. Call `invoke('validate_vault_path', { path })`
    2. If invalid, show error toast and return
    3. If valid, call `invoke('set_vault_path', { path })`
    4. Call `invoke('ensure_jots_folder')`
    5. Navigate to main app: `navigate('/')`
  - Error handling:
    ```typescript
    try {
      const isValid = await invoke<boolean>('validate_vault_path', { path });
      if (!isValid) {
        setError('Not a valid Obsidian vault (missing .obsidian folder)');
        return;
      }
      await invoke('set_vault_path', { path });
      await invoke('ensure_jots_folder');
      navigate('/');
    } catch (e) {
      setError(String(e));
    }
    ```

- [ ] **T023**: Add validation error handling
  - Display errors clearly above vault list
  - Error messages:
    - "Path does not exist"
    - "Not a valid Obsidian vault (missing .obsidian folder)"
    - "Permission denied"
  - Include "Try Again" button that clears error

- [ ] **T024**: Style onboarding screen
  - Full-screen overlay: `bg-black/80`
  - Centered card: `max-w-2xl mx-auto p-8 bg-white dark:bg-neutral-800 rounded-lg`
  - Heading: "Welcome to Scribel" (text-4xl, font-bold)
  - Subheading: "Select your Obsidian vault to get started" (text-neutral-500)
  - Button styles:
    - Primary: `bg-blue-600 hover:bg-blue-700 text-white`
    - Secondary: `border border-neutral-300 dark:border-neutral-600`
  - Dark mode support using Tailwind's `dark:` prefix

**Checkpoint**: Onboarding UI complete (works with mocks)

---

### Phase 5: Frontend Settings Panel (Day 2-3)

**Tasks**: T025-T030

**Requires**: BE_GEEKS T018 complete (real backend commands)

- [ ] **T025**: Create VaultSettings component
  - File: `src/components/settings/VaultSettings.tsx`
  - Section in settings panel under "Vault"
  - State:
    ```typescript
    const [vaultPath, setVaultPath] = useState<string | null>(null);
    const [vaultName, setVaultName] = useState<string>('');
    const [status, setStatus] = useState<'connected' | 'not-found'>('connected');
    ```

- [ ] **T026**: Implement current vault display
  - On mount:
    ```typescript
    useEffect(() => {
      const loadVault = async () => {
        const path = await invoke<string | null>('get_vault_path');
        if (path) {
          setVaultPath(path);
          setVaultName(path.split('/').pop() || 'Unknown');

          // Check if still valid
          const isValid = await invoke<boolean>('validate_vault_path', { path });
          setStatus(isValid ? 'connected' : 'not-found');
        }
      };
      loadVault();
    }, []);
    ```
  - Display:
    - Vault name (large, bold)
    - Full path (small, clickable to copy)
    - Status indicator: "✅ Connected" (green) or "❌ Not Found" (red)

- [ ] **T027**: Implement change vault flow
  - Button: "Change Vault"
  - Click handler:
    ```typescript
    const handleChangeVault = async () => {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select New Vault',
        defaultPath: vaultPath || undefined
      });

      if (!selected) return;

      // Show confirmation
      const confirmed = await confirm(
        `Switch to ${selected}?\n\nThis will reload the app and clear current jots from view.`,
        { title: 'Change Vault', type: 'warning' }
      );

      if (confirmed) {
        await invoke('set_vault_path', { path: selected as string });
        window.location.reload();
      }
    };
    ```

- [ ] **T028**: Implement rebuild index button
  - Button: "Rebuild Index"
  - Click handler:
    ```typescript
    const handleRebuild = async () => {
      const confirmed = await confirm(
        'This will re-scan all jot files. Continue?',
        { title: 'Rebuild Index' }
      );

      if (confirmed) {
        setRebuilding(true);
        try {
          const count = await invoke<number>('rebuild_jot_index');
          toast.success(`Index rebuilt successfully. ${count} jots found.`);
        } catch (e) {
          toast.error(`Failed to rebuild index: ${e}`);
        } finally {
          setRebuilding(false);
        }
      }
    };
    ```

- [ ] **T029**: Implement open folder button
  - Button: "Open Vault Folder"
  - Click handler:
    ```typescript
    const handleOpenFolder = async () => {
      try {
        await invoke('open_vault_in_finder');
      } catch (e) {
        toast.error(`Failed to open folder: ${e}`);
      }
    };
    ```

- [ ] **T030**: Add settings panel route
  - File: `src/App.tsx`
  - Route: `/settings`
  - Add link in main nav:
    ```tsx
    <nav>
      <Link to="/">Jots</Link>
      <Link to="/settings">Settings</Link>
    </nav>

    <Routes>
      <Route path="/" element={<JotPanel />} />
      <Route path="/settings" element={<SettingsPanel />} />
    </Routes>
    ```
  - In SettingsPanel, include `<VaultSettings />` as a section

**Checkpoint**: Settings panel complete, user can manage vault

---

## Feature 002: File Watcher - Jots Folder

**Goal**: Listen to backend events and auto-refresh jot list

**Your Tasks**: T023-T025, T036 (partial)

**Duration**: 1 day

**Dependencies**: BE_GEEKS T022 complete (watcher commands registered)

### Phase 5: Frontend Integration (Day 3-4)

**Tasks**: T023-T025

**Minimal Work**: Just add event listeners and refresh jot list

- [ ] **T023**: Create `useWatcherEvents` hook
  - File: `src/hooks/useWatcherEvents.ts`
  - Listen to three Tauri events:
    ```typescript
    import { listen } from '@tauri-apps/api/event';
    import { useEffect } from 'react';

    export function useWatcherEvents(onJotChange: () => void) {
      useEffect(() => {
        let unlisteners: (() => void)[] = [];

        const setupListeners = async () => {
          const unlistenCreate = await listen('jot_created', (event) => {
            console.log('Jot created:', event.payload);
            onJotChange();
          });

          const unlistenUpdate = await listen('jot_updated', (event) => {
            console.log('Jot updated:', event.payload);
            onJotChange();
          });

          const unlistenDelete = await listen('jot_deleted', (event) => {
            console.log('Jot deleted:', event.payload);
            onJotChange();
          });

          unlisteners = [unlistenCreate, unlistenUpdate, unlistenDelete];
        };

        setupListeners();

        return () => {
          unlisteners.forEach(fn => fn());
        };
      }, [onJotChange]);
    }
    ```

- [ ] **T024**: Integrate `useWatcherEvents` in JotPanel
  - File: `src/components/JotPanel.tsx`
  - Add hook:
    ```typescript
    const { jots, refresh } = useJots();
    useWatcherEvents(refresh);
    ```
  - That's it! Jot list will auto-refresh on external changes

- [ ] **T025**: Add watcher status to Settings panel (optional)
  - File: `src/components/settings/VaultSettings.tsx`
  - Add section: "File Watcher"
  - Display status:
    ```typescript
    const [watcherStatus, setWatcherStatus] = useState<WatcherStatus | null>(null);

    useEffect(() => {
      const loadStatus = async () => {
        const status = await invoke<WatcherStatus>('get_watcher_status');
        setWatcherStatus(status);
      };
      loadStatus();
      const interval = setInterval(loadStatus, 5000); // Poll every 5s
      return () => clearInterval(interval);
    }, []);
    ```
  - Display:
    - "Watcher: Running" or "Watcher: Stopped"
    - Events processed count
    - Optional: "Restart Watcher" button

**Checkpoint**: Frontend listens to watcher events, auto-refreshes

---

## Testing (Day 3-4)

**Tasks**: T033-T035, T036 (partial)

### Integration Tests

- [ ] **T033**: End-to-end onboarding test
  - Use test vault (coordinate with BE_GEEKS)
  - Launch app with no config
  - Verify onboarding appears
  - Select test vault
  - Verify navigation to main app
  - Verify config saved (persists on reload)

- [ ] **T034**: Test vault switching
  - Configure vault A
  - Create jots in vault A
  - Switch to vault B via settings
  - Verify app reloads
  - Verify jots from vault B appear

### Manual Testing

- [ ] **T035**: Manual test checklist
  - [ ] First-run onboarding appears
  - [ ] Auto-detection finds real Obsidian vaults
  - [ ] Can select detected vault with one click
  - [ ] Can browse for vault manually
  - [ ] Invalid paths show clear error messages
  - [ ] Settings panel shows correct vault info
  - [ ] Change vault triggers confirmation
  - [ ] Open folder button works
  - [ ] Dark mode styles work correctly

- [ ] **T036**: Manual test watcher integration
  - [ ] Edit jot in Obsidian → changes appear in Scribel within 2 seconds
  - [ ] Create new jot file externally → appears in Scribel
  - [ ] Delete jot file externally → removed from Scribel

---

## UI/UX Design Reference

### Onboarding Screen

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                    Welcome to Scribel                        │
│                                                              │
│           Select your Obsidian vault to get started         │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐  │
│   │  📁  My Vault                         [Most Recent]   │  │
│   │      /Users/you/Documents/My Vault                    │  │
│   └──────────────────────────────────────────────────────┘  │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐  │
│   │  📁  Work Notes                                       │  │
│   │      /Users/you/Documents/Work Notes                  │  │
│   └──────────────────────────────────────────────────────┘  │
│                                                              │
│              [Browse for Vault...]                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Settings Panel - Vault Section

```
┌─────────────────────────────────────────────────────────────┐
│  Settings                                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Vault                                                       │
│  ─────                                                       │
│                                                              │
│  Current Vault: My Vault                        ✅ Connected │
│  /Users/you/Documents/My Vault                               │
│                                                              │
│  [Change Vault]  [Rebuild Index]  [Open Folder]             │
│                                                              │
│  File Watcher                                                │
│  ────────────                                                │
│  Status: Running • 142 events processed                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Communication with BE_GEEKS

### Integration Points

**Feature 001**:
- **After BE_GEEKS T018**: Backend commands ready → Replace mocks with real `invoke()` calls
- **Sync Point**: Test commands together in DevTools console first

**Feature 002**:
- **After BE_GEEKS T022**: Watcher commands ready → Add event listeners
- **Minimal Integration**: Just 3 event listeners, very straightforward

### Code Comments

Use `AI-DEV-NOTE` for communication:
```typescript
// AI-DEV-NOTE: @BE_GEEKS - Need VaultInfo type exported from backend -- by @FE_DUDES
```

### Handoff Documents

When complete, create:
- `work/handoffs/epic-2/epic-2-f1-FE_DUDES-to-THE_PO.md` (after Feature 001)
- `work/handoffs/epic-2/epic-2-f2-FE_DUDES-to-THE_PO.md` (after Feature 002)

---

## Build & Run Commands

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Run tests
npm test

# Type check
npm run type-check

# Lint
npm run lint
```

---

## Resources

### Documentation
- **Feature Specs**: `specs/epic-2-feat-001-vault-config/spec.md`, `specs/epic-2-feat-002-file-watcher-jots/spec.md`
- **Implementation Plans**: See `plan.md` files in spec directories
- **Tasks**: See `tasks.md` files in spec directories

### Type Definitions

Create `src/types/vault.ts`:
```typescript
export interface VaultInfo {
  name: string;
  path: string;
  last_modified: number; // Unix timestamp
}

export interface WatcherStatus {
  state: 'running' | 'idle' | 'stopped' | 'error';
  events_processed: number;
  last_event_time: number | null;
  error_message: string | null;
}
```

### External Docs
- **React 19**: https://react.dev/
- **Tailwind CSS 4**: https://tailwindcss.com/docs
- **Tauri API**: https://tauri.app/v2/api/js/
- **Tauri Events**: https://tauri.app/v2/guides/features/events/

---

## Next Steps

1. ✅ Review this handoff note
2. ⏭️ Start Feature 001, Phase 4 (T019-T024) with mocks
3. ⏭️ Wait for BE_GEEKS T018, then integrate real commands
4. ⏭️ Complete Feature 001, Phase 5 (T025-T030)
5. ⏭️ Start Feature 002, Phase 5 (T023-T025) after BE_GEEKS T022

**Status**: Ready to begin implementation (with mocks)
**Last Updated**: 2026-01-19
