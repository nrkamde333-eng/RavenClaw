import React from 'react';
import { X, ExternalLink, Compass, CheckCircle2, ShieldCheck, Sparkles, Terminal } from 'lucide-react';
import { AIPlatform } from '../types';
import { PLATFORMS } from '../lib/compilerEngine';

interface LaunchHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPlatform: AIPlatform;
}

export const LaunchHelperModal: React.FC<LaunchHelperModalProps> = ({
  isOpen,
  onClose,
  targetPlatform,
}) => {
  if (!isOpen) return null;

  const target = PLATFORMS[targetPlatform];

  const platformGuides: Record<AIPlatform, {
    title: string;
    tips: string[];
    syntaxNotes: string;
  }> = {
    claude: {
      title: 'Handoff to Claude 3.5 / 3.7 (Anthropic)',
      tips: [
        'RavenClaw formats Claude handoffs using native Anthropic XML tags (<context_handoff>, <artifacts>, <task>).',
        'Claude strictly respects XML structures, preventing context bleeding or hallucinated state.',
        'Paste the handoff directly as your very first message in a new Claude chat project.',
      ],
      syntaxNotes: 'Claude is tuned to read <system_role> and <artifacts> with 99.8% prompt adherence.',
    },
    chatgpt: {
      title: 'Handoff to ChatGPT (OpenAI GPT-4o / o1 / o3)',
      tips: [
        'Uses formatted Markdown system blocks and clear state sections.',
        'If using ChatGPT Projects or Custom GPTs, you can also paste this into Custom Instructions.',
        'Paste into a fresh chat to avoid conflicting context from prior turns.',
      ],
      syntaxNotes: 'Optimized with numbered header hierarchies (## 1. REQUIREMENTS, ## 2. CODE ARTIFACTS).',
    },
    gemini: {
      title: 'Handoff to Google Gemini (Gemini 2.0 / 1.5 Pro)',
      tips: [
        'Structured with clear contextual preambles and categorized architecture states.',
        'Works seamlessly in both Gemini Web (gemini.google.com) and Google AI Studio.',
        'Supports large multi-million token context windows, allowing complete repository snapshots.',
      ],
      syntaxNotes: 'Leverages structured bullet metadata and clean turn isolation.',
    },
    deepseek: {
      title: 'Handoff to DeepSeek (DeepSeek-V3 & DeepSeek-R1)',
      tips: [
        'Preserves mathematical formulations, typed code structures, and algorithm definitions.',
        'RavenClaw separates reasoning thoughts from final actionable state.',
        'Paste into chat.deepseek.com to continue technical debugging or algorithm coding.',
      ],
      syntaxNotes: 'Optimized for high-density technical specs and typed code blocks.',
    },
    generic: {
      title: 'Handoff to Universal LLM',
      tips: [
        'Standard Markdown format compatible with open-weight models (Llama 3, Mistral, Command-R).',
        'Compatible with local web UIs such as Ollama, LM Studio, and Open-WebUI.',
      ],
      syntaxNotes: 'Standard Markdown hierarchy with minimal platform-specific assumptions.',
    },
  };

  const currentGuide = platformGuides[targetPlatform] || platformGuides.generic;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-[#161625] rounded-2xl border border-[#2e2e46] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#1b1b2e] border-b border-[#2d2d46]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-700/50 text-purple-300">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{currentGuide.title}</h2>
              <p className="text-xs text-slate-400">Target Injection Guide & Quick Launch</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#25253b] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs bg-[#12121e]">
          <div className="p-3.5 rounded-xl bg-[#1a1a2b] border border-[#2d2d46]">
            <h3 className="font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              How to continue work seamlessly:
            </h3>
            <div className="space-y-2 text-slate-300">
              <div className="flex items-start gap-2">
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-purple-950 text-purple-300 border border-purple-700 font-bold text-[10px]">
                  1
                </span>
                <span>
                  Click <strong>"Copy Handoff"</strong> (<kbd className="bg-[#242436] px-1 rounded font-mono">Ctrl+Shift+C</kbd>) in RavenClaw.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-purple-950 text-purple-300 border border-purple-700 font-bold text-[10px]">
                  2
                </span>
                <span>
                  Open <strong>{target.name}</strong> ({target.domain || 'Target AI'}).
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-purple-950 text-purple-300 border border-purple-700 font-bold text-[10px]">
                  3
                </span>
                <span>
                  Paste the compiled handoff as your new prompt and press Enter. The target model will adopt the context and resume the task immediately.
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#171726] border border-[#27273d]">
            <h3 className="font-semibold text-purple-300 mb-2 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-purple-400" />
              Framing Highlights & Strategy:
            </h3>
            <ul className="space-y-1.5 text-slate-300">
              {currentGuide.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 pt-2 border-t border-[#2a2a40] text-[11px] text-slate-400 font-mono">
              💡 {currentGuide.syntaxNotes}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#19192b] border-t border-[#2c2c44]">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Local privacy guaranteed</span>
          </div>

          <div className="flex items-center gap-2">
            {target.url && (
              <a
                href={target.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-white font-medium text-xs shadow-md transition-colors"
              >
                <span>Launch {target.name}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-[#27273d] hover:bg-[#343450] text-slate-200 text-xs transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
