# Feature 1.4: Global Hotkey

**Status:** Pending
**PRD Reference:** F1 (Quick Jot Interface — hotkey requirement)

## Overview

Configure system-wide keyboard shortcut to summon Scribel window from anywhere.

## Requirements

From PRD F1:
- Global hotkey to summon app: `⌘+Shift+Space` (macOS), `Ctrl+Shift+Space` (Windows/Linux)
- App summon via hotkey: <200ms
- Focus input field on summon

## Implementation

### Tauri Configuration

Add to `tauri.conf.json`:
```json
{
  "plugins": {
    "global-shortcut": {
      "shortcuts": [
        {
          "shortcut": "CommandOrControl+Shift+Space",
          "handler": "show_window"
        }
      ]
    }
  }
}
```

### Rust Handler

```rust
// In lib.rs or dedicated module
use tauri::Manager;

fn setup_global_shortcut(app: &tauri::App) {
    // Register global shortcut
    // On trigger: show window, focus, focus input
}
```

### Frontend Integration

```typescript
// Listen for window show event
// Auto-focus input field when window appears
```

## Implementation Tasks

1. [ ] Add `tauri-plugin-global-shortcut` dependency
2. [ ] Configure shortcut in `tauri.conf.json`
3. [ ] Implement Rust handler to show/focus window
4. [ ] Add frontend listener to focus input on window show
5. [ ] Handle window already visible case (toggle or just focus)
6. [ ] Test on macOS
7. [ ] Test on Windows (if available)
8. [ ] Add settings UI to customize hotkey (future)

## Acceptance Criteria

- [ ] `⌘+Shift+Space` summons app on macOS
- [ ] `Ctrl+Shift+Space` summons app on Windows/Linux
- [ ] Response time <200ms from keypress to window visible
- [ ] Input field auto-focused on summon
- [ ] Works when app is minimized or in background
- [ ] Works from any application

## Tauri Plugin

```toml
# Cargo.toml
[dependencies]
tauri-plugin-global-shortcut = "2"
```

```json
// capabilities/default.json
{
  "permissions": [
    "global-shortcut:allow-register",
    "global-shortcut:allow-unregister"
  ]
}
```

## Performance Target

| Metric | Target | Measurement |
|--------|--------|-------------|
| Hotkey to window visible | <200ms | Time from keypress to first paint |
| Hotkey to input focused | <250ms | Time from keypress to cursor in input |

## Platform Considerations

| Platform | Shortcut | Notes |
|----------|----------|-------|
| macOS | ⌘+Shift+Space | May conflict with Spotlight (user should disable) |
| Windows | Ctrl+Shift+Space | Generally available |
| Linux | Ctrl+Shift+Space | May vary by desktop environment |

## Dependencies

- Feature 1.3 (Quick Jot Interface) — input field must exist to focus

## Future Enhancement

- Allow user to customize hotkey in Settings
- Conflict detection and warning

## Next Epic

→ [Epic 2: Vault Integration](../epic-2-vault-integration/)
