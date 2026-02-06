import { FlowData, FlowStep } from '@/store/flowStore';
import { Node, Edge } from '@xyflow/react';

export function yamlToReactFlow(flowData: FlowData): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const stepIds = Object.keys(flowData.steps);
  const processedSteps = new Set<string>();

  // Helper to determine step visual type
  const getStepType = (step: FlowStep): 'decision' | 'action' | 'start' | 'end' | 'collect' | 'condition' => {
    if (step.type === 'decision_point') return 'decision';
    if (step.type === 'collect_information') return 'collect';
    if (step.type === 'evaluate_condition') return 'condition';
    if (step.type === 'execute_action') {
      const actionType = (step.config as any)?.action_type || '';
      if (actionType.includes('close') || actionType === 'close_case') return 'end';
      return 'action';
    }
    if (step.type === 'provide_instructions') return 'action';

    // First step is typically start
    if (stepIds[0] === step.step_id) return 'start';

    return 'action';
  };

  // Helper to check if node is configured
  const isConfigured = (step: FlowStep): boolean => {
    const c = step.config as Record<string, any>;

    switch (step.type) {
      case 'collect_information':
        return !!(c?.prompt && c?.field_name);
      case 'decision_point':
        return !!(c?.prompt && c?.options && c.options.length > 0);
      case 'evaluate_condition':
        return !!(c?.conditions && c.conditions.length > 0);
      case 'provide_instructions':
        return !!c?.instructions_text;
      case 'execute_action':
        return !!c?.action_type;
      default:
        return false;
    }
  };

  // Helper to get config summary
  const getConfigSummary = (step: FlowStep): string => {
    const c = step.config as Record<string, any>;
    if (c?.prompt) return c.prompt.length > 50 ? c.prompt.substring(0, 50) + '...' : c.prompt;
    if (c?.instructions_text) {
      return c.instructions_text.length > 50
        ? c.instructions_text.substring(0, 50) + '...'
        : c.instructions_text;
    }
    if (c?.field_name) return `Field: ${c.field_name}`;
    if (c?.action_type) return `Action: ${c.action_type}`;
    if (c?.conditions?.length) return `${c.conditions.length} condition(s)`;
    if (c?.options?.length) return `${c.options.length} option(s)`;
    return '';
  };

  // Recursive DFS to build nodes/edges
  function processStep(stepId: string, level: number, parentX: number): void {
    if (processedSteps.has(stepId)) return;
    processedSteps.add(stepId);

    const step = flowData.steps[stepId];
    if (!step) return;

    const stepType = getStepType(step);
    const configured = isConfigured(step);
    const summary = getConfigSummary(step);

    // Calculate position
    const x = parentX + (level * 350);
    const y = nodes.filter(n => Math.abs((n.position?.x || 0) - x) < 100).length * 140;

    // Create node
    nodes.push({
      id: step.step_id,
      type: 'flowNode',
      position: { x, y },
      data: {
        label: step.name,
        stepId: step.step_id,
        stepType,
        type: step.type,
        config: step.config,
        configSummary: summary,
        isConfigured: configured,
        hasWarning: !configured,
      },
    });

    // Handle different connection types
    if (step.next_step) {
      edges.push({
        id: `${step.step_id}-${step.next_step}`,
        source: step.step_id,
        target: step.next_step,
        type: 'smoothstep',
        animated: true,
      });
      processStep(step.next_step, level + 1, x);
    }

    // Decision point options
    if (step.type === 'decision_point' && step.config.options) {
      const options = step.config.options as Array<{ label: string; value: string; next_step: string }>;
      options.forEach((opt, idx) => {
        if (opt.next_step) {
          edges.push({
            id: `${step.step_id}-${opt.next_step}-${idx}`,
            source: step.step_id,
            target: opt.next_step,
            type: 'smoothstep',
            animated: true,
            label: opt.label,
            style: { stroke: 'hsl(25, 95%, 53%)', strokeWidth: 2 },
          });
          processStep(opt.next_step, level + 1, x);
        }
      });
    }

    // Evaluate condition
    if (step.type === 'evaluate_condition') {
      if (step.config.conditions) {
        const conditions = step.config.conditions as Array<{ field: string; operator: string; value: any; next_step: string }>;
        conditions.forEach((cond, idx) => {
          if (cond.next_step) {
            edges.push({
              id: `${step.step_id}-${cond.next_step}-${idx}`,
              source: step.step_id,
              target: cond.next_step,
              type: 'smoothstep',
              animated: true,
              label: `${cond.field} ${cond.operator} ${cond.value}`,
              style: { stroke: 'hsl(45, 93%, 47%)', strokeWidth: 2, strokeDasharray: '5,5' },
            });
            processStep(cond.next_step, level + 1, x);
          }
        });
      }

      if (step.config.default_next_step) {
        const defaultNext = step.config.default_next_step as string;
        edges.push({
          id: `${step.step_id}-${defaultNext}-default`,
          source: step.step_id,
          target: defaultNext,
          type: 'smoothstep',
          animated: true,
          label: 'Default',
          style: { stroke: 'hsl(215, 20%, 55%)', strokeWidth: 2 },
        });
        processStep(defaultNext, level + 1, x);
      }
    }
  }

  // Start from first step or initial_step
  const firstStepId = flowData.initial_step || stepIds[0];
  if (firstStepId) {
    processStep(firstStepId, 0, 0);
  }

  // Process any orphaned steps
  stepIds.forEach((stepId) => {
    if (!processedSteps.has(stepId)) {
      const orphanY = nodes.length * 140;
      const step = flowData.steps[stepId];
      const stepType = getStepType(step);
      const configured = isConfigured(step);
      const summary = getConfigSummary(step);

      nodes.push({
        id: stepId,
        type: 'flowNode',
        position: { x: 800, y: orphanY },
        data: {
          label: step.name,
          stepId: step.step_id,
          stepType,
          type: step.type,
          config: step.config,
          configSummary: summary,
          isConfigured: configured,
          hasWarning: true, // Orphaned nodes always have warning
        },
      });
      processedSteps.add(stepId);
    }
  });

  return { nodes, edges };
}
