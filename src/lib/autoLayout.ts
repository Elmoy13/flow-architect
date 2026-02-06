import dagre from 'dagre';
import { Node, Edge } from '@xyflow/react';

export type LayoutDirection = 'TB' | 'LR' | 'BT' | 'RL';

interface LayoutOptions {
    direction?: LayoutDirection;
    nodeSpacing?: number;
    rankSpacing?: number;
}

/**
 * Auto-layout using Dagre algorithm
 * Arranges nodes in a hierarchical, easy-to-read layout
 * 
 * @param nodes - Array of React Flow nodes
 * @param edges - Array of React Flow edges
 * @param options - Layout configuration
 * @returns New node positions
 */
export function getLayoutedNodes(
    nodes: Node[],
    edges: Edge[],
    options: LayoutOptions = {}
): Node[] {
    const {
        direction = 'TB', // Top to Bottom (vertical)
        nodeSpacing = 150,  // Horizontal spacing between nodes
        rankSpacing = 200,  // Vertical spacing between ranks/levels
    } = options;

    // Create a new directed graph
    const dagreGraph = new dagre.graphlib.Graph();

    // Set graph properties
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({
        rankdir: direction,
        nodesep: nodeSpacing,
        ranksep: rankSpacing,
        marginx: 50,
        marginy: 50,
    });

    // Add nodes to the graph
    nodes.forEach((node) => {
        // Use actual node dimensions if available, otherwise default
        const width = node.width || 280;
        const height = node.height || 120;

        dagreGraph.setNode(node.id, {
            width,
            height,
        });
    });

    // Add edges to establish hierarchy
    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    // Calculate layout
    dagre.layout(dagreGraph);

    // Apply new positions to nodes
    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);

        // Dagre returns center position, we need top-left
        const width = node.width || 280;
        const height = node.height || 120;

        return {
            ...node,
            position: {
                x: nodeWithPosition.x - width / 2,
                y: nodeWithPosition.y - height / 2,
            },
        };
    });

    return layoutedNodes;
}

/**
 * Auto-layout specifically for workflow steps
 * Optimized for linear and branching flow patterns
 */
export function getWorkflowLayout(
    nodes: Node[],
    edges: Edge[],
    direction: LayoutDirection = 'TB'
): Node[] {
    // For workflows, we want more vertical spacing
    return getLayoutedNodes(nodes, edges, {
        direction,
        nodeSpacing: 180,
        rankSpacing: 220,
    });
}

/**
 * Compact layout for dense graphs
 */
export function getCompactLayout(
    nodes: Node[],
    edges: Edge[]
): Node[] {
    return getLayoutedNodes(nodes, edges, {
        direction: 'LR', // Left to Right for compact
        nodeSpacing: 100,
        rankSpacing: 150,
    });
}
