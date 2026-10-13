import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + Enter', desc: 'Compile chat transcript into target handoff' },
    { key: 'Ctrl + Shift + C', desc: 'Copy compiled handoff Markdown to clipboard' },
    { key: 'Ctrl + Shift + V', desc: 'Open Local Context Vault' },
    { key: 'Ctrl + Alt + S', desc: 'Load next sample test preset' },
    { key: 'Ctrl + Shift + K', desc: 'Clean UI artifacts & web copy clutter' },
    { key: 'Escape', desc: 'Close any active modal dialog' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[#161625] rounded-2xl border border-[#2e2e46] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-[#1b1b2e] border-b border-[#2d2d46]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-700/50 text-purple-300">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Keyboard Shortcuts</h2>
              <p className="text-xs text-slate-400">Power-user workspace hotkeys</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#25253b] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-2.5 bg-[#12121e] text-xs">
          {shortcuts.map((sc, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-lg bg-[#19192b] border border-[#27273d]"
            >
              <span className="text-slate-300">{sc.desc}</span>
              <kbd className="px-2 py-0.5 rounded bg-[#25253a] border border-[#393956] text-purple-300 font-mono text-[11px]">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="flex justify-end px-5 py-3 bg-[#19192b] border-t border-[#2c2c44]">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-[#27273d] hover:bg-[#343450] text-slate-200 text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
