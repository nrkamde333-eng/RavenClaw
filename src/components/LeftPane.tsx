import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  Trash2,
  Clipboard,
  Check,
  Code2,
  User,
  Bot,
  Brain,
  AlertCircle,
  Wand2,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { AIPlatform, ChatMessage } from '../types';
import { PLATFORMS, sanitizeRawText } from '../lib/compilerEngine';

interface LeftPaneProps {
  rawText: string;
  onChangeRawText: (text: string) => void;
  sourcePlatform: AIPlatform;
  onChangeSourcePlatform: (platform: AIPlatform) => void;
  targetPlatform: AIPlatform;
  onChangeTargetPlatform: (platform: AIPlatform) => void;
  detectedSource: AIPlatform;
  wordCount: number;
  thresholdWords: number;
  parsedMessages: ChatMessage[];
  onTriggerCompile: () => void;
}

export const LeftPane: React.FC<LeftPaneProps> = ({
  rawText,
  onChangeRawText,
  sourcePlatform,
  onChangeSourcePlatform,
  targetPlatform,
  onChangeTargetPlatform,
  detectedSource,
  wordCount,
  thresholdWords,
  parsedMessages,
  onTriggerCompile,
}) => {
  const [activeTab, setActiveTab] = useState<'raw' | 'parsed'>('raw');
  const [isDragging, setIsDragging] = useState(false);
  const [justPasted, setJustPasted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isDirectMode = wordCount < thresholdWords;

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onChangeRawText(text);
        setJustPasted(true);
        setTimeout(() => setJustPasted(false), 2000);
      }
    } catch (err) {
      console.warn('Clipboard read error, focusing textarea');
      textareaRef.current?.focus();
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      readFileContent(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      readFileContent(file);
    }
  };

  const readFileContent = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onChangeRawText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleCleanNoise = () => {
    if (!rawText) return;
    const sanitized = sanitizeRawText(rawText);
    onChangeRawText(sanitized);
  };

  return (
    <section className="flex flex-col h-full bg-[#1E1E2C] rounded-xl border border-gray-800 p-4 shadow-lg overflow-hidden">
      {/* Pane Top Bar */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <label htmlFor="rawInput" className="font-semibold text-sm text-gray-300">
            1. Paste Raw Chat / Context
          </label>
        </div>

        <div className="flex items-center gap-2">
          {/* Source Platform Selector */}
          <div className="hidden sm:flex items-center gap-1 bg-[#141420] p-0.5 rounded-lg border border-[#2b2b42] text-xs">
            <span className="text-[10px] text-slate-400 pl-2 pr-1 font-medium">Source:</span>
            {(['generic', 'gemini', 'chatgpt', 'claude', 'deepseek'] as AIPlatform[]).map((plat) => {
              const isSelected = sourcePlatform === plat;
              const isAutoDetected = sourcePlatform === 'generic' && detectedSource === plat;
              return (
                <button
                  key={plat}
                  type="button"
                  id={`btn-source-${plat}`}
                  onClick={() => onChangeSourcePlatform(plat)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                    isSelected
                      ? 'bg-purple-700 text-white shadow-sm'
                      : isAutoDetected
                      ? 'bg-purple-950/70 text-purple-300 border border-purple-700/50'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#202033]'
                  }`}
                >
                  {plat === 'generic' ? 'Auto' : PLATFORMS[plat].name}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            id="clearInput"
            onClick={() => onChangeRawText('')}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Mode Threshold Banner & Quick Stats */}
      <div className="flex items-center justify-between px-2.5 py-1.5 mb-2 bg-black/30 rounded-lg border border-[#27273c] text-[11px]">
        <div className="flex items-center gap-2 text-slate-300 font-mono">
          <span className="text-slate-400">Words:</span>
          <span className="font-bold text-white bg-[#222236] px-1.5 py-0.2 rounded border border-[#30304a]">
            {wordCount}
          </span>
          <span className="text-slate-400 ml-1">Turns:</span>
          <span className="text-purple-300 font-semibold">{parsedMessages.length}</span>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
              isDirectMode
                ? 'bg-emerald-950/60 border-emerald-700/50 text-emerald-300'
                : 'bg-purple-950/60 border-purple-700/50 text-purple-300'
            }`}
            title={`Threshold: ${thresholdWords} words`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isDirectMode ? 'bg-emerald-400 animate-pulse' : 'bg-purple-400 animate-pulse'
              }`}
            />
            <span>{isDirectMode ? 'Direct Mode (< 600w)' : 'Snapshot Mode (> 600w)'}</span>
          </div>

          {/* View Tab Switcher */}
          <div className="flex items-center bg-[#1e1e2c] rounded p-0.5 border border-[#2b2b40]">
            <button
              type="button"
              id="btn-tab-raw"
              onClick={() => setActiveTab('raw')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                activeTab === 'raw'
                  ? 'bg-[#6A0DAD] text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Raw Input
            </button>
            <button
              type="button"
              id="btn-tab-parsed"
              onClick={() => setActiveTab('parsed')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                activeTab === 'parsed'
                  ? 'bg-[#6A0DAD] text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Inspector ({parsedMessages.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Textarea Area */}
      <div className="relative flex-1 min-h-[300px] flex flex-col overflow-hidden">
        {activeTab === 'raw' ? (
          <div
            className={`relative flex-1 flex flex-col ${
              isDragging ? 'ring-2 ring-purple-500 bg-purple-950/20' : ''
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
          >
            <textarea
              ref={textareaRef}
              id="rawInput"
              value={rawText}
              onChange={(e) => onChangeRawText(e.target.value)}
              placeholder="Copy text directly from your AI chat window and paste it here..."
              className="flex-1 w-full bg-black/40 border border-gray-700 rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-purple-500 resize-none font-mono selection:bg-purple-900 selection:text-white leading-relaxed"
            />

            {/* Empty State Action Overlay */}
            {!rawText && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4 text-center">
                <div className="pointer-events-auto flex flex-col items-center max-w-xs">
                  <div className="w-10 h-10 rounded-xl bg-[#1e1e30] border border-[#30304a] flex items-center justify-center text-purple-400 mb-2 shadow-inner">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    Paste raw chat turns from ChatGPT, Claude, Gemini, or DeepSeek.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id="btn-empty-paste"
                      onClick={handlePasteFromClipboard}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#6A0DAD] hover:bg-[#7B1FA2] text-white text-xs font-medium shadow transition-colors"
                    >
                      <Clipboard className="w-3.5 h-3.5" />
                      <span>Paste</span>
                    </button>
                    <button
                      type="button"
                      id="btn-empty-upload"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1e1e2c] hover:bg-[#28283c] text-slate-300 border border-[#2f2f45] text-xs font-medium transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Browse File</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Parsed Turns Inspector Tab */
          <div className="flex-1 p-2 bg-black/30 rounded-lg border border-gray-700 overflow-y-auto space-y-2.5">
            {parsedMessages.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No chat turns detected. Paste text in Raw Input tab first.
              </div>
            ) : (
              parsedMessages.map((msg, index) => {
                const isUser = msg.role === 'user';
                const isThought = msg.role === 'thought';
                return (
                  <div
                    key={msg.id || index}
                    className={`rounded-lg border p-2.5 text-xs ${
                      isUser
                        ? 'bg-[#1a1a2b] border-[#30304a] text-slate-200'
                        : isThought
                        ? 'bg-[#151a24] border-cyan-900/50 text-cyan-200'
                        : 'bg-[#1c1a29] border-purple-900/40 text-purple-100'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-[#28283e]">
                      <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                        {isUser ? (
                          <span className="flex items-center gap-1 text-slate-300">
                            <User className="w-3.5 h-3.5 text-blue-400" />
                            Turn {index + 1}: User Prompt
                          </span>
                        ) : isThought ? (
                          <span className="flex items-center gap-1 text-cyan-300">
                            <Brain className="w-3.5 h-3.5 text-cyan-400" />
                            Reasoning / Chain-of-Thought
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-purple-300">
                            <Bot className="w-3.5 h-3.5 text-purple-400" />
                            Turn {index + 1}: {PLATFORMS[detectedSource]?.name || 'AI Assistant'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                        {msg.codeBlocks.length > 0 && (
                          <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/40">
                            <Code2 className="w-3 h-3" />
                            {msg.codeBlocks.length} code
                          </span>
                        )}
                        <span>{msg.wordCount} words</span>
                      </div>
                    </div>
                    <p className="font-mono text-xs leading-relaxed whitespace-pre-wrap line-clamp-5 text-slate-300">
                      {msg.content}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Target AI & Compile Action Bar */}
      <div className="mt-4 flex justify-between items-center gap-2">
        <div className="flex space-x-2 items-center">
          <span className="text-xs text-gray-400">Target AI:</span>
          <select
            id="targetSelect"
            value={targetPlatform}
            onChange={(e) => onChangeTargetPlatform(e.target.value as AIPlatform)}
            className="bg-gray-800 border border-gray-700 text-xs rounded px-2.5 py-1.5 text-white font-medium focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="chatgpt">ChatGPT</option>
            <option value="claude">Claude</option>
            <option value="gemini">Gemini</option>
            <option value="deepseek">DeepSeek</option>
            <option value="generic">Universal</option>
          </select>

          <button
            type="button"
            id="btn-clean-artifacts"
            onClick={handleCleanNoise}
            disabled={!rawText}
            title="Clean web copy buttons and noise"
            className="hidden sm:flex items-center gap-1 text-xs text-slate-400 hover:text-purple-300 px-2 py-1 rounded hover:bg-gray-800 transition-colors disabled:opacity-40"
          >
            <Wand2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Clean UI Noise</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.json,.log"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            type="button"
            id="compileContext"
            onClick={onTriggerCompile}
            className="bg-[#6A0DAD] hover:bg-[#7B1FA2] text-white px-4 py-2 rounded-lg text-sm font-semibold shadow transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5"
          >
            <span>Compile Handoff</span>
            <span>⚡</span>
          </button>
        </div>
      </div>
    </section>
  );
};
