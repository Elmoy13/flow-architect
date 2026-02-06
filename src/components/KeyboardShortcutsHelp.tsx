import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface KeyboardShortcutsHelpProps {
    isOpen: boolean;
    onClose: () => void;
}

const SHORTCUTS = [
    { keys: ['Ctrl/⌘', 'C'], description: 'Copy selected node' },
    { keys: ['Ctrl/⌘', 'V'], description: 'Paste copied node' },
    { keys: ['Ctrl/⌘', 'D'], description: 'Duplicate selected node' },
    { keys: ['Ctrl/⌘', 'Z'], description: 'Undo last change' },
    { keys: ['Delete'], description: 'Delete selected node' },
    { keys: ['Escape'], description: 'Deselect node' },
    { keys: ['Double-click'], description: 'Quick edit node' },
    { keys: ['Right-click'], description: 'Open context menu' },
];

export default function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="relative w-full max-w-md glass-panel border border-border rounded-xl shadow-2xl p-6"
                >
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1 rounded-lg hover:bg-muted transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Keyboard className="w-6 h-6 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold">Keyboard Shortcuts</h2>
                    </div>

                    {/* Shortcuts list */}
                    <div className="space-y-3">
                        {SHORTCUTS.map((shortcut, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors"
                            >
                                <span className="text-sm text-foreground">{shortcut.description}</span>
                                <div className="flex items-center gap-1">
                                    {shortcut.keys.map((key, keyIndex) => (
                                        <div key={keyIndex} className="flex items-center gap-1">
                                            <kbd className="px-2 py-1 text-xs font-mono font-semibold bg-steel-800 border border-border rounded">
                                                {key}
                                            </kbd>
                                            {keyIndex < shortcut.keys.length - 1 && (
                                                <span className="text-xs text-muted-foreground">+</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="mt-6 pt-4 border-t border-border">
                        <Button onClick={onClose} className="w-full">
                            Got it!
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
