/**
 * OpenAI-compatible query path.
 * Converts OpenAI chat completion responses into Anthropic-format messages so
 * the rest of the pipeline can stay mostly unchanged.
 *
 * Supports tool calling: Anthropic tool schemas are converted to OpenAI
 * function-calling format, and OpenAI tool_calls responses are converted back
 * to Anthropic tool_use content blocks.
 */
import type { BetaJSONOutputFormat } from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
import type { BetaToolUnion } from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
import type {
  AssistantMessage,
  Message,
  StreamEvent,
  SystemAPIErrorMessage,
} from '../../types/message.js'
import { logForDebugging } from '../../utils/debug.js'
import { createAssistantMessage } from '../../utils/messages.js'
import { getDefaultModel, getModel, getProviderForModel } from '../llm/index.js'
import type {
  OpenAICompatibleChunk,
  OpenAICompatibleClient,
  OpenAICompatibleMessage,
  OpenAICompatibleResponse,
  OpenAITool,
  OpenAIToolCall,
  OpenAIToolCallDelta,
} from '../llm/providers/openai.js'

// ── Path selection ──

type OpenAIPathSelection = {
  use: boolean
  modelName?: string
  modelId?: string
}

function isOpenAICompatibleSourceType(sourceType: string): boolean {
  return [
    'openai',
    'deepseek',
    'kimi',
    'qwen',
    'glm',
    'minimax',
    'step',
  ].includes(sourceType)
}

function resolveOpenAIPath(
  preferredModelName?: string,
): OpenAIPathSelection {
  const candidateModelNames = [
    preferredModelName,
    getDefaultModel(),
  ].filter((value, index, values): value is string => {
    return (
      typeof value === 'string' &&
      value.length > 0 &&
      values.indexOf(value) === index
    )
  })

  if (candidateModelNames.length === 0) {
    logForDebugging('[LLM] shouldUseOpenAIPath: no candidate model configured')
    return { use: false }
  }

  for (const modelName of candidateModelNames) {
    const model = getModel(modelName)
    if (!model) {
      logForDebugging(
        `[LLM] shouldUseOpenAIPath: model "${modelName}" not in registry`,
      )
      continue
    }

    const provider = getProviderForModel(modelName)
    if (!provider) {
      logForDebugging(
        `[LLM] shouldUseOpenAIPath: no provider for model "${modelName}"`,
      )
      continue
    }

    logForDebugging(
      `[LLM] shouldUseOpenAIPath: provider="${provider.name}" sourceType="${provider.sourceType}" modelId="${model.modelId}" candidate="${modelName}"`,
    )

    if (isOpenAICompatibleSourceType(provider.sourceType)) {
      return { use: true, modelName, modelId: model.modelId }
    }
  }

  return { use: false }
}

export function shouldUseOpenAIPath(
  preferredModelName?: string,
): OpenAIPathSelection {
  return resolveOpenAIPath(preferredModelName)
}

// ── Anthropic → OpenAI format conversion ──

/**
 * Convert Anthropic BetaToolUnion schemas to OpenAI function-calling tools.
 */
function convertToolsToOpenAI(tools: BetaToolUnion[]): OpenAITool[] {
  return tools
    .filter(t => {
      // Only convert standard tools with name + input_schema.
      // Skip server-side tools (advisor, web_search, etc.)
      const type = (t as any).type
      return !type || type === 'custom'
    })
    .map(t => ({
      type: 'function' as const,
      function: {
        name: (t as any).name as string,
        description: (t as any).description as string | undefined,
        parameters: (t as any).input_schema as Record<string, unknown> | undefined,
      },
    }))
}

/**
 * Convert internal Message[] + system prompt to OpenAI chat messages,
 * preserving tool_calls and tool results for multi-turn tool use.
 */
