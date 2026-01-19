# Specification: Feature 1.4 - Global Hotkey

**Epic:** Epic 1 - Foundation
**Feature:** 1.4 Global Hotkey
**Status:** Ready for Implementation
**PRD Reference:** F1 (Quick Jot Interface — hotkey requirement)
**Plan Reference:** [plan/epic-1-foundation/feature-4-global-hotkey.md](../../plan/epic-1-foundation/feature-4-global-hotkey.md)

---

## 1. Overview

### 1.1 Purpose
Configure a system-wide keyboard shortcut to summon the Scribel window from anywhere on the system, enabling rapid jot capture without interrupting workflow.

### 1.2 Scope
- Register global keyboard shortcut on app startup
- Show/focus window on hotkey trigger
- Auto-focus input field when window appears
- Handle window toggle behavior (show if hidden, focus if visible)

### 1.3 Out of Scope
- Custom hotkey configuration UI (Epic 5)
- Multiple hotkey bindings
- Conflict detection with other applications

---

## 2. Design

### 2.1 Hotkey Configuration

| Platform | Shortcut | Notes |
|----------|----------|-------|
| macOS | `⌘ + Shift + Space` | May conflict with Spotlight (user can disable) |
| Windows | `Ctrl + Shift + Space` | Generally available |
| Linux | `Ctrl + Shift + Space` | May vary by desktop environment |

**Tauri Unified Key:** `CommandOrControl+Shift+Space`

### 2.2 Behavior Flow

```
User presses hotkey
       │
       ▼
┌──────────────────┐
│ Is window        │
│ visible?         │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
   Yes        No
    │         │
    ▼         ▼
┌─────────┐  ┌─────────┐
│ Focus   │  │ Show    │
│ window  │  │ window  │
└────┬────┘  └────┬────┘
     │            │
     └─────┬──────┘
           │
           ▼
    ┌────────────┐
    │ Focus      │
    │ input field│
    └────────────┘
```

### 2.3 Window Behavior

- **Show:** Bring window to foreground, above all other windows
- **Focus:** Set keyboard focus to the window
- **Input Focus:** Set cursor in the jot input field
- **No Toggle:** Do NOT hide on repeat press (always show/focus)

---

## 3. Technical Implementation

### 3.1 Tauri Plugin Setup

**Cargo.toml:**
```toml
[dependencies]
tauri-plugin-global-shortcut = "2"
```

**capabilities/default.json:**
```json
{
  "identifier": "default",
  "description": "Default capability for Scribel",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "opener:default",
    "global-shortcut:allow-register",
    "global-shortcut:allow-unregister",
    "global-shortcut:allow-is-registered"
  ]
}
```

### 3.2 Rust Implementation

```rust
// src-tauri/src/lib.rs

use tauri::{Manager, Runtime};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            // Initialize database
            let db = db::Database::new(&app.handle())?;
            app.manage(db);

            // Register global shortcut
            register_global_shortcut(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // ... jot commands
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn register_global_shortcut(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let shortcut = Shortcut::new(
        Some(Modifiers::SUPER | Modifiers::SHIFT),  // Cmd/Ctrl + Shift
        Code::Space
    );

    let handle = app.handle().clone();

    app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
        if event.state == ShortcutState::Pressed {
            if let Some(window) = handle.get_webview_window("main") {
                // Show and focus the window
                let _ = window.show();
                let _ = window.set_focus();

                // Emit event to frontend to focus input
                let _ = window.emit("focus-input", ());
            }
        }
    })?;

    app.global_shortcut().register(shortcut)?;

    Ok(())
}
```

### 3.3 Frontend Integration

```typescript
// src/hooks/useGlobalShortcut.ts

import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";

interface UseGlobalShortcutOptions {
  onFocusInput: () => void;
}

export function useGlobalShortcut({ onFocusInput }: UseGlobalShortcutOptions) {
  useEffect(() => {
    const unlisten = listen("focus-input", () => {
      onFocusInput();
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [onFocusInput]);
}
```

```tsx
// src/components/JotPanel.tsx (updated)

import { useRef, useCallback } from "react";
import { useJots } from "../hooks/useJots";
import { useGlobalShortcut } from "../hooks/useGlobalShortcut";
import { JotList } from "./JotList";
import { JotInput } from "./JotInput";

export function JotPanel() {
  const { jots, loading, createJot, deleteJot } = useJots();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  useGlobalShortcut({ onFocusInput: handleFocusInput });

  return (
    <div className="flex flex-col h-full">
      <JotList
        jots={jots}
        onDelete={deleteJot}
        loading={loading}
      />
      <JotInput
        ref={inputRef}
        onSubmit={createJot}
        autoFocus
      />
    </div>
  );
}
```

