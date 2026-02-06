import { useCallback, useMemo, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  type Connection,
  addEdge,
  type Node,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useFlowStore, StepType } from '@/store/flowStore';
import { yamlToReactFlow } from '@/lib/yamlToReactFlow';
import FlowNode from './FlowNode';
import { useFlowAnimation } from '@/hooks/useFlowAnimation';

const nodeTypes = {
  flowNode: FlowNode,
};

function FlowCanvas() {
  const { flowData, setSelectedStepId, selectedStepId, animationEnabled, animationSpeed, addStep, pushFlowHistory } = useFlowStore();
  const prevFlowDataRef = useRef(flowData);
  const reactFlowInstance = useReactFlow();

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => yamlToReactFlow(flowData),
    [flowData]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const { visibleNodeIds, visibleEdgeIds, isAnimating, startAnimation } = useFlowAnimation({
    enabled: animationEnabled ?? true,
    speed: animationSpeed ?? 'normal',
    nodeDelay: 200,
    edgeDelay: 150,
  });

  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = yamlToReactFlow(flowData);
    const prevStepCount = Object.keys(prevFlowDataRef.current.steps || {}).length;
    const currStepCount = Object.keys(flowData.steps || {}).length;
    const isNewFlow = prevStepCount !== currStepCount || prevFlowDataRef.current.flow_id !== flowData.flow_id;

    if (isNewFlow && newNodes.length > 0) {
      startAnimation(newNodes, newEdges);
    }

    setNodes(newNodes);
    setEdges(newEdges);
    prevFlowDataRef.current = flowData;
  }, [flowData, setNodes, setEdges, startAnimation]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: { id: string }) => {
    setSelectedStepId(node.id);
  }, [setSelectedStepId]);

  const onPaneClick = useCallback(() => {
    setSelectedStepId(null);
  }, [setSelectedStepId]);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge(connection, eds));
  }, [setEdges]);

  // Handle drop from toolbox
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow') as StepType;
      if (!type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      pushFlowHistory();

      const stepId = `step_${Date.now()}`;
      const nameMap: Record<StepType, string> = {
        collect_information: 'Nuevo Collect',
        decision_point: 'Nueva Decisión',
        evaluate_condition: 'Nueva Condición',
        provide_instructions: 'Nuevas Instrucciones',
        execute_action: 'Nueva Acción',
      };

      const defaultConfigs: Record<StepType, any> = {
        collect_information: { prompt: '', field_name: '', validation: { type: 'text' } },
        decision_point: { prompt: '', options: [{ label: 'Opción 1', value: 'opt_1', next_step: '' }] },
        evaluate_condition: { conditions: [{ field: '', operator: '==', value: '', next_step: '' }], default_next_step: '' },
        provide_instructions: { instructions_text: '', confirmation_required: false },
        execute_action: { action_type: '' },
      };

      addStep({
        step_id: stepId,
        name: nameMap[type] || 'Nuevo Paso',
        type,
        config: defaultConfigs[type] || {},
      });

      setSelectedStepId(stepId);
    },
    [reactFlowInstance, addStep, pushFlowHistory, setSelectedStepId]
  );

  const visibleNodes = isAnimating
    ? nodes.filter((n) => visibleNodeIds.has(n.id))
    : nodes;

  const visibleEdges = isAnimating
    ? edges.filter((e) => visibleEdgeIds.has(e.id))
    : edges;

  return (
    <ReactFlow
      nodes={visibleNodes.map(n => ({ ...n, selected: n.id === selectedStepId }))}
      edges={visibleEdges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      onConnect={onConnect}
      onDragOver={onDragOver}
      onDrop={onDrop}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.3}
      maxZoom={1.5}
      defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      defaultEdgeOptions={{
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'hsl(217, 91%, 60%)', strokeWidth: 2 },
      }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={20}
        size={1}
        color="hsl(217, 33%, 20%)"
      />
      <Controls
        showInteractive={false}
        className="!bg-steel-850 !border-border !rounded-lg overflow-hidden"
        position="bottom-left"
      />
      <MiniMap
        nodeStrokeWidth={3}
        pannable
        zoomable
        className="!bg-steel-900 !border-border !rounded-lg"
        position="bottom-right"
        nodeColor={(node) => {
          const stepType = (node.data as { stepType?: string })?.stepType;
          switch (stepType) {
            case 'decision': return 'hsl(25, 95%, 53%)';
            case 'collect': return 'hsl(280, 70%, 60%)';
            case 'action': return 'hsl(217, 91%, 60%)';
            case 'start':
            case 'end': return 'hsl(142, 71%, 45%)';
            default: return 'hsl(217, 91%, 60%)';
          }
        }}
      />
    </ReactFlow>
  );
}

export default function FlowVisualizer() {
  return (
    <div className="w-full h-full">
      <ReactFlowProvider>
        <FlowCanvas />
      </ReactFlowProvider>
    </div>
  );
}
