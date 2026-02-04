import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Code2, Columns, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFlowStore } from '@/store/flowStore';
import FlowVisualizer from './FlowVisualizer';
import YamlEditor from './YamlEditor';
import { cn } from '@/lib/utils';

export default function MainWorkspace() {
  const { viewMode, setViewMode, isCopilotOpen, toggleCopilot } = useFlowStore();

  const tabs = [
    { id: 'visual' as const, label: 'Visual Flow', icon: Eye },
    { id: 'code' as const, label: 'Code Editor', icon: Code2 },
    { id: 'split' as const, label: 'Split View', icon: Columns },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full">
      {/* Top Bar with Tabs */}
      <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-steel-900/50">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              onClick={() => setViewMode(tab.id)}
              className={cn(
                'gap-2 relative',
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

        {!isCopilotOpen && (
          <Button
            variant="outline"
            size="sm"
            onClick={toggleCopilot}
            className="gap-2"
          >
            <Sparkles className="w-4 h-4" />
            AI Copilot
          </Button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden p-4">
        <AnimatePresence mode="wait">
          {viewMode === 'visual' && (
            <motion.div
              key="visual"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full h-full rounded-xl overflow-hidden border border-border bg-steel-950"
            >
              <FlowVisualizer />
            </motion.div>
          )}

          {viewMode === 'code' && (
            <motion.div
              key="code"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full h-full"
            >
              <YamlEditor />
            </motion.div>
          )}

          {viewMode === 'split' && (
            <motion.div
              key="split"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full h-full grid grid-cols-2 gap-4"
            >
              <div className="rounded-xl overflow-hidden border border-border bg-steel-950">
                <FlowVisualizer />
              </div>
              <div className="h-full">
                <YamlEditor />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