function buildOpenAIMessages(
  messages: Message[],
  systemPrompt: Array<{ type: string; text: string }>,
): OpenAICompatibleMessage[] {
  const openaiMessages: OpenAICompatibleMessage[] = []

  if (systemPrompt.length > 0) {
    const systemText = systemPrompt
      .map(block => block.text ?? '')
      .filter(Boolean)
      .join('\n')
    if (systemText) {
      openaiMessages.push({ role: 'system', content: systemText })
    }
  }

  for (const msg of messages) {
    if (msg.type !== 'user' && msg.type !== 'assistant') continue

    const content = msg.message.content

    if (msg.message.role === 'assistant') {
      // Assistant message: may contain text + tool_use blocks
      const textParts: string[] = []
      const toolCalls: OpenAIToolCall[] = []

      if (typeof content === 'string') {
        textParts.push(content)
      } else if (Array.isArray(content)) {
        for (const block of content as any[]) {
          if (typeof block === 'string') {
            textParts.push(block)
          } else if (block.type === 'text') {
            textParts.push(block.text)
          } else if (block.type === 'tool_use') {
            toolCalls.push({
              id: block.id,
              type: 'function',
              function: {
                name: block.name,
                arguments: JSON.stringify(block.input ?? {}),
              },
            })
          }
          // Skip thinking blocks, etc.
        }
      }

      if (toolCalls.length > 0) {
        const assistantMsg: OpenAICompatibleMessage = {
          role: 'assistant',
          content: textParts.join('\n') || undefined,
          tool_calls: toolCalls,
        }
        openaiMessages.push(assistantMsg)
      } else {
        const text = textParts.join('\n')
        if (text) {
          openaiMessages.push({ role: 'assistant', content: text })
        }
      }
    } else {
      // User message: may contain text + tool_result blocks
      const textParts: string[] = []
      const toolResults: Array<{ tool_call_id: string; content: string }> = []

      if (typeof content === 'string') {
        textParts.push(content)
      } else if (Array.isArray(content)) {
        for (const block of content as any[]) {
          if (typeof block === 'string') {
            textParts.push(block)
          } else if (block.type === 'text') {
            textParts.push(block.text)
          } else if (block.type === 'tool_result') {
            const resultContent =
              typeof block.content === 'string'
                ? block.content
                : JSON.stringify(block.content ?? '')
            toolResults.push({
              tool_call_id: block.tool_use_id,
              content: resultContent,
            })
          }
        }
      }

      // Emit tool result messages first (OpenAI uses role: "tool")
      for (const tr of toolResults) {
        openaiMessages.push({
          role: 'tool',
          tool_call_id: tr.tool_call_id,
          content: tr.content,
        })
      }

      // Then emit remaining user text if any
      const text = textParts.join('\n')
      if (text) {
        openaiMessages.push({ role: 'user', content: text })
      }
    }
  }

  return openaiMessages
}

// ── Helpers ──

function toOpenAIResponseFormat(
  outputFormat?: BetaJSONOutputFormat,
): Record<string, unknown> | undefined {
  if (outputFormat?.type !== 'json_schema') {
    return undefined
  }

  return {
    type: 'json_schema',
    json_schema: {
      name: 'structured_output',
      strict: true,
      schema: outputFormat.schema,
    },
  }
}

function extractCompletionText(content: unknown): string {
  if (typeof content === 'string') {
    return content
  }

  if (!Array.isArray(content)) {
    return ''
  }

  return content
    .map(part => {
      if (typeof part === 'string') return part
      if (
        part &&
        typeof part === 'object' &&
        'type' in part &&
        part.type === 'text' &&
        'text' in part &&
        typeof part.text === 'string'
      ) {
        return part.text
      }
      return ''
    })
    .filter(Boolean)
    .join('\n')
}

let _toolCallIdCounter = 0
function generateToolCallId(): string {
  return `call_${Date.now()}_${++_toolCallIdCounter}`
}

// ── Non-streaming query ──

/**
 * Query an OpenAI-compatible model without streaming and convert the result to
 * the internal AssistantMessage shape.
 */
