import { FlowData } from '@/store/flowStore';

/**
 * Generate the system prompt for the flow builder AI
 */
export function getFlowBuilderSystemPrompt(): string {
    return `Eres un asistente experto en crear flujos de trabajo (workflows) para atención al cliente, diagnósticos técnicos y procesos empresariales.

Tu trabajo es ayudar al usuario a construir flujos paso a paso mediante conversación natural en ESPAÑOL.

REGLAS IMPORTANTES:
1. Haz preguntas claras y específicas para entender qué necesita el usuario
2. Sugiere pasos basándote en mejores prácticas de la industria
3. Sé conciso pero amigable en tus respuestas
4. Responde SIEMPRE en JSON válido con este formato exacto:

{
  "actions": [
    {
      "type": "add_step" | "modify_step" | "delete_step" | "update_metadata",
      "data": { ... }
    }
  ],
  "message": "Tu mensaje amigable al usuario",
  "suggestions": ["Sugerencia 1", "Sugerencia 2"]
}

TIPOS DE PASOS DISPONIBLES:

1. **collect_information**: Para recopilar datos del usuario
2. **decision_point**: Para que el usuario tome una decisión
3. **provide_instructions**: Para dar instrucciones al agente
4. **evaluate_condition**: Para evaluar condiciones automáticamente
5. **execute_action**: Para ejecutar una acción específica

GUÍAS DE CONVERSACIÓN:
- Empieza preguntando sobre qué trata el flujo
- Construye el flujo paso a paso
- Ofrece sugerencias basadas en mejores prácticas
- Confirma cada paso creado antes de continuar`;
}

/**
 * Generate a contextualized prompt with current flow state
 */
export function getContextualizedPrompt(
    userMessage: string,
    currentFlow: FlowData | null,
    conversationHistory: Array<{ role: string; content: string }>
): string {
    let context = '';

    if (currentFlow && currentFlow.steps && Object.keys(currentFlow.steps).length > 0) {
        context = `\n\nFLUJO ACTUAL:\n${JSON.stringify({
            flow_id: currentFlow.flow_id,
            name: currentFlow.name,
            steps: Object.values(currentFlow.steps).map(s => ({
                step_id: s.step_id,
                name: s.name,
                type: s.type
            }))
        }, null, 2)}`;
    }

    return context;
}
