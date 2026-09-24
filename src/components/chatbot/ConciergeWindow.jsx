import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatbotService, DEFAULT_CHATBOT_CONFIG } from '../../services/chatbotService';
import { ConciergeWelcomeCard } from './views/ConciergeWelcomeCard';
import { ServiceCarouselCard } from './views/ServiceCarouselCard';
import { ServiceDetailCard } from './views/ServiceDetailCard';
import { PricingTableView } from './views/PricingTableView';
import { InteractiveBookingStepper } from './views/InteractiveBookingStepper';
import { OrderTrackingCard } from './views/OrderTrackingCard';
import { FAQAccordionCard } from './views/FAQAccordionCard';
import { ContactSupportCard } from './views/ContactSupportCard';
import { 
  Sparkles, 
  X, 
  Send, 
  RotateCcw, 
  Mic, 
  MicOff, 
  ArrowRight 
} from 'lucide-react';

export const ConciergeWindow = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [config, setConfig] = useState(DEFAULT_CHATBOT_CONFIG);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeQuickPills, setActiveQuickPills] = useState([
    { label: '📦 Book Pickup', value: 'Book a Doorstep Pickup' },
    { label: '👕 Services', value: 'Explore Cleaning Services' },
    { label: '💰 Price List', value: 'Calculate Garment Pricing' },
    { label: '❓ FAQs', value: 'What are your turnaround times and solvents?' },
  ]);

  // Load chatbot configuration
  useEffect(() => {
    chatbotService.getConfig().then(setConfig);
  }, []);

  // Keyboard accessibility: Escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Initial welcome greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome-card',
          sender: 'bot',
          componentType: 'WELCOME_CARD',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    }
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Auto-scroll inside contained message feed
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Voice speech-to-text recognition handler
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleSend(transcript);
        }
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  const handleSend = async (userText) => {
    const text = (userText || inputText).trim();
    if (!text) return;

    // Add user message
    const userMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      componentType: 'TEXT',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await chatbotService.processMessage(text);

      if (response.contextPills && response.contextPills.length > 0) {
        setActiveQuickPills(response.contextPills);
      }

      setTimeout(() => {
        const botMsg = {
          id: `b-${Date.now()}`,
          sender: 'bot',
          componentType: response.type,
          text: response.text,
          payload: response.payload,
          actionLabel: response.actionLabel,
          actionUrl: response.actionUrl,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botMsg]);
        setIsTyping(false);
      }, 350);
    } catch (e) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `b-err-${Date.now()}`,
          sender: 'bot',
          componentType: 'CONTACT_CARD',
          text: "I'm experiencing a brief network pause. You can book online anytime or connect with our concierge team:",
          payload: {
            phone: '+91 63048 45567',
            whatsapp: '+91 63048 45567',
          },
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-card',
        sender: 'bot',
        componentType: 'WELCOME_CARD',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
    setActiveQuickPills([
      { label: '📦 Book Pickup', value: 'Book a Doorstep Pickup' },
      { label: '👕 Services', value: 'Explore Cleaning Services' },
      { label: '💰 Price List', value: 'Calculate Garment Pricing' },
      { label: '❓ FAQs', value: 'What are your turnaround times and solvents?' },
    ]);
  };

  if (!isOpen) return null;

  return (
    /* NO full-screen backdrop overlay — Website behind remains completely visible, interactive & scrollable */
    <div
      className="fixed z-50 bottom-[80px] sm:bottom-[90px] right-3 sm:right-6 left-3 sm:left-auto w-auto sm:w-[390px] max-w-[420px] h-[550px] max-h-[70vh] sm:max-h-[580px] bg-white rounded-[28px] shadow-[0_20px_60px_-15px_rgba(31,41,55,0.25)] border border-[#FED7AA] flex flex-col justify-between overflow-hidden animate-fade-in no-print"
      role="dialog"
      aria-label="Tech Wash AI Concierge"
      aria-modal="false"
    >
      
      {/* ─────────────────────────────────────────────────────────
          1. COMPACT CONCIERGE HEADER (FIXED, ~56px)
      ───────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 bg-[#1F2937] text-white flex items-center justify-between border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center p-0.5 shadow-sm border border-[#FED7AA]/50 overflow-hidden">
            <img 
              src="/techwashlogo.webp" 
              alt="Tech Wash Bot" 
              className="w-full h-full object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <div>
            <h3 className="text-xs font-black font-display tracking-tight text-white flex items-center gap-1.5 leading-none">
              <span>{config.botName || 'Tech Wash Concierge'}</span>
              <span className="w-2 h-2 rounded-full bg-[#F97316] animate-pulse" />
            </h3>
            <span className="text-[10px] text-[#FED7AA] font-medium leading-none block mt-1">
              AI Laundry Assistant • Online now
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleResetChat}
            className="w-7 h-7 rounded-lg text-slate-300 hover:text-white hover:bg-white/15 flex items-center justify-center transition-colors"
            title="Reset Conversation"
            aria-label="Reset Conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-300 hover:text-white hover:bg-white/15 flex items-center justify-center transition-colors"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          2. SCROLLABLE STRUCTURED MESSAGES FEED
      ───────────────────────────────────────────────────────── */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50/60 text-xs">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          if (isUser) {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[78%] p-3 rounded-2xl rounded-tr-xs bg-[#F97316] text-white shadow-sm font-medium text-xs">
                  <div>{msg.text}</div>
                  <div className="text-[9px] text-orange-100 mt-1 text-right font-mono">
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          }

          // BOT STRUCTURED COMPONENTS
          return (
            <div key={msg.id} className="space-y-2 animate-fade-in">
              
              {/* Conversational Text Intro (Short, 1-2 sentences) */}
              {msg.text && (
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center p-0.5 text-white shrink-0 mt-0.5 shadow-sm border border-[#FED7AA]/50 overflow-hidden">
                    <img 
                      src="/techwashlogo.webp" 
                      alt="Tech Wash Bot" 
                      className="w-full h-full object-contain"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                  <div className="max-w-[85%] p-3 rounded-2xl rounded-tl-xs bg-white text-slate-800 border border-brand-200/80 shadow-sm text-xs leading-relaxed">
                    {msg.text}
                  </div>
                </div>
              )}

              {/* Typed UI Component Renderers */}
              {msg.componentType === 'WELCOME_CARD' && (
                <ConciergeWelcomeCard onSelectAction={(act) => handleSend(act)} />
              )}

              {msg.componentType === 'SERVICES_CAROUSEL' && (
                <ServiceCarouselCard
                  services={msg.payload?.services || []}
                  onSelectService={(srv) => {
                    handleSend(`Tell me more about ${srv.title}`);
                  }}
                  onBookService={(srv) => {
                    handleSend(`Book ${srv.title}`);
                  }}
                />
              )}

              {msg.componentType === 'SERVICE_DETAIL' && (
                <ServiceDetailCard
                  service={msg.payload?.service}
                  onBack={() => handleSend('Explore Cleaning Services')}
                  onBookService={(srv) => handleSend(`Book ${srv.title}`)}
                />
              )}

              {msg.componentType === 'PRICING_TABLE' && (
                <PricingTableView
                  onStartBookingWithItem={(item) => handleSend(`Book pickup for ${item.name}`)}
                />
              )}

              {msg.componentType === 'BOOKING_STEPPER' && (
                <InteractiveBookingStepper
                  initialService={msg.payload?.initialService}
                  initialItem={msg.payload?.initialItem}
                  onBookingConfirmed={() => {}}
                />
              )}

              {msg.componentType === 'ORDER_TRACKING' && (
                <OrderTrackingCard order={msg.payload?.order} />
              )}

              {msg.componentType === 'FAQ_ACCORDION' && (
                <FAQAccordionCard faqs={msg.payload?.faqs} />
              )}

              {msg.componentType === 'CONTACT_CARD' && (
                <ContactSupportCard contacts={msg.payload} />
              )}

              {msg.actionUrl && msg.actionLabel && (
                <div className="pl-8">
                  <a
                    href={msg.actionUrl}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-[11px] shadow-sm transition-all"
                  >
                    <span>{msg.actionLabel}</span>
                    <ArrowRight className="w-3 h-3 text-white" />
                  </a>
                </div>
              )}

            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#F97316] flex items-center justify-center text-white shrink-0 shadow-sm">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <div className="p-2.5 rounded-2xl bg-white border border-[#FED7AA] rounded-tl-xs flex items-center gap-1 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#FED7AA] animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] animate-bounce" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ─────────────────────────────────────────────────────────
          3. DYNAMIC CONTEXTUAL QUICK ACTION PILLS (HORIZONTAL SCROLL)
      ───────────────────────────────────────────────────────── */}
      <div className="px-3 pt-2 pb-1.5 bg-white border-t border-slate-100 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {activeQuickPills.map((pill, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(pill.value)}
              className="px-2.5 py-1 rounded-full bg-[#FFF7ED] hover:bg-[#FFEDD5] border border-[#FED7AA] text-[#F97316] text-[11px] font-bold transition-all shrink-0 hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          4. COMPACT INPUT BAR WITH OPTIONAL VOICE RECOGNITION
      ───────────────────────────────────────────────────────── */}
      <div className="p-3 bg-white border-t border-slate-100 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 focus-within:border-[#F97316] focus-within:ring-2 focus-within:ring-[#F97316]/15 transition-all shadow-inner"
        >
          {/* Voice Input Trigger */}
          <button
            type="button"
            onClick={handleVoiceInput}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse'
                : 'text-slate-400 hover:text-[#F97316] hover:bg-slate-100'
            }`}
            title={isListening ? 'Listening...' : 'Voice Input'}
            aria-label="Voice input"
          >
            {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>

          <input
            ref={inputRef}
            type="text"
            placeholder={isListening ? 'Listening to your voice...' : 'Ask about prices, pickup, care...'}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-transparent border-none text-xs text-slate-800 focus:outline-none placeholder:text-slate-400 font-medium"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-7 h-7 rounded-full bg-[#F97316] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[#EA580C] hover:scale-105 active:scale-95 transition-all shadow-sm shrink-0"
            aria-label="Send message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

    </div>
  );
};
