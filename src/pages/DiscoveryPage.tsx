import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Search } from 'lucide-react';

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

  const functionUrl = import.meta.env.VITE_FUNCTION_URL;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    <div className="pt-20 pb-4 px-4 h-screen flex flex-col">
      <div className="container mx-auto flex-grow flex flex-col">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">Grant Discovery</h1>
          <p className="text-text-secondary">
            Chat with our AI assistant to find grants matching your project needs
          </p>
        </div>
        
        <div className="flex-grow card-bg rounded-xl overflow-hidden flex flex-col">
          {/* Messages Area */}
          <div className="flex-grow p-4 overflow-y-auto">
            <div className="space-y-4">
              {messages.map(message => (
                <div 
                  key={message.id} 
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-[75%] items-start gap-2.5 ${
                    message.sender === 'user' 
                      ? 'flex-row-reverse' 
                      : 'flex-row'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.sender === 'user'
                        ? 'bg-accent-teal'
                        : 'bg-accent-subtle'
                    }`}>
                      {message.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`p-4 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-accent-teal text-white'
                        : 'bg-background-dark border border-gray-800 text-text-primary'
                    }`}>
                      <p>{message.text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          {/* Input Area */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Describe your project or ask about grants..."
                className="flex-grow bg-background-dark border border-gray-800 rounded-md px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-teal"
                disabled={loading}
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className={`p-3 rounded-md ${
                  input.trim() && !loading
                    ? 'bg-accent-teal hover:bg-accent-teal/90 cursor-pointer' 
                    : 'bg-gray-700 cursor-not-allowed'
                } transition-colors`}
              >
                <Send size={20} className="text-white" />
              </button>
            </div>
            <div className="flex justify-center mt-4">
              <button className="flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors">
                <Search size={16} />
                <span>Search all grants instead</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscoveryPage;