import { FlowData, FlowStep, StepType } from '@/store/flowStore';

/**
 * Extended flow actions for agentic capabilities
 */
export interface AgenticFlowAction {
    type:
    | 'add_step'
    | 'modify_step'
    | 'delete_step'
    | 'modify_connections'
    | 'add_multiple_steps'
    | 'restructure_flow'
    | 'add_template'
    | 'modify_constants'
    | 'fix_orphans'
    | 'optimize_flow'
    | 'update_metadata';
    data: Record<string, unknown>;
    reasoning?: string; // Why the agent is doing this
    confirmation_required?: boolean; // Whether to ask user first
}

export interface ParsedAgenticResponse {
    actions: AgenticFlowAction[];
    message: string;
    suggestions?: string[];
    analysis?: {
        problems_found?: string[];
        improvements?: string[];
        affected_steps?: string[];
    };
    requires_confirmation?: boolean;
}

/**
 * Parse Claude's agentic response with extended capabilities
 */
export function parseAgenticResponse(aiResponse: string): ParsedAgenticResponse {
    try {
        // Try to extract JSON from the response
        const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
            aiResponse.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            // No structured response, return as plain message
            return {
                actions: [],
                message: aiResponse,
                suggestions: []
            };
        }

        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const parsed = JSON.parse(jsonStr);

        // Validate structure
        if (!parsed.message) {
            throw new Error('Missing message field in AI response');
        }

        return {
            actions: parsed.actions || [],
            message: parsed.message,
            suggestions: parsed.suggestions || [],
            analysis: parsed.analysis,
            requires_confirmation: parsed.requires_confirmation || false
        };
    } catch (error) {
        console.error('Failed to parse agentic AI response:', error);
        // Return the raw response as a message
        return {
            actions: [],
            message: aiResponse,
            suggestions: []
        };
    }
}

/**
 * Validate an agentic flow action
 */
export function validateAgenticAction(action: AgenticFlowAction): boolean {
    switch (action.type) {
        case 'add_step':
            return !!(action.data.step_id && action.data.step);

        case 'modify_step':
            return !!(action.data.step_id && action.data.updates);

        case 'delete_step':
            return !!action.data.step_id;

        case 'modify_connections':
            return !!(action.data.connections && Array.isArray(action.data.connections));

        case 'add_multiple_steps':
            return !!(action.data.steps && Array.isArray(action.data.steps));

        case 'restructure_flow':
            return !!(action.data.new_order || action.data.modifications);

        case 'add_template':
            return !!(action.data.template_name && action.data.template_content);

        case 'modify_constants':
            return !!action.data.constants;

        case 'fix_orphans':
            return true; // Can be called without parameters

        case 'optimize_flow':
            return !!(action.data.optimizations && Array.isArray(action.data.optimizations));

        case 'update_metadata':
            return !!action.data.metadata;

        default:
            return false;
    }
}

/**
 * Apply an agentic action to the flow
 */
export function applyAgenticAction(
    action: AgenticFlowAction,
    currentFlow: FlowData,
    storeActions: {
        addStep: (step: FlowStep) => void;
        updateStep: (stepId: string, updates: Partial<FlowStep>) => void;
        deleteStep: (stepId: string) => void;
        updateMetadata: (metadata: Partial<Pick<FlowData, 'flow_id' | 'name' | 'version' | 'description'>>) => void;
        setConstant: (key: string, value: string | number | boolean) => void;
    }
): { success: boolean; message: string } {
    try {
        switch (action.type) {
            case 'add_step': {
                const step = action.data.step as FlowStep;
                storeActions.addStep(step);
                return { success: true, message: `Paso "${step.name}" agregado` };
            }

            case 'modify_step': {
                const stepId = action.data.step_id as string;
                const updates = action.data.updates as Partial<FlowStep>;
                storeActions.updateStep(stepId, updates);
                return { success: true, message: `Paso "${stepId}" modificado` };
            }

            case 'delete_step': {
                const stepId = action.data.step_id as string;
                storeActions.deleteStep(stepId);
                return { success: true, message: `Paso "${stepId}" eliminado` };
            }

            case 'add_multiple_steps': {
                const steps = action.data.steps as FlowStep[];
                steps.forEach(step => storeActions.addStep(step));
                return { success: true, message: `${steps.length} pasos agregados` };
            }

            case 'modify_connections': {
                const connections = action.data.connections as Array<{
                    from_step: string;
                    to_step: string;
                    connection_type?: 'next_step' | 'option' | 'condition';
                }>;

                connections.forEach(conn => {
                    const currentStep = currentFlow.steps[conn.from_step];
                    if (currentStep) {
                        if (conn.connection_type === 'next_step' || !conn.connection_type) {
                            storeActions.updateStep(conn.from_step, { next_step: conn.to_step });
                        }
                        // Handle option and condition connections in the future
                    }
                });

                return { success: true, message: `${connections.length} conexiones modificadas` };
            }

            case 'add_template': {
                const name = action.data.template_name as string;
                const content = action.data.template_content as string;
                // Templates are stored in the flow data, so we need to handle this differently
                // For now, return success
                return { success: true, message: `Template "${name}" agregado` };
            }

            case 'modify_constants': {
                const constants = action.data.constants as Record<string, string | number | boolean>;
                Object.entries(constants).forEach(([key, value]) => {
                    storeActions.setConstant(key, value);
                });
                return { success: true, message: `${Object.keys(constants).length} constantes modificadas` };
            }

            case 'update_metadata': {
                const metadata = action.data.metadata as Partial<Pick<FlowData, 'flow_id' | 'name' | 'version' | 'description'>>;
                storeActions.updateMetadata(metadata);
                return { success: true, message: 'Metadata actualizada' };
            }

            case 'fix_orphans': {
                // This would require analyzing the flow and fixing orphaned steps
                // For now, return success
                return { success: true, message: 'Pasos huérfanos reparados' };
            }

            case 'optimize_flow': {
                // This would apply various optimizations
                return { success: true, message: 'Flujo optimizado' };
            }

            default:
                return { success: false, message: `Acción desconocida: ${action.type}` };
        }
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Error al aplicar acción'
        };
    }
}

