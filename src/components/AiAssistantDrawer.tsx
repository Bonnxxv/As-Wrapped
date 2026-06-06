import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, X, Trash2, ArrowRight, ArrowLeft, Copy, Check } from 'lucide-react';
import { PlatformProfiles, FolderDataState, ApiKeyConfig } from '../types';
import { ChatMessage, prepareChatContext, sendAiChatMessage } from '../utils/aiChatService';
import { simplifyModelName } from '../utils/geminiService';

interface ChatSession {
  id: string;
  title: string;
  timestamp: number;
  messages: ChatMessage[];
}

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: PlatformProfiles;
  folders: FolderDataState;
  selectedYear: number;
  selectedMonth: number;
  apiKeys: ApiKeyConfig[];
  activeApiKeyId: string;
}

const SUGGESTED_PROMPTS = [
  { label: '💡 Cari Ide Konten Baru', text: 'Berdasarkan postingan terbaik saya, berikan 3 ide konsep konten baru yang berpotensi menarik audiens.' },
  { label: '📉 Analisis Performa Turun', text: 'Analisis performa konten saya periode ini. Mengapa interaksi/views berkurang dan apa saran perbaikannya?' },
  { label: '✍️ Buat Draf Caption & Hashtag', text: 'Buatkan draf caption yang menarik dan hashtag yang dioptimalkan untuk konten tips trik media sosial.' },
  { label: '⏰ Jam Posting Terbaik', text: 'Analisis performa konten saya berdasarkan hari postingan. Kapan waktu posting terbaik menurut data ini?' }
];

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  profiles,
  folders,
  selectedYear,
  selectedMonth,
  apiKeys,
  activeApiKeyId
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeScreen, setActiveScreen] = useState<'welcome' | 'chat'>('welcome');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeKey = apiKeys.find(k => k.id === activeApiKeyId) || apiKeys[0];

  // Load chat sessions from localStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('aswrapped_chat_sessions');
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions) as ChatSession[];
        setSessions(parsed);
        
        const savedActiveId = localStorage.getItem('aswrapped_active_session_id');
        if (savedActiveId) {
          const activeSess = parsed.find(s => s.id === savedActiveId);
          if (activeSess) {
            setActiveSessionId(savedActiveId);
            setMessages(activeSess.messages);
            setActiveScreen('chat');
          }
        }
      } catch (err) {
        console.error('Failed to load chat sessions:', err);
      }
    }
  }, []);

  // Save active session messages to sessions array and localStorage
  useEffect(() => {
    if (activeSessionId && messages.length > 0) {
      setSessions(prev => {
        const index = prev.findIndex(s => s.id === activeSessionId);
        let updated = [...prev];
        
        if (index !== -1) {
          updated[index] = {
            ...updated[index],
            messages,
            timestamp: Date.now()
          };
        }
        
        localStorage.setItem('aswrapped_chat_sessions', JSON.stringify(updated));
        return updated;
      });
    }
  }, [messages, activeSessionId]);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Trigger scroll on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
      textareaRef.current?.focus();
    }
  }, [isOpen]);

  // Auto-grow textarea height berdasarkan input
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  const handleSendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    if (!activeKey || !activeKey.apiKey) {
      setError('API Key belum diatur. Silakan buka Setelan API di Sidebar untuk mengaturnya.');
      return;
    }

    setError(null);
    const userMsg: ChatMessage = { role: 'user', content: trimmed };
    
    let currentSessionId = activeSessionId;
    let updatedMessages: ChatMessage[] = [];

    // Jika di halaman awal atau tidak ada sesi aktif, buat sesi baru
    if (activeScreen === 'welcome' || !currentSessionId) {
      const newSessionId = `session-${Date.now()}`;
      const newSession: ChatSession = {
        id: newSessionId,
        title: trimmed.length > 35 ? trimmed.substring(0, 35) + '...' : trimmed,
        timestamp: Date.now(),
        messages: [userMsg]
      };
      
      setSessions(prev => {
        const updated = [newSession, ...prev];
        localStorage.setItem('aswrapped_chat_sessions', JSON.stringify(updated));
        return updated;
      });
      
      currentSessionId = newSessionId;
      setActiveSessionId(newSessionId);
      localStorage.setItem('aswrapped_active_session_id', newSessionId);
      
      updatedMessages = [userMsg];
      setMessages(updatedMessages);
    } else {
      // Melanjutkan sesi yang sedang aktif
      updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
    }

    setInputText('');
    setIsLoading(true);
    setActiveScreen('chat');

    try {
      // 1. Ambil data analitik aktual sebagai konteks
      const contextText = prepareChatContext(profiles, folders, selectedYear, selectedMonth);

      // 2. Kirim ke API Key yang dipilih
      const reply = await sendAiChatMessage(
        activeKey.apiKey,
        activeKey.model,
        activeKey.provider,
        updatedMessages,
        contextText
      );

      const aiMsg: ChatMessage = { role: 'assistant', content: reply };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal mengirim pesan. Silakan periksa koneksi internet atau kunci API Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputText);
    }
  };

  // Hapus sesi aktif dari header
  const handleClearChat = () => {
    if (window.confirm('Hapus obrolan ini dari histori?')) {
      if (activeSessionId) {
        setSessions(prev => {
          const updated = prev.filter(s => s.id !== activeSessionId);
          localStorage.setItem('aswrapped_chat_sessions', JSON.stringify(updated));
          return updated;
        });
      }
      setMessages([]);
      setActiveSessionId(null);
      localStorage.removeItem('aswrapped_active_session_id');
      setActiveScreen('welcome');
      setError(null);
    }
  };

  // Hapus sesi spesifik dari daftar halaman awal
  const handleDeleteSession = (sessionId: string) => {
    if (window.confirm('Hapus histori obrolan ini secara permanen?')) {
      setSessions(prev => {
        const updated = prev.filter(s => s.id !== sessionId);
        localStorage.setItem('aswrapped_chat_sessions', JSON.stringify(updated));
        return updated;
      });
      if (activeSessionId === sessionId) {
        setMessages([]);
        setActiveSessionId(null);
        localStorage.removeItem('aswrapped_active_session_id');
        setActiveScreen('welcome');
      }
    }
  };

  const handleCopyMessage = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(idx);
      setTimeout(() => {
        setCopiedIndex(null);
      }, 2000);
    }).catch(err => {
      console.error('Gagal menyalin teks:', err);
    });
  };

  // Helper untuk format waktu relatif
  const formatTime = (timestamp: number): string => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Baru saja';
    if (mins < 60) return `${mins}m lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}j lalu`;
    const days = Math.floor(hours / 24);
    return `${days}h lalu`;
  };

  // Helper untuk parse inline markdown dasar secara manual (bold, bullets, linebreaks)
  const parseInlineMarkdown = (text: string) => {
    const parts = [];
    let currentText = text;
    let key = 0;
    
    while (currentText.includes('**')) {
      const startIdx = currentText.indexOf('**');
      const endIdx = currentText.indexOf('**', startIdx + 2);
      if (endIdx === -1) break;
      
      if (startIdx > 0) {
        parts.push(<span key={key++}>{currentText.substring(0, startIdx)}</span>);
      }
      parts.push(
        <strong key={key++} className="font-bold text-[color:var(--md-sys-color-primary)]">
          {currentText.substring(startIdx + 2, endIdx)}
        </strong>
      );
      currentText = currentText.substring(endIdx + 2);
    }
    
    if (currentText.length > 0) {
      parts.push(<span key={key++}>{currentText}</span>);
    }
    
    return parts.length > 0 ? parts : text;
  };

  const parseMarkdown = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Check for headers (e.g. ### Header)
      if (line.startsWith('### ')) {
        return <h4 key={i} className="font-bold text-[13px] mt-2 mb-1 text-[color:var(--md-sys-color-on-surface)]">{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={i} className="font-bold text-[14px] mt-3 mb-1 text-[color:var(--md-sys-color-on-surface)]">{line.replace('## ', '')}</h3>;
      }
      // Check for lists (e.g. * Item or - Item or 1. Item)
      const listMatch = line.match(/^[\*\-\+]\s+(.*)/);
      if (listMatch) {
        return (
          <li key={i} className="ml-4 list-disc text-[12px] leading-relaxed text-[color:var(--md-sys-color-on-surface)]">
            {parseInlineMarkdown(listMatch[1])}
          </li>
        );
      }
      const numListMatch = line.match(/^\d+\.\s+(.*)/);
      if (numListMatch) {
        return (
          <li key={i} className="ml-4 list-decimal text-[12px] leading-relaxed text-[color:var(--md-sys-color-on-surface)]">
            {parseInlineMarkdown(numListMatch[1])}
          </li>
        );
      }
      if (line.trim() === '') return <div key={i} className="h-1.5" />;
      return <p key={i} className="text-[12px] leading-relaxed mb-0.5 text-[color:var(--md-sys-color-on-surface)]">{parseInlineMarkdown(line)}</p>;
    });
  };

  return (
    <>
      {/* Dimmed Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/15 backdrop-blur-[1px] transition-opacity duration-300 cursor-pointer"
          onClick={onClose}
        />
      )}

      {/* Slide Out Panel */}
      <div
        className={`fixed right-0 top-0 h-screen w-[380px] z-50 flex flex-col
          bg-[color:var(--md-sys-color-surface-container)]
          border-l border-[color:var(--md-sys-color-outline-variant)]
          shadow-[var(--md-elevation-3)]
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-[color:var(--md-sys-color-outline-variant)] shrink-0 bg-[color:var(--md-sys-color-surface)]">
          <div className="flex items-center gap-2 text-left">
            {activeScreen === 'chat' && messages.length > 0 && (
              <button
                onClick={() => setActiveScreen('welcome')}
                className="md-icon-btn-sm shrink-0 mr-1"
                title="Kembali ke Menu Awal"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div className="w-8 h-8 rounded-full bg-[color:var(--md-sys-color-primary-container)] text-[color:var(--md-sys-color-primary)] flex items-center justify-center shrink-0">
              <Sparkles size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold text-[color:var(--md-sys-color-on-surface)]">Asisten AI Pertumbuhan</span>
              <span className="text-[9px] text-[color:var(--md-sys-color-on-surface-variant)] leading-none mt-0.5 capitalize">
                {activeKey ? `${activeKey.provider === 'gemini' ? 'Gemini' : 'Hugging Face'} • ${simplifyModelName(activeKey.model)}` : 'Kunci belum diatur'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {activeScreen === 'chat' && messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="md-icon-btn-sm"
                title="Hapus Percakapan Ini"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className="md-icon-btn-sm"
              title="Tutup Panel"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[color:var(--md-sys-color-surface-container-low)]">
          {messages.length === 0 || activeScreen === 'welcome' ? (
            /* Welcome / Onboarding Card */
            <div className="flex flex-col gap-4 mt-2 select-none">
              {/* Button to resume active chat */}
              {messages.length > 0 && activeSessionId && (
                <button
                  onClick={() => setActiveScreen('chat')}
                  className="gai-btn-tonal w-full py-2.5 rounded-xl text-[11px] flex justify-center items-center gap-2 mb-2 font-semibold cursor-pointer shadow-sm border border-[color:var(--md-sys-color-outline-variant)] bg-[color:var(--md-sys-color-surface)] hover:bg-[color:var(--md-sys-color-surface-container-high)] text-[color:var(--md-sys-color-on-surface)] shrink-0"
                >
                  <span>Lihat Obrolan Aktif ({messages.length} pesan)</span>
                  <ArrowRight size={12} className="shrink-0 text-[color:var(--md-sys-color-primary)]" />
                </button>
              )}

              <div className="w-14 h-14 rounded-3xl bg-[color:var(--md-sys-color-primary-container)] text-[color:var(--md-sys-color-primary)] flex items-center justify-center mx-auto shadow-sm shrink-0">
                <Sparkles size={28} />
              </div>
              <div className="flex flex-col gap-1 px-2 text-center">
                <h3 className="text-[14px] font-bold text-[color:var(--md-sys-color-on-surface)]">Halo Kreator! 👋</h3>
                <p className="text-[11px] text-[color:var(--md-sys-color-on-surface-variant)] leading-normal">
                  Saya adalah **Antigravity AI**. Saya memahami data statistik postingan Instagram & TikTok Anda.
                </p>
              </div>

              {/* Suggested Questions */}
              <div className="flex flex-col gap-2 mt-2 text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--md-sys-color-on-surface-variant)] px-2">Pertanyaan Populer:</span>
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt.text)}
                    className="p-3 rounded-xl border border-[color:var(--md-sys-color-outline-variant)] bg-[color:var(--md-sys-color-surface)] hover:bg-[color:var(--md-sys-color-surface-container-high)] text-[11px] text-[color:var(--md-sys-color-on-surface)] flex justify-between items-center gap-3 transition-all duration-150 cursor-pointer shadow-sm text-left font-medium"
                  >
                    <span>{prompt.label}</span>
                    <ArrowRight size={12} className="shrink-0 text-[color:var(--md-sys-color-primary)]" />
                  </button>
                ))}
              </div>

              {/* Chat History List */}
              {sessions.length > 0 && (
                <div className="flex flex-col gap-2 mt-4 text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--md-sys-color-on-surface-variant)] px-2">Histori Chat Sebelumnya:</span>
                  <div className="max-h-[180px] overflow-y-auto pr-1 space-y-2">
                    {sessions.map(session => (
                      <div
                        key={session.id}
                        className={`group relative flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                          session.id === activeSessionId && activeScreen !== 'welcome'
                            ? 'border-[color:var(--md-sys-color-primary)] bg-[color:var(--md-sys-color-primary-container)]/30 text-[color:var(--md-sys-color-on-surface)]'
                            : 'border-[color:var(--md-sys-color-outline-variant)] bg-[color:var(--md-sys-color-surface)] hover:bg-[color:var(--md-sys-color-surface-container-high)] text-[color:var(--md-sys-color-on-surface)]'
                        }`}
                        onClick={() => {
                          setActiveSessionId(session.id);
                          localStorage.setItem('aswrapped_active_session_id', session.id);
                          setMessages(session.messages);
                          setActiveScreen('chat');
                        }}
                      >
                        <div className="flex flex-col min-w-0 pr-6">
                          <span className="text-[11px] font-semibold truncate leading-normal text-[color:var(--md-sys-color-on-surface)]">{session.title}</span>
                          <span className="text-[9px] text-[color:var(--md-sys-color-on-surface-variant)] mt-0.5">
                            {formatTime(session.timestamp)} • {session.messages.length} pesan
                          </span>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(session.id);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-[color:var(--md-sys-color-error)] hover:bg-[color:var(--md-sys-color-error)]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer"
                          title="Hapus Histori"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Messages List */
            <div className="space-y-4">
              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                const isCopied = copiedIndex === idx;
                return (
                  <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} group/bubble relative`}>
                    <div
                      className={`p-3.5 pr-8 max-w-[85%] rounded-2xl shadow-sm text-[12px] leading-relaxed transition-all relative ${
                        isUser
                          ? 'bg-[color:var(--md-sys-color-primary-container)] text-[color:var(--md-sys-color-on-primary-container)] rounded-tr-none'
                          : 'bg-[color:var(--md-sys-color-surface)] text-[color:var(--md-sys-color-on-surface)] rounded-tl-none border border-[color:var(--md-sys-color-outline-variant)]'
                      }`}
                    >
                      {!isUser ? parseMarkdown(msg.content) : msg.content}

                      {/* Tombol Salin Pesan (Muncul saat Hover) */}
                      <button
                        onClick={() => handleCopyMessage(msg.content, idx)}
                        className={`absolute right-1.5 bottom-1.5 p-1 rounded-lg transition-all opacity-0 group-hover/bubble:opacity-100 hover:bg-[color:var(--md-sys-color-surface-container-high)] cursor-pointer ${
                          isUser 
                            ? 'text-[color:var(--md-sys-color-on-primary-container)]/70 hover:text-[color:var(--md-sys-color-on-primary-container)]' 
                            : 'text-[color:var(--md-sys-color-on-surface-variant)] hover:text-[color:var(--md-sys-color-on-surface)]'
                        }`}
                        title="Salin Pesan"
                      >
                        {isCopied ? (
                          <Check size={11} className="text-green-500" />
                        ) : (
                          <Copy size={11} />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="p-3.5 rounded-2xl rounded-tl-none bg-[color:var(--md-sys-color-surface)] border border-[color:var(--md-sys-color-outline-variant)] shadow-sm flex items-center gap-1.5 h-9">
                    <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--md-sys-color-primary)] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--md-sys-color-primary)] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--md-sys-color-primary)] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {error && (
                <div className="p-3 rounded-xl bg-[color:var(--md-sys-color-error-container)] text-[color:var(--md-sys-color-on-error-container)] text-[11px] leading-relaxed border border-[color:var(--md-sys-color-error)]/20 shadow-sm font-medium">
                  {error}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Box */}
        <div className="p-3 border-t border-[color:var(--md-sys-color-outline-variant)] bg-[color:var(--md-sys-color-surface)] shrink-0 flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tanyakan analisis data Anda..."
            className="flex-1 gai-input text-xs resize-none overflow-y-auto"
            style={{ 
              padding: '10px 14px', 
              borderRadius: '18px',
              minHeight: '36px',
              maxHeight: '120px',
              lineHeight: '1.4'
            }}
            disabled={isLoading}
          />
          <button
            onClick={() => handleSendMessage(inputText)}
            disabled={!inputText.trim() || isLoading}
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer ${
              inputText.trim() && !isLoading
                ? 'bg-[color:var(--md-sys-color-primary)] text-[color:var(--md-sys-color-on-primary)] shadow-sm hover:scale-105 active:scale-95'
                : 'bg-[color:var(--md-sys-color-surface-container-high)] text-[color:var(--md-sys-color-on-surface-variant)] cursor-not-allowed'
            }`}
            title="Kirim Pesan"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </>
  );
};
