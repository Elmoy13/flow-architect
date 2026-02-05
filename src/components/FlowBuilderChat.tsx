import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Send,
    Bot,
    User,
    Sparkles,
    Loader2,
    CheckCircle2,
    XCircle,
    Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFlowStore } from '@/store/flowStore';
import { useToast } from '@/hooks/use-toast';
import { BedrockClient } from '@/lib/bedrock/bedrockClient';
import { Message } from '@/lib/bedrock/bedrockClient';
import { parseChatResponse, validateFlowAction, generateStepId } from '@/lib/bedrock/chatToFlowParser';
import { getFlowBuilderSystemPrompt, getContextualizedPrompt } from '@/lib/bedrock/flowBuilderPrompts';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    suggestions?: string[];
    createdSteps?: string[]; // IDs of steps created by this message
}

export default function FlowBuilderChat() {
    const {
        flowData,
        addStep,
        updateStep,
        updateMetadata,
        awsAccessKey,
        awsSecretKey,
        awsRegion,
        bedrockModelId,
        aiProvider,
    } = useFlowStore();

    const { toast } = useToast();
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            role: 'assistant',
            content: '¡Hola! 👋 Soy tu asistente para crear flujos de trabajo. Estoy aquí para ayudarte a construir un flujo paso a paso mediante conversación natural.\n\n¿Qué tipo de flujo necesitas crear? Por ejemplo:\n• Atención al cliente\n• Diagnóstico técnico\n• Proceso de ventas\n• Onboarding de usuarios',
            timestamp: new Date(),
            suggestions: ['Diagnóstico de internet', 'Atención al cliente', 'Proceso de ventas']
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Check if AWS is configured
    const isAwsConfigured = awsAccessKey && awsSecretKey && awsRegion;

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        // Check configuration
        if (aiProvider === 'bedrock' && !isAwsConfigured) {
            toast({
                title: 'Configuración incompleta',
                description: 'Por favor configura tus credenciales de AWS Bedrock en Settings',
                variant: 'destructive',
            });
            return;
        }

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Create Bedrock client
            const client = new BedrockClient({
                region: awsRegion,
                credentials: {
                    accessKeyId: awsAccessKey,
                    secretAccessKey: awsSecretKey,
                },
                modelId: bedrockModelId,
            });

            // Prepare conversation history
            const conversationHistory: Message[] = messages.map((msg) => ({
                role: msg.role,
                content: msg.content,
            }));
            conversationHistory.push({ role: 'user', content: input });

            // Get system prompt with context
            const systemPrompt = getFlowBuilderSystemPrompt();
            const contextPrompt = getContextualizedPrompt(input, flowData, conversationHistory);

            // Send to Bedrock
            const response = await client.chat(
                conversationHistory,
                systemPrompt + contextPrompt
            );

            // Parse response
            const parsed = parseChatResponse(response.content);

            // Apply actions
            const createdSteps: string[] = [];
            for (const action of parsed.actions) {
                if (!validateFlowAction(action)) {
                    console.warn('Invalid action:', action);
                    continue;
                }

                switch (action.type) {
                    case 'add_step':
                        if (action.data.step) {
                            const stepId = action.data.step_id || generateStepId(action.data.step.name || 'step');
                            addStep({ ...action.data.step, step_id: stepId } as any);
                            createdSteps.push(stepId);
                        }
                        break;

                    case 'modify_step':
                        if (action.data.step_id && action.data.step) {
                            updateStep(action.data.step_id, action.data.step);
                        }
                        break;

                    case 'update_metadata':
                        if (action.data.metadata) {
                            updateMetadata(action.data.metadata);
                        }
                        break;
                }
            }

            // Add AI response
            const aiMessage: ChatMessage = {
                id: Date.now().toString(),
                role: 'assistant',
                content: parsed.message,
                timestamp: new Date(),
                suggestions: parsed.suggestions,
                createdSteps: createdSteps.length > 0 ? createdSteps : undefined,
            };

            setMessages((prev) => [...prev, aiMessage]);

            // Show success toast if steps were created
            if (createdSteps.length > 0) {
                toast({
                    title: '✅ Pasos creados',
                    description: `Se ${createdSteps.length === 1 ? 'creó' : 'crearon'} ${createdSteps.length} ${createdSteps.length === 1 ? 'paso' : 'pasos'} exitosamente`,
                });
            }
        } catch (error) {
            console.error('Error calling Bedrock:', error);
            toast({
                title: 'Error de comunicación',
                description: error instanceof Error ? error.message : 'No se pudo conectar con el AI',
                variant: 'destructive',
            });

            // Add error message
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: '❌ Lo siento, hubo un error al procesar tu mensaje. Por favor verifica tu configuración de AWS e intenta nuevamente.',
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setInput(suggestion);
    };

    return (
        <div className="w-[400px] h-full glass-panel border-r border-border flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/20">
                        <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold">Chat Flow Builder</h2>
                        <p className="text-xs text-muted-foreground">
                            {isAwsConfigured ? 'AI activado' : 'Configurar AI'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {message.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                <Bot className="w-4 h-4 text-primary" />
                            </div>
                        )}

                        <div className={`flex-1 max-w-[280px] ${message.role === 'user' ? 'order-first' : ''}`}>
                            <div
                                className={`p-3 rounded-lg text-sm ${message.role === 'user'
                                        ? 'bg-primary text-primary-foreground ml-auto'
                                        : 'bg-muted'
                                    }`}
                            >
                                <p className="whitespace-pre-wrap">{message.content}</p>

                                {/* Created steps indicator */}
                                {message.createdSteps && message.createdSteps.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-border/50">
                                        <div className="flex items-center gap-1 text-xs text-node-start">
                                            <CheckCircle2 className="w-3 h-3" />
                                            <span>{message.createdSteps.length} paso(s) creado(s)</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Suggestions */}
                            {message.suggestions && message.suggestions.length > 0 && (
                                <div className="mt-2 space-y-1">
                                    {message.suggestions.map((suggestion, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSuggestionClick(suggestion)}
                                            className="w-full text-left p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-xs flex items-center gap-2"
                                        >
                                            <Lightbulb className="w-3 h-3 text-primary" />
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <p className="text-xs text-muted-foreground mt-1">
                                {message.timestamp.toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>

                        {message.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                                <User className="w-4 h-4" />
                            </div>
                        )}
                    </motion.div>
                ))}

                {isLoading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <Loader2 className="w-4 h-4 text-primary animate-spin" />
                        </div>
                        <div className="bg-muted p-3 rounded-lg">
                            <p className="text-sm text-muted-foreground">Pensando...</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border">
                {!isAwsConfigured ? (
                    <div className="text-center p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <XCircle className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                            Configura AWS Bedrock en Settings para usar el chat
                        </p>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="Escribe tu mensaje..."
                            className="flex-1 text-sm"
                            disabled={isLoading}
                        />
                        <Button
                            onClick={handleSendMessage}
                            disabled={isLoading || !input.trim()}
                            size="icon"
                            className="shrink-0"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
