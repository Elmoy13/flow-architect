import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    Send,
    Bot,
    User,
    Sparkles,
    Loader2,
    CheckCircle2,
    XCircle,
    Lightbulb,
    Trash2,
    Undo2,
    AlertCircle,
    TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFlowStore } from '@/store/flowStore';
import { useToast } from '@/hooks/use-toast';
import { BedrockClient } from '@/lib/bedrock/bedrockClient';
import { Message } from '@/lib/bedrock/bedrockClient';
import {
    parseAgenticResponse,
    validateAgenticAction,
    applyAgenticAction,
    analyzeFlow,
    AgenticFlowAction
} from '@/lib/bedrock/agenticFlowParser';
import {
    getAgenticSystemPrompt,
    getAgenticContextualizedPrompt,
    getSmartSuggestions
} from '@/lib/bedrock/agenticPrompts';

export default function FlowBuilderChat() {
    const {
        flowData,
        addStep,
        updateStep,
        deleteStep,
        updateMetadata,
        setConstant,
        awsAccessKey,
        awsSecretKey,
        awsRegion,
        bedrockModelId,
        aiProvider,
        persistentChatMessages,
        addPersistentChatMessage,
        clearChatHistory,
        pushFlowHistory,
        undoLastChange,
        agentContext
    } = useFlowStore();

    const { toast } = useToast();
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Check if AWS is configured
    const isAwsConfigured = awsAccessKey && awsSecretKey && awsRegion;

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [persistentChatMessages]);

    // Initial greeting if no messages
    useEffect(() => {
        if (persistentChatMessages.length === 0) {
            addPersistentChatMessage({
                role: 'assistant',
                content: '¡Hola! 👋 Soy tu asistente agéntico para crear flujos de trabajo.\n\n✨ Puedo:\n• Crear y modificar pasos\n• Analizar el flujo automáticamente\n• Detectar y reparar problemas\n• Sugerir optimizaciones\n• Recordar toda nuestra conversación\n\n¿Qué tipo de flujo necesitas crear?',
                suggestions: getSmartSuggestions(flowData)
            });
        }
    }, []);

    const handleSendMessage = async (messageToSend?: string) => {
        const userInput = messageToSend || input.trim();
        if (!userInput) return;

        // Check configuration
        if (aiProvider === 'bedrock' && !isAwsConfigured) {
            toast({
                title: 'Configuración incompleta',
                description: 'Por favor configura tus credenciales de AWS Bedrock en Settings',
                variant: 'destructive',
            });
            return;
        }

        // Add user message
        addPersistentChatMessage({
            role: 'user',
            content: userInput,
        });

        setInput('');
        setIsLoading(true);

        // Save current flow state for potential undo
        pushFlowHistory();

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
            const conversationHistory: Message[] = persistentChatMessages.map((msg) => ({
                role: msg.role,
                content: msg.content,
            }));
            conversationHistory.push({ role: 'user', content: userInput });

            // Get agentic system prompt with full context
            const systemPrompt = getAgenticSystemPrompt();
            const contextPrompt = getAgenticContextualizedPrompt(userInput, flowData, conversationHistory);

            // Send to Bedrock
            const response = await client.chat(
                conversationHistory,
                systemPrompt + contextPrompt
            );

            // Parse agentic response
            const parsed = parseAgenticResponse(response.content);

            // Apply actions
            const createdSteps: string[] = [];
            const modifiedSteps: string[] = [];
            let actionResults: string[] = [];

            for (const action of parsed.actions) {
                if (!validateAgenticAction(action)) {
                    console.warn('Invalid action:', action);
                    continue;
                }

                const result = applyAgenticAction(action, flowData, {
                    addStep,
                    updateStep,
                    deleteStep,
                    updateMetadata,
                    setConstant
                });

                if (result.success) {
                    actionResults.push(result.message);

                    // Track created/modified steps
                    if (action.type === 'add_step' && action.data.step) {
                        const stepId = (action.data.step as any).step_id;
                        if (stepId) createdSteps.push(stepId);
                    } else if (action.type === 'add_multiple_steps' && action.data.steps) {
                        const steps = action.data.steps as any[];
                        steps.forEach(s => {
                            if (s.step_id) createdSteps.push(s.step_id);
                        });
                    } else if (action.type === 'modify_step') {
                        const stepId = action.data.step_id as string;
                        if (stepId) modifiedSteps.push(stepId);
                    }
                }
            }

            // Add AI response with analysis
            addPersistentChatMessage({
                role: 'assistant',
                content: parsed.message,
                suggestions: parsed.suggestions,
                createdSteps: createdSteps.length > 0 ? createdSteps : undefined,
                analysis: parsed.analysis
            });

            // Show success toast if steps were created
            if (createdSteps.length > 0 || modifiedSteps.length > 0) {
                toast({
                    title: '✅ Cambios aplicados',
                    description: actionResults.join(', '),
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
            addPersistentChatMessage({
                role: 'assistant',
                content: '❌ Lo siento, hubo un error al procesar tu mensaje. Por favor verifica tu configuración de AWS e intenta nuevamente.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnalyzeFlow = () => {
        const analysis = analyzeFlow(flowData);
        const problems = [
            ...analysis.orphaned_steps.map(s => `Paso huérfano: ${s}`),
            ...analysis.broken_connections.map(c => `Conexión rota: ${c.from} → ${c.to}`)
        ];

        addPersistentChatMessage({
            role: 'assistant',
            content: problems.length > 0
                ? `🔍 Análisis del flujo:\n\n${problems.join('\n')}\n\n¿Quieres que repare estos problemas?`
                : '✅ El flujo está en buen estado, no se encontraron problemas.',
            analysis: {
                problems_found: problems,
                affected_steps: [...analysis.orphaned_steps, ...analysis.broken_connections.map(c => c.from)]
            },
            suggestions: problems.length > 0 ? ['Reparar automáticamente', 'Ver detalles'] : []
        });
    };

    const handleSuggestionClick = (suggestion: string) => {
        handleSendMessage(suggestion);
    };

    const handleUndo = () => {
        undoLastChange();
        toast({
            title: 'Cambio revertido',
            description: 'Se restauró la versión anterior del flujo'
        });
    };

    return (
        <div className="w-[400px] h-full glass-panel border-r border-border flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/20">
                            <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold">Agente Agéntico</h2>
                            <p className="text-xs text-muted-foreground">
                                {isAwsConfigured ? '🟢 AI activo' : '🔴 Configurar AI'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        {agentContext.flowHistory.length > 0 && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={handleUndo}
                                title="Deshacer último cambio"
                            >
                                <Undo2 className="w-4 h-4" />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                                if (confirm('¿Borrar todo el historial de chat?')) {
                                    clearChatHistory();
                                }
                            }}
                            title="Limpiar historial"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-xs flex-1"
                        onClick={handleAnalyzeFlow}
                    >
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Analizar Flujo
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {persistentChatMessages.map((message) => (
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

                                {/* Analysis */}
                                {message.analysis && (message.analysis.problems_found?.length || message.analysis.improvements?.length) && (
                                    <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                                        {message.analysis.problems_found && message.analysis.problems_found.length > 0 && (
                                            <div className="flex items-start gap-1 text-xs text-destructive">
                                                <AlertCircle className="w-3 h-3 mt-0.5" />
                                                <span>{message.analysis.problems_found.length} problema(s)</span>
                                            </div>
                                        )}
                                        {message.analysis.improvements && message.analysis.improvements.length > 0 && (
                                            <div className="flex items-start gap-1 text-xs text-node-start">
                                                <TrendingUp className="w-3 h-3 mt-0.5" />
                                                <span>{message.analysis.improvements.length} mejora(s)</span>
                                            </div>
                                        )}
                                    </div>
                                )}

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
                                            disabled={isLoading}
                                            className="w-full text-left p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-xs flex items-center gap-2 disabled:opacity-50"
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

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border">
                {!isAwsConfigured ? (
                    <div className="text-center p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <XCircle className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                            Configura AWS Bedrock en Settings para usar el agente
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
                            onClick={() => handleSendMessage()}
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
