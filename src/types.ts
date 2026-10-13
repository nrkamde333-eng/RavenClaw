export type AIPlatform = 'gemini' | 'chatgpt' | 'claude' | 'deepseek' | 'generic';

export interface CodeBlock {
  lang: string;
  code: string;
  filename?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'thought';
  content: string;
  rawText?: string;
  timestamp?: string;
  wordCount: number;
  codeBlocks: CodeBlock[];
}

export type CompilationMode = 'auto' | 'direct' | 'snapshot';

export interface CompilerOptions {
  sourcePlatform: AIPlatform;
  targetPlatform: AIPlatform;
  mode: CompilationMode;
  thresholdWords: number;
  customObjective: string;
  includeCodeBlocks: boolean;
  includeDeepSeekThoughts: boolean;
  stripUiArtifacts: boolean;
}

export interface CompiledResult {
  modeUsed: 'direct' | 'snapshot';
  sourcePlatform: AIPlatform;
  targetPlatform: AIPlatform;
  rawWordCount: number;
  compiledWordCount: number;
  tokensEstimate: number;
  savingsPercentage: number;
  parsedMessages: ChatMessage[];
  compiledMarkdown: string;
  summaryPoints: string[];
  extractedDecisions: string[];
  extractedCodeBlocks: CodeBlock[];
  userRequirements: string[];
  activeTask: string;
  generatedAt: string;
}

export interface VaultEntry {
  id: string;
  title: string;
  createdAt: string;
  sourcePlatform: AIPlatform;
  targetPlatform: AIPlatform;
  modeUsed: 'direct' | 'snapshot';
  rawWordCount: number;
  compiledWordCount: number;
  rawText: string;
  compiledMarkdown: string;
  tags: string[];
  customObjective?: string;
}

export interface PlatformConfig {
  id: AIPlatform;
  name: string;
  url: string;
  iconName: string;
  primaryColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  placeholderPrompt: string;
  framingStyle: 'xml' | 'markdown_system' | 'structured_bullets' | 'technical_concise' | 'universal';
}
