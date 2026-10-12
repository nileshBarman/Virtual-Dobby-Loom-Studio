import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Lightbulb,
  CheckCircle,
  HelpCircle,
  Wand2,
  Layers,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { DobbyDesign } from '../types';

interface AIAssistantProps {
  currentDesign: DobbyDesign;
  onApplyPreset?: (name: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  suggestions?: string[];
}

const DEFAULT_SUGGESTIONS = [
  'How do I fix excessive floats on my border?',
  'Explain the relationship between EPI, PPI and motif distortion.',
  'What is the difference between straight draft and pointed draft?',
  'Suggest traditional Maheshwari zari border ideas.',
  'How do I peg my dobby lattice for an 8-shaft pointed twill?'
];

export const AIAssistant: React.FC<AIAssistantProps> = ({ currentDesign }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: `Hello! I am your Handloom Textile & Dobby Consultant. I can help you analyze weave structures, diagnose excessive floats, calculate EPI/PPI reed densities, and suggest authentic traditional handloom motifs (Maheshwari, Chanderi, Kanjivaram). How can I assist with your design today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: DEFAULT_SUGGESTIONS.slice(0, 3),
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputText;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Call server-side API endpoint for Gemini
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          context: {
            designName: currentDesign.name,
            dimensions: `${currentDesign.width} ends × ${currentDesign.height} picks`,
            numShafts: currentDesign.numShafts,
            epi: currentDesign.epi,
            ppi: currentDesign.ppi,
            warpYarn: `${currentDesign.warpYarn.material} (${currentDesign.warpYarn.count})`,
            weftYarn: `${currentDesign.weftYarn.material} (${currentDesign.weftYarn.count})`,
            repeatType: currentDesign.repeatType,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        // High quality fallback textile response if API key not injected
        generateFallbackResponse(textToSend);
      }
    } catch {
      generateFallbackResponse(textToSend);
    } finally {
      setIsLoading(false);
    }
  };

  const generateFallbackResponse = (query: string) => {
    const lower = query.toLowerCase();
    let reply = '';

    if (lower.includes('float') || lower.includes('snag')) {
      reply = `In handloom dobby weaving, floats longer than 5-6 threads are hazardous. On fine silk warps (20/22D), an unbound weft float can catch the boat shuttle tip or snag during wear. To fix this:\n1. Insert a 1/1 ground tie point in the center of the float.\n2. Convert the solid motif interior to a 2/2 or 3/1 twill diagonal ground.\n3. Verify your repeat seam in the Repeat Engine to ensure edges do not double the float length when tiled.`;
    } else if (lower.includes('epi') || lower.includes('ppi') || lower.includes('distort')) {
      reply = `EPI (Ends Per Inch) and PPI (Picks Per Inch) determine geometric proportionality. Currently, your design is set to EPI ${currentDesign.epi} and PPI ${currentDesign.ppi} (aspect ratio ${(currentDesign.ppi / currentDesign.epi).toFixed(2)}x).\n\nIf your EPI and PPI differ by more than 15%, square pixels on your dobby graph will weave as rectangles on the loom. To keep round or 45° diamond motifs intact, ensure your reed denting and beat-up tension are closely balanced, or compress the graph row count in advance.`;
    } else if (lower.includes('draft') || lower.includes('shaft')) {
      reply = `Drafting assigns each warp thread to a specific heald shaft:\n• Straight Draft: 1-2-3-4-5-6-7-8 across. Best for non-symmetrical weaves.\n• Pointed Draft: 1-2-3-4-3-2-1. Creates symmetrical diamonds and chevrons with half the heald shafts!\n• Minimum Shaft Reduction: Any warp threads with identical lift signatures across all ${currentDesign.height} picks share one shaft. Your current design requires ${currentDesign.numShafts} shafts.`;
    } else if (lower.includes('maheshwari') || lower.includes('border') || lower.includes('zari')) {
      reply = `Traditional Maheshwari borders originate from the historic town of Maheshwar in Madhya Pradesh. Distinctive characteristics include:\n• Geometric architectural chevrons (Narmada river fort battlements)\n• Pure mulberry silk warp with fine combed cotton weft\n• Silver or tested gold zari accent lines bordering the motif\n• Reversible borders that look identical on both sides of the saree.`;
    } else {
      reply = `For your current design "${currentDesign.name}" (${currentDesign.width}×${currentDesign.height}, ${currentDesign.numShafts} shafts, ${currentDesign.epi} EPI / ${currentDesign.ppi} PPI):\n\nI recommend previewing the weave structure in Mode C (Fabric View) to inspect the 3D over-under interlacement. You can also test pick-by-pick shedding in the Virtual Loom simulator to verify that shuttle passage and shed opening are smooth.`;
    }

    const aiMsg: ChatMessage = {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: reply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: DEFAULT_SUGGESTIONS.slice(2, 5),
    };
    setMessages(prev => [...prev, aiMsg]);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0c12] text-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-[#121622] border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-sky-500/20 text-amber-400 border border-amber-500/30">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">AI Dobby Textile Consultant</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Active Context: {currentDesign.name}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Technical advisor for dobby drafts, float remediation, yarn counts, and authentic handloom weaves
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                id: 'welcome-reset',
                sender: 'ai',
                text: 'Chat history cleared. How can I help with your handloom dobby design?',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ])
          }
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          title="Clear Conversation"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-3xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold ${
                msg.sender === 'user'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-[#181d2c] text-sky-400 border border-slate-700'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className="space-y-2 max-w-2xl">
              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-amber-600 text-white shadow-lg'
                    : 'bg-[#121622] text-slate-200 border border-slate-800 shadow-md whitespace-pre-line'
                }`}
              >
                {msg.text}
              </div>

              {/* Suggestions chips */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {msg.suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(s)}
                      className="px-3 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-300 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              <span className="text-[10px] text-slate-500 px-1 block">{msg.timestamp}</span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 max-w-xl">
            <div className="w-8 h-8 rounded-xl bg-[#181d2c] text-sky-400 border border-slate-700 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-[#121622] border border-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]"></span>
              <span className="text-xs text-slate-400 font-mono ml-2">Consulting textile engine...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 bg-[#121622] border-t border-slate-800">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 max-w-4xl mx-auto"
        >
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Ask about dobby lattice pegging, float errors, silk EPI/PPI counts, or traditional motifs..."
            className="flex-1 bg-[#090b10] border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:pointer-events-none text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-950/40 transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
