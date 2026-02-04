import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFlowStore } from '@/store/flowStore';
import { cn } from '@/lib/utils';

export default function AICopilot() {
  const { 
    isCopilotOpen, 
    toggleCopilot, 
    chatMessages, 
    addChatMessage,
    yamlContent,
    setYamlContent,
    apiKey 
  } = useFlowStore();
  
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;

    const userMessage = input.trim();
    setInput('');
    addChatMessage({ role: 'user', content: userMessage });
    setIsThinking(true);

    // Simulate AI response (or real API call if key exists)
    setTimeout(() => {
      if (!apiKey) {
        // Simulation mode - add a comment to YAML
        const updatedYaml = `# AI Suggestion: ${userMessage}\n${yamlContent}`;
        setYamlContent(updatedYaml);
        
        addChatMessage({
          role: 'assistant',
          content: `I've added a comment to your YAML flow based on your request: "${userMessage}"\n\nNote: This is a simulation. To enable real AI modifications, add your OpenAI API key in Settings.`,
        });
      } else {
        // Would make real API call here
        addChatMessage({
          role: 'assistant',
          content: `I understand you want to: "${userMessage}"\n\nI would process this with the AI to modify your flow. This feature is ready for implementation with the OpenAI API.`,
        });
      }
      setIsThinking(false);
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isCopilotOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 350, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="h-full glass-panel border-l border-border flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/20">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">AI Copilot</h3>
                <p className="text-xs text-muted-foreground">Modify flows with AI</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCopilot}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 && (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Ask me to modify your flow...
                </p>
                <p className="text-xs text-muted-foreground/70 mt-2">
                  Try: "Add a step to check modem lights"
                </p>
              </div>
            )}
            
            {chatMessages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'flex-row-reverse' : ''
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                    message.role === 'user'
                      ? 'bg-primary/20'
                      : 'bg-accent/20'
                  )}
                >
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 text-primary" />
                  ) : (
                    <Bot className="w-4 h-4 text-accent" />
                  )}
                </div>
                <div
                  className={cn(
                    'px-4 py-3 rounded-2xl max-w-[85%]',
                    message.role === 'user'
                      ? 'chat-bubble-user rounded-br-md'
                      : 'chat-bubble-ai rounded-bl-md'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </motion.div>
            ))}
            
            {isThinking && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-accent" />
                </div>
                <div className="chat-bubble-ai px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-border">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask AI to modify this flow..."
                className="flex-1 bg-muted border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={isThinking}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isThinking}
                className="shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            {!apiKey && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Simulation mode • Add API key for real AI
              </p>
            )}
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
