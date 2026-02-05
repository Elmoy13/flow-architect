import { useCallback, useMemo, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useFlowStore } from '@/store/flowStore';
import { yamlToReactFlow } from '@/lib/yamlToReactFlow';
import FlowNode from './FlowNode';
import { useFlowAnimation } from '@/hooks/useFlowAnimation';

const nodeTypes = {
  flowNode: FlowNode,
};

export default function FlowVisualizer() {
  const { flowData, setSelectedStepId, selectedStepId, animationEnabled, animationSpeed } = useFlowStore();
  const prevFlowDataRef = useRef(flowData);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => yamlToReactFlow(flowData),
    [flowData]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Animation hook
  const { visibleNodeIds, visibleEdgeIds, isAnimating, startAnimation } = useFlowAnimation({
    enabled: animationEnabled ?? true,
    speed: animationSpeed ?? 'normal',
    nodeDelay: 200,
    edgeDelay: 150,
  });

  // Update nodes/edges when flowData changes
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = yamlToReactFlow(flowData);

    // Detect if this is a "new" flow (significant change)
    const isNewFlow = prevFlowDataRef.current.steps?.length !== flowData.steps?.length
      || prevFlowDataRef.current.flow_id !== flowData.flow_id;

    if (isNewFlow && newNodes.length > 0) {
      // Trigger animation for new flow
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

  // Filter nodes and edges based on animation state
  const visibleNodes = isAnimating
    ? nodes.filter((n) => visibleNodeIds.has(n.id))
    : nodes;

  const visibleEdges = isAnimating
    ? edges.filter((e) => visibleEdgeIds.has(e.id))
    : edges;

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={visibleNodes.map(n => ({ ...n, selected: n.id === selectedStepId }))}
        edges={visibleEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
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
        />
        <MiniMap
          nodeStrokeWidth={3}
          pannable
          zoomable
          className="!bg-steel-900 !border-border !rounded-lg"
          nodeColor={(node) => {
            const stepType = (node.data as { stepType?: string })?.stepType;
            switch (stepType) {
              case 'decision':
                return 'hsl(25, 95%, 53%)';
              case 'collect':
                return 'hsl(280, 70%, 60%)';
              case 'action':
                return 'hsl(217, 91%, 60%)';
              case 'start':
              case 'end':
                return 'hsl(142, 71%, 45%)';
              default:
                return 'hsl(217, 91%, 60%)';
            }
          }}
        />
      </ReactFlow>
    </div>
  );
}