export async function queryOpenAIModelWithoutStreaming({
  messages,
  systemPrompt,
  signal,
  modelId,
  modelName,
  outputFormat,
  tools,
}: {
  messages: Message[]
  systemPrompt: Array<{ type: string; text: string }>
  signal: AbortSignal
  modelId: string
  modelName: string
  outputFormat?: BetaJSONOutputFormat
  tools?: BetaToolUnion[]
}): Promise<AssistantMessage> {
  const provider = getProviderForModel(modelName)
  if (!provider) {
    throw new Error(`No provider found for model: ${modelName}`)
  }

  logForDebugging(
    `[LLM] queryOpenAIModelWithoutStreaming: provider="${provider.name}" modelId="${modelId}" modelName="${modelName}"`,
  )

  const client = (await provider.createClient()) as OpenAICompatibleClient
  const request: Record<string, unknown> = {
    model: modelId,
    messages: buildOpenAIMessages(messages, systemPrompt),
  }

  // Add tools if provided
  const openaiTools = tools && tools.length > 0 ? convertToolsToOpenAI(tools) : undefined
  if (openaiTools && openaiTools.length > 0) {
    request.tools = openaiTools
    request.tool_choice = 'auto'
  }

  const responseFormat = toOpenAIResponseFormat(outputFormat)
  if (responseFormat) {
    request.response_format = responseFormat
  }

  const completion = (await client.chat.completions.create(request as any, {
    signal,
  })) as OpenAICompatibleResponse

  const choice = completion.choices?.[0]
  const text = extractCompletionText(choice?.message?.content)
  const toolCalls = choice?.message?.tool_calls

  // Build content blocks in Anthropic format
  const contentBlocks: any[] = []
  if (text) {
    contentBlocks.push({ type: 'text', text })
  }
  if (toolCalls && toolCalls.length > 0) {
    for (const tc of toolCalls) {
      let input: Record<string, unknown> = {}
      try {
        input = JSON.parse(tc.function.arguments)
      } catch {
        input = { raw: tc.function.arguments }
      }
      contentBlocks.push({
        type: 'tool_use',
        id: tc.id || generateToolCallId(),
        name: tc.function.name,
        input,
      })
    }
  }

  const hasToolUse = contentBlocks.some(b => b.type === 'tool_use')
  const assistantMessage = createAssistantMessage({
    content: contentBlocks.length > 0 ? contentBlocks : text,
  })
  assistantMessage.message.model = modelId
  assistantMessage.message.stop_reason = hasToolUse ? 'tool_use' : 'end_turn'
  assistantMessage.message.stop_sequence = null
  return assistantMessage
}

// ── Streaming query ──

/**
 * Accumulator for streaming tool call deltas.
 * OpenAI streams tool_calls incrementally: first chunk has id+name,
 * subsequent chunks append to arguments.
 */
type ToolCallAccumulator = {
  id: string
  name: string
  arguments: string
  /** Index in the content blocks (after text block) */
  contentIndex: number
}

/**
 * Query an OpenAI-compatible model with streaming, yielding Anthropic-format
 * StreamEvents. Supports tool calling.
 */
