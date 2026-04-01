import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from '../ink.js';
import { updateSettingsForSource } from '../utils/settings/settings.js';
import { initializeLLMRegistry } from '../services/llm/index.js';

const PROVIDERS = [
  { name: 'anthropic', label: 'Anthropic', sourceType: 'anthropic', defaultBaseUrl: 'https://api.anthropic.com', defaultModel: 'claude-sonnet-4-6' },
  { name: 'openai', label: 'OpenAI', sourceType: 'openai', defaultBaseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o' },
  { name: 'deepseek', label: 'DeepSeek', sourceType: 'openai', defaultBaseUrl: 'https://api.deepseek.com', defaultModel: 'deepseek-chat' },
  { name: 'minimax', label: 'MiniMax', sourceType: 'openai', defaultBaseUrl: 'https://api.minimax.chat/v1', defaultModel: 'MiniMax-M1' },
  { name: 'qwen', label: 'Qwen (通义千问)', sourceType: 'openai', defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', defaultModel: 'qwen-plus' },
  { name: 'kimi', label: 'Kimi (Moonshot)', sourceType: 'openai', defaultBaseUrl: 'https://api.moonshot.cn/v1', defaultModel: 'moonshot-v1-auto' },
  { name: 'glm', label: 'GLM (智谱)', sourceType: 'openai', defaultBaseUrl: 'https://open.bigmodel.cn/api/paas/v4/', defaultModel: 'glm-4-plus' },
];

type Step = 'provider' | 'apiKey' | 'baseUrl' | 'modelId' | 'saving';

/**
 * API Key 配置组件 — 替代原 OAuth 登录流程。
 * 流程: 选择 Provider → 输入 API Key → 输入 Base URL → 输入 Model ID → 保存
 */
export function ConsoleOAuthFlow({
  onDone,
}: {
  onDone: (success?: boolean) => void
  startingMessage?: string
  mode?: string
  forceLoginMethod?: string
}): React.ReactNode {
  const [step, setStep] = useState<Step>('provider');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [baseUrlInput, setBaseUrlInput] = useState('');
  const [modelIdInput, setModelIdInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const selectedProvider = PROVIDERS[selectedIndex]!;

  const saveConfig = useCallback(async (
    providerName: string,
    sourceType: string,
    key: string,
    baseUrl: string,
    modelId: string,
  ) => {
    setStep('saving');
    try {
      const modelAlias = providerName;
      await updateSettingsForSource('userSettings', {
        llm: {
          providers: {
            [providerName]: {
              apiKey: key,
              sourceType,
              baseUrl,
            },
          },
          models: {
            [modelAlias]: {
              provider: providerName,
              modelId,
            },
          },
          defaultModel: modelAlias,
        },
      } as any);

      // 重新初始化 registry
      const { getInitialSettings } = await import('../utils/settings/settings.js');
      const settings = getInitialSettings();
      const llmConfig = (settings as Record<string, unknown>).llm as Record<string, unknown> | undefined;
      initializeLLMRegistry(llmConfig);

      onDone(true);
    } catch (e) {
      setError(`Failed to save: ${e}`);
      setStep('modelId');
    }
  }, [onDone]);

  useInput((input, key) => {
    if (step === 'provider') {
      if (key.upArrow) {
        setSelectedIndex(i => Math.max(0, i - 1));
      } else if (key.downArrow) {
        setSelectedIndex(i => Math.min(PROVIDERS.length - 1, i + 1));
      } else if (key.return) {
        setStep('apiKey');
      } else if (key.escape) {
        onDone(false);
      }
    } else if (step === 'apiKey') {
      if (key.return && apiKeyInput.length > 0) {
        setBaseUrlInput(PROVIDERS[selectedIndex]!.defaultBaseUrl);
        setStep('baseUrl');
      } else if (key.escape) {
        setStep('provider');
        setApiKeyInput('');
      } else if (key.backspace || key.delete) {
        setApiKeyInput(prev => prev.slice(0, -1));
      } else if (input && !key.ctrl && !key.meta) {
        setApiKeyInput(prev => prev + input);
      }
    } else if (step === 'baseUrl') {
      if (key.return) {
        setModelIdInput(PROVIDERS[selectedIndex]!.defaultModel);
        setStep('modelId');
      } else if (key.escape) {
        setStep('apiKey');
      } else if (key.backspace || key.delete) {
        setBaseUrlInput(prev => prev.slice(0, -1));
      } else if (input && !key.ctrl && !key.meta) {
        setBaseUrlInput(prev => prev + input);
      }
    } else if (step === 'modelId') {
      if (key.return) {
        const p = PROVIDERS[selectedIndex]!;
        const finalUrl = baseUrlInput.trim() || p.defaultBaseUrl;
        const finalModel = modelIdInput.trim() || p.defaultModel;
        void saveConfig(p.name, p.sourceType, apiKeyInput, finalUrl, finalModel);
      } else if (key.escape) {
        setStep('baseUrl');
      } else if (key.backspace || key.delete) {
        setModelIdInput(prev => prev.slice(0, -1));
      } else if (input && !key.ctrl && !key.meta) {
        setModelIdInput(prev => prev + input);
      }
    }
  });

  if (step === 'saving') {
    return <Text color="yellow">Saving...</Text>;
  }

  if (step === 'provider') {
    return (
      <Box flexDirection="column">
        <Text bold>Select LLM Provider:</Text>
        <Text> </Text>
        {PROVIDERS.map((p, i) => (
          <Text key={p.name}>
            {i === selectedIndex ? '› ' : '  '}
            <Text color={i === selectedIndex ? 'cyan' : undefined} bold={i === selectedIndex}>
              {p.label}
            </Text>
          </Text>
        ))}
        <Text> </Text>
        <Text dimColor>↑↓ select · Enter confirm · Esc cancel</Text>
      </Box>
    );
  }

  if (step === 'apiKey') {
    return (
      <Box flexDirection="column">
        <Text bold>Enter API Key for {selectedProvider.label}:</Text>
        <Text> </Text>
        <Box>
          <Text color="cyan">{'> '}</Text>
          <Text>{apiKeyInput.length > 0 ? '•'.repeat(apiKeyInput.length) : ''}</Text>
          <Text color="gray">█</Text>
        </Box>
        {error && <Text color="red">{error}</Text>}
        <Text> </Text>
        <Text dimColor>Enter next · Esc back</Text>
      </Box>
    );
  }

  if (step === 'baseUrl') {
    return (
      <Box flexDirection="column">
        <Text bold>Base URL for {selectedProvider.label}:</Text>
        <Text dimColor>Default: {selectedProvider.defaultBaseUrl}</Text>
        <Text> </Text>
        <Box>
          <Text color="cyan">{'> '}</Text>
          <Text>{baseUrlInput}</Text>
          <Text color="gray">█</Text>
        </Box>
        <Text> </Text>
        <Text dimColor>Enter next (empty = use default) · Esc back</Text>
      </Box>
    );
  }

  // step === 'modelId'
  return (
    <Box flexDirection="column">
      <Text bold>Model ID for {selectedProvider.label}:</Text>
      <Text dimColor>Default: {selectedProvider.defaultModel}</Text>
      <Text> </Text>
      <Box>
        <Text color="cyan">{'> '}</Text>
        <Text>{modelIdInput}</Text>
        <Text color="gray">█</Text>
      </Box>
      {error && <Text color="red">{error}</Text>}
      <Text> </Text>
      <Text dimColor>Enter confirm (empty = use default) · Esc back</Text>
    </Box>
  );
}