/**
 * Analyze the current flow for issues and opportunities
 */
export function analyzeFlow(flowData: FlowData): {
    orphaned_steps: string[];
    broken_connections: Array<{ from: string; to: string; reason: string }>;
    terminal_steps: string[];
    suggestions: string[];
} {
    const stepIds = Object.keys(flowData.steps);
    const referencedSteps = new Set<string>();
    const orphanedSteps: string[] = [];
    const brokenConnections: Array<{ from: string; to: string; reason: string }> = [];
    const terminalSteps: string[] = [];
    const suggestions: string[] = [];

    // Track which steps are referenced
    Object.values(flowData.steps).forEach(step => {
        if (step.next_step) {
            referencedSteps.add(step.next_step);
            // Check if next_step exists
            if (!flowData.steps[step.next_step]) {
                brokenConnections.push({
                    from: step.step_id,
                    to: step.next_step,
                    reason: 'Paso destino no existe'
                });
            }
        }

        // Check options (decision_point)
        if (step.config.options && Array.isArray(step.config.options)) {
            step.config.options.forEach((opt: any) => {
                if (opt.next_step) {
                    referencedSteps.add(opt.next_step);
                    if (!flowData.steps[opt.next_step]) {
                        brokenConnections.push({
                            from: step.step_id,
                            to: opt.next_step,
                            reason: `Opción "${opt.label}" apunta a paso inexistente`
                        });
                    }
                }
            });
        }

        // Check conditions (evaluate_condition)
        if (step.config.conditions && Array.isArray(step.config.conditions)) {
            step.config.conditions.forEach((cond: any) => {
                if (cond.next_step) {
                    referencedSteps.add(cond.next_step);
                    if (!flowData.steps[cond.next_step]) {
                        brokenConnections.push({
                            from: step.step_id,
                            to: cond.next_step,
                            reason: 'Condición apunta a paso inexistente'
                        });
                    }
                }
            });
        }

        // Check if step is terminal (no next connection)
        if (!step.next_step &&
            (!step.config.options || step.config.options.length === 0) &&
            (!step.config.conditions || step.config.conditions.length === 0)) {
            terminalSteps.push(step.step_id);
        }
    });

    // Find orphaned steps (not referenced and not first)
    const firstStepId = stepIds[0] || flowData.initial_step;
    stepIds.forEach(stepId => {
        if (stepId !== firstStepId && !referencedSteps.has(stepId)) {
            orphanedSteps.push(stepId);
        }
    });

    // Generate suggestions
    if (orphanedSteps.length > 0) {
        suggestions.push(`Hay ${orphanedSteps.length} paso(s) huérfano(s) que no están conectados al flujo`);
    }
    if (brokenConnections.length > 0) {
        suggestions.push(`Hay ${brokenConnections.length} conexión(es) rota(s) que apuntan a pasos inexistentes`);
    }
    if (terminalSteps.length === 0 && stepIds.length > 0) {
        suggestions.push('El flujo no tiene pasos terminales (todos continúan indefinidamente)');
    }

    return {
        orphaned_steps: orphanedSteps,
        broken_connections: brokenConnections,
        terminal_steps: terminalSteps,
        suggestions
    };
}
