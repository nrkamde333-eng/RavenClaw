import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Download,
  BookmarkPlus,
  ExternalLink,
  ChevronDown,
  Layers,
  Code2,
  FileText,
  Zap,
  TrendingDown,
  Brain,
  Sliders,
  Compass,
} from 'lucide-react';
import { AIPlatform, CompilationMode, CompiledResult } from '../types';
import { PLATFORMS } from '../lib/compilerEngine';
import { MarkdownRenderer } from './MarkdownRenderer';

interface RightPaneProps {
  compiledResult: CompiledResult | null;
  targetPlatform: AIPlatform;
  onChangeTargetPlatform: (platform: AIPlatform) => void;
  compilationMode: CompilationMode;
  onChangeCompilationMode: (mode: CompilationMode) => void;
  customObjective: string;
  onChangeCustomObjective: (val: string) => void;
  includeCodeBlocks: boolean;
  onToggleIncludeCode: (val: boolean) => void;
  includeThoughts: boolean;
  onToggleIncludeThoughts: (val: boolean) => void;
  onSaveToVault: () => void;
  onOpenLaunchHelper: () => void;
}

export const RightPane: React.FC<RightPaneProps> = ({
  compiledResult,
  targetPlatform,
  onChangeTargetPlatform,
  compilationMode,
  onChangeCompilationMode,
  customObjective,
  onChangeCustomObjective,
  includeCodeBlocks,
  onToggleIncludeCode,
  includeThoughts,
  onToggleIncludeThoughts,
  onSaveToVault,
  onOpenLaunchHelper,
}) => {
  const [activeView, setActiveView] = useState<'preview' | 'raw'>('preview');
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const targetConfig = PLATFORMS[targetPlatform];

  const handleCopyClipboard = async () => {
    if (!compiledResult?.compiledMarkdown) return;
    try {
      await navigator.clipboard.writeText(compiledResult.compiledMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const handleSaveToVault = () => {
    onSaveToVault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!compiledResult?.compiledMarkdown) return;
    const blob = new Blob([compiledResult.compiledMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.download = `ravenclaw-handoff-${targetPlatform}-${dateStr}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const objectiveSuggestions = [
    'Refactor code architecture for production',
    'Write complete unit tests with edge cases',
    'Debug and fix the reported runtime error',
    'Implement database synchronization layer',
    'Add Swagger API documentation and types',
  ];

  return (
    <section className="flex flex-col h-full bg-[#1E1E2C] rounded-xl border border-gray-800 p-4 shadow-lg overflow-hidden">
      {/* Pane Header */}
      <div className="flex justify-between items-center mb-2">
        <label className="font-semibold text-sm text-gray-300">
          2. Compiled Handoff Package
        </label>
        <span
          id="wordCountBadge"
          className="text-xs bg-gray-800 text-purple-400 px-2 py-0.5 rounded font-mono font-medium"
        >
          {compiledResult ? `${compiledResult.compiledWordCount} Words` : '0 Words'}
        </span>
      </div>

      {/* Target Framing & Custom Objective Input */}
      <div className="p-2.5 bg-black/30 rounded-lg border border-[#27273c] mb-2 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Continuation Objective:
          </span>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
          >
            <Sliders className="w-3 h-3" />
            <span>{showAdvanced ? 'Hide Options' : 'Framing Options'}</span>
          </button>
        </div>

        <input
          type="text"
          id="input-custom-objective"
          value={customObjective}
          onChange={(e) => onChangeCustomObjective(e.target.value)}
          placeholder="e.g. Please analyze this state and implement unit tests for the auth module..."
          className="w-full bg-[#1c1c2e] text-xs text-slate-100 placeholder-slate-500 rounded-lg px-2.5 py-1.5 border border-[#2d2d46] focus:outline-none focus:border-purple-500"
        />

        {/* Advanced Framing Settings */}
        {showAdvanced && (
          <div className="pt-2 mt-1 border-t border-[#252538] flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCodeBlocks}
                  onChange={(e) => onToggleIncludeCode(e.target.checked)}
                  className="rounded bg-[#1a1a2b] border-[#373752] text-purple-600 focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-[11px]">Include Extracted Code Artifacts</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeThoughts}
                  onChange={(e) => onToggleIncludeThoughts(e.target.checked)}
                  className="rounded bg-[#1a1a2b] border-[#373752] text-purple-600 focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-[11px]">Include DeepSeek Reasoning</span>
              </label>
            </div>

            {/* Mode Override */}
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-slate-400">Mode:</span>
              {(['auto', 'direct', 'snapshot'] as CompilationMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onChangeCompilationMode(m)}
                  className={`px-2 py-0.5 rounded capitalize ${
                    compilationMode === m
                      ? 'bg-purple-700 text-white font-medium'
                      : 'bg-[#1e1e30] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Metrics & View Switcher */}
      <div className="flex items-center justify-between px-2.5 py-1 mb-2 bg-black/20 rounded border border-[#232336] text-[11px]">
        {compiledResult ? (
          <div className="flex items-center gap-3 font-mono text-slate-300">
            <span className="text-slate-400">Est. Tokens:</span>
            <span className="text-purple-300 font-semibold">{compiledResult.tokensEstimate}</span>

            {compiledResult.savingsPercentage > 0 && (
              <span className="flex items-center gap-0.5 text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/40 font-semibold text-[10px]">
                <TrendingDown className="w-3 h-3" />
                {compiledResult.savingsPercentage}% Token Savings
              </span>
            )}
          </div>
        ) : (
          <div className="text-slate-500 text-xs">Ready to compile context</div>
        )}

        <div className="flex items-center bg-[#1e1e2c] rounded p-0.5 border border-[#2b2b40]">
          <button
            type="button"
            id="btn-view-preview"
            onClick={() => setActiveView('preview')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              activeView === 'preview'
                ? 'bg-[#6A0DAD] text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Formatted
          </button>
          <button
            type="button"
            id="btn-view-raw-md"
            onClick={() => setActiveView('raw')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              activeView === 'raw'
                ? 'bg-[#6A0DAD] text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Raw View
          </button>
        </div>
      </div>

      {/* Main Output Content Body */}
      <div className="relative flex-1 min-h-[300px] overflow-y-auto p-3 bg-black/40 border border-gray-700 rounded-lg">
        {activeView === 'preview' && compiledResult?.compiledMarkdown ? (
          <MarkdownRenderer content={compiledResult.compiledMarkdown} />
        ) : (
          <textarea
            id="compiledOutput"
            readOnly
            value={compiledResult?.compiledMarkdown || ''}
            placeholder="Compiled context ready for export will appear here..."
            className="w-full h-full bg-transparent text-purple-200 focus:outline-none resize-none font-mono text-xs leading-relaxed"
          />
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="mt-4 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-1.5">
          {/* Save to Vault */}
          <button
            type="button"
            id="btn-save-to-vault"
            onClick={handleSaveToVault}
            disabled={!compiledResult?.compiledMarkdown}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#202032] hover:bg-[#2a2a42] text-purple-300 hover:text-purple-200 border border-purple-900/40 text-xs transition-colors disabled:opacity-40"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Saved!</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="w-3 h-3 text-purple-400" />
                <span>Save Vault</span>
              </>
            )}
          </button>

          {/* Download Markdown */}
          <button
            type="button"
            id="btn-download-markdown"
            onClick={handleDownloadMarkdown}
            disabled={!compiledResult?.compiledMarkdown}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#202032] hover:bg-[#2a2a42] text-slate-300 hover:text-white border border-[#2e2e46] text-xs transition-colors disabled:opacity-40"
            title="Download formatted .md file"
          >
            <Download className="w-3 h-3" />
            <span>Download .md</span>
          </button>
        </div>

        {/* Copy to Clipboard */}
        <button
          type="button"
          id="copyToClipboard"
          onClick={handleCopyClipboard}
          disabled={!compiledResult?.compiledMarkdown}
          className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-semibold border border-gray-600 flex items-center space-x-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
        >
          <span>{copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
          <span>📋</span>
        </button>
      </div>
    </section>
  );
};