```tsx
// src/components/JotInput.tsx (updated with forwardRef)

import { useState, forwardRef, useImperativeHandle, useRef, useEffect } from "react";

interface JotInputProps {
  onSubmit: (content: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export const JotInput = forwardRef<HTMLInputElement, JotInputProps>(
  function JotInput({ onSubmit, disabled, autoFocus = true }, ref) {
    const [value, setValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // Expose focus method via ref
    useImperativeHandle(ref, () => inputRef.current!, []);

    useEffect(() => {
      if (autoFocus && inputRef.current) {
        inputRef.current.focus();
      }
    }, [autoFocus]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && value.trim() && !disabled) {
        onSubmit(value.trim());
        setValue("");
      }
    };

    return (
      <div className="border-t border-neutral-200 dark:border-neutral-700 p-4">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="What's on your mind?"
          className="w-full px-4 py-3 rounded-lg
            border border-neutral-200 dark:border-neutral-700
            bg-white dark:bg-neutral-800
            text-neutral-900 dark:text-neutral-100
            placeholder:text-neutral-400
            focus:outline-none focus:ring-2 focus:ring-blue-500
            disabled:opacity-50"
        />
      </div>
    );
  }
);
```

### 3.4 Alternative: Window Focus Event

Instead of custom event, listen for Tauri window focus:

```typescript
// src/hooks/useWindowFocus.ts

import { useEffect } from "react";
import { getCurrent } from "@tauri-apps/api/window";

export function useWindowFocus(onFocus: () => void) {
  useEffect(() => {
    const appWindow = getCurrent();
    const unlisten = appWindow.onFocusChanged(({ payload: focused }) => {
      if (focused) {
        onFocus();
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [onFocus]);
}
```

---

## 4. Configuration

### 4.1 tauri.conf.json Updates

```json
{
  "app": {
    "windows": [
      {
        "title": "Scribel",
        "width": 600,
        "height": 500,
        "resizable": true,
        "fullscreen": false,
        "decorations": true,
        "transparent": false,
        "alwaysOnTop": false,
        "skipTaskbar": false,
        "focus": true,
        "visible": true
      }
    ]
  },
  "plugins": {}
}
```

### 4.2 macOS Permissions

On macOS, the app needs Accessibility permissions to register global shortcuts. Tauri handles this automatically, but users may see a permission prompt.

**Info.plist addition (if needed):**
```xml
<key>NSAppleEventsUsageDescription</key>
<string>Scribel needs accessibility access to register global shortcuts.</string>
```

---

## 5. Error Handling

### 5.1 Registration Failures

```rust
fn register_global_shortcut(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let shortcut = Shortcut::new(
        Some(Modifiers::SUPER | Modifiers::SHIFT),
        Code::Space
    );

    // Check if already registered
    if app.global_shortcut().is_registered(shortcut) {
        return Ok(());
    }

    // Attempt registration
    match app.global_shortcut().register(shortcut) {
        Ok(_) => {
            println!("Global shortcut registered: Cmd/Ctrl+Shift+Space");
            Ok(())
        }
        Err(e) => {
            eprintln!("Failed to register global shortcut: {}", e);
            // Non-fatal: app still works without hotkey
            Ok(())
        }
    }
}
```

### 5.2 Frontend Fallback

If the global shortcut fails, the app should still be usable via:
- System tray icon (future)
- Dock/taskbar click
- Spotlight/launcher search

---

## 6. Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| Hotkey to window visible | < 200ms | Time from keypress to first paint |
| Hotkey to input focused | < 250ms | Time from keypress to cursor blink |
| Registration time | < 50ms | During app startup |

### 6.1 Performance Optimization

