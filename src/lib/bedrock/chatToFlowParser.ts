import { FlowData, FlowStep } from '@/store/flowStore';

export interface FlowAction {
    type: 'add_step' | 'modify_step' | 'delete_step' | 'update_metadata' | 'reorder_steps';
    data: {
        step_id?: string;
        step?: Partial<FlowStep>;
        stepIds?: string[];
        metadata?: Partial<Pick<FlowData, 'flow_id' | 'name' | 'version' | 'description'>>;
    };
}

export interface ParsedChatResponse {
    actions: FlowAction[];
    message: string;
    suggestions?: string[];
}

/**
 * Parse Claude's response from chat-to-flow conversation
 * Expects JSON format with actions and message
 */
export function parseChatResponse(aiResponse: string): ParsedChatResponse {
    try {
        // Try to extract JSON from the response
        // Claude sometimes wraps JSON in markdown code blocks
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
            suggestions: parsed.suggestions || []
        };
    } catch (error) {
        console.error('Failed to parse AI response:', error);
        // Return the raw response as a message
        return {
            actions: [],
            message: aiResponse,
            suggestions: []
        };
    }
}

/**
 * Validate a flow action before applying it
 */
export function validateFlowAction(action: FlowAction): boolean {
    switch (action.type) {
        case 'add_step':
            return !!(action.data.step_id && action.data.step);

        case 'modify_step':
            return !!(action.data.step_id && action.data.step);

        case 'delete_step':
            return !!action.data.step_id;

        case 'update_metadata':
            return !!action.data.metadata;

        case 'reorder_steps':
            return !!(action.data.stepIds && action.data.stepIds.length > 0);

        default:
            return false;
    }
}

/**
 * Generate a unique step ID
 */
export function generateStepId(baseName: string): string {
    const sanitized = baseName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

    const timestamp = Date.now().toString(36).slice(-4);
    return `${sanitized}_${timestamp}`;
}
