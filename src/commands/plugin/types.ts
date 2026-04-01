/**
 * Plugin command types (stub).
 */

export type PluginCommandAction = 'install' | 'uninstall' | 'list' | 'enable' | 'disable'

export type PluginCommandState = {
  action?: PluginCommandAction
  pluginId?: string
  [key: string]: any
}
