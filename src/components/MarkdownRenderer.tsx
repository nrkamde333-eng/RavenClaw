import React, { useState } from 'react';
import { Copy, Check, Terminal, Code2, Tag, FileText } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-slate-500">
        <FileText className="w-12 h-12 mb-3 opacity-30 text-purple-400" />
        <p className="text-sm font-medium">No compiled output yet</p>
        <p className="text-xs text-slate-500 mt-1">Paste a chat session on the left and click "Compile Handoff"</p>
      </div>
    );
  }

  const copyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Process and split text into markdown segments
  const lines = content.split('\n');
  const renderedElements: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockContent: string[] = [];
  let codeBlockIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        const fullCode = codeBlockContent.join('\n');
        const currentIndex = codeBlockIndex++;
        renderedElements.push(
          <div key={`code-${currentIndex}`} className="my-3 rounded-lg overflow-hidden border border-[#2e2e44] bg-[#0d0d14]">
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#171724] border-b border-[#2e2e44] text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5 text-purple-300 font-medium">
                <Code2 className="w-3.5 h-3.5" />
                {codeBlockLang || 'code'}
              </span>
              <button
                type="button"
                id={`btn-copy-code-${currentIndex}`}
                onClick={() => copyCode(fullCode, currentIndex)}
                className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-[#26263b] text-slate-300 transition-colors text-[11px]"
              >
                {copiedIndex === currentIndex ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 overflow-x-auto text-xs font-mono text-emerald-300/90 leading-relaxed">
              <code>{fullCode}</code>
            </pre>
          </div>
        );
        inCodeBlock = false;
        codeBlockContent = [];
        codeBlockLang = '';
      } else {
        // Start of code block
        inCodeBlock = true;
        codeBlockLang = line.replace('```', '').trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Handle XML tags formatting (for Claude output)
    if (line.trim().startsWith('<') && line.trim().endsWith('>')) {
      renderedElements.push(
        <div key={`xml-${i}`} className="font-mono text-xs text-purple-400 font-semibold py-0.5 flex items-center gap-1.5">
          <Tag className="w-3 h-3 opacity-60" />
          <span>{line}</span>
        </div>
      );
      continue;
    }

    // Headers
    if (line.startsWith('# ')) {
      renderedElements.push(
        <h1 key={`h1-${i}`} className="text-base font-bold text-white mt-4 mb-2 pb-1 border-b border-purple-900/40 text-purple-200">
          {line.replace('# ', '')}
        </h1>
      );
    } else if (line.startsWith('## ')) {
      renderedElements.push(
        <h2 key={`h2-${i}`} className="text-sm font-semibold text-purple-300 mt-3 mb-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
          {line.replace('## ', '')}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      renderedElements.push(
        <h3 key={`h3-${i}`} className="text-xs font-semibold text-slate-200 mt-2.5 mb-1 text-slate-300">
          {line.replace('### ', '')}
        </h3>
      );
    } else if (line.startsWith('---') || line.startsWith('===')) {
      renderedElements.push(
        <hr key={`hr-${i}`} className="border-t border-[#2d2d42] my-3" />
      );
    } else if (line.startsWith('> ')) {
      renderedElements.push(
        <div key={`quote-${i}`} className="border-l-2 border-purple-500 bg-purple-950/20 px-3 py-1.5 my-2 text-xs text-purple-200/90 rounded-r">
          {line.replace('> ', '')}
        </div>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      renderedElements.push(
        <li key={`li-${i}`} className="text-xs text-slate-300 ml-4 list-disc py-0.5 leading-relaxed">
          {line.replace(/^[-*]\s*/, '')}
        </li>
      );
    } else if (line.trim().length === 0) {
      renderedElements.push(<div key={`empty-${i}`} className="h-2" />);
    } else {
      renderedElements.push(
        <p key={`p-${i}`} className="text-xs text-slate-300 py-0.5 leading-relaxed">
          {line}
        </p>
      );
    }
  }

  return <div className="space-y-0.5 font-sans">{renderedElements}</div>;
};
