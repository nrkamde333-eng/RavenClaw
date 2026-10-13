/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { LeftPane } from './components/LeftPane';
import { RightPane } from './components/RightPane';
import { SimpleTransferView } from './components/SimpleTransferView';
import { VaultModal } from './components/VaultModal';
import { LaunchHelperModal } from './components/LaunchHelperModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { AIPlatform, CompilationMode, CompiledResult, VaultEntry } from './types';
import {
  compileContextHandoff,
  detectSourcePlatform,
  countWords,
  parseChatTurns,
  PLATFORMS,
} from './lib/compilerEngine';
import {
  getVaultEntries,
  saveVaultEntry,
  deleteVaultEntry,
  clearVault,
} from './lib/vaultStorage';
import { SAMPLE_PRESETS, SamplePreset } from './lib/sampleData';
import { Check, Info, ShieldCheck, Sparkles } from 'lucide-react';

export default function App() {
  // Primary state
  const [viewMode, setViewMode] = useState<'simple' | 'studio'>('simple');
  const [rawText, setRawText] = useState<string>('');
  const [sourcePlatform, setSourcePlatform] = useState<AIPlatform>('generic');
  const [targetPlatform, setTargetPlatform] = useState<AIPlatform>('claude');
  const [compilationMode, setCompilationMode] = useState<CompilationMode>('auto');
  const [thresholdWords, setThresholdWords] = useState<number>(600);
  const [customObjective, setCustomObjective] = useState<string>('');
  const [includeCodeBlocks, setIncludeCodeBlocks] = useState<boolean>(true);
  const [includeThoughts, setIncludeThoughts] = useState<boolean>(false);
  const [stripUiArtifacts, setStripUiArtifacts] = useState<boolean>(true);
  
  // Results & Vault state
  const [compiledResult, setCompiledResult] = useState<CompiledResult | null>(null);
  const [vaultEntries, setVaultEntries] = useState<VaultEntry[]>([]);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);

  // Modals state
  const [isVaultOpen, setIsVaultOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isLaunchHelperOpen, setIsLaunchHelperOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Word count & parsed preview
  const rawWordCount = useMemo(() => countWords(rawText), [rawText]);
  const detectedSource = useMemo(() => {
    return sourcePlatform === 'generic' ? detectSourcePlatform(rawText) : sourcePlatform;
  }, [rawText, sourcePlatform]);

  const parsedMessages = useMemo(() => {
    return parseChatTurns(rawText, detectedSource);
  }, [rawText, detectedSource]);

  // Load vault on initial mount
  useEffect(() => {
    setVaultEntries(getVaultEntries());

    // Pre-populate with a rich sample preset so the workspace is immediately alive
    const initialPreset = SAMPLE_PRESETS[0];
    if (initialPreset) {
      setRawText(initialPreset.rawText.trim());
      setSourcePlatform(initialPreset.source);
      setTargetPlatform(initialPreset.target);
      setCustomObjective(initialPreset.customObjective);
    }
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

  // Compilation trigger
  const handleCompile = useCallback(() => {
    if (!rawText.trim()) {
      showToast('Please paste or import a chat session first');
      return;
    }

    setIsCompiling(true);
    setTimeout(() => {
      const result = compileContextHandoff(rawText, {
        sourcePlatform,
        targetPlatform,
        mode: compilationMode,
        thresholdWords,
        customObjective,
        includeCodeBlocks,
        includeDeepSeekThoughts: includeThoughts,
        stripUiArtifacts,
      });

      setCompiledResult(result);
      setIsCompiling(false);
      showToast(
        `Compiled ${result.modeUsed === 'direct' ? 'Direct Handoff' : 'Snapshot Brief'} (${result.compiledWordCount} words)`
      );
    }, 150);
  }, [
    rawText,
    sourcePlatform,
    targetPlatform,
    compilationMode,
    thresholdWords,
    customObjective,
    includeCodeBlocks,
    includeThoughts,
    stripUiArtifacts,
    showToast,
  ]);

  // Auto compile on changes with slight debounce
  useEffect(() => {
    if (rawText.trim()) {
      const timer = setTimeout(() => {
        const result = compileContextHandoff(rawText, {
          sourcePlatform,
          targetPlatform,
          mode: compilationMode,
          thresholdWords,
          customObjective,
          includeCodeBlocks,
          includeDeepSeekThoughts: includeThoughts,
          stripUiArtifacts,
        });
        setCompiledResult(result);
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setCompiledResult(null);
    }
  }, [
    rawText,
    sourcePlatform,
    targetPlatform,
    compilationMode,
    thresholdWords,
    customObjective,
    includeCodeBlocks,
    includeThoughts,
    stripUiArtifacts,
  ]);

  // Preset Selection
  const handleSelectPreset = (preset: SamplePreset) => {
    setRawText(preset.rawText.trim());
    setSourcePlatform(preset.source);
    setTargetPlatform(preset.target);
    setCustomObjective(preset.customObjective);
    showToast(`Loaded sample: ${preset.name}`);
  };

  // Vault actions
  const handleSaveToVault = () => {
    if (!compiledResult || !compiledResult.compiledMarkdown) {
      showToast('No compiled output to save');
      return;
    }

    const title = `${PLATFORMS[compiledResult.sourcePlatform]?.name || 'Chat'} -> ${
      PLATFORMS[compiledResult.targetPlatform]?.name || 'Target'
    } (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;

    saveVaultEntry({
      title,
      sourcePlatform: compiledResult.sourcePlatform,
      targetPlatform: compiledResult.targetPlatform,
      modeUsed: compiledResult.modeUsed,
      rawWordCount: compiledResult.rawWordCount,
      compiledWordCount: compiledResult.compiledWordCount,
      rawText,
      compiledMarkdown: compiledResult.compiledMarkdown,
      tags: [compiledResult.sourcePlatform, compiledResult.targetPlatform, compiledResult.modeUsed],
      customObjective,
    });

    setVaultEntries(getVaultEntries());
    showToast('Saved snapshot to Local Vault!');
  };

  const handleLoadVaultEntry = (entry: VaultEntry) => {
    setRawText(entry.rawText);
    setSourcePlatform(entry.sourcePlatform);
    setTargetPlatform(entry.targetPlatform);
    if (entry.customObjective) {
      setCustomObjective(entry.customObjective);
    }
    showToast(`Loaded "${entry.title}" into workspace`);
  };

  const handleDeleteVaultEntry = (id: string) => {
    const updated = deleteVaultEntry(id);
    setVaultEntries(updated);
    showToast('Deleted entry from Vault');
  };

  const handleClearAllVault = () => {
    clearVault();
    setVaultEntries([]);
    showToast('Vault cleared completely');
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter or Cmd+Enter: Compile
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleCompile();
      }

      // Ctrl+Shift+C: Copy Output
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'c' || e.key === 'C')) {
        if (compiledResult?.compiledMarkdown) {
          e.preventDefault();
          navigator.clipboard.writeText(compiledResult.compiledMarkdown);
          showToast('Copied Handoff Markdown to clipboard!');
        }
      }

      // Ctrl+Shift+V: Open Vault
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        setIsVaultOpen((prev) => !prev);
      }

      // Ctrl+Alt+S: Cycle sample presets
      if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        const currentIdx = SAMPLE_PRESETS.findIndex((p) => p.rawText.trim() === rawText.trim());
        const nextPreset = SAMPLE_PRESETS[(currentIdx + 1) % SAMPLE_PRESETS.length];
        if (nextPreset) {
          handleSelectPreset(nextPreset);
        }
      }

      // Escape: Close active modals
      if (e.key === 'Escape') {
        setIsVaultOpen(false);
        setIsShortcutsOpen(false);
        setIsLaunchHelperOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCompile, compiledResult, rawText, showToast]);

  return (
    <div className="flex flex-col min-h-screen bg-[#121212] text-slate-100 selection:bg-purple-900 selection:text-white">
      {/* Navigation & Platform Launcher */}
      <Header
        onCompile={handleCompile}
        onOpenVault={() => setIsVaultOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenLaunchHelper={() => setIsLaunchHelperOpen(true)}
        onSelectPreset={handleSelectPreset}
        onClearWorkspace={() => {
          setRawText('');
          setCompiledResult(null);
          showToast('Workspace cleared');
        }}
        vaultCount={vaultEntries.length}
        isCompiling={isCompiling}
        selectedSource={detectedSource}
        selectedTarget={targetPlatform}
        onSelectTarget={(p) => setTargetPlatform(p)}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-3 sm:p-4 md:p-6 flex flex-col gap-4">
        {viewMode === 'simple' ? (
          /* Simple 3-Step Wizard View */
          <SimpleTransferView
            rawText={rawText}
            onChangeRawText={setRawText}
            sourcePlatform={sourcePlatform}
            onChangeSourcePlatform={setSourcePlatform}
            targetPlatform={targetPlatform}
            onChangeTargetPlatform={setTargetPlatform}
            detectedSource={detectedSource}
            compiledResult={compiledResult}
            onTriggerCompile={handleCompile}
            onLoadPreset={(presetId) => {
              const preset = SAMPLE_PRESETS.find(p => p.id === presetId) || SAMPLE_PRESETS[0];
              if (preset) handleSelectPreset(preset);
            }}
          />
        ) : (
          /* Dual-Pane Studio Workspace */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 items-stretch min-h-[calc(100vh-130px)]">
            {/* Left Pane: Active Session Reader */}
            <LeftPane
              rawText={rawText}
              onChangeRawText={setRawText}
              sourcePlatform={sourcePlatform}
              onChangeSourcePlatform={setSourcePlatform}
              targetPlatform={targetPlatform}
              onChangeTargetPlatform={setTargetPlatform}
              detectedSource={detectedSource}
              wordCount={rawWordCount}
              thresholdWords={thresholdWords}
              parsedMessages={parsedMessages}
              onTriggerCompile={handleCompile}
            />

            {/* Right Pane: Compiled Handoff Output */}
            <RightPane
              compiledResult={compiledResult}
              targetPlatform={targetPlatform}
              onChangeTargetPlatform={setTargetPlatform}
              compilationMode={compilationMode}
              onChangeCompilationMode={setCompilationMode}
              customObjective={customObjective}
              onChangeCustomObjective={setCustomObjective}
              includeCodeBlocks={includeCodeBlocks}
              onToggleIncludeCode={setIncludeCodeBlocks}
              includeThoughts={includeThoughts}
              onToggleIncludeThoughts={setIncludeThoughts}
              onSaveToVault={handleSaveToVault}
              onOpenLaunchHelper={() => setIsLaunchHelperOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Footer / Privacy & Status Bar */}
      <footer className="bg-[#101018] border-t border-[#1e1e2c] px-4 py-2 text-[11px] text-slate-400">
        <div className="max-w-[1720px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              100% Client-Side Privacy
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="hidden sm:inline text-slate-400">
              No chat logs or API tokens sent to any external server
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 font-mono text-[10px]">
            <span>
              Engine: <strong className="text-purple-300">Deduplication v2.4</strong>
            </span>
            <span>
              Target: <strong className="text-purple-300">{PLATFORMS[targetPlatform]?.name}</strong>
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <VaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        entries={vaultEntries}
        onLoadEntry={handleLoadVaultEntry}
        onDeleteEntry={handleDeleteVaultEntry}
        onClearAll={handleClearAllVault}
        onRefreshVault={() => setVaultEntries(getVaultEntries())}
      />

      <LaunchHelperModal
        isOpen={isLaunchHelperOpen}
        onClose={() => setIsLaunchHelperOpen(false)}
        targetPlatform={targetPlatform}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-950/90 text-purple-100 border border-purple-500/60 shadow-2xl backdrop-blur-md text-xs font-medium animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Sparkles className="w-4 h-4 text-purple-300 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
