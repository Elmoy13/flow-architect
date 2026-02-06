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
  Search,
  ChevronDown,
  ChevronUp,
  Play,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { StepType } from '@/store/flowStore';

interface ToolboxItem {
  type: StepType;
  label: string;
  description: string;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  category: string;
}

const TOOLBOX_ITEMS: ToolboxItem[] = [
  {
    type: 'collect_information',
    label: 'Ask User',
    description: 'Collect data from user',
    icon: <MessageSquare className="w-5 h-5" />,
    colorClass: 'text-purple-400',
    bgClass: 'bg-purple-500/15 border-purple-500/30 hover:border-purple-400/50 hover:bg-purple-500/25',
    category: 'Data',
  },
  {
    type: 'decision_point',
    label: 'User Choice',
    description: 'Present options to user',
    icon: <GitBranch className="w-5 h-5" />,
    colorClass: 'text-orange-400',
    bgClass: 'bg-orange-500/15 border-orange-500/30 hover:border-orange-400/50 hover:bg-orange-500/25',
    category: 'Logic',
  },
  {
    type: 'evaluate_condition',
    label: 'If Condition',
    description: 'Evaluate rules automatically',
    icon: <GitMerge className="w-5 h-5" />,
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-500/15 border-amber-500/30 hover:border-amber-400/50 hover:bg-amber-500/25',
    category: 'Logic',
  },
  {
    type: 'provide_instructions',
    label: 'Show Instructions',
    description: 'Display guidance',
    icon: <ClipboardList className="w-5 h-5" />,
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-500/15 border-blue-500/30 hover:border-blue-400/50 hover:bg-blue-500/25',
    category: 'Actions',
  },
  {
    type: 'execute_action',
    label: 'Run Action',
    description: 'Execute an operation',
    icon: <Zap className="w-5 h-5" />,
    colorClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/15 border-emerald-500/30 hover:border-emerald-400/50 hover:bg-emerald-500/25',
    category: 'Actions',
  },
];

const CATEGORY_INFO = {
  Triggers: { icon: <Play className="w-4 h-4" />, color: 'text-green-400' },
  Data: { icon: <MessageSquare className="w-4 h-4" />, color: 'text-purple-400' },
  Logic: { icon: <GitBranch className="w-4 h-4" />, color: 'text-orange-400' },
  Actions: { icon: <Zap className="w-4 h-4" />, color: 'text-blue-400' },
};

interface FlowToolboxProps {
  onDragStart: (event: React.DragEvent, nodeType: StepType) => void;
}

export default function FlowToolbox({ onDragStart }: FlowToolboxProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const filteredItems = TOOLBOX_ITEMS.filter(
    (item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ToolboxItem[]>);

  return (
    <div className="relative flex">
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 240, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full glass-panel border-r border-border flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-3 border-b border-border">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Node Library
              </h3>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search nodes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 text-xs pl-8 bg-steel-900 border-border/50"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="flex-1 overflow-y-auto">
              {Object.entries(groupedItems).map(([category, items]) => {
                const categoryInfo = CATEGORY_INFO[category as keyof typeof CATEGORY_INFO];
                const isCategoryCollapsed = collapsedCategories.has(category);

                return (
                  <div key={category} className="border-b border-border/30 last:border-b-0">
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full px-3 py-2 flex items-center justify-between hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className={categoryInfo?.color || 'text-muted-foreground'}>
                          {categoryInfo?.icon}
                        </div>
                        <span className="text-xs font-medium text-foreground">{category}</span>
                        <span className="text-[10px] text-muted-foreground">({items.length})</span>
                      </div>
                      {isCategoryCollapsed ? (
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </button>

                    {/* Category Items */}
                    <AnimatePresence initial={false}>
                      {!isCategoryCollapsed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden"
                        >
                          <div className="p-2 space-y-1.5">
                            {items.map((item) => (
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
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-medium text-foreground">{item.label}</p>
                                  <p className="text-[10px] text-muted-foreground truncate">
                                    {item.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {/* No results */}
              {Object.keys(groupedItems).length === 0 && (
                <div className="p-6 text-center">
                  <p className="text-xs text-muted-foreground">No nodes found</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    Try a different search term
                  </p>
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="p-2 border-t border-border/30 bg-muted/20">
              <p className="text-[10px] text-muted-foreground text-center">
                💡 Drag nodes onto canvas
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapse toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors shadow-lg"
        title={isCollapsed ? 'Show Toolbox' : 'Hide Toolbox'}
      >
        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </div>
  );
}
