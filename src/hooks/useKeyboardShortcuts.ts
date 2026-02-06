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
            if (cmdOrCtrl && e.key === 'c') {
                e.preventDefault();

                // Try selectedStepId first, then fall back to React Flow selection
                let nodeToCopy = null;
                let stepToCopy = null;

                if (selectedStepId) {
                    stepToCopy = flowData.steps[selectedStepId];
                    nodeToCopy = getNodes().find(n => n.id === selectedStepId);
                } else {
                    // Check React Flow selection
                    const selectedNodes = getNodes().filter(n => n.selected);
                    if (selectedNodes.length > 0) {
                        nodeToCopy = selectedNodes[0];
                        stepToCopy = flowData.steps[nodeToCopy.id];
                    }
                }

                if (stepToCopy && nodeToCopy) {
                    // Store both step data and visual position
                    localStorage.setItem('flow_builder_clipboard', JSON.stringify({
                        step: stepToCopy,
                        position: nodeToCopy.position,
                        nodeData: nodeToCopy.data
                    }));
                    toast({
                        title: 'Node copied',
                        description: `"${stepToCopy.name}" copied to clipboard`,
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
                        const baseTimestamp = Date.now();
                        const newStepId = `step_${baseTimestamp}`;

                        const newStep: FlowStep = {
                            step_id: newStepId,
                            name: copied.step.name + ' (Copy)',
                            type: copied.step.type,
                            config: copied.step.config,
                        };

                        // Save positions before pasting
                        const positionMap = new Map(
                            getNodes().map(n => [n.id, n.position])
                        );
                        pushFlowHistory(positionMap);

                        // Set skip flag to prevent useEffect race condition
                        const skipRef = (window as any).__skipNextUpdate;
                        if (skipRef?.current !== undefined) {
                            skipRef.current = true;
                        }

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
                        toast({
                            title: 'Paste failed',
                            description: 'Could not paste node',
                            variant: 'destructive',
                        });
                    }
                }
            }


            // Cmd/Ctrl + Z: Undo
            if (cmdOrCtrl && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                if (agentContext.flowHistory.length > 0) {
                    const restoredPositions = undoLastChange();

                    // Trigger position restoration via window global
                    if (restoredPositions) {
                        (window as any).__restoredPositions = restoredPositions;
                    }

                    toast({
                        title: 'Undo',
                        description: 'Reverted to previous state',
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
