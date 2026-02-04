import { Node, Edge, MarkerType } from '@xyflow/react';
import { FlowData } from '@/store/flowStore';

interface ReactFlowData {
  nodes: Node[];
  edges: Edge[];
}

export function yamlToReactFlow(flowData: FlowData | null): ReactFlowData {
  if (!flowData || !flowData.steps) {
    return { nodes: [], edges: [] };
  }

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const stepKeys = Object.keys(flowData.steps);
  
  // Calculate positions using a simple layout algorithm
  const HORIZONTAL_SPACING = 280;
  const VERTICAL_SPACING = 150;
  
  // Create a simple grid layout based on step order and connections
  const positionMap = new Map<string, { x: number; y: number }>();
  const visited = new Set<string>();
  
  // BFS to determine layout levels
  const levels: string[][] = [];
  const queue: Array<{ stepKey: string; level: number }> = [];
  
  // Find the first step (usually a decision or start node)
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
    
    // Add next steps to queue
    if (step.next_step && !visited.has(step.next_step)) {
      queue.push({ stepKey: step.next_step, level: level + 1 });
    }
    
    if (step.options) {
      step.options.forEach((option, idx) => {
        if (!visited.has(option.next_step)) {
          queue.push({ stepKey: option.next_step, level: level + 1 });
        }
      });
    }
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
        label: step.label,
        description: step.description,
        stepType: step.type,
        options: step.options,
      },
    });
  });
  
  // Create edges
  stepKeys.forEach((stepKey) => {
    const step = flowData.steps[stepKey];
    if (!step) return;
    
    if (step.next_step) {
      edges.push({
        id: `${stepKey}-${step.next_step}`,
        source: stepKey,
        target: step.next_step,
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'hsl(217, 91%, 60%)', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'hsl(217, 91%, 60%)',
        },
      });
    }
    
    if (step.options) {
      step.options.forEach((option, idx) => {
        edges.push({
          id: `${stepKey}-${option.next_step}-${idx}`,
          source: stepKey,
          target: option.next_step,
          type: 'smoothstep',
          animated: true,
          label: option.label,
          labelStyle: { 
            fill: 'hsl(215, 20%, 65%)', 
            fontSize: 11,
            fontWeight: 500,
          },
          labelBgStyle: { 
            fill: 'hsl(222, 47%, 8%)', 
            fillOpacity: 0.9,
          },
          style: { stroke: 'hsl(217, 91%, 60%)', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: 'hsl(217, 91%, 60%)',
          },
        });
      });
    }
  });
  
  return { nodes, edges };
}
