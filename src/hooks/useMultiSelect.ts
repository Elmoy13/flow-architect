import { useCallback, useEffect } from 'react';
import { useFlowStore } from '@/store/flowStore';
import { useReactFlow } from '@xyflow/react';

/**
 * Hook for multi-select functionality
 * Supports:
 * - Shift+Click to add to selection
 * - Ctrl/Cmd+Click to toggle selection
 * - Box selection (built-in React Flow)
 * - Keyboard shortcuts for batch operations
 */
export function useMultiSelect() {
    const { selectedStepId, setSelectedStepId, flowData, deleteStep, pushFlowHistory, addStep } = useFlowStore();
    const { getNodes, setNodes } = useReactFlow();

    // Track selected nodes
    const selectedNodes = getNodes().filter(node => node.selected);
    const selectedIds = selectedNodes.map(node => node.id);

    // Select multiple nodes
    const selectNodes = useCallback((nodeIds: string[]) => {
        setNodes((nodes) =>
            nodes.map((node) => ({
                ...node,
                selected: nodeIds.includes(node.id),
            }))
        );
    }, [setNodes]);

    // Add node to selection
    const addToSelection = useCallback((nodeId: string) => {
        setNodes((nodes) =>
            nodes.map((node) =>
                node.id === nodeId ? { ...node, selected: true } : node
            )
        );
    }, [setNodes]);

    // Toggle node selection
    const toggleSelection = useCallback((nodeId: string) => {
        setNodes((nodes) =>
            nodes.map((node) =>
                node.id === nodeId ? { ...node, selected: !node.selected } : node
            )
        );
    }, [setNodes]);

    // Clear all selections
    const clearSelection = useCallback(() => {
        setNodes((nodes) =>
            nodes.map((node) => ({ ...node, selected: false }))
        );
        setSelectedStepId(null);
    }, [setNodes, setSelectedStepId]);

    // Delete selected nodes
    const deleteSelectedNodes = useCallback(() => {
        if (selectedIds.length === 0) return;

        pushFlowHistory();
        selectedIds.forEach((id) => {
            deleteStep(id);
        });
        clearSelection();
    }, [selectedIds, deleteStep, pushFlowHistory, clearSelection]);

    // Duplicate selected nodes
    const duplicateSelectedNodes = useCallback(() => {
        if (selectedIds.length === 0) return;

        pushFlowHistory();
        const nodesToDuplicate = selectedNodes;

        // Get skipNextUpdate ref
        const skipRef = (window as any).__skipNextUpdate;

        nodesToDuplicate.forEach((node, index) => {
            const stepId = `step_${Date.now()}_${index}`;
            const step = flowData.steps[node.id];

            if (!step) return;

            // Set skip flag BEFORE addStep
            if (skipRef?.current !== undefined) {
                skipRef.current = true;
            }

            // Add to flow store
            addStep({
                step_id: stepId,
                name: `${step.name} (Copy)`,
                type: step.type,
                config: { ...step.config },
            });

            // Add visual node with offset position
            const newNode = {
                id: stepId,
                type: node.type,
                position: {
                    x: node.position.x + 50,
                    y: node.position.y + 50,
                },
                data: {
                    ...node.data,
                    label: `${step.name} (Copy)`,
                    stepId,
                },
            };

            setNodes((nds) => nds.concat(newNode));
        });

        // Select the new nodes
        const newIds = nodesToDuplicate.map((_, index) => `step_${Date.now()}_${index}`);
        setTimeout(() => selectNodes(newIds), 50);
    }, [selectedIds, selectedNodes, flowData, addStep, setNodes, selectNodes, pushFlowHistory]);

    // Keyboard shortcuts for batch operations
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in input
            if ((e.target as HTMLElement).tagName === 'INPUT' ||
                (e.target as HTMLElement).tagName === 'TEXTAREA') {
                return;
            }

            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

            // Delete selected nodes (works for both single and multiple)
            if (e.key === 'Delete' && selectedIds.length > 0) {
                e.preventDefault();
                deleteSelectedNodes();
            }

            // Duplicate selected nodes (Ctrl/Cmd+D) - works for both single and multiple
            if (cmdOrCtrl && e.key === 'd' && selectedIds.length > 0) {
                e.preventDefault();
                duplicateSelectedNodes();
            }

            // Select all (Ctrl/Cmd+A)
            if (cmdOrCtrl && e.key === 'a') {
                e.preventDefault();
                const allIds = getNodes().map(n => n.id);
                selectNodes(allIds);
            }

            // Deselect all (Escape)
            if (e.key === 'Escape' && selectedIds.length > 0) {
                e.preventDefault();
                clearSelection();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedIds, deleteSelectedNodes, duplicateSelectedNodes, selectNodes, clearSelection, getNodes]);

    return {
        selectedNodes,
        selectedIds,
        selectNodes,
        addToSelection,
        toggleSelection,
        clearSelection,
        deleteSelectedNodes,
        duplicateSelectedNodes,
    };
}
