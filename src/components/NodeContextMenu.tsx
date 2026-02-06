import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Copy,
    Trash2,
    Edit3,
    Settings2,
    ChevronRight,
} from 'lucide-react';
import { useFlowStore } from '@/store/flowStore';
import { useToast } from '@/hooks/use-toast';

interface ContextMenuProps {
    nodeId: string | null;
    position: { x: number; y: number } | null;
    onClose: () => void;
    onEdit: (nodeId: string) => void;
    onQuickEdit: (nodeId: string) => void;
}

export default function NodeContextMenu({
    nodeId,
    position,
    onClose,
    onEdit,
    onQuickEdit,
}: ContextMenuProps) {
    const { flowData, deleteStep, addStep, pushFlowHistory, setSelectedStepId } = useFlowStore();
    const { toast } = useToast();

    const step = nodeId ? flowData.steps[nodeId] : null;

    useEffect(() => {
        if (position) {
            const handleClickOutside = () => onClose();
            const handleEscape = (e: KeyboardEvent) => {
                if (e.key === 'Escape') onClose();
            };

            // Small delay to avoid immediate close
            setTimeout(() => {
                document.addEventListener('click', handleClickOutside);
                document.addEventListener('keydown', handleEscape);
            }, 100);

            return () => {
                document.removeEventListener('click', handleClickOutside);
                document.removeEventListener('keydown', handleEscape);
            };
        }
    }, [position, onClose]);

    const handleDuplicate = useCallback(() => {
        if (!step) return;

        const newStepId = `${step.step_id}_copy_${Date.now()}`;
        const newStep = {
            ...step,
            step_id: newStepId,
            name: `${step.name} (Copy)`,
        };

        pushFlowHistory();
        addStep(newStep);
        setSelectedStepId(newStepId);

        toast({
            title: 'Node duplicated',
            description: `Created "${newStep.name}"`,
        });

        onClose();
    }, [step, addStep, pushFlowHistory, setSelectedStepId, toast, onClose]);

    const handleDelete = useCallback(() => {
        if (!step || !nodeId) return;

        pushFlowHistory();
        deleteStep(nodeId);

        toast({
            title: 'Node deleted',
            description: `"${step.name}" removed from flow`,
            variant: 'destructive',
        });

        onClose();
    }, [step, nodeId, deleteStep, pushFlowHistory, toast, onClose]);

    const handleQuickEditClick = useCallback(() => {
        if (nodeId) {
            onQuickEdit(nodeId);
            onClose();
        }
    }, [nodeId, onQuickEdit, onClose]);

    const handleEditClick = useCallback(() => {
        if (nodeId) {
            onEdit(nodeId);
            onClose();
        }
    }, [nodeId, onEdit, onClose]);

    if (!position || !step) return null;

    const menuItems = [
        {
            icon: <Edit3 className="w-4 h-4" />,
            label: 'Quick Edit',
            action: handleQuickEditClick,
            shortcut: 'Double-click',
        },
        {
            icon: <Settings2 className="w-4 h-4" />,
            label: 'Advanced Edit',
            action: handleEditClick,
            shortcut: '',
        },
        {
            icon: <Copy className="w-4 h-4" />,
            label: 'Duplicate',
            action: handleDuplicate,
            shortcut: '⌘D',
        },
        {
            icon: <Trash2 className="w-4 h-4" />,
            label: 'Delete',
            action: handleDelete,
            shortcut: 'Del',
            danger: true,
        },
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className="fixed z-50"
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="min-w-[200px] glass-panel border border-border rounded-lg shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="px-3 py-2 border-b border-border/50 bg-muted/30">
                        <p className="text-xs font-medium truncate">{step.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{step.step_id}</p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                        {menuItems.map((item, index) => (
                            <button
                                key={index}
                                onClick={item.action}
                                className={`
                  w-full px-3 py-2 flex items-center justify-between gap-3
                  hover:bg-muted/50 transition-colors text-left
                  ${item.danger ? 'text-destructive hover:bg-destructive/10' : 'text-foreground'}
                `}
                            >
                                <div className="flex items-center gap-2">
                                    {item.icon}
                                    <span className="text-sm">{item.label}</span>
                                </div>
                                {item.shortcut && (
                                    <span className="text-xs text-muted-foreground font-mono">
                                        {item.shortcut}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
