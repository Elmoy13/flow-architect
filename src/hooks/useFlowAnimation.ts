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
            // Always show everything immediately for fluid experience
            setVisibleNodeIds(new Set(nodes.map((n) => n.id)));
            setVisibleEdgeIds(new Set(edges.map((e) => e.id)));
            setIsAnimating(false);
        },
        []
    );

    // Animation effect disabled for fluid experience - everything shows immediately
    // useEffect(() => {
    //     if (!animationQueue || !isAnimating) return;
    //     ... animation logic removed for performance
    // }, [animationQueue, isAnimating, config.speed]);

    return {
        visibleNodeIds,
        visibleEdgeIds,
        isAnimating,
        startAnimation,
        resetAnimation,
    };
}
