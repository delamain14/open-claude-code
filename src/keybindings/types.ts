/**
 * Stub: Keybinding system types.
 *
 * These types power the configurable keyboard shortcut system:
 * - Users define bindings in ~/.claude/keybindings.json
 * - Bindings are parsed into ParsedBinding/ParsedKeystroke for matching
 * - Actions are resolved at runtime via the KeybindingContext
 */

/** Valid context names scoping where a binding is active. */
export type KeybindingContextName =
  | 'Global'
  | 'Chat'
  | 'Autocomplete'
  | 'Confirmation'
  | 'Help'
  | 'Transcript'
  | 'HistorySearch'
  | 'Task'
  | 'ThemePicker'
  | 'Settings'
  | 'Tabs'
  | 'Attachments'
  | 'Footer'
  | 'MessageSelector'
  | 'DiffDialog'
  | 'ModelPicker'
  | 'Select'
  | 'Plugin'

/**
 * A keybinding action string (e.g., 'app:toggleTranscript', 'chat:submit').
 * Typed as string to allow extensibility.
 */
export type KeybindingAction = string

/**
 * A parsed single keystroke (e.g., ctrl+shift+k).
 */
export type ParsedKeystroke = {
  key: string
  ctrl: boolean
  shift: boolean
  meta: boolean
  super: boolean
}

/**
 * A parsed binding associates a chord (one or more keystrokes) with an
 * action within a specific context.
 */
export type ParsedBinding = {
  context: KeybindingContextName
  chord: ParsedKeystroke[]
  action: string
}

/**
 * A keybinding block as written in the JSON configuration file.
 * Each block scopes its bindings to a single context.
 */
export type KeybindingBlock = {
  context: string
  bindings: Record<string, string | null>
}
