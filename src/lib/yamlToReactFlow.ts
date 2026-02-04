import { Node, Edge, MarkerType } from '@xyflow/react';
import { FlowData, FlowStep } from '@/store/flowStore';

interface ReactFlowData {
  nodes: Node[];
  edges: Edge[];
}

// Map complex step types to visual types
function getVisualStepType(step: FlowStep, stepId?: string): 'decision' | 'action' | 'start' | 'end' {
  const type = step.type;

  // Check if step name or ID contains "cierre" (closure/end step)
  const isCierreStep =
    (step.name && step.name.toLowerCase().includes('cierre')) ||
    (step.step_id && step.step_id.toLowerCase().includes('close')) ||
    (stepId && stepId.toLowerCase().includes('close'));

  // If it's a cierre/close step, always show as "end"
  if (isCierreStep) {
    return 'end';
  }

  switch (type) {
    case 'evaluate_condition':
    case 'decision_point':
    case 'decision':
      return 'decision';

    case 'collect_information':
    case 'provide_instructions':
    case 'execute_action':
    case 'wait_and_validate':
    case 'action':
      return 'action';

    case 'start':
      return 'start';

    case 'end':
      return 'end';

    default:
      return 'action';
  }
}

// Get label from step (supports both old and new structure)
function getStepLabel(step: FlowStep): string {
  return step.name || step.label || 'Unnamed Step';
}

// Get description from step (supports both old and new structure)
function getStepDescription(step: FlowStep): string {
  return step.description || '';
}

// Extract options from config for decision_point steps
function getStepOptions(step: FlowStep): Array<{ label: string; next_step: string }> | undefined {
  // Legacy options
  if (step.options && step.options.length > 0) {
    return step.options;
  }

  // New structure: extract from config
  if (step.config?.options && step.config.options.length > 0) {
    return step.config.options.map(opt => ({
      label: opt.label,
      next_step: opt.next_step
    }));
  }

  return undefined;
}

// Get all next steps from a step (handles multiple scenarios)
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

  // Legacy options
  if (step.options) {
    step.options.forEach(option => {
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

    // Default next step for conditions
    if (step.config.default_next_step) {
      nextSteps.push({
        nextStep: step.config.default_next_step,
        label: 'Default'
      });
    }
  }

  // wait_and_validate specific
  if (step.config?.success_next_step) {
    nextSteps.push({
      nextStep: step.config.success_next_step,
      label: 'Success'
    });
  }

  if (step.config?.failure_next_step) {
    nextSteps.push({
      nextStep: step.config.failure_next_step,
      label: 'Failure'
    });
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

  // Calculate positions using a simple layout algorithm
  const HORIZONTAL_SPACING = 320;
  const VERTICAL_SPACING = 180;

  // Create a simple grid layout based on step order and connections
  const positionMap = new Map<string, { x: number; y: number }>();
  const visited = new Set<string>();

  // BFS to determine layout levels
  const levels: string[][] = [];
  const queue: Array<{ stepKey: string; level: number }> = [];

  // Find the first step (use initial_step if available, otherwise first in steps)
  const firstStep = flowData.initial_step || stepKeys[0];
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

    // Add all next steps to queue
    const nextSteps = getNextSteps(step);
    nextSteps.forEach(({ nextStep }) => {
      if (!visited.has(nextStep)) {
        queue.push({ stepKey: nextStep, level: level + 1 });
      }
    });
  }

  // Add any unvisited steps
  stepKeys.forEach((key) => {
    if (!visited.has(key)) {
      const lastLevel = levels.length;
      if (!levels[lastLevel]) {
        levels[lastLevel] = [];
      }
      levels[lastLevel].push(key);
    }
  });

  // Calculate positions based on levels
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

    nodes.push({
      id: stepKey,
      type: 'flowNode',
      position,
      data: {
        label: getStepLabel(step),
        description: getStepDescription(step),
        stepType: getVisualStepType(step, stepKey),
        options: getStepOptions(step),
      },
    });
  });

  // Create edges
  stepKeys.forEach((stepKey) => {
    const step = flowData.steps[stepKey];
    if (!step) return;

    const nextSteps = getNextSteps(step);

    nextSteps.forEach(({ nextStep, label }, idx) => {
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
