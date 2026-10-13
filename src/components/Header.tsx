import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Archive,
  Layers,
  ExternalLink,
  Keyboard,
  Compass,
  FileCode2,
  ChevronDown,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { AIPlatform } from '../types';
import { SAMPLE_PRESETS, SamplePreset } from '../lib/sampleData';

interface HeaderProps {
  onCompile: () => void;
  onOpenVault: () => void;
  onOpenShortcuts: () => void;
  onOpenLaunchHelper: () => void;
  onSelectPreset: (preset: SamplePreset) => void;
  onClearWorkspace: () => void;
  vaultCount: number;
  isCompiling: boolean;
  selectedSource: AIPlatform;
  selectedTarget: AIPlatform;
  onSelectTarget: (platform: AIPlatform) => void;
  viewMode: 'simple' | 'studio';
  onToggleViewMode: (mode: 'simple' | 'studio') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onCompile,
  onOpenVault,
  onOpenShortcuts,
  onOpenLaunchHelper,
  onSelectPreset,
  onClearWorkspace,
  vaultCount,
  isCompiling,
  selectedSource,
  selectedTarget,
  onSelectTarget,
  viewMode,
  onToggleViewMode,
}) => {
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);

  const platforms = [
    {
      id: 'gemini' as AIPlatform,
      name: 'Gemini',
      url: 'https://gemini.google.com',
      domain: 'gemini.google.com',
      color: 'hover:border-blue-500/60 text-blue-400',
      activeBorder: 'border-blue-500 bg-blue-950/30 text-blue-300',
    },
    {
      id: 'chatgpt' as AIPlatform,
      name: 'ChatGPT',
      url: 'https://chatgpt.com',
      domain: 'chatgpt.com',
      color: 'hover:border-emerald-500/60 text-emerald-400',
      activeBorder: 'border-emerald-500 bg-emerald-950/30 text-emerald-300',
    },
    {
      id: 'claude' as AIPlatform,
      name: 'Claude',
      url: 'https://claude.ai',
      domain: 'claude.ai',
      color: 'hover:border-amber-500/60 text-amber-400',
      activeBorder: 'border-amber-500 bg-amber-950/30 text-amber-300',
    },
    {
      id: 'deepseek' as AIPlatform,
      name: 'DeepSeek',
      url: 'https://chat.deepseek.com',
      domain: 'chat.deepseek.com',
      color: 'hover:border-cyan-500/60 text-cyan-400',
      activeBorder: 'border-cyan-500 bg-cyan-950/30 text-cyan-300',
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#141420]/95 backdrop-blur-md border-b border-[#242436] px-4 py-2.5">
      <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Logo & Identity */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-purple-700 via-indigo-800 to-purple-950 shadow-md shadow-purple-900/40 border border-purple-500/40">
              <Zap className="w-5 h-5 text-purple-200 fill-purple-300/30" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#121212] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5 font-sans">
                  RavenClaw <span className="text-purple-400 font-semibold text-xs px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-800/60 uppercase tracking-wider">Web</span>
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Cross-AI Context Handoff Engine</p>
            </div>
          </div>

          {/* Quick Platform Launchers (Mobile / Tablet Compact) */}
          <div className="flex md:hidden items-center gap-1">
            <button
              type="button"
              id="btn-mobile-vault"
              onClick={onOpenVault}
              className="p-1.5 rounded-md bg-[#1e1e2c] border border-[#2d2d42] text-slate-300 hover:text-white relative"
            >
              <Archive className="w-4 h-4" />
              {vaultCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-600 text-[10px] flex items-center justify-center font-bold text-white">
                  {vaultCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mode Switcher & Platform Launcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Simple vs Studio Toggle */}
          <div className="flex items-center bg-[#191928] p-1 rounded-lg border border-[#27273c] text-xs">
            <button
              type="button"
              id="btn-mode-simple"
              onClick={() => onToggleViewMode('simple')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all ${
                viewMode === 'simple'
                  ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Simple Transfer</span>
            </button>
            <button
              type="button"
              id="btn-mode-studio"
              onClick={() => onToggleViewMode('studio')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
                viewMode === 'studio'
                  ? 'bg-[#26263d] text-white shadow-sm border border-purple-800/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Dual Studio</span>
            </button>
          </div>

          {/* Quick AI Launchers */}
          <div className="hidden xl:flex items-center gap-1 bg-[#191928] p-1 rounded-lg border border-[#27273c]">
            <span className="text-[11px] text-slate-400 px-2 font-medium flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-purple-400" />
              Launch:
            </span>
            {platforms.map((p) => {
              const isSelectedTarget = selectedTarget === p.id;
              return (
                <a
                  key={p.id}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  id={`link-launch-${p.id}`}
                  title={`Open ${p.name} in new tab`}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-all border ${
                    isSelectedTarget
                      ? p.activeBorder
                      : 'border-transparent text-slate-300 hover:bg-[#232338] hover:text-white'
                  }`}
                >
                  <span>{p.name}</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                </a>
              );
            })}
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* Sample Presets Dropdown */}
          <div className="relative">
            <button
              type="button"
              id="btn-sample-presets"
              onClick={() => setShowPresetsMenu(!showPresetsMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#1e1e2c] hover:bg-[#28283d] text-slate-300 hover:text-white border border-[#2e2e46] transition-colors"
            >
              <FileCode2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Load Sample</span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>

            {showPresetsMenu && (
              <div
                className="absolute right-0 mt-1.5 w-72 rounded-xl bg-[#1c1c2b] border border-[#31314d] shadow-xl z-50 py-1.5 overflow-hidden text-xs"
                onClick={() => setShowPresetsMenu(false)}
              >
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-[#2b2b40]">
                  Select Sample Chat
                </div>
                {SAMPLE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSelectPreset(preset)}
                    className="w-full text-left px-3 py-2 hover:bg-[#27273d] transition-colors flex flex-col gap-0.5 text-slate-200 group"
                  >
                    <div className="font-medium text-slate-100 group-hover:text-purple-300 flex items-center justify-between">
                      <span>{preset.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800/50">
                        {preset.expectedMode}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">{preset.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Vault Button */}
          <button
            type="button"
            id="btn-view-vault"
            onClick={onOpenVault}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1e1e2c] hover:bg-[#28283d] text-slate-200 border border-[#2e2e46] transition-colors relative"
          >
            <Archive className="w-3.5 h-3.5 text-purple-400" />
            <span>Vault</span>
            {vaultCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-purple-700/70 border border-purple-500/50 text-[10px] font-bold text-white">
                {vaultCount}
              </span>
            )}
          </button>

          {/* Shortcuts Modal Trigger */}
          <button
            type="button"
            id="btn-shortcuts-guide"
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 bg-[#1e1e2c] hover:bg-[#28283d] border border-[#2e2e46] transition-colors"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* Compile Handoff Primary Action */}
          <button
            type="button"
            id="btn-compile-handoff-main"
            onClick={onCompile}
            disabled={isCompiling}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white shadow-lg shadow-purple-950/60 border border-purple-400/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isCompiling ? 'Compiling...' : 'Compile Handoff'}</span>
            <kbd className="hidden lg:inline-block ml-1 text-[10px] bg-purple-950/60 border border-purple-400/40 rounded px-1 text-purple-200 font-mono">
              Ctrl+↵
            </kbd>
          </button>
        </div>
      </div>
    </header>
  );
};
