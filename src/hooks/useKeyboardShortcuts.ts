import { useCallback, useEffect } from 'react';
import { useFlowStore } from '@/store/flowStore';
import type { FlowStep } from '@/store/flowStore';
import { useToast } from '@/hooks/use-toast';
import { useReactFlow, Node } from '@xyflow/react';

/**
 * Custom hook for keyboard shortcuts in the flow builder
 */
export function useKeyboardShortcuts() {
    const {
        selectedStepId,
        flowData,
        addStep,
        deleteStep,
        updateStep,
        pushFlowHistory,
        undoLastChange,
        agentContext
    } = useFlowStore();
    const { toast } = useToast();
    const { getNodes, setNodes } = useReactFlow();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

            // Ignore if user is typing in an input/textarea
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                return;
            }

            // Cmd/Ctrl + C: Copy node
            if (cmdOrCtrl && e.key === 'c' && selectedStepId) {
                e.preventDefault();
                const step = flowData.steps[selectedStepId];
                const node = getNodes().find(n => n.id === selectedStepId);
                if (step && node) {
                    // Store both step data and visual position
                    localStorage.setItem('flow_builder_clipboard', JSON.stringify({
                        step,
                        position: node.position,
                        nodeData: node.data
                    }));
                    toast({
                        title: 'Node copied',
                        description: `"${step.name}" copied to clipboard`,
                    });
                }
            }

            // Cmd/Ctrl + V: Paste node
            if (cmdOrCtrl && e.key === 'v') {
                e.preventDefault();
                const clipboardData = localStorage.getItem('flow_builder_clipboard');
                if (clipboardData) {
                    try {
                        const copied = JSON.parse(clipboardData);
                        const newStepId = `step_${Date.now()}`;

                        const newStep: FlowStep = {
                            step_id: newStepId,
                            name: copied.step.name + ' (Copy)',
                            type: copied.step.type,
                            config: copied.step.config,
                        };

                        pushFlowHistory();

                        // Set skip flag to prevent useEffect race condition
                        const skipRef = (window as any).__skipNextUpdate?.current;
                        if (skipRef !== undefined) skipRef.current = true;

                        addStep(newStep);

                        // Use last click position on canvas (from window global)
                        const lastClickPos = (window as any).__lastClickPos?.current || { x: 100, y: 100 };

                        // Add visual node at last click position
                        const newNode: Node = {
                            id: newStepId,
                            type: 'flowNode',
                            position: {
                                x: lastClickPos.x,
                                y: lastClickPos.y,
                            },
                            data: {
                                ...copied.nodeData,
                                label: newStep.name,
                                stepId: newStepId,
                            },
                        };

                        setNodes((nds) => nds.concat(newNode));

                        toast({
                            title: 'Node pasted',
                            description: `Created "${newStep.name}" at cursor position`,
                        });
                    } catch (error) {
                        console.error('Failed to paste:', error);
                    }
                }
            }

            // Cmd/Ctrl + D: Duplicate selected node
            if (cmdOrCtrl && e.key === 'd' && selectedStepId) {
                e.preventDefault();
                const step = flowData.steps[selectedStepId];
                const node = getNodes().find(n => n.id === selectedStepId);
                if (step && node) {
                    const newStepId = `step_${Date.now()}`;
                    const newStep: FlowStep = {
                        step_id: newStepId,
                        name: node.data.label + ' (Copy)',
                        type: node.data.type,
                        config: node.data.config,
                    };

                    pushFlowHistory();

                    // Set skip flag to prevent useEffect race condition
                    const skipRef = (window as any).__skipNextUpdate?.current;
                    if (skipRef !== undefined) skipRef.current = true;

                    addStep(newStep);

                    // Add visual node with offset (next to original)
                    const newNode: Node = {
                        id: newStepId,
                        type: 'flowNode',
                        position: {
                            x: node.position.x + 50,
                            y: node.position.y + 50,
                        },
                        data: {
                            ...node.data,
                            label: newStep.name,
                            stepId: newStepId,
                        },
                    };

                    setNodes((nds) => nds.concat(newNode));

                    toast({
                        title: 'Node duplicated',
                        description: `Created "${newStep.name}" next to original`,
                    });
                }
            }

            // Cmd/Ctrl + Z: Undo
            if (cmdOrCtrl && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                if (agentContext.flowHistory.length > 0) {
                    undoLastChange();
                    toast({
                        title: 'Undo',
                        description: 'Reverted to previous state',
                    });
                }
            }

            // Delete: Delete selected node
            if (e.key === 'Delete' && selectedStepId) {
                e.preventDefault();
                const step = flowData.steps[selectedStepId];
                if (step) {
                    pushFlowHistory();
                    deleteStep(selectedStepId);
                    toast({
                        title: 'Node deleted',
                        description: `"${step.name}" removed from flow`,
                        variant: 'destructive',
                    });
                }
            }

            // Escape: Deselect
            if (e.key === 'Escape' && selectedStepId) {
                e.preventDefault();
                useFlowStore.getState().setSelectedStepId(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedStepId, flowData, addStep, deleteStep, updateStep, pushFlowHistory, undoLastChange, agentContext, toast, getNodes, setNodes]);
}
