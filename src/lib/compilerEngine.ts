import { AIPlatform, ChatMessage, CodeBlock, CompilerOptions, CompiledResult } from '../types';

export const PLATFORMS: Record<AIPlatform, {
  name: string;
  url: string;
  domain: string;
  themeColor: string;
  logoLetter: string;
}> = {
  gemini: {
    name: 'Gemini',
    url: 'https://gemini.google.com',
    domain: 'gemini.google.com',
    themeColor: '#4285F4',
    logoLetter: 'G',
  },
  chatgpt: {
    name: 'ChatGPT',
    url: 'https://chatgpt.com',
    domain: 'chatgpt.com',
    themeColor: '#10A37F',
    logoLetter: 'O',
  },
  claude: {
    name: 'Claude',
    url: 'https://claude.ai',
    domain: 'claude.ai',
    themeColor: '#D97706',
    logoLetter: 'C',
  },
  deepseek: {
    name: 'DeepSeek',
    url: 'https://chat.deepseek.com',
    domain: 'chat.deepseek.com',
    themeColor: '#0ea5e9',
    logoLetter: 'D',
  },
  generic: {
    name: 'Universal LLM',
    url: '',
    domain: '',
    themeColor: '#8A2BE2',
    logoLetter: 'U',
  },
};

/**
 * Automatically detects the source platform from pasted raw text.
 */
export function detectSourcePlatform(rawText: string): AIPlatform {
  const lower = rawText.toLowerCase();

  if (lower.includes('deepseek') || lower.includes('<think>') || lower.includes('</think>')) {
    return 'deepseek';
  }
  if (
    lower.includes('chatgpt said:') ||
    lower.includes('you said:') ||
    lower.includes('chatgpt 4o') ||
    lower.includes('gpt-4') ||
    lower.includes('chatgpt:') ||
    lower.includes('chatgpt')
  ) {
    return 'chatgpt';
  }
  if (
    lower.includes('claude:') ||
    lower.includes('claude 3.5') ||
    lower.includes('claude 3.7') ||
    lower.includes('human:') ||
    lower.includes('assistant:') ||
    lower.includes('claude.ai')
  ) {
    return 'claude';
  }
  if (
    lower.includes('gemini:') ||
    lower.includes('gemini 1.5') ||
    lower.includes('gemini 2.0') ||
    lower.includes('gemini.google.com') ||
    lower.includes('draft 1') ||
    lower.includes('draft 2')
  ) {
    return 'gemini';
  }

  return 'generic';
}

/**
 * Strips web UI clutter and copy button artifacts from raw pasted transcripts.
 */
export function sanitizeRawText(rawText: string): string {
  let text = rawText;

  // Remove common UI copy/action clutter
  text = text.replace(/Copy code/gi, '');
  text = text.replace(/Copy/gi, '');
  text = text.replace(/Regenerate response/gi, '');
  text = text.replace(/Share/gi, '');
  text = text.replace(/Read aloud/gi, '');
  text = text.replace(/Bad response|Good response/gi, '');
  text = text.replace(/Edit message/gi, '');
  text = text.replace(/Thumbs up|Thumbs down/gi, '');
  text = text.replace(/View other drafts/gi, '');
  text = text.replace(/Modify response/gi, '');

  // Strip raw timestamps like [10:45 AM] or 10:45 AM or Yesterday at 4:20 PM
  text = text.replace(/(?:Yesterday|Today|\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b)?\s*(?:at\s*)?\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?/g, '');

  // Strip excessive trailing spaces on lines
  text = text
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n');

  // Strip more than 3 consecutive empty lines
  text = text.replace(/\n{4,}/g, '\n\n\n');

  return text.trim();
}

/**
 * Extracts fenced code blocks from markdown/text.
 */
