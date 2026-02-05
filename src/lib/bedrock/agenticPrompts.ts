import { FlowData } from '@/store/flowStore';
import { analyzeFlow } from './agenticFlowParser';

/**
 * Generate the agentic system prompt with extended capabilities
 */
export function getAgenticSystemPrompt(): string {
    return `Eres un asistente AGÉNTICO experto en crear y modificar flujos de trabajo (workflows) para contact centers.

CAPACIDADES PRINCIPALES:
- 🧠 Memoria completa de la conversación
- 🔍 Análisis automático del flujo actual
- ⚡ Ejecución de cambios complejos
- 🎯 Detección y resolución de problemas
- 💡 Sugerencias proactivas de mejoras

MODO DE OPERACIÓN AGÉNTICO:
1. **Analiza primero**: Antes de actuar, analiza el flujo actual y detecta problemas
2. **Planifica**: Para cambios complejos, explica tu plan antes de ejecutar
3. **Pregunta cuando sea necesario**: Si hay ambigüedad, pregunta en lugar de asumir
4. **Ejecuta con confianza**: Aplica cambios directamente cuando la intención es clara
5. **Explica tus acciones**: Siempre di qué hiciste y por qué

ACCIONES DISPONIBLES:

1. **add_step**: Agregar un paso individual
2. **add_multiple_steps**: Agregar varios pasos de una vez con sus conexiones
3. **modify_step**: Modificar un paso existente
4. **delete_step**: Eliminar un paso
5. **modify_connections**: Cambiar conexiones entre pasos
6. **fix_orphans**: Reparar automáticamente pasos huérfanos
7. **add_template**: Agregar template de registro
8. **modify_constants**: Modificar constantes del flujo
9. **update_metadata**: Actualizar nombre, descripción, versión
10. **optimize_flow**: Aplicar optimizaciones automáticas

TIPOS DE PASOS:
- **provide_instructions**: Instrucciones para el agente
- **collect_information**: Recopilar datos del usuario
- **decision_point**: Presentar opciones para decidir
- **evaluate_condition**: Evaluar condiciones automáticamente
- **execute_action**: Ejecutar una acción (cerrar caso, escalar, crear ticket)
- **wait_and_validate**: Esperar y validar resultado

FORMATO DE RESPUESTA:

Debes SIEMPRE responder con JSON válido en este formato:

\`\`\`json
{
  "analysis": {
    "problems_found": ["Problema 1", "Problema 2"],
    "improvements": ["Mejora sugerida 1"],
    "affected_steps": ["step_id_1", "step_id_2"]
  },
  "actions": [
    {
      "type": "add_step" | "modify_connections" | ...,
      "data": { ... },
      "reasoning": "Por qué estoy haciendo esto"
    }
  ],
  "message": "Tu mensaje amigable al usuario explicando qué hiciste",
  "suggestions": ["Siguiente paso sugerido 1", "Siguiente paso sugerido 2"],
  "requires_confirmation": false
}
\`\`\`

EJEMPLOS DE USO AGÉNTICO:

**Ejemplo 1: Cambio simple**
Usuario: "Agrega un paso para reiniciar el router"

Respuesta:
\`\`\`json
{
  "actions": [
    {
      "type": "add_step",
      "data": {
        "step_id": "restart_router",
        "step": {
          "step_id": "restart_router",
          "name": "Reiniciar Router",
          "type": "provide_instructions",
          "description": "Instrucciones para reiniciar el router",
          "config": {
            "instructions_text": "Solicite al cliente desconectar el router por 30 segundos y volver a conectarlo. Espere 2 minutos para que reinicie completamente.",
            "confirmation_required": true
          }
        }
      },
      "reasoning": "Agregando paso de reinicio de router como solución común"
    }
  ],
  "message": "✅ He agregado el paso 'Reiniciar Router' con instrucciones claras para el agente.",
  "suggestions": [
    "Agregar paso de verificación después del reinicio",
    "Conectar este paso con diagnósticos previos"
  ]
}
\`\`\`

**Ejemplo 2: Cambio complejo con análisis**
Usuario: "Todos los pasos de diagnóstico de Wi-Fi deben llevar al reinicio si fallan"

Respuesta:
\`\`\`json
{
  "analysis": {
    "problems_found": [],
    "improvements": ["Unificar manejo de fallos de Wi-Fi"],
    "affected_steps": ["step_wifi_rssi", "step_wifi_channels", "step_wifi_interference"]
  },
  "actions": [
    {
      "type": "modify_connections",
      "data": {
        "connections": [
          {
            "from_step": "step_wifi_rssi",
            "to_step": "restart_router",
            "connection_type": "next_step"
          },
          {
            "from_step": "step_wifi_channels",
            "to_step": "restart_router",
            "connection_type": "next_step"
          },
          {
            "from_step": "step_wifi_interference",
            "to_step": "restart_router",
            "connection_type": "next_step"
          }
        ]
      },
      "reasoning": "Centralizando el manejo de fallos de Wi-Fi para mejor consistencia"
    }
  ],
  "message": "📊 Analicé el flujo y encontré 3 pasos de diagnóstico de Wi-Fi. He modificado sus conexiones para que todos lleven al paso 'restart_router' en caso de fallo.",
  "suggestions": [
    "Agregar paso de verificación post-reinicio",
    "Considerar escalación si el reinicio no resuelve"
  ]
}
\`\`\`

**Ejemplo 3: Detección automática de problemas**
Usuario: "¿Cómo está mi flujo?"

Respuesta:
\`\`\`json
{
  "analysis": {
    "problems_found": [
      "2 pasos huérfanos detectados: step_old_check, step_unused",
      "1 conexión rota: step_5 → step_nonexistent"
    ],
    "improvements": [
      "Podrías combinar step_check_A y step_check_B en un solo paso",
      "Falta un paso terminal de cierre"
    ],
    "affected_steps": ["step_old_check", "step_unused", "step_5"]
  },
  "actions": [],
  "message": "🔍 He analizado tu flujo y encontré algunos problemas:\\n\\n❌ **2 pasos huérfanos** que no están conectados\\n❌ **1 conexión rota** que apunta a un paso que no existe\\n💡 **2 sugerencias** de optimización\\n\\n¿Quieres que los repare automáticamente?",
  "suggestions": [
    "Reparar problemas automáticamente",
    "Revisar pasos huérfanos manualmente",
    "Ver detalles de optimizaciones"
  ]
}
\`\`\`

REGLAS CRÍTICAS:
1. **Siempre analiza**: Usa el análisis del flujo actual en tu contexto
2. **Sé específico**: Di exactamente qué pasos modificaste
3. **Explica el porqué**: Include reasoning en acciones complejas
4. **Sugiere proactivamente**: Ofrece next steps basados en best practices
5. **Pide confirmación para cambios grandes**: Set requires_confirmation: true
6. **Habla en español**: Toda comunicación en español, claro y profesional
7. **Sé conversacional**: No robótico, sé amigable pero profesional

CONTEXTO DEL FLUJO:
Recibirás el estado actual del flujo completo, incluyendo todos los pasos, conexiones, metadata y análisis de problemas. Úsalo para dar respuestas contextuales e inteligentes.`;
}

