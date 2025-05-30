import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Search, Sparkles, Info } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const DiscoveryPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi there! I'm your Grant Discovery Assistant. Tell me about your project, and I'll help you find the perfect grant opportunities.",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);

  const functionUrl = import.meta.env.VITE_FUNCTION_URL;

  const handleSend = async () => {
    if (input.trim() === '') return;
    const userMessage: Message = {
      id: messages.length + 1,
      text: input,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      };
      const res = await fetch(`${functionUrl}/ai-grants`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: input })
      });
      const data = await res.json();
      const aiMessage: Message = {
        id: messages.length + 2,
        text: data.message || 'No relevant grants found.',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch {
      setMessages(prev => [...prev, {
        id: messages.length + 2,
        text: 'Error contacting AI grant assistant.',
        sender: 'ai',
        timestamp: new Date()
      }]);
    }
    setLoading(false);
  };

  return (
    <div className="pt-24 pb-16 px-4 min-h-screen bg-gradient-to-b from-background-dark to-background-light flex flex-col items-center">
      <div className="container mx-auto flex-grow flex flex-col max-w-3xl w-full">
        {/* Main Chat Area */}
        <section className="flex-grow flex flex-col w-full">
          <div className="card-bg rounded-2xl shadow-lg p-0 flex flex-col h-full">
            <div className="px-8 pt-8 pb-4 border-b border-background-light text-center flex flex-col items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center bg-accent-teal bg-opacity-20 rounded-full p-3 mb-2">
                <Sparkles size={32} className="text-accent-teal" />
              </span>
              <h1 className="text-3xl font-bold mb-1">Grant Discovery</h1>
              <p className="text-text-secondary text-base max-w-xl">
                Chat with our AI assistant to find grants matching your project needs.
              </p>
              <button
                className="mt-2 flex items-center gap-2 text-sm text-accent-teal hover:underline focus:outline-none"
                onClick={() => howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Info size={16} /> How it works?
              </button>
            </div>
            {/* Messages Area */}
            <div className="px-6 py-6 bg-background-dark/60" style={{ maxHeight: '480px', minHeight: '320px', overflowY: 'auto' }}>
              <div className="space-y-6">
                {messages.map(message => (
                  <div 
                    key={message.id} 
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex max-w-[80%] items-start gap-3 ${
                      message.sender === 'user' 
                        ? 'flex-row-reverse' 
                        : 'flex-row'
                    }`}>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow ${
                        message.sender === 'user'
                          ? 'bg-accent-teal text-white'
                          : 'bg-accent-subtle text-accent-teal'
                      }`}>
                        {message.sender === 'user' ? <User size={18} /> : <Bot size={18} />}
                      </div>
                      <div className={`p-4 rounded-2xl text-base leading-relaxed shadow-subtle ${
                        message.sender === 'user'
                          ? 'bg-accent-teal text-white'
                          : 'bg-background border border-background-light text-text-primary'
                      }`}>
                        {message.sender === 'ai' ? (
                          <p dangerouslySetInnerHTML={{ __html: message.text }} />
                        ) : (
                          <p>{message.text}</p>
                        )}
                        <p className="text-xs opacity-60 mt-2 text-right">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="flex max-w-[80%] items-start gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shadow bg-accent-subtle text-accent-teal">
                        <Bot size={18} />
                      </div>
                      <div className="p-4 rounded-2xl text-base leading-relaxed shadow-subtle bg-background border border-background-light text-text-primary">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-accent-teal rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-accent-teal rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-accent-teal rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
            {/* Input Area */}
            <div className="px-6 py-5 border-t border-background-light bg-background flex flex-col gap-2">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Describe your project or ask about grants..."
                  className="flex-grow bg-background-dark border border-background-light rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-teal text-base"
                  disabled={loading}
                  autoFocus
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className={`p-3 rounded-lg ${
                    input.trim() && !loading
                      ? 'bg-accent-teal hover:bg-accent-teal/90 cursor-pointer' 
                      : 'bg-gray-700 cursor-not-allowed'
                  } transition-colors flex items-center justify-center`}
                  aria-label="Send message"
                >
                  <Send size={22} className="text-white" />
                </button>
              </div>
              <div className="flex justify-center mt-2">
                <button className="flex items-center gap-2 text-sm text-text-secondary hover:text-accent-teal transition-colors">
                  <Search size={16} />
                  <span>Search all grants instead</span>
                </button>
              </div>
            </div>
          </div>
        </section>
        {/* How it works section below chat */}
        <div ref={howItWorksRef} className="w-full mt-10">
          <div className="bg-background-dark border border-background-light rounded-2xl p-8 shadow-lg mb-6">
            <h2 className="text-lg font-semibold mb-3 text-accent-teal flex items-center gap-2">
              <Bot size={20} /> How GrantMatch Discovery Works
            </h2>
            <ul className="text-text-secondary text-base space-y-2 list-disc list-inside mb-4">
              <li>Describe your project, mission, or needs in the chat.</li>
              <li>Our AI scans all available grants and matches the best ones for you.</li>
              <li>Get a list of grants with reasons why they fit your project.</li>
              <li>Click to apply or learn more about each grant.</li>
              <li>All matching is private and instant — no signup required.</li>
            </ul>
            <div className="bg-background border border-background-light rounded-xl p-4 text-xs text-text-secondary mt-4">
              <span className="font-semibold text-accent-warm">Tip:</span> The more details you share about your project, the better your matches!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscoveryPage;