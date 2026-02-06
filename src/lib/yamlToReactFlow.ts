import { Node, Edge, MarkerType } from '@xyflow/react';
import { FlowData, FlowStep } from '@/store/flowStore';

interface ReactFlowData {
  nodes: Node[];
  edges: Edge[];
}

// Map step types to visual types
function getVisualStepType(step: FlowStep): 'decision' | 'action' | 'start' | 'end' | 'collect' {
  const type = step.type;
  const isCloseStep = step.step_id?.toLowerCase().includes('close') || 
                      step.step_id?.toLowerCase().includes('end') ||
                      step.name?.toLowerCase().includes('cierre') ||
                      step.name?.toLowerCase().includes('fin');

  if (isCloseStep && type === 'execute_action') {
    return 'end';
  }

  switch (type) {
    case 'evaluate_condition':
    case 'decision_point':
      return 'decision';
    case 'collect_information':
      return 'collect';
    case 'provide_instructions':
    case 'execute_action':
      return 'action';
    default:
      return 'action';
  }
}

// Get all next steps from a step
function getNextSteps(step: FlowStep): Array<{ nextStep: string; label?: string }> {
  const nextSteps: Array<{ nextStep: string; label?: string }> = [];

  // Direct next_step
  if (step.next_step) {
    nextSteps.push({ nextStep: step.next_step });
  }

  // Options (decision_point)
  if (step.config?.options) {
    step.config.options.forEach(option => {
      nextSteps.push({
        nextStep: option.next_step,
        label: option.label
      });
    });
  }

  // Conditions (evaluate_condition)
  if (step.config?.conditions) {
    step.config.conditions.forEach(condition => {
      if (condition.next_step) {
        const label = `${condition.field} ${condition.operator} ${condition.value}`;
        nextSteps.push({
          nextStep: condition.next_step,
          label
        });
      }
    });

    if (step.config.default_next_step) {
      nextSteps.push({
        nextStep: step.config.default_next_step,
        label: 'Default'
      });
    }
  }

  return nextSteps;
}

export function yamlToReactFlow(flowData: FlowData | null): ReactFlowData {
  if (!flowData || !flowData.steps) {
    return { nodes: [], edges: [] };
  }

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const stepKeys = Object.keys(flowData.steps);

  // Calculate positions using BFS layout
  const HORIZONTAL_SPACING = 320;
  const VERTICAL_SPACING = 180;

  const positionMap = new Map<string, { x: number; y: number }>();
  const visited = new Set<string>();
  const levels: string[][] = [];
  const queue: Array<{ stepKey: string; level: number }> = [];

  // Start from first step
  const firstStep = stepKeys[0];
  if (firstStep) {
    queue.push({ stepKey: firstStep, level: 0 });
  }

  while (queue.length > 0) {
    const { stepKey, level } = queue.shift()!;

    if (visited.has(stepKey)) continue;
    visited.add(stepKey);

    if (!levels[level]) {
      levels[level] = [];
    }
    levels[level].push(stepKey);

    const step = flowData.steps[stepKey];
    if (!step) continue;

    const nextSteps = getNextSteps(step);
    nextSteps.forEach(({ nextStep }) => {
      if (!visited.has(nextStep) && flowData.steps[nextStep]) {
        queue.push({ stepKey: nextStep, level: level + 1 });
      }
    });
  }

  // Add unvisited steps
  stepKeys.forEach((key) => {
    if (!visited.has(key)) {
      const lastLevel = levels.length;
      if (!levels[lastLevel]) {
        levels[lastLevel] = [];
      }
      levels[lastLevel].push(key);
    }
  });

  // Calculate positions
  levels.forEach((levelNodes, levelIndex) => {
    const totalWidth = (levelNodes.length - 1) * HORIZONTAL_SPACING;
    const startX = -totalWidth / 2;

    levelNodes.forEach((stepKey, nodeIndex) => {
      positionMap.set(stepKey, {
        x: startX + nodeIndex * HORIZONTAL_SPACING,
        y: levelIndex * VERTICAL_SPACING,
      });
    });
  });

  // Create nodes
  stepKeys.forEach((stepKey) => {
    const step = flowData.steps[stepKey];
    if (!step) return;

    const position = positionMap.get(stepKey) || { x: 0, y: 0 };

    // Generate config summary
    let configSummary = '';
    if (step.config.prompt) configSummary = step.config.prompt.substring(0, 60);
    else if (step.config.instructions_text) configSummary = step.config.instructions_text.substring(0, 60);
    else if (step.config.field_name) configSummary = `Input: ${step.config.field_name}`;
    else if (step.config.action_type) configSummary = `Action: ${step.config.action_type}`;
    else if (step.config.conditions?.length) configSummary = `${step.config.conditions.length} condition(s)`;

    nodes.push({
      id: stepKey,
      type: 'flowNode',
      position,
      data: {
        label: step.name,
        stepId: step.step_id,
        stepType: getVisualStepType(step),
        type: step.type,
        config: step.config,
        configSummary,
      },
    });
  });

  // Create edges
  stepKeys.forEach((stepKey) => {
    const step = flowData.steps[stepKey];
    if (!step) return;

    const nextSteps = getNextSteps(step);

    nextSteps.forEach(({ nextStep, label }, idx) => {
      if (!flowData.steps[nextStep]) return;

      const edgeId = label
        ? `${stepKey}-${nextStep}-${idx}`
        : `${stepKey}-${nextStep}`;

      edges.push({
        id: edgeId,
        source: stepKey,
        target: nextStep,
        type: 'smoothstep',
        animated: true,
        label: label,
        labelStyle: label ? {
          fill: 'hsl(215, 20%, 65%)',
          fontSize: 11,
          fontWeight: 500,
        } : undefined,
        labelBgStyle: label ? {
          fill: 'hsl(222, 47%, 8%)',
          fillOpacity: 0.9,
        } : undefined,
        style: { stroke: 'hsl(217, 91%, 60%)', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'hsl(217, 91%, 60%)',
        },
      });
    });
  });

  return { nodes, edges };
}
