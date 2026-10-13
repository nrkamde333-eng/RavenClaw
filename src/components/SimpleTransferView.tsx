import React, { useState, useRef } from 'react';
import { 
  ExternalLink, 
  Download, 
  Copy, 
  Check, 
  FileArchive, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  Upload, 
  Clipboard, 
  Trash2, 
  Bot, 
  CheckCircle2, 
  Code2, 
  Layers,
  HelpCircle
} from 'lucide-react';
import { AIPlatform, CompiledResult, PlatformConfig } from '../types';
import { PLATFORMS } from '../lib/compilerEngine';
import { createChatZip, downloadBlob, downloadTextFile } from '../lib/zipExporter';

interface SimpleTransferViewProps {
  rawText: string;
  onChangeRawText: (text: string) => void;
  sourcePlatform: AIPlatform;
  onChangeSourcePlatform: (platform: AIPlatform) => void;
  targetPlatform: AIPlatform;
  onChangeTargetPlatform: (platform: AIPlatform) => void;
  detectedSource: AIPlatform;
  compiledResult: CompiledResult | null;
  onTriggerCompile: () => void;
  onLoadPreset: (key: string) => void;
}

export const SimpleTransferView: React.FC<SimpleTransferViewProps> = ({
  rawText,
  onChangeRawText,
  sourcePlatform,
  onChangeSourcePlatform,
  targetPlatform,
  onChangeTargetPlatform,
  detectedSource,
  compiledResult,
  onTriggerCompile,
  onLoadPreset,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [instructionsModal, setInstructionsModal] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeSourceKey = sourcePlatform === 'generic' ? detectedSource : sourcePlatform;
  const currentSource = PLATFORMS[activeSourceKey] || PLATFORMS.chatgpt;
  const currentTarget = PLATFORMS[targetPlatform] || PLATFORMS.claude;

  const wordCount = rawText.trim() ? rawText.trim().split(/\s+/).length : 0;
  const messageCount = compiledResult?.parsedMessages.length || 0;
  const codeBlocksCount = compiledResult?.extractedCodeBlocks.length || 0;

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onChangeRawText(text);
      }
    } catch {
      // Fallback
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (content) {
        onChangeRawText(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCopyReadyPrompt = async () => {
    const textToCopy = compiledResult?.compiledMarkdown || rawText;
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenTargetAndPaste = async () => {
    const textToCopy = compiledResult?.compiledMarkdown || rawText;
    if (textToCopy) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch (e) {
        console.error(e);
      }
    }
    if (currentTarget.url) {
      window.open(currentTarget.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownloadZip = async () => {
    if (!rawText.trim()) return;
    setDownloadingZip(true);
    try {
      const blob = await createChatZip(
        rawText,
        compiledResult,
        currentSource.name,
        currentTarget.name
      );
      const safeName = currentSource.name.toLowerCase().replace(/\s+/g, '-');
      downloadBlob(blob, `chat-export-${safeName}-${new Date().toISOString().slice(0, 10)}.zip`);
      setDownloadSuccess('ZIP Package downloaded successfully!');
      setTimeout(() => setDownloadSuccess(null), 3000);
    } catch (err) {
      console.error('Error generating zip', err);
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleDownloadFile = (format: 'md' | 'txt' | 'json') => {
    if (!rawText.trim()) return;
    const date = new Date().toISOString().slice(0, 10);
    const safeName = currentSource.name.toLowerCase().replace(/\s+/g, '-');

    if (format === 'md') {
      const content = compiledResult?.compiledMarkdown || rawText;
      downloadTextFile(content, `chat-${safeName}-${date}.md`, 'text/markdown');
      setDownloadSuccess('Markdown file downloaded!');
    } else if (format === 'txt') {
      downloadTextFile(rawText, `chat-log-${safeName}-${date}.txt`, 'text/plain');
      setDownloadSuccess('Text log downloaded!');
    } else if (format === 'json') {
      const jsonData = {
        exportedAt: new Date().toISOString(),
        source: currentSource.name,
        target: currentTarget.name,
        messages: compiledResult?.parsedMessages || [],
        rawText,
      };
      downloadTextFile(JSON.stringify(jsonData, null, 2), `chat-data-${safeName}-${date}.json`, 'application/json');
      setDownloadSuccess('JSON data downloaded!');
    }
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12">
      {/* Toast Alert */}
      {downloadSuccess && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-emerald-500 font-medium text-sm animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Main 3-Step Card Flow */}
      <div className="grid grid-cols-1 gap-6">

        {/* STEP 1: Connect / Source AI */}
        <div className="bg-[#1E1E2C] border border-gray-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-900/60 border border-purple-500/40 flex items-center justify-center font-bold text-purple-300 text-sm">
                1
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  Select Source AI App & Copy Chat
                </h2>
                <p className="text-xs text-gray-400">
                  Where is your current chat conversation located?
                </p>
              </div>
            </div>

            {/* Try Sample Data Button */}
            {!rawText && (
              <button
                type="button"
                onClick={() => onLoadPreset('authRefactor')}
                className="text-xs text-purple-300 bg-purple-950/70 hover:bg-purple-900 border border-purple-800/60 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Load Sample Chat</span>
              </button>
            )}
          </div>

          {/* AI Selection Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {(['chatgpt', 'claude', 'gemini', 'deepseek'] as AIPlatform[]).map((platformKey) => {
              const p = PLATFORMS[platformKey];
              const isSelected = activeSourceKey === platformKey;
              return (
                <div
                  key={platformKey}
                  onClick={() => onChangeSourcePlatform(platformKey)}
                  className={`cursor-pointer rounded-xl p-3 border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-500 shadow-md ring-1 ring-purple-500/50'
                      : 'bg-[#151522] border-gray-800 hover:border-gray-700 hover:bg-[#181828]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-white">{p.name}</span>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      title={`Open ${p.name} in new tab`}
                      className="p-1 rounded-md bg-gray-800/80 hover:bg-purple-900 text-gray-400 hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <span className="text-[11px] text-gray-400">
                    {isSelected ? '✓ Selected source' : 'Click to select'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Quick Actions Bar for Step 1 */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 bg-[#141420] p-2.5 rounded-xl border border-gray-800/80">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="flex items-center gap-1.5 bg-[#6A0DAD] hover:bg-[#7B1FA2] text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow transition-all"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>Paste from Clipboard</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-700 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Chat File (.txt / .md / .json)</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.json,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {rawText && (
              <button
                type="button"
                onClick={() => onChangeRawText('')}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-rose-950/40 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Text</span>
              </button>
            )}
          </div>

          {/* Chat Text Input Area */}
          <textarea
            id="rawInput"
            rows={6}
            value={rawText}
            onChange={(e) => onChangeRawText(e.target.value)}
            placeholder={`Paste raw conversation from ${currentSource.name} here (e.g. select all in your chat window, copy, and paste here)...`}
            className="w-full bg-black/40 border border-gray-700 rounded-xl p-3.5 text-sm text-gray-200 font-mono focus:outline-none focus:border-purple-500 resize-y leading-relaxed"
          />

          {/* Chat Summary Status Badge */}
          {rawText.trim() && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 p-2.5 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-xs text-emerald-300 font-mono">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 font-bold text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Chat Loaded
                </span>
                <span>• {wordCount} Words</span>
                {messageCount > 0 && <span>• {messageCount} Turns</span>}
                {codeBlocksCount > 0 && <span>• {codeBlocksCount} Code Snippets</span>}
              </div>
              <span className="text-[11px] text-gray-400">
                Source: {currentSource.name}
              </span>
            </div>
          )}
        </div>

        {/* STEP 2: Download Options (File or ZIP) */}
        <div className="bg-[#1E1E2C] border border-gray-800 rounded-2xl p-5 sm:p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-800">
            <div className="w-8 h-8 rounded-xl bg-purple-900/60 border border-purple-500/40 flex items-center justify-center font-bold text-purple-300 text-sm">
              2
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Download Whole Chat as File or ZIP
              </h2>
              <p className="text-xs text-gray-400">
                Save your complete conversation history offline with extracted code snippets
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Download Full ZIP Package */}
            <button
              type="button"
              id="btn-download-zip"
              disabled={!rawText.trim() || downloadingZip}
              onClick={handleDownloadZip}
              className="p-4 rounded-xl bg-gradient-to-br from-purple-900/60 to-purple-950/80 hover:from-purple-800/70 hover:to-purple-900 border border-purple-600/60 text-left transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none group shadow-lg"
            >
              <div className="w-9 h-9 rounded-lg bg-purple-700/60 border border-purple-500/50 flex items-center justify-center text-white mb-2.5">
                <FileArchive className="w-5 h-5" />
              </div>
              <div className="font-bold text-sm text-white flex items-center justify-between">
                <span>Complete ZIP Package</span>
                <Download className="w-4 h-4 text-purple-300 group-hover:translate-y-0.5 transition-transform" />
              </div>
              <p className="text-[11px] text-purple-200/80 mt-1">
                All-in-one .zip archive with Markdown, raw text, JSON, and extracted code files.
              </p>
            </button>

            {/* Download Markdown */}
            <button
              type="button"
              id="btn-download-md"
              disabled={!rawText.trim()}
              onClick={() => handleDownloadFile('md')}
              className="p-4 rounded-xl bg-[#161626] hover:bg-[#1c1c30] border border-gray-800 hover:border-gray-700 text-left transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none group"
            >
              <div className="w-9 h-9 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-300 mb-2.5">
                <FileText className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="font-bold text-sm text-white flex items-center justify-between">
                <span>Markdown (.md)</span>
                <Download className="w-4 h-4 text-gray-400 group-hover:translate-y-0.5 transition-transform" />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Formatted dialogue file with syntax highlighting blocks.
              </p>
            </button>

            {/* Download Text */}
            <button
              type="button"
              id="btn-download-txt"
              disabled={!rawText.trim()}
              onClick={() => handleDownloadFile('txt')}
              className="p-4 rounded-xl bg-[#161626] hover:bg-[#1c1c30] border border-gray-800 hover:border-gray-700 text-left transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none group"
            >
              <div className="w-9 h-9 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-300 mb-2.5">
                <FileText className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="font-bold text-sm text-white flex items-center justify-between">
                <span>Plain Text (.txt)</span>
                <Download className="w-4 h-4 text-gray-400 group-hover:translate-y-0.5 transition-transform" />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Clean text transcript without formatting clutter.
              </p>
            </button>

            {/* Download JSON */}
            <button
              type="button"
              id="btn-download-json"
              disabled={!rawText.trim()}
              onClick={() => handleDownloadFile('json')}
              className="p-4 rounded-xl bg-[#161626] hover:bg-[#1c1c30] border border-gray-800 hover:border-gray-700 text-left transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none group"
            >
              <div className="w-9 h-9 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-300 mb-2.5">
                <Code2 className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="font-bold text-sm text-white flex items-center justify-between">
                <span>Structured JSON (.json)</span>
                <Download className="w-4 h-4 text-gray-400 group-hover:translate-y-0.5 transition-transform" />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Machine-readable turns and requirement metadata.
              </p>
            </button>
          </div>
        </div>

        {/* STEP 3: Transfer & Paste to Other AI */}
        <div className="bg-[#1E1E2C] border border-gray-800 rounded-2xl p-5 sm:p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-900/60 border border-purple-500/40 flex items-center justify-center font-bold text-purple-300 text-sm">
                3
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  Paste & Continue in Other AI
                </h2>
                <p className="text-xs text-gray-400">
                  Select destination AI and transfer your context in 1 click
                </p>
              </div>
            </div>

            {/* Destination Selector Pills */}
            <div className="flex items-center gap-1.5 bg-[#141420] p-1 rounded-xl border border-gray-800">
              <span className="text-[11px] text-gray-400 pl-2 pr-1">Target:</span>
              {(['claude', 'chatgpt', 'gemini', 'deepseek'] as AIPlatform[]).map((pKey) => {
                const p = PLATFORMS[pKey];
                const isSelected = targetPlatform === pKey;
                return (
                  <button
                    key={pKey}
                    type="button"
                    onClick={() => onChangeTargetPlatform(pKey)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-[#6A0DAD] text-white shadow'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* 1-Click Copy Prompt */}
            <button
              type="button"
              id="copyToClipboard"
              disabled={!rawText.trim()}
              onClick={handleCopyReadyPrompt}
              className="py-3.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-semibold text-sm border border-gray-700 flex items-center justify-center gap-2 shadow transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 text-emerald-400" />
                  <span className="text-emerald-300">Prompt Copied! Ready to Paste</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 text-purple-400" />
                  <span>Copy Ready-to-Paste Prompt</span>
                  <span>📋</span>
                </>
              )}
            </button>

            {/* 1-Click Open AI & Paste */}
            <button
              type="button"
              id="btn-open-target-ai"
              disabled={!rawText.trim()}
              onClick={handleOpenTargetAndPaste}
              className="py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold text-sm shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40"
            >
              <ExternalLink className="w-5 h-5 text-purple-200" />
              <span>Open {currentTarget.name} & Paste</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          {/* Collapsible Preview Box */}
          <div className="border border-gray-800 rounded-xl overflow-hidden bg-black/30">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-gray-400 hover:text-gray-200 transition-colors"
            >
              <span>{showPreview ? '▲ Hide Formatted Context' : '▼ Preview Formatted Context for ' + currentTarget.name}</span>
              <span id="wordCountBadge" className="bg-gray-800 text-purple-400 px-2 py-0.5 rounded font-mono">
                {compiledResult ? `${compiledResult.compiledWordCount} Words` : `${wordCount} Words`}
              </span>
            </button>

            {showPreview && (
              <div className="p-3 border-t border-gray-800 max-h-64 overflow-y-auto">
                <textarea
                  id="compiledOutput"
                  readOnly
                  value={compiledResult?.compiledMarkdown || rawText}
                  className="w-full h-48 bg-transparent text-purple-200 text-xs font-mono focus:outline-none resize-none leading-relaxed"
                />
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
