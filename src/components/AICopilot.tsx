import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, X, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFlowStore } from '@/store/flowStore';
import { cn } from '@/lib/utils';

export default function AICopilot() {
  const { 
    isCopilotOpen, 
    toggleCopilot, 
    chatMessages, 
    addChatMessage,
    yamlContent,
    flowData,
    addStep,
    apiKey 
  } = useFlowStore();
  
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'yaml'>('chat');
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

    // Simulate AI response - macro builder functionality
    setTimeout(() => {
      // Try to interpret the request and create a step
      const lowerMessage = userMessage.toLowerCase();
      
      if (lowerMessage.includes('add') && (lowerMessage.includes('step') || lowerMessage.includes('check') || lowerMessage.includes('verify'))) {
        const newStepId = `step_ai_${Date.now()}`;
        const stepName = userMessage.replace(/^add\s*(a\s*)?(new\s*)?(step\s*)?(to\s*)?/i, '').trim() || 'AI Generated Step';
        
        // Determine step type from context
        let stepType: 'collect_information' | 'evaluate_condition' | 'decision_point' | 'provide_instructions' | 'execute_action' = 'provide_instructions';
        let config: Record<string, unknown> = { instructions_text: stepName, confirmation_required: false };
        
        if (lowerMessage.includes('ask') || lowerMessage.includes('collect') || lowerMessage.includes('input')) {
          stepType = 'collect_information';
          config = { prompt: stepName, field_name: 'ai_field', validation: { type: 'text' } };
        } else if (lowerMessage.includes('check') || lowerMessage.includes('verify') || lowerMessage.includes('condition')) {
          stepType = 'evaluate_condition';
          config = { conditions: [{ field: 'field', operator: '==', value: 'value', next_step: '' }], default_next_step: '' };
        } else if (lowerMessage.includes('decision') || lowerMessage.includes('choose') || lowerMessage.includes('option')) {
          stepType = 'decision_point';
          config = { prompt: stepName, options: [{ label: 'Yes', value: 'yes', next_step: '' }, { label: 'No', value: 'no', next_step: '' }] };
        }
        
        addStep({
          step_id: newStepId,
          name: stepName.charAt(0).toUpperCase() + stepName.slice(1),
          type: stepType,
          config,
        });
        
        addChatMessage({
          role: 'assistant',
          content: `✅ I've added a new "${stepType.replace(/_/g, ' ')}" step:\n\n**${stepName}**\n\nYou can find it at the bottom of the Steps list. Edit it to configure the details and link it to other steps.`,
        });
      } else {
        addChatMessage({
          role: 'assistant',
          content: `I understand you want to: "${userMessage}"\n\nTry commands like:\n• "Add a step to check modem lights"\n• "Add a decision for customer acceptance"\n• "Add a step to collect customer email"\n\n${!apiKey ? '💡 Add an OpenAI API key in Settings for more advanced AI assistance.' : ''}`,
        });
      }
      setIsThinking(false);
    }, 1000);
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
          <div className="p-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/20">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">AI Copilot</h3>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCopilot}
              className="h-7 w-7"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'chat' | 'yaml')} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="mx-3 mt-2 grid grid-cols-2">
              <TabsTrigger value="chat" className="text-xs gap-1">
                <Bot className="w-3 h-3" /> Chat
              </TabsTrigger>
              <TabsTrigger value="yaml" className="text-xs gap-1">
                <Code2 className="w-3 h-3" /> YAML Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden m-0">
              {/* Messages */}
              <ScrollArea className="flex-1 p-3">
                {chatMessages.length === 0 && (
                  <div className="text-center py-8">
                    <Bot className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      Ask me to add steps...
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      "Add a step to check modem lights"
                    </p>
                  </div>
                )}
                
                <div className="space-y-3">
                  {chatMessages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'flex gap-2',
                        message.role === 'user' ? 'flex-row-reverse' : ''
                      )}
                    >
                      <div
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                          message.role === 'user'
                            ? 'bg-primary/20'
                            : 'bg-accent/20'
                        )}
                      >
                        {message.role === 'user' ? (
                          <User className="w-3 h-3 text-primary" />
                        ) : (
                          <Bot className="w-3 h-3 text-accent" />
                        )}
                      </div>
                      <div
                        className={cn(
                          'px-3 py-2 rounded-xl max-w-[85%] text-sm',
                          message.role === 'user'
                            ? 'chat-bubble-user rounded-br-sm'
                            : 'chat-bubble-ai rounded-bl-sm'
                        )}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </motion.div>
                  ))}
                  
                  {isThinking && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-2"
                    >
                      <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
                        <Bot className="w-3 h-3 text-accent" />
                      </div>
                      <div className="chat-bubble-ai px-3 py-2 rounded-xl rounded-bl-sm">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>

              {/* Input */}
              <form onSubmit={handleSubmit} className="p-3 border-t border-border">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Add a step to..."
                    className="flex-1 bg-muted border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    disabled={isThinking}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || isThinking}
                    className="shrink-0 h-8 w-8"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="yaml" className="flex-1 overflow-hidden m-0 p-3">
              <ScrollArea className="h-full">
                <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                  {yamlContent}
                </pre>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
      
      {/* Show toggle button when closed */}
      {!isCopilotOpen && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute right-4 top-20"
        >
          <Button
            onClick={toggleCopilot}
            size="sm"
            className="gap-2 shadow-lg"
          >
            <Sparkles className="w-4 h-4" />
            AI Copilot
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
