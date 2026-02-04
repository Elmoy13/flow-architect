import { useCallback, useMemo, useEffect } from 'react';
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

const nodeTypes = {
  flowNode: FlowNode,
};

export default function FlowVisualizer() {
  const { flowData } = useFlowStore();
  
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => yamlToReactFlow(flowData),
    [flowData]
  );
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Update nodes/edges when flowData changes
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = yamlToReactFlow(flowData);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [flowData, setNodes, setEdges]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
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
            const stepType = (node.data as any)?.stepType;
            switch (stepType) {
              case 'decision':
                return 'hsl(25, 95%, 53%)';
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
