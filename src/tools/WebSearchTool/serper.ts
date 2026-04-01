/**
 * Serper.dev web search client.
 *
 * Uses the Google Search JSON API via serper.dev.
 * API key is read from the SERPER_API_KEY environment variable.
 *
 * Docs: https://serper.dev/
 */

import { logForDebugging } from '../../utils/debug.js'

export interface SerperSearchParams {
  q: string
  gl?: string
  hl?: string
  tbs?: string
  page?: number
}

export interface SerperOrganicResult {
  title: string
  link: string
  snippet: string
  position: number
}

export interface SerperSearchResponse {
  organic: SerperOrganicResult[]
  searchParameters: {
    q: string
    gl?: string
    hl?: string
    type: string
  }
  knowledgeGraph?: {
    title?: string
    description?: string
  }
}

export function isSerperEnabled(): boolean {
  return !!process.env.SERPER_API_KEY
}

export async function serperSearch(
  params: SerperSearchParams,
): Promise<SerperSearchResponse> {
  const apiKey = process.env.SERPER_API_KEY
  if (!apiKey) {
    throw new Error(
      'SERPER_API_KEY environment variable is required for web search',
    )
  }

  logForDebugging(`[serper] Searching: "${params.q}"`)

  const body: Record<string, unknown> = { q: params.q }
  if (params.gl) body.gl = params.gl
  if (params.hl) body.hl = params.hl
  if (params.tbs) body.tbs = params.tbs
  if (params.page) body.page = params.page

  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Serper API error ${response.status}: ${text}`)
  }

  const data = (await response.json()) as SerperSearchResponse
  logForDebugging(
    `[serper] Got ${data.organic?.length ?? 0} results for "${params.q}"`,
  )
  return data
}
