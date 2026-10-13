import React, { useState } from 'react';
import {
  X,
  Archive,
  Search,
  Copy,
  Check,
  Download,
  Trash2,
  Upload,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Layers,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { VaultEntry, AIPlatform } from '../types';
import { PLATFORMS } from '../lib/compilerEngine';
import { exportVaultJson, importVaultJson } from '../lib/vaultStorage';

interface VaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: VaultEntry[];
  onLoadEntry: (entry: VaultEntry) => void;
  onDeleteEntry: (id: string) => void;
  onClearAll: () => void;
  onRefreshVault: () => void;
}

export const VaultModal: React.FC<VaultModalProps> = ({
  isOpen,
  onClose,
  entries,
  onLoadEntry,
  onDeleteEntry,
  onClearAll,
  onRefreshVault,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredEntries = entries.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.compiledMarkdown.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.customObjective && item.customObjective.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSource =
      selectedSourceFilter === 'all' ||
      item.sourcePlatform === selectedSourceFilter ||
      item.targetPlatform === selectedSourceFilter;

    return matchesSearch && matchesSource;
  });

  const handleCopyMarkdown = (item: VaultEntry) => {
    navigator.clipboard.writeText(item.compiledMarkdown);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (item: VaultEntry) => {
    const blob = new Blob([item.compiledMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vault-handoff-${item.id}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportBackup = () => {
    const jsonStr = exportVaultJson();
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ravenclaw-vault-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          const res = importVaultJson(content);
          if (res.success) {
            setImportStatus(`Imported ${res.count} sessions successfully!`);
            onRefreshVault();
          } else {
            setImportStatus(`Import failed: ${res.error}`);
          }
          setTimeout(() => setImportStatus(null), 4000);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col bg-[#161625] rounded-2xl border border-[#2e2e46] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#1b1b2e] border-b border-[#2d2d46]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-700/50 text-purple-300">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Local Context Vault</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/60 font-semibold">
                  {entries.length} stored
                </span>
              </div>
              <p className="text-xs text-slate-400">
                100% stored securely in your browser's localStorage. Zero external network telemetry.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-vault-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#25253b] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 bg-[#131320] border-b border-[#26263a] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="input-vault-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search saved contexts..."
              className="w-full bg-[#1c1c2e] text-xs text-slate-200 placeholder-slate-500 rounded-lg pl-9 pr-3 py-2 border border-[#2e2e46] focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-1 bg-[#1a1a2b] p-1 rounded-lg border border-[#2b2b40] text-xs">
              <span className="text-[10px] text-slate-400 px-1 font-medium">Filter:</span>
              {['all', 'gemini', 'chatgpt', 'claude', 'deepseek'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setSelectedSourceFilter(f)}
                  className={`px-2 py-0.5 rounded capitalize text-[11px] ${
                    selectedSourceFilter === f
                      ? 'bg-purple-700 text-white font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Backup / Export Buttons */}
            <button
              type="button"
              id="btn-export-vault"
              onClick={handleExportBackup}
              title="Export all vault records as JSON backup"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#202034] hover:bg-[#2b2b44] text-slate-300 text-xs border border-[#2e2e46] transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <label className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#202034] hover:bg-[#2b2b44] text-slate-300 text-xs border border-[#2e2e46] transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {importStatus && (
          <div className="px-5 py-2 bg-purple-950/60 border-b border-purple-800 text-xs text-purple-200 flex items-center justify-between">
            <span>{importStatus}</span>
          </div>
        )}

        {/* Entries List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#12121e]">
          {filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 text-center">
              <FileText className="w-12 h-12 mb-3 opacity-20 text-purple-400" />
              <p className="text-sm font-semibold text-slate-400">No matching vault entries</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Compile a handoff session and click "Save to Vault" in the output pane to store it locally.
              </p>
            </div>
          ) : (
            filteredEntries.map((item) => {
              const src = PLATFORMS[item.sourcePlatform]?.name || 'AI';
              const tgt = PLATFORMS[item.targetPlatform]?.name || 'Target';
              const isDirect = item.modeUsed === 'direct';

              return (
                <div
                  key={item.id}
                  className="rounded-xl bg-[#1a1a2b] border border-[#2c2c44] hover:border-purple-800/60 p-4 transition-all group shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                        {item.title}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-[#232338] border border-[#32324e] text-slate-300">
                        <span className="text-purple-300">{src}</span>
                        <ArrowRight className="w-2.5 h-2.5 text-slate-500" />
                        <span className="text-emerald-300">{tgt}</span>
                      </div>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded border font-medium ${
                          isDirect
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40'
                            : 'bg-purple-950/60 text-purple-300 border-purple-800/40'
                        }`}
                      >
                        {item.modeUsed}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(item.createdAt).toLocaleDateString()} at{' '}
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {item.customObjective && (
                    <div className="text-xs text-purple-200/90 bg-purple-950/30 border border-purple-900/30 rounded px-2.5 py-1 mb-2.5 line-clamp-1">
                      <span className="font-semibold text-purple-300">Objective: </span>
                      {item.customObjective}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-400 border-t border-[#25253a] pt-2.5 mt-2">
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span>Original: {item.rawWordCount}w</span>
                      <span>•</span>
                      <span>Output: {item.compiledWordCount}w</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        id={`btn-load-entry-${item.id}`}
                        onClick={() => {
                          onLoadEntry(item);
                          onClose();
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold shadow-sm transition-colors"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Load in Workspace</span>
                      </button>

                      <button
                        type="button"
                        id={`btn-copy-vault-${item.id}`}
                        onClick={() => handleCopyMarkdown(item)}
                        className="p-1.5 rounded-lg bg-[#242438] hover:bg-[#30304a] text-slate-300 hover:text-white transition-colors"
                        title="Copy Markdown"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        id={`btn-dl-vault-${item.id}`}
                        onClick={() => handleDownload(item)}
                        className="p-1.5 rounded-lg bg-[#242438] hover:bg-[#30304a] text-slate-300 hover:text-white transition-colors"
                        title="Download .md"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        id={`btn-del-vault-${item.id}`}
                        onClick={() => onDeleteEntry(item.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/30 transition-colors"
                        title="Delete from Vault"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#19192b] border-t border-[#2c2c44] text-xs">
          <div className="text-slate-400">
            Storage Engine: <span className="text-purple-300 font-mono">browser.localStorage</span>
          </div>

          <div className="flex items-center gap-2">
            {entries.length > 0 && (
              <>
                {confirmClear ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-rose-300 font-medium">Delete all entries?</span>
                    <button
                      type="button"
                      id="btn-confirm-clear-all"
                      onClick={() => {
                        onClearAll();
                        setConfirmClear(false);
                      }}
                      className="px-2 py-1 rounded bg-rose-600 text-white font-semibold text-xs"
                    >
                      Yes, Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="px-2 py-1 rounded bg-[#2a2a3e] text-slate-300 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    id="btn-trigger-clear-all"
                    onClick={() => setConfirmClear(true)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-950/30 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Vault</span>
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              id="btn-dismiss-vault"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-[#27273d] hover:bg-[#343450] text-slate-200 font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
