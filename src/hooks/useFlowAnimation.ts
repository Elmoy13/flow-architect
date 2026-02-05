import { useState, useEffect, useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';

interface AnimationConfig {
    enabled: boolean;
    speed: 'fast' | 'normal' | 'slow';
    nodeDelay: number;
    edgeDelay: number;
}

interface UseFlowAnimationResult {
    visibleNodeIds: Set<string>;
    visibleEdgeIds: Set<string>;
    isAnimating: boolean;
    startAnimation: (nodes: Node[], edges: Edge[]) => void;
    resetAnimation: () => void;
}

const SPEED_DELAYS = {
    fast: { node: 100, edge: 80 },
    normal: { node: 200, edge: 150 },
    slow: { node: 350, edge: 250 },
};

/**
 * Hook para controlar animaciones secuenciales de construcción de flujo
 * Los nodos y edges aparecen uno por uno en orden
 */
export function useFlowAnimation(
    config: AnimationConfig = {
        enabled: true,
        speed: 'normal',
        nodeDelay: 200,
        edgeDelay: 150,
    }
): UseFlowAnimationResult {
    const [visibleNodeIds, setVisibleNodeIds] = useState<Set<string>>(new Set());
    const [visibleEdgeIds, setVisibleEdgeIds] = useState<Set<string>>(new Set());
    const [isAnimating, setIsAnimating] = useState(false);
    const [animationQueue, setAnimationQueue] = useState<{
        nodes: Node[];
        edges: Edge[];
    } | null>(null);

    const resetAnimation = useCallback(() => {
        setVisibleNodeIds(new Set());
        setVisibleEdgeIds(new Set());
        setIsAnimating(false);
        setAnimationQueue(null);
    }, []);

    const startAnimation = useCallback(
        (nodes: Node[], edges: Edge[]) => {
            if (!config.enabled || nodes.length === 0) {
                // Si animaciones deshabilitadas, mostrar todo inmediatamente
                setVisibleNodeIds(new Set(nodes.map((n) => n.id)));
                setVisibleEdgeIds(new Set(edges.map((e) => e.id)));
                return;
            }

            // Reset y comenzar animación
            resetAnimation();
            setAnimationQueue({ nodes, edges });
            setIsAnimating(true);
        },
        [config.enabled, resetAnimation]
    );

    // Efecto para animar secuencialmente
    useEffect(() => {
        if (!animationQueue || !isAnimating) return;

        const { nodes, edges } = animationQueue;
        const delays = SPEED_DELAYS[config.speed];

        // Crear mapa de edges por nodo fuente
        const edgesBySource = new Map<string, Edge[]>();
        edges.forEach((edge) => {
            const sourceEdges = edgesBySource.get(edge.source) || [];
            sourceEdges.push(edge);
            edgesBySource.set(edge.source, sourceEdges);
        });

        let currentIndex = 0;
        const timeouts: NodeJS.Timeout[] = [];

        const animateNext = () => {
            if (currentIndex >= nodes.length) {
                setIsAnimating(false);
                return;
            }

            const currentNode = nodes[currentIndex];

            // Mostrar nodo actual
            setVisibleNodeIds((prev) => new Set([...prev, currentNode.id]));

            // Después de un delay, mostrar edges que salen de este nodo
            const edgeTimeout = setTimeout(() => {
                const outgoingEdges = edgesBySource.get(currentNode.id) || [];
                setVisibleEdgeIds((prev) => {
                    const newSet = new Set(prev);
                    outgoingEdges.forEach((edge) => newSet.add(edge.id));
                    return newSet;
                });
            }, delays.edge);

            timeouts.push(edgeTimeout);

            currentIndex++;

            // Programar siguiente nodo
            const nodeTimeout = setTimeout(animateNext, delays.node);
            timeouts.push(nodeTimeout);
        };

        // Comenzar animación
        animateNext();

        // Cleanup
        return () => {
            timeouts.forEach(clearTimeout);
        };
    }, [animationQueue, isAnimating, config.speed]);

    return {
        visibleNodeIds,
        visibleEdgeIds,
        isAnimating,
        startAnimation,
        resetAnimation,
    };
}