export async function* queryOpenAIModelWithStreaming({
  messages,
  systemPrompt,
  signal,
  modelId,
  modelName,
  tools,
}: {
  messages: Message[]
  systemPrompt: Array<{ type: string; text: string }>
  signal: AbortSignal
  modelId: string
  modelName: string
  tools?: BetaToolUnion[]
}): AsyncGenerator<StreamEvent | AssistantMessage | SystemAPIErrorMessage, void> {
  const provider = getProviderForModel(modelName)
  if (!provider) {
    throw new Error(`No provider found for model: ${modelName}`)
  }

  logForDebugging(
    `[LLM] queryOpenAIModelWithStreaming: provider="${provider.name}" modelId="${modelId}" modelName="${modelName}" tools=${tools?.length ?? 0}`,
  )
  const client = (await provider.createClient()) as OpenAICompatibleClient
  logForDebugging(
    `[LLM] OpenAI client created, baseURL="${(client as any).baseURL}"`,
  )

  const openaiMessages = buildOpenAIMessages(messages, systemPrompt)

  const request: Record<string, unknown> = {
    model: modelId,
    messages: openaiMessages,
    stream: true,
  }

  // Add tools if provided
  const openaiTools = tools && tools.length > 0 ? convertToolsToOpenAI(tools) : undefined
  if (openaiTools && openaiTools.length > 0) {
    request.tools = openaiTools
    request.tool_choice = 'auto'
  }

  const messageId = `msg_${Date.now()}`
  yield {
    type: 'stream_event' as const,
    event: {
      type: 'message_start' as const,
      message: {
        id: messageId,
        type: 'message' as const,
        role: 'assistant' as const,
        content: [],
        model: modelId,
        stop_reason: null,
        stop_sequence: null,
        usage: { input_tokens: 0, output_tokens: 0 },
      },
    },
  }

  // Start text content block (index 0)
  yield {
    type: 'stream_event' as const,
    event: {
      type: 'content_block_start' as const,
      index: 0,
      content_block: { type: 'text' as const, text: '' },
    },
  }

  const stream = (await client.chat.completions.create(
    request as any,
    { signal },
  )) as AsyncIterable<OpenAICompatibleChunk>

  let fullText = ''
  let outputTokens = 0
  const startTime = Date.now()
  let ttftEmitted = false
  let textBlockStopped = false

  // Tool call accumulators: keyed by OpenAI's tool_calls[].index
  const toolCallAccumulators = new Map<number, ToolCallAccumulator>()
  // Content block index counter: 0 is text, tool_use blocks start at 1
  let nextContentIndex = 1

  for await (const chunk of stream) {
    const choice = chunk.choices?.[0]
    if (!choice) continue

    // ── Handle text delta ──
    const textDelta = choice.delta?.content
    if (textDelta) {
      fullText += textDelta
      outputTokens++

      yield {
        type: 'stream_event' as const,
        ...(!ttftEmitted ? { ttftMs: Date.now() - startTime } : {}),
        event: {
          type: 'content_block_delta' as const,
          index: 0,
          delta: { type: 'text_delta' as const, text: textDelta },
        },
      }
      ttftEmitted = true
    }

    // ── Handle tool_calls delta ──
    const toolCallDeltas = choice.delta?.tool_calls
    if (toolCallDeltas) {
      // If we haven't stopped the text block yet, do it now
      if (!textBlockStopped) {
        yield {
          type: 'stream_event' as const,
          event: { type: 'content_block_stop' as const, index: 0 },
        }
        textBlockStopped = true
      }

      for (const tcd of toolCallDeltas) {
        const tcIndex = tcd.index
        let acc = toolCallAccumulators.get(tcIndex)

        if (!acc && tcd.id) {
          // New tool call: emit content_block_start
          const contentIndex = nextContentIndex++
          acc = {
            id: tcd.id,
            name: tcd.function?.name ?? '',
            arguments: tcd.function?.arguments ?? '',
            contentIndex,
          }
          toolCallAccumulators.set(tcIndex, acc)

          yield {
            type: 'stream_event' as const,
            ...(!ttftEmitted ? { ttftMs: Date.now() - startTime } : {}),
            event: {
              type: 'content_block_start' as const,
              index: contentIndex,
              content_block: {
                type: 'tool_use' as const,
                id: acc.id,
                name: acc.name,
                input: {},
              },
            },
          }
          ttftEmitted = true

          // If there are initial arguments, emit them
          if (acc.arguments) {
            yield {
              type: 'stream_event' as const,
              event: {
                type: 'content_block_delta' as const,
                index: contentIndex,
                delta: {
                  type: 'input_json_delta' as const,
                  partial_json: acc.arguments,
                },
              },
            }
          }
        } else if (acc) {
          // Continuation: append arguments
          const argDelta = tcd.function?.arguments ?? ''
          if (argDelta) {
            acc.arguments += argDelta

            yield {
              type: 'stream_event' as const,
              event: {
                type: 'content_block_delta' as const,
                index: acc.contentIndex,
                delta: {
                  type: 'input_json_delta' as const,
                  partial_json: argDelta,
                },
              },
            }
          }

          // Update name if provided (rare but possible)
          if (tcd.function?.name) {
            acc.name = tcd.function.name
          }
        }
      }
    }

    if (choice.finish_reason) {
      break
    }
  }

  // ── Close all open content blocks ──

  // Close text block if still open
  if (!textBlockStopped) {
    yield {
      type: 'stream_event' as const,
      event: { type: 'content_block_stop' as const, index: 0 },
    }
  }

  // Close all tool_use blocks
  for (const acc of toolCallAccumulators.values()) {
    yield {
      type: 'stream_event' as const,
      event: { type: 'content_block_stop' as const, index: acc.contentIndex },
    }
  }

  // Determine stop reason
  const hasToolUse = toolCallAccumulators.size > 0
  const stopReason = hasToolUse ? 'tool_use' : 'end_turn'

  yield {
    type: 'stream_event' as const,
    event: {
      type: 'message_delta' as const,
      delta: { stop_reason: stopReason as any, stop_sequence: null },
      usage: { output_tokens: outputTokens },
    },
  }

  yield {
    type: 'stream_event' as const,
    event: {
      type: 'message_stop' as const,
    },
  }

  // ── Build final AssistantMessage ──
  const contentBlocks: any[] = []
  if (fullText) {
    contentBlocks.push({ type: 'text', text: fullText })
  }
  for (const acc of toolCallAccumulators.values()) {
    let input: Record<string, unknown> = {}
    try {
      input = JSON.parse(acc.arguments)
    } catch {
      input = { raw: acc.arguments }
    }
    contentBlocks.push({
      type: 'tool_use',
      id: acc.id || generateToolCallId(),
      name: acc.name,
      input,
    })
  }

  const assistantMessage = createAssistantMessage({
    content: contentBlocks.length > 0 ? contentBlocks : fullText,
  })
  assistantMessage.message.id = messageId
  assistantMessage.message.model = modelId
  assistantMessage.message.stop_reason = stopReason as any
  assistantMessage.message.stop_sequence = null
  assistantMessage.message.usage.output_tokens = outputTokens
  yield assistantMessage
}
