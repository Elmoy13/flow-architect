import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  GitBranch,
  GitMerge,
  ClipboardList,
  Zap,
  ChevronLeft,
  ChevronRight,
  GripVertical,
} from 'lucide-react';
import { StepType } from '@/store/flowStore';

interface ToolboxItem {
  type: StepType;
  label: string;
  description: string;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
}

const TOOLBOX_ITEMS: ToolboxItem[] = [
  {
    type: 'collect_information',
    label: 'Collect Info',
    description: 'Gather data from user',
    icon: <MessageSquare className="w-5 h-5" />,
    colorClass: 'text-purple-400',
    bgClass: 'bg-purple-500/15 border-purple-500/30 hover:border-purple-400/50 hover:bg-purple-500/25',
  },
  {
    type: 'decision_point',
    label: 'Decision',
    description: 'Branch with options',
    icon: <GitBranch className="w-5 h-5" />,
    colorClass: 'text-orange-400',
    bgClass: 'bg-orange-500/15 border-orange-500/30 hover:border-orange-400/50 hover:bg-orange-500/25',
  },
  {
    type: 'evaluate_condition',
    label: 'Condition',
    description: 'Evaluate logic rules',
    icon: <GitMerge className="w-5 h-5" />,
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-500/15 border-amber-500/30 hover:border-amber-400/50 hover:bg-amber-500/25',
  },
  {
    type: 'provide_instructions',
    label: 'Instructions',
    description: 'Show agent guidance',
    icon: <ClipboardList className="w-5 h-5" />,
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-500/15 border-blue-500/30 hover:border-blue-400/50 hover:bg-blue-500/25',
  },
  {
    type: 'execute_action',
    label: 'Action',
    description: 'Run an operation',
    icon: <Zap className="w-5 h-5" />,
    colorClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/15 border-emerald-500/30 hover:border-emerald-400/50 hover:bg-emerald-500/25',
  },
];

interface FlowToolboxProps {
  onDragStart: (event: React.DragEvent, nodeType: StepType) => void;
}

export default function FlowToolbox({ onDragStart }: FlowToolboxProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="relative flex">
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 200, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full glass-panel border-r border-border flex flex-col overflow-hidden"
          >
            <div className="p-3 border-b border-border">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Flow Toolbox
              </h3>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                Drag onto canvas
              </p>
            </div>

            <div className="flex-1 p-2 space-y-1.5 overflow-y-auto">
              {TOOLBOX_ITEMS.map((item) => (
                <div
                  key={item.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, item.type)}
                  className={`
                    flex items-center gap-2.5 p-2.5 rounded-lg border cursor-grab active:cursor-grabbing
                    transition-all duration-150
                    ${item.bgClass}
                  `}
                >
                  <GripVertical className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                  <div className={`shrink-0 ${item.colorClass}`}>
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapse toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
      >
        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </div>
  );
}
