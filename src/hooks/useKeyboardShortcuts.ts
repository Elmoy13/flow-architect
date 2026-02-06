import { useEffect } from 'react';
import { useFlowStore } from '@/store/flowStore';
import { useToast } from '@/hooks/use-toast';

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
                if (step) {
                    // Store in clipboard (localStorage for simplicity)
                    localStorage.setItem('flow_builder_clipboard', JSON.stringify(step));
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
                        const copiedStep = JSON.parse(clipboardData);
                        const newStepId = `${copiedStep.step_id}_copy_${Date.now()}`;
                        const newStep = {
                            ...copiedStep,
                            step_id: newStepId,
                            name: `${copiedStep.name} (Copy)`,
                        };

                        pushFlowHistory();
                        addStep(newStep);

                        toast({
                            title: 'Node pasted',
                            description: `Created "${newStep.name}"`,
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
                if (step) {
                    const newStepId = `${step.step_id}_duplicate_${Date.now()}`;
                    const newStep = {
                        ...step,
                        step_id: newStepId,
                        name: `${step.name} (Copy)`,
                    };

                    pushFlowHistory();
                    addStep(newStep);

                    toast({
                        title: 'Node duplicated',
                        description: `Created "${newStep.name}"`,
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
    }, [selectedStepId, flowData, addStep, deleteStep, updateStep, pushFlowHistory, undoLastChange, agentContext, toast]);
}
