import { Eye, Code2, Columns } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import FlowVisualizer from './FlowVisualizer';
import YamlEditor from './YamlEditor';
import { cn } from '@/lib/utils';

type ViewMode = 'visual' | 'code' | 'split';

export default function MainWorkspace() {
  const [viewMode, setViewMode] = useState<ViewMode>('visual');

  const tabs = [
    { id: 'visual' as const, label: 'Visual Flow', icon: Eye },
    { id: 'code' as const, label: 'YAML', icon: Code2 },
    { id: 'split' as const, label: 'Split', icon: Columns },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full">
      {/* Top Bar with Tabs */}
      <div className="h-12 border-b border-border flex items-center px-4 bg-steel-900/50">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              onClick={() => setViewMode(tab.id)}
              className={cn(
                'gap-2 relative h-8',
                viewMode === tab.id
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {viewMode === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {viewMode === 'visual' && (
            <motion.div
              key="visual"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full bg-steel-950"
            >
              <FlowVisualizer />
            </motion.div>
          )}

          {viewMode === 'code' && (
            <motion.div
              key="code"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full p-4"
            >
              <YamlEditor />
            </motion.div>
          )}

          {viewMode === 'split' && (
            <motion.div
              key="split"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full grid grid-cols-2 gap-0"
            >
              <div className="bg-steel-950 border-r border-border">
                <FlowVisualizer />
              </div>
              <div className="p-4 overflow-hidden">
                <YamlEditor />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
