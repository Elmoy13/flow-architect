import { useCallback, useMemo, useEffect, useRef, useState } from 'react';
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
import QuickEditModal from './QuickEditModal';
import NodeContextMenu from './NodeContextMenu';
import SelectionToolbar from './SelectionToolbar';
import { useFlowAnimation } from '@/hooks/useFlowAnimation';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useMultiSelect } from '@/hooks/useMultiSelect';
import { useAutoLayout } from '@/hooks/useAutoLayout';

const nodeTypes = {
  flowNode: FlowNode,
};

function FlowCanvas() {
  const { flowData, setSelectedStepId, selectedStepId, animationEnabled, animationSpeed, addStep, pushFlowHistory } = useFlowStore();

  // Keyboard shortcuts
  useKeyboardShortcuts();

  // Multi-select
  const multiSelect = useMultiSelect();

  // Auto-layout
  const autoLayout = useAutoLayout();

  // Expose auto-layout globally for Header to use
  useEffect(() => {
    (window as any).__flowAutoLayout = autoLayout;
    return () => {
      delete (window as any).__flowAutoLayout;
    };
  }, [autoLayout]);

  const [quickEditStepId, setQuickEditStepId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ nodeId: string; x: number; y: number } | null>(null);
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
      // Only update if this is a completely new flow or nodes don't exist yet
      // Don't overwrite manually placed nodes
      const existingNodeIds = new Set(nodes.map(n => n.id));
      const hasNewNodes = newNodes.some(n => !existingNodeIds.has(n.id));

      if (hasNewNodes || nodes.length === 0) {
        // Merge: keep existing node positions, add new ones with generated positions
        const mergedNodes = newNodes.map(newNode => {
          const existing = nodes.find(n => n.id === newNode.id);
          return existing ? { ...newNode, position: existing.position } : newNode;
        });

        setNodes(mergedNodes);
        setEdges(newEdges);
        startAnimation(mergedNodes, newEdges);
      }
    }

    prevFlowDataRef.current = flowData;
  }, [flowData, setNodes, setEdges, startAnimation, nodes]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: { id: string }) => {
    // Handle multi-select with Shift/Ctrl
    if (event.shiftKey) {
      // Shift+Click: Add to selection
      multiSelect.addToSelection(node.id);
    } else if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd+Click: Toggle selection
      multiSelect.toggleSelection(node.id);
    } else {
      // Single click: Select only this node
      multiSelect.clearSelection();
      setSelectedStepId(node.id);
    }
  }, [setSelectedStepId, multiSelect]);

  const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: { id: string }) => {
    setQuickEditStepId(node.id);
  }, []);

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: { id: string }) => {
    event.preventDefault();
    setContextMenu({
      nodeId: node.id,
      x: event.clientX,
      y: event.clientY,
    });
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedStepId(null);
    setContextMenu(null);
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
      if (!type || !reactFlowInstance) return;

      // Get exact drop position using reactFlowInstance
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

      // Immediately add the node to React Flow with the exact drop position
      const stepTypeMap: Record<StepType, 'decision' | 'action' | 'start' | 'end' | 'collect' | 'condition'> = {
        collect_information: 'collect',
        decision_point: 'decision',
        evaluate_condition: 'condition',
        provide_instructions: 'action',
        execute_action: 'action',
      };

      const newNode: Node = {
        id: stepId,
        type: 'flowNode',
        position, // Exact position from screenToFlowPosition
        data: {
          label: nameMap[type] || 'Nuevo Paso',
          stepId,
          stepType: stepTypeMap[type],
          type,
          config: defaultConfigs[type] || {},
          isConfigured: false,
          hasWarning: true,
        },
      };

      // Add node directly to React Flow
      setNodes((nds) => nds.concat(newNode));
      setSelectedStepId(stepId);
    },
    [reactFlowInstance, addStep, pushFlowHistory, setSelectedStepId, setNodes]
  );

  const visibleNodes = isAnimating
    ? nodes.filter((n) => visibleNodeIds.has(n.id))
    : nodes;

  const visibleEdges = isAnimating
    ? edges.filter((e) => visibleEdgeIds.has(e.id))
    : edges;

  return (
    <>
      <ReactFlow
        nodes={visibleNodes}
        edges={visibleEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeContextMenu={onNodeContextMenu}
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
        selectionOnDrag={true}
        multiSelectionKeyCode={['Control', 'Meta', 'Shift']}
        deleteKeyCode={null}
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
              case 'condition': return 'hsl(45, 93%, 47%)';
              case 'action': return 'hsl(217, 91%, 60%)';
              case 'start':
              case 'end': return 'hsl(142, 71%, 45%)';
              default: return 'hsl(217, 91%, 60%)';
            }
          }}
        />
      </ReactFlow>

      {/* Quick Edit Modal */}
      <QuickEditModal
        stepId={quickEditStepId}
        onClose={() => setQuickEditStepId(null)}
      />

      {/* Context Menu */}
      <NodeContextMenu
        nodeId={contextMenu?.nodeId || null}
        position={contextMenu ? { x: contextMenu.x, y: contextMenu.y } : null}
        onClose={() => setContextMenu(null)}
        onEdit={(nodeId) => setSelectedStepId(nodeId)}
        onQuickEdit={(nodeId) => setQuickEditStepId(nodeId)}
      />

      {/* Selection Toolbar */}
      <SelectionToolbar
        selectedCount={multiSelect.selectedIds.length}
        onDuplicate={multiSelect.duplicateSelectedNodes}
        onDelete={multiSelect.deleteSelectedNodes}
        position={{ x: 80, y: 80 }}
      />
    </>
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