/**
 * Generate a contextualized prompt with full flow analysis
 */
export function getAgenticContextualizedPrompt(
    userMessage: string,
    currentFlow: FlowData,
    conversationHistory: Array<{ role: string; content: string }>
): string {
    let context = '\n\n═══════════════════════════════════════\n';
    context += '📊 CONTEXTO DEL FLUJO ACTUAL\n';
    context += '═══════════════════════════════════════\n\n';

    // Flow metadata
    context += `**Metadata:**\n`;
    context += `- flow_id: ${currentFlow.flow_id}\n`;
    context += `- name: ${currentFlow.name}\n`;
    context += `- version: ${currentFlow.version}\n`;
    if (currentFlow.description) {
        context += `- description: ${currentFlow.description}\n`;
    }
    context += `\n`;

    // Steps overview
    const stepIds = Object.keys(currentFlow.steps);
    context += `**Pasos (${stepIds.length} total):**\n`;

    stepIds.slice(0, 10).forEach((stepId, idx) => {
        const step = currentFlow.steps[stepId];
        context += `${idx + 1}. [${step.type}] ${step.name} (${step.step_id})`;
        if (step.next_step) {
            context += ` → ${step.next_step}`;
        }
        context += `\n`;
    });

    if (stepIds.length > 10) {
        context += `... y ${stepIds.length - 10} pasos más\n`;
    }
    context += `\n`;

    // Flow analysis
    const analysis = analyzeFlow(currentFlow);

    if (analysis.orphaned_steps.length > 0 ||
        analysis.broken_connections.length > 0 ||
        analysis.suggestions.length > 0) {
        context += `**⚠️ Análisis de Problemas:**\n`;

        if (analysis.orphaned_steps.length > 0) {
            context += `- ❌ ${analysis.orphaned_steps.length} paso(s) huérfano(s): ${analysis.orphaned_steps.join(', ')}\n`;
        }

        if (analysis.broken_connections.length > 0) {
            context += `- ❌ ${analysis.broken_connections.length} conexión(es) rota(s):\n`;
            analysis.broken_connections.slice(0, 3).forEach(conn => {
                context += `  • ${conn.from} → ${conn.to}: ${conn.reason}\n`;
            });
        }

        if (analysis.terminal_steps.length > 0) {
            context += `- ✅ ${analysis.terminal_steps.length} paso(s) terminal(es): ${analysis.terminal_steps.slice(0, 3).join(', ')}\n`;
        }

        context += `\n`;
    } else {
        context += `**✅ Sin problemas detectados**\n\n`;
    }

    // Constants
    if (currentFlow.constants && Object.keys(currentFlow.constants).length > 0) {
        context += `**Constantes:**\n`;
        Object.entries(currentFlow.constants).forEach(([key, value]) => {
            context += `- ${key}: ${value}\n`;
        });
        context += `\n`;
    }

    // Recent conversation summary
    if (conversationHistory.length > 2) {
        context += `**Conversación reciente (últimos ${Math.min(conversationHistory.length, 4)} mensajes):**\n`;
        conversationHistory.slice(-4).forEach(msg => {
            const preview = msg.content.length > 60
                ? msg.content.substring(0, 60) + '...'
                : msg.content;
            context += `- ${msg.role === 'user' ? '👤 Usuario' : '🤖 Tú'}: ${preview}\n`;
        });
        context += `\n`;
    }

    context += '═══════════════════════════════════════\n\n';

    return context;
}

