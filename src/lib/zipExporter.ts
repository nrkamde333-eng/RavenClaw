import JSZip from 'jszip';
import { CompiledResult, ChatMessage } from '../types';

export interface ZipExportOptions {
  includeMarkdown: boolean;
  includeText: boolean;
  includeJson: boolean;
  includeCodeSnippets: boolean;
  includeSummary: boolean;
}

export async function createChatZip(
  rawText: string,
  compiledResult: CompiledResult | null,
  sourceName: string,
  targetName: string,
  options: ZipExportOptions = {
    includeMarkdown: true,
    includeText: true,
    includeJson: true,
    includeCodeSnippets: true,
    includeSummary: true,
  }
): Promise<Blob> {
  const zip = new JSZip();
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const folderName = `ai-chat-export-${sourceName.toLowerCase()}-${dateStr}`;
  const root = zip.folder(folderName) || zip;

  // 1. Full Markdown conversation
  if (options.includeMarkdown) {
    const mdContent = compiledResult?.compiledMarkdown || rawText;
    root.file(
      'full_conversation.md',
      `# AI Chat Conversation Export\n**Source:** ${sourceName}\n**Date:** ${new Date().toLocaleString()}\n\n---\n\n${mdContent}`
    );
  }

  // 2. Plain raw text log
  if (options.includeText) {
    root.file('raw_chat_log.txt', rawText);
  }

  // 3. Structured JSON transcript
  if (options.includeJson && compiledResult?.parsedMessages) {
    const jsonData = {
      exportedAt: new Date().toISOString(),
      sourcePlatform: sourceName,
      targetPlatform: targetName,
      totalTurns: compiledResult.parsedMessages.length,
      rawWordCount: compiledResult.rawWordCount,
      messages: compiledResult.parsedMessages.map((m: ChatMessage) => ({
        role: m.role,
        content: m.content,
        wordCount: m.wordCount,
        codeBlocksCount: m.codeBlocks.length,
      })),
      extractedRequirements: compiledResult.userRequirements,
      architecturalDecisions: compiledResult.extractedDecisions,
    };
    root.file('conversation_data.json', JSON.stringify(jsonData, null, 2));
  }

  // 4. Extracted Code Snippets directory
  if (options.includeCodeSnippets && compiledResult?.extractedCodeBlocks && compiledResult.extractedCodeBlocks.length > 0) {
    const codeFolder = root.folder('code_snippets');
    if (codeFolder) {
      compiledResult.extractedCodeBlocks.forEach((cb, idx) => {
        const ext = getExtensionForLang(cb.lang);
        const fileName = cb.filename || `snippet_${idx + 1}.${ext}`;
        codeFolder.file(fileName, cb.code);
      });
    }
  }

  // 5. Readme / Summary note for pasting to other AI
  if (options.includeSummary) {
    const readyToPastePrompt = compiledResult?.compiledMarkdown || rawText;
    root.file(
      'READY_TO_PASTE_INTO_AI.txt',
      `============================================================\nREADY TO PASTE INTO ${targetName.toUpperCase()}\n============================================================\n\nCopy everything below this line and paste it directly into your new chat with ${targetName}:\n\n${readyToPastePrompt}`
    );
  }

  return await zip.generateAsync({ type: 'blob' });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadTextFile(content: string, filename: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  downloadBlob(blob, filename);
}

function getExtensionForLang(lang: string): string {
  const l = (lang || '').toLowerCase().trim();
  const map: Record<string, string> = {
    typescript: 'ts',
    ts: 'ts',
    tsx: 'tsx',
    javascript: 'js',
    js: 'js',
    jsx: 'jsx',
    python: 'py',
    py: 'py',
    html: 'html',
    css: 'css',
    json: 'json',
    sql: 'sql',
    rust: 'rs',
    go: 'go',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    shell: 'sh',
    bash: 'sh',
    yaml: 'yaml',
    yml: 'yml',
    markdown: 'md',
    md: 'md',
  };
  return map[l] || 'txt';
}