- Pre-create window (don't lazy-load on hotkey)
- Use `show()` instead of `create()` for instant response
- Keep window in memory even when hidden

---

## 7. Testing Strategy

### 7.1 Manual Testing Checklist

- [ ] Press hotkey when app is hidden → window appears
- [ ] Press hotkey when app is visible → window focuses
- [ ] Press hotkey when app is minimized → window restores
- [ ] Press hotkey from different applications
- [ ] Input field receives focus after hotkey
- [ ] Measure hotkey-to-visible time (< 200ms)
- [ ] Test on macOS
- [ ] Test on Windows (if available)
- [ ] Test after system restart
- [ ] Test with conflicting app (e.g., Spotlight)

### 7.2 Integration Test

```rust
// src-tauri/src/tests/shortcut.rs

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_shortcut_creation() {
        let shortcut = Shortcut::new(
            Some(Modifiers::SUPER | Modifiers::SHIFT),
            Code::Space
        );
        assert!(shortcut.is_valid());
    }
}
```

### 7.3 E2E Test (WebDriver)

```typescript
// tests/e2e/global-shortcut.spec.ts

import { test, expect } from "@playwright/test";

test.describe("Global Shortcut", () => {
  test("focuses input on window focus", async ({ page }) => {
    // Simulate window gaining focus
    await page.evaluate(() => {
      window.dispatchEvent(new Event("focus"));
    });

    const input = page.getByPlaceholder("What's on your mind?");
    await expect(input).toBeFocused();
  });
});
```

---

## 8. Acceptance Criteria

- [ ] `⌘+Shift+Space` summons app on macOS
- [ ] `Ctrl+Shift+Space` summons app on Windows/Linux
- [ ] Window appears within 200ms of keypress
- [ ] Input field is focused after window appears
- [ ] Works when app is minimized to dock/taskbar
- [ ] Works when app is behind other windows
- [ ] Works from any application
- [ ] No crash if shortcut registration fails
- [ ] Shortcut persists after app restart

---

## 9. Dependencies

### 9.1 Rust Crates

```toml
[dependencies]
tauri-plugin-global-shortcut = "2"
```

### 9.2 Prerequisites

- Feature 1.3 Quick Jot Interface (input field must exist)

### 9.3 Dependents

- None (this is the final feature in Epic 1)

---

## 10. Implementation Tasks

1. [ ] Add `tauri-plugin-global-shortcut` to `Cargo.toml`
2. [ ] Add permissions to `capabilities/default.json`
3. [ ] Implement shortcut registration in `lib.rs`
4. [ ] Add window show/focus logic in Rust handler
5. [ ] Create `useWindowFocus` hook in frontend
6. [ ] Update `JotInput` to use `forwardRef`
7. [ ] Update `JotPanel` to pass ref and handle focus event
8. [ ] Test on macOS with `cargo tauri dev`
9. [ ] Test shortcut response time (< 200ms)
10. [ ] Handle registration failure gracefully
11. [ ] Document macOS permission requirements
12. [ ] Test on Windows (if available)

---

## 11. File Changes Summary

### New Files
- `src/hooks/useWindowFocus.ts`

### Modified Files
- `src-tauri/Cargo.toml` (add dependency)
- `src-tauri/capabilities/default.json` (add permissions)
- `src-tauri/src/lib.rs` (register shortcut)
- `src/components/JotInput.tsx` (forwardRef)
- `src/components/JotPanel.tsx` (ref handling)

---

## 12. Platform-Specific Notes

### 12.1 macOS

- **Accessibility Permission:** First launch may prompt for accessibility access
- **Spotlight Conflict:** Default Spotlight shortcut is `⌘+Space`; our `⌘+Shift+Space` should not conflict
- **App Nap:** Ensure app isn't suspended (Tauri handles this)

### 12.2 Windows

- **UAC:** No elevation required for global shortcuts
- **System Keys:** Avoid conflicts with Windows system shortcuts

### 12.3 Linux

- **Desktop Environment:** Behavior may vary (GNOME, KDE, etc.)
- **Wayland:** Global shortcuts may have limitations on Wayland
- **X11:** Full support expected

---

## 13. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Shortcut conflict with other apps | Medium | Low | Choose uncommon combo; future: custom hotkey |
| macOS permission denied | Low | Medium | Graceful fallback; clear permission prompt |
| Wayland limitations | Medium | Low | Document limitation; suggest X11 for full support |
| Registration fails silently | Low | Medium | Log errors; show notification (future) |

---

## 14. Future Enhancements

- **Custom Hotkey:** Settings UI to change the shortcut
- **Conflict Detection:** Warn if shortcut is already in use
- **Multiple Shortcuts:** Alternative bindings
- **System Tray:** Click to show, context menu
- **Auto-Hide:** Hide window after jot submission (optional)