export function extractCodeBlocks(text: string): { cleanedText: string; codeBlocks: CodeBlock[] } {
  const codeBlocks: CodeBlock[] = [];
  const codeRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  
  let match;
  while ((match = codeRegex.exec(text)) !== null) {
    const lang = match[1]?.trim() || 'text';
    const code = match[2]?.trimEnd() || '';
    
    // Try to detect filename from leading comment
    let filename: string | undefined = undefined;
    const firstLine = code.split('\n')[0] || '';
    const filenameMatch = firstLine.match(/(?:\/\/\s*|#\s*|<!--\s*|--\s*)(?:filename|file|filepath):\s*([\w./-]+)/i);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].trim();
    }

    codeBlocks.push({ lang, code, filename });
  }

  return { cleanedText: text, codeBlocks };
}

/**
 * Computes word count reliably.
 */
export function countWords(text: string): number {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Parses raw text into discrete turn messages (User vs Assistant vs Thought).
 */
export function parseChatTurns(rawInput: string, platform: AIPlatform): ChatMessage[] {
  const cleaned = sanitizeRawText(rawInput);
  if (!cleaned) return [];

  const messages: ChatMessage[] = [];
  let idCounter = 1;

  // 1. Check for DeepSeek <think> blocks
  const thinkRegex = /<think>([\s\S]*?)<\/think>/gi;
  let remainingText = cleaned;
  
  // Custom splitting by known headers
  // Headers to match:
  // "You said:", "ChatGPT said:", "Human:", "Assistant:", "User:", "Gemini:", "DeepSeek:", "Prompt:", "Response:"
  const turnPatterns = [
    // ChatGPT patterns
    /(?:^|\n)(?:You said:|You:|User:)\s*\n?/gi,
    /(?:^|\n)(?:ChatGPT said:|ChatGPT:|Assistant:)\s*\n?/gi,
    // Claude patterns
    /(?:^|\n)(?:Human:|User:)\s*\n?/gi,
    /(?:^|\n)(?:Claude:|Assistant:)\s*\n?/gi,
    // Gemini patterns
    /(?:^|\n)(?:Prompt:|User:)\s*\n?/gi,
    /(?:^|\n)(?:Gemini:|Model:|Response:)\s*\n?/gi,
    // DeepSeek patterns
    /(?:^|\n)(?:DeepSeek:|Assistant:)\s*\n?/gi,
    // Markdown headers
    /(?:^|\n)##\s+(?:User|Human|Prompt)\s*\n?/gi,
    /(?:^|\n)##\s+(?:Assistant|ChatGPT|Claude|Gemini|DeepSeek|Model|AI)\s*\n?/gi,
    /(?:^|\n)\*\*(?:User|Human|Prompt):\*\*\s*\n?/gi,
    /(?:^|\n)\*\*(?:Assistant|ChatGPT|Claude|Gemini|DeepSeek|Model|AI):\*\*\s*\n?/gi,
  ];

  // Normalized delimiter split
  // We'll replace matching headers with a special marker: [[ROLE:user]] or [[ROLE:assistant]]
  let markedText = cleaned;

  // ChatGPT
  markedText = markedText.replace(/(?:^|\n)(?:You said:|You:|\*\*You:\*\*|## User|\*\*User:\*\*)\s*/gi, '\n[[TURN:user]]\n');
  markedText = markedText.replace(/(?:^|\n)(?:ChatGPT said:|ChatGPT:|\*\*ChatGPT:\*\*|## ChatGPT|\*\*Assistant:\*\*|## Assistant)\s*/gi, '\n[[TURN:assistant]]\n');
  
  // Claude
  markedText = markedText.replace(/(?:^|\n)(?:Human:|\*\*Human:\*\*)\s*/gi, '\n[[TURN:user]]\n');
  markedText = markedText.replace(/(?:^|\n)(?:Claude:|\*\*Claude:\*\*)\s*/gi, '\n[[TURN:assistant]]\n');

  // Gemini
  markedText = markedText.replace(/(?:^|\n)(?:Prompt:|\*\*Prompt:\*\*)\s*/gi, '\n[[TURN:user]]\n');
  markedText = markedText.replace(/(?:^|\n)(?:Gemini:|\*\*Gemini:\*\*|## Gemini|## Model)\s*/gi, '\n[[TURN:assistant]]\n');

  // DeepSeek
  markedText = markedText.replace(/(?:^|\n)(?:DeepSeek:|\*\*DeepSeek:\*\*|## DeepSeek)\s*/gi, '\n[[TURN:assistant]]\n');

  // Generic User/Assistant
  markedText = markedText.replace(/(?:^|\n)(?:User:)\s*/gi, '\n[[TURN:user]]\n');
  markedText = markedText.replace(/(?:^|\n)(?:Assistant:)\s*/gi, '\n[[TURN:assistant]]\n');

  if (markedText.includes('[[TURN:')) {
    const rawParts = markedText.split(/\[\[TURN:(user|assistant)\]\]/i);
    // rawParts will be [prefix, 'user', content, 'assistant', content, ...]
    
    // If there is a prefix before the first tag, include it as user or system
    if (rawParts[0] && rawParts[0].trim()) {
      const pText = rawParts[0].trim();
      const { codeBlocks } = extractCodeBlocks(pText);
      messages.push({
        id: `msg-${idCounter++}`,
        role: 'user',
        content: pText,
        wordCount: countWords(pText),
        codeBlocks,
      });
    }

    for (let i = 1; i < rawParts.length; i += 2) {
      const role = rawParts[i].toLowerCase() === 'assistant' ? 'assistant' : 'user';
      const content = (rawParts[i + 1] || '').trim();
      if (!content) continue;

      // Extract DeepSeek think tags if any
      const thinkMatches = content.match(/<think>([\s\S]*?)<\/think>/i);
      let finalContent = content;
      if (thinkMatches && thinkMatches[1]) {
        // We can record the thoughts
        messages.push({
          id: `msg-${idCounter++}`,
          role: 'thought',
          content: thinkMatches[1].trim(),
          wordCount: countWords(thinkMatches[1]),
          codeBlocks: [],
        });
        finalContent = content.replace(/<think>[\s\S]*?<\/think>/i, '').trim();
      }

      if (finalContent) {
        const { codeBlocks } = extractCodeBlocks(finalContent);
        messages.push({
          id: `msg-${idCounter++}`,
          role,
          content: finalContent,
          wordCount: countWords(finalContent),
          codeBlocks,
        });
      }
    }
  } else {
    // Fallback: Split by double newlines or paragraph blocks
    // If no distinct turn markers, treat the whole document as a single or auto-chunked conversation
    const paragraphs = cleaned.split(/\n\n+/);
    if (paragraphs.length <= 2) {
      const { codeBlocks } = extractCodeBlocks(cleaned);
      messages.push({
        id: `msg-${idCounter++}`,
        role: 'user',
        content: cleaned,
        wordCount: countWords(cleaned),
        codeBlocks,
      });
    } else {
      // Alternating guess if paragraphs are balanced
      paragraphs.forEach((p, idx) => {
        const trimmed = p.trim();
        if (!trimmed) return;
        const { codeBlocks } = extractCodeBlocks(trimmed);
        messages.push({
          id: `msg-${idCounter++}`,
          role: idx % 2 === 0 ? 'user' : 'assistant',
          content: trimmed,
          wordCount: countWords(trimmed),
          codeBlocks,
        });
      });
    }
  }

  return messages;
}

/**
 * Extracts high-value architectural decisions and user requirements from messages.
 */
export function extractKeyInsights(messages: ChatMessage[]) {
  const userRequirements: string[] = [];
  const extractedDecisions: string[] = [];
  const allCodeBlocks: CodeBlock[] = [];

  messages.forEach((msg) => {
    // Collect code blocks
    if (msg.codeBlocks && msg.codeBlocks.length > 0) {
      allCodeBlocks.push(...msg.codeBlocks);
    }

    const lines = msg.content.split('\n');
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('```') || trimmed.length < 15) return;

      if (msg.role === 'user') {
        // Look for requirements patterns
        if (
          /^(?:I need|Please|Make sure|Requirements?:|Goal:|Can you|We want|Should have|Must have|-|\*)/i.test(trimmed) &&
          !userRequirements.includes(trimmed) &&
          userRequirements.length < 10
        ) {
          userRequirements.push(trimmed.replace(/^[-*•]\s*/, ''));
        }
      } else if (msg.role === 'assistant') {
        // Look for architectural/decision patterns
        if (
          /^(?:We will use|Using|Implemented|The architecture|Key decision|Configured|Recommended|Created|Updated|Note that|-|\*)/i.test(trimmed) &&
          !extractedDecisions.includes(trimmed) &&
          extractedDecisions.length < 10
        ) {
          extractedDecisions.push(trimmed.replace(/^[-*•]\s*/, ''));
        }
      }
    });
  });

  // If no requirements were extracted with regex, extract first lines of user messages
  if (userRequirements.length === 0) {
    messages
      .filter(m => m.role === 'user')
      .forEach(m => {
        const firstLine = m.content.split('\n').find(l => l.trim().length > 10);
        if (firstLine && userRequirements.length < 5) {
          userRequirements.push(firstLine.trim());
        }
      });
  }

  // If no decisions extracted, summarize assistant outputs
  if (extractedDecisions.length === 0) {
    messages
      .filter(m => m.role === 'assistant')
      .forEach(m => {
        const line = m.content.split('\n').find(l => l.trim().length > 20 && !l.trim().startsWith('```'));
        if (line && extractedDecisions.length < 5) {
          extractedDecisions.push(line.trim());
        }
      });
  }

  return { userRequirements, extractedDecisions, allCodeBlocks };
}

/**
 * Compiles the handoff markdown output based on source, target, and thresholding.
 */
export function compileContextHandoff(
  rawText: string,
  options: CompilerOptions
): CompiledResult {
  const detectedSource = options.sourcePlatform === 'generic' 
    ? detectSourcePlatform(rawText) 
    : options.sourcePlatform;

  const rawWordCount = countWords(rawText);
  const parsedMessages = parseChatTurns(rawText, detectedSource);
  
  // Word count thresholding
  let modeUsed: 'direct' | 'snapshot' = 'direct';
  if (options.mode === 'auto') {
    modeUsed = rawWordCount >= options.thresholdWords ? 'snapshot' : 'direct';
  } else {
    modeUsed = options.mode;
  }

  const { userRequirements, extractedDecisions, allCodeBlocks } = extractKeyInsights(parsedMessages);
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  const sourceName = PLATFORMS[detectedSource]?.name || 'Previous AI Session';
  const targetName = PLATFORMS[options.targetPlatform]?.name || 'Target AI';

  let compiledMarkdown = '';

  if (modeUsed === 'direct') {
    // Direct Mode: Exact chronological transcript with target-specific preamble
    compiledMarkdown = generateDirectModeMarkdown({
      sourcePlatform: detectedSource,
      targetPlatform: options.targetPlatform,
      sourceName,
      targetName,
      messages: parsedMessages,
      customObjective: options.customObjective,
      includeThoughts: options.includeDeepSeekThoughts,
      timestamp: now,
    });
  } else {
    // Snapshot Mode: Structured architectural breakdown with code state and summary
    compiledMarkdown = generateSnapshotModeMarkdown({
      sourcePlatform: detectedSource,
      targetPlatform: options.targetPlatform,
      sourceName,
      targetName,
      messages: parsedMessages,
      userRequirements,
      extractedDecisions,
      codeBlocks: options.includeCodeBlocks ? allCodeBlocks : [],
      customObjective: options.customObjective,
      timestamp: now,
      rawWordCount,
    });
  }

  const compiledWordCount = countWords(compiledMarkdown);
  const tokensEstimate = Math.round(compiledWordCount * 1.33);
  const savings = rawWordCount > 0 ? Math.max(0, Math.round(((rawWordCount - compiledWordCount) / rawWordCount) * 100)) : 0;

  return {
    modeUsed,
    sourcePlatform: detectedSource,
    targetPlatform: options.targetPlatform,
    rawWordCount,
    compiledWordCount,
    tokensEstimate,
    savingsPercentage: modeUsed === 'snapshot' ? savings : 0,
    parsedMessages,
    compiledMarkdown,
    summaryPoints: userRequirements,
    extractedDecisions,
    extractedCodeBlocks: allCodeBlocks,
    userRequirements,
    activeTask: options.customObjective || 'Continue the session without losing historical state.',
    generatedAt: now,
  };
}

/**
 * Direct Mode Generator (< 600 words)
 */
function generateDirectModeMarkdown(params: {
  sourcePlatform: AIPlatform;
  targetPlatform: AIPlatform;
  sourceName: string;
  targetName: string;
  messages: ChatMessage[];
  customObjective: string;
  includeThoughts: boolean;
  timestamp: string;
}): string {
  const { sourcePlatform, targetPlatform, sourceName, targetName, messages, customObjective, includeThoughts, timestamp } = params;

  if (targetPlatform === 'claude') {
    let transcript = '';
    messages.forEach((msg) => {
      if (msg.role === 'thought') {
        transcript += `<think>\n${msg.content}\n</think>\n\n`;
      } else if (msg.role === 'user') {
        transcript += `<turn role="user">\n${msg.content}\n</turn>\n\n`;
      } else {
        transcript += `<turn role="assistant">\n${msg.content}\n</turn>\n\n`;
      }
    });

    return `<context_handoff>
<metadata>
  <source>${sourceName}</source>
  <target>Claude</target>
  <timestamp>${timestamp}</timestamp>
  <mode>Direct Chronological</mode>
</metadata>
<directive>
You are taking over an active session from ${sourceName}. Review the full chronological turn structure below and proceed directly without repeating established context.
</directive>
<conversation_transcript>
${transcript.trim()}
</conversation_transcript>
<instruction>
${customObjective || 'Please review the conversation history above and execute the next task directly.'}
</instruction>
</context_handoff>`;
  }

  if (targetPlatform === 'chatgpt') {
    let transcript = '';
    messages.forEach((msg) => {
      if (msg.role === 'thought') {
        transcript += `**[Reasoning / Thought]:**\n${msg.content}\n\n`;
      } else {
        const roleLabel = msg.role === 'user' ? 'User' : 'Assistant';
        transcript += `### **${roleLabel}:**\n${msg.content}\n\n`;
      }
    });

    return `### CONTEXT HANDOFF
- **Origin:** ${sourceName}
- **Destination:** ChatGPT
- **Timestamp:** ${timestamp}
- **Mode:** Direct Chronological

---

### **CONVERSATION LOG**
${transcript.trim()}

---

### **NEXT STEP DIRECTIVE**
${customObjective || 'Review the dialogue above and proceed directly with solutions without re-explaining background facts.'}`;
  }

  if (targetPlatform === 'deepseek') {
    let transcript = '';
    messages.forEach((msg) => {
      if (msg.role === 'thought') {
        transcript += `<think>\n${msg.content}\n</think>\n\n`;
      } else {
        const role = msg.role === 'user' ? 'USER' : 'ASSISTANT';
        transcript += `[${role}]\n${msg.content}\n\n`;
      }
    });

    return `[SYSTEM CONTEXT MATRIX]
SOURCE: ${sourceName.toUpperCase()}
TARGET: DEEPSEEK
TIMESTAMP: ${timestamp}
MODE: DIRECT_CHRONOLOGICAL

=== CONVERSATION LOG ===
${transcript.trim()}

=== EXECUTION DIRECTIVE ===
${customObjective || 'Resume implementation from the conversation log above.'}`;
  }

  // Universal / Gemini
  let transcript = '';
  messages.forEach((msg) => {
    if (msg.role === 'thought') {
      transcript += `<think>\n${msg.content}\n</think>\n\n`;
    } else {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      transcript += `**[${role}]**:\n${msg.content}\n\n`;
    }
  });

  return `[CONTEXT HANDOFF: ${sourceName.toUpperCase()} -> ${targetName.toUpperCase()}]
[TIMESTAMP: ${timestamp}]
[MODE: Direct Chronological]

==================================================
${transcript.trim()}
==================================================

[NEXT-STEP DIRECTIVE]
${customObjective || 'Review the context above and proceed directly with solutions.'}`;
}

/**
 * Snapshot Mode Generator (≥ 600 words)
 */
function generateSnapshotModeMarkdown(params: {
  sourcePlatform: AIPlatform;
  targetPlatform: AIPlatform;
  sourceName: string;
  targetName: string;
  messages: ChatMessage[];
  userRequirements: string[];
  extractedDecisions: string[];
  codeBlocks: CodeBlock[];
  customObjective: string;
  timestamp: string;
  rawWordCount: number;
}): string {
  const { sourcePlatform, targetPlatform, sourceName, targetName, userRequirements, extractedDecisions, codeBlocks, customObjective, timestamp, rawWordCount } = params;

  if (targetPlatform === 'claude') {
    return `<context_handoff>
<metadata>
  <source>${sourceName}</source>
  <target>Claude</target>
  <timestamp>${timestamp}</timestamp>
  <mode>Snapshot</mode>
  <original_word_count>${rawWordCount}</original_word_count>
</metadata>
<conversation_summary>
  <active_requirements>
${userRequirements.map(req => `    <item>${req}</item>`).join('\n')}
  </active_requirements>
  <system_architecture_decisions>
${extractedDecisions.map(dec => `    <decision>${dec}</decision>`).join('\n')}
  </system_architecture_decisions>
</conversation_summary>
${codeBlocks.length > 0 ? `<actionable_code_blocks>
${codeBlocks.map((cb, i) => `  <code_artifact index="${i + 1}" language="${cb.lang}" ${cb.filename ? `file="${cb.filename}"` : ''}>
\`\`\`${cb.lang}
${cb.code}
\`\`\`
  </code_artifact>`).join('\n')}
</actionable_code_blocks>` : ''}
<instruction>
${customObjective || 'Continue implementation based on the active requirements, system architecture decisions, and code artifacts above.'}
</instruction>
</context_handoff>`;
  }

  if (targetPlatform === 'chatgpt') {
    return `### CONTEXT HANDOFF
- **Origin:** ${sourceName}
- **Destination:** ChatGPT
- **Timestamp:** ${timestamp}
- **Mode:** Compressed Snapshot (${rawWordCount} raw words)

---

### **ACTIVE REQUIREMENTS**
${userRequirements.map(req => `- **Requirement:** ${req}`).join('\n')}

---

### **SYSTEM ARCHITECTURE & DECISIONS**
${extractedDecisions.map(dec => `- **Decision:** ${dec}`).join('\n')}

---

${codeBlocks.length > 0 ? `### **ACTIONABLE CODE BLOCKS**
${codeBlocks.map((cb, i) => `#### Snippet ${i + 1} (${cb.lang}${cb.filename ? ` - ${cb.filename}` : ''})
\`\`\`${cb.lang}
${cb.code}
\`\`\``).join('\n\n')}

---` : ''}

### **NEXT STEP DIRECTIVE**
${customObjective || 'Please review the active requirements and architecture above and proceed with the next task directly.'}`;
  }

  if (targetPlatform === 'deepseek') {
    return `[SYSTEM CONTEXT MATRIX]
SOURCE: ${sourceName.toUpperCase()}
TARGET: DEEPSEEK
TIMESTAMP: ${timestamp}
MODE: COMPRESSED_SNAPSHOT
ORIGINAL_WORD_COUNT: ${rawWordCount}

=== ACTIVE REQUIREMENTS & CONSTRAINTS ===
${userRequirements.map((req, i) => `[REQ-${i + 1}] ${req}`).join('\n')}

=== SYSTEM ARCHITECTURE DECISIONS ===
${extractedDecisions.map((dec, i) => `[ARCH-${i + 1}] ${dec}`).join('\n')}

${codeBlocks.length > 0 ? `=== ACTIONABLE CODE BLOCKS ===
${codeBlocks.map((cb, i) => `[BLOCK-${i + 1}] ${cb.filename || cb.lang}
\`\`\`${cb.lang}
${cb.code}
\`\`\``).join('\n\n')}
` : ''}
=== EXECUTION DIRECTIVE ===
${customObjective || 'Execute technical tasks in accordance with the system matrix and code artifacts.'}`;
  }

  // Universal / Gemini
  return `[CONTEXT HANDOFF: ${sourceName.toUpperCase()} -> ${targetName.toUpperCase()}]
[TIMESTAMP: ${timestamp}]
[MODE: Compressed Snapshot (${rawWordCount} words)]

[ACTIVE REQUIREMENTS]
${userRequirements.map(req => `- ${req}`).join('\n')}

[SYSTEM ARCHITECTURE DECISIONS]
${extractedDecisions.map(dec => `- ${dec}`).join('\n')}

${codeBlocks.length > 0 ? `[ACTIONABLE CODE BLOCKS]
${codeBlocks.map((cb, i) => `\`\`\`${cb.lang}
${cb.code}
\`\`\``).join('\n\n')}
` : ''}
[NEXT-STEP DIRECTIVE]
${customObjective || 'Continue implementation based on the active requirements and system architecture decisions.'}`;
}
