/**
 * Stub: Spinner component types.
 */

/**
 * The current mode of the spinner, reflecting what the assistant is doing.
 * Used throughout the UI to adapt the spinner animation.
 */
export type SpinnerMode = 'responding' | 'thinking' | 'tool' | (string & {})
