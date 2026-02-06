import { Copy, Trash2, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface SelectionToolbarProps {
    selectedCount: number;
    onDuplicate: () => void;
    onDelete: () => void;
    position?: { x: number; y: number };
}

/**
 * Floating toolbar that appears when multiple nodes are selected
 * Shows actions: Duplicate, Delete, Group, Align
 */
export default function SelectionToolbar({
    selectedCount,
    onDuplicate,
    onDelete,
    position = { x: 20, y: 20 },
}: SelectionToolbarProps) {
    if (selectedCount === 0) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="fixed z-50 glass-panel border border-border rounded-lg shadow-2xl px-3 py-2"
                style={{
                    top: position.y,
                    left: position.x,
                }}
            >
                <div className="flex items-center gap-2">
                    {/* Selection count */}
                    <div className="px-3 py-1 rounded-md bg-primary/10 text-primary text-sm font-semibold">
                        {selectedCount} selected
                    </div>

                    <div className="w-px h-6 bg-border" />

                    {/* Actions */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onDuplicate}
                        className="gap-2 h-8"
                        title="Duplicate (Ctrl+D)"
                    >
                        <Copy className="w-4 h-4" />
                        Duplicate
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onDelete}
                        className="gap-2 h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Delete (Del)"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </Button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