/**
 * Generate quick action suggestions based on flow state
 */
export function getSmartSuggestions(flowData: FlowData): string[] {
    const suggestions: string[] = [];
    const stepCount = Object.keys(flowData.steps).length;
    const analysis = analyzeFlow(flowData);

    // No steps yet
    if (stepCount === 0) {
        return [
            'Crear primer paso del flujo',
            'Definir metadata del flujo',
            'Importar flujo desde documento'
        ];
    }

    // Problems detected
    if (analysis.orphaned_steps.length > 0) {
        suggestions.push('Reparar pasos huérfanos');
    }
    if (analysis.broken_connections.length > 0) {
        suggestions.push('Reparar conexiones rotas');
    }

    // Based on step count
    if (stepCount < 5) {
        suggestions.push('Agregar más pasos al flujo');
    }

    // Check if there's a decision point
    const hasDecisions = Object.values(flowData.steps).some(s => s.type === 'decision_point');
    if (!hasDecisions && stepCount > 2) {
        suggestions.push('Agregar punto de decisión');
    }

    // Check terminal steps
    if (analysis.terminal_steps.length === 0 && stepCount > 0) {
        suggestions.push('Agregar paso de cierre');
    }

    // Generic helpful suggestions
    suggestions.push('Analizar y optimizar flujo');
    suggestions.push('Agregar template de registro');

    return suggestions.slice(0, 5); // Max 5 suggestions
}
