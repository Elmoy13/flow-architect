import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { getLayoutedNodes, LayoutDirection } from '@/lib/autoLayout';
import { useToast } from './use-toast';

/**
 * Hook for auto-layout functionality
 * Provides methods to automatically arrange nodes using Dagre algorithm
 */
export function useAutoLayout() {
    const { getNodes, getEdges, setNodes } = useReactFlow();
    const { toast } = useToast();

    const applyLayout = useCallback((direction: LayoutDirection = 'TB') => {
        const nodes = getNodes();
        const edges = getEdges();

        if (nodes.length === 0) {
            toast({
                title: 'No nodes',
                description: 'Add some nodes to the canvas first',
                variant: 'destructive',
            });
            return;
        }

        // Apply Dagre layout
        const layoutedNodes = getLayoutedNodes(nodes, edges, {
            direction,
            nodeSpacing: direction === 'LR' ? 180 : 200,
            rankSpacing: direction === 'LR' ? 150 : 220,
        });

        // Animate to new positions
        setNodes(layoutedNodes);

        const directionLabels = {
            TB: 'Vertical',
            LR: 'Horizontal',
            BT: 'Bottom-Up',
            RL: 'Right-Left',
        };

        toast({
            title: 'Layout applied',
            description: `Nodes arranged in ${directionLabels[direction]} layout`,
        });
    }, [getNodes, getEdges, setNodes, toast]);

    const applyVerticalLayout = useCallback(() => {
        applyLayout('TB');
    }, [applyLayout]);

    const applyHorizontalLayout = useCallback(() => {
        applyLayout('LR');
    }, [applyLayout]);

    const applyCompactLayout = useCallback(() => {
        // Compact uses horizontal with tighter spacing
        const nodes = getNodes();
        const edges = getEdges();

        if (nodes.length === 0) {
            toast({
                title: 'No nodes',
                description: 'Add some nodes to the canvas first',
                variant: 'destructive',
            });
            return;
        }

        const layoutedNodes = getLayoutedNodes(nodes, edges, {
            direction: 'LR',
            nodeSpacing: 100,
            rankSpacing: 150,
        });

        setNodes(layoutedNodes);

        toast({
            title: 'Layout applied',
            description: 'Nodes arranged in compact layout',
        });
    }, [getNodes, getEdges, setNodes, toast]);

    return {
        applyLayout,
        applyVerticalLayout,
        applyHorizontalLayout,
        applyCompactLayout,
    };
}
