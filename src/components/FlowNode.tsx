import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  GitBranch,
  CheckCircle2,
  Zap,
  MessageSquare,
  ClipboardList,
  Play,
  AlertTriangle,
  GitMerge,
  Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FlowNodeData {
  label: string;
  stepId: string;
  stepType: 'decision' | 'action' | 'start' | 'end' | 'collect' | 'condition';
  type: string;
  config: Record<string, unknown>;
  configSummary?: string;
  hasWarning?: boolean;
  isConfigured?: boolean;
  [key: string]: unknown;
}

const FlowNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as FlowNodeData;
  const { label, stepId, stepType, type, config, configSummary, hasWarning, isConfigured } = nodeData;

  // Determine if node is properly configured
  const configured = isConfigured ?? isNodeConfigured(type, config);

  const getNodeColors = () => {
    switch (stepType) {
      case 'decision':
        return {
          bg: 'bg-gradient-to-br from-orange-500/10 to-orange-600/10',
          border: selected ? 'border-orange-400 ring-2 ring-orange-400/50' : 'border-orange-500/50',
          icon: 'bg-orange-500/20 text-orange-300',
          badge: 'bg-orange-500 text-white',
          glow: 'shadow-orange-500/20',
        };
      case 'collect':
        return {
          bg: 'bg-gradient-to-br from-purple-500/10 to-purple-600/10',
          border: selected ? 'border-purple-400 ring-2 ring-purple-400/50' : 'border-purple-500/50',
          icon: 'bg-purple-500/20 text-purple-300',
          badge: 'bg-purple-500 text-white',
          glow: 'shadow-purple-500/20',
        };
      case 'condition':
        return {
          bg: 'bg-gradient-to-br from-amber-500/10 to-amber-600/10',
          border: selected ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-amber-500/50',
          icon: 'bg-amber-500/20 text-amber-300',
          badge: 'bg-amber-500 text-white',
          glow: 'shadow-amber-500/20',
        };
      case 'action':
        return {
          bg: 'bg-gradient-to-br from-blue-500/10 to-blue-600/10',
          border: selected ? 'border-blue-400 ring-2 ring-blue-400/50' : 'border-blue-500/50',
          icon: 'bg-blue-500/20 text-blue-300',
          badge: 'bg-blue-500 text-white',
          glow: 'shadow-blue-500/20',
        };
      case 'start':
        return {
          bg: 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/10',
          border: selected ? 'border-emerald-400 ring-2 ring-emerald-400/50' : 'border-emerald-500/50',
          icon: 'bg-emerald-500/20 text-emerald-300',
          badge: 'bg-emerald-500 text-white',
          glow: 'shadow-emerald-500/20',
        };
      case 'end':
        return {
          bg: 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/10',
          border: selected ? 'border-emerald-400 ring-2 ring-emerald-400/50' : 'border-emerald-500/50',
          icon: 'bg-emerald-500/20 text-emerald-300',
          badge: 'bg-emerald-500 text-white',
          glow: 'shadow-emerald-500/20',
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-slate-500/10 to-slate-600/10',
          border: selected ? 'border-slate-400 ring-2 ring-slate-400/50' : 'border-slate-500/50',
          icon: 'bg-slate-500/20 text-slate-300',
          badge: 'bg-slate-500 text-white',
          glow: 'shadow-slate-500/20',
        };
    }
  };

  const getIcon = () => {
    const iconClass = "w-6 h-6"; // Larger icons
    switch (stepType) {
      case 'decision': return <GitBranch className={iconClass} />;
      case 'collect': return <MessageSquare className={iconClass} />;
      case 'condition': return <GitMerge className={iconClass} />;
      case 'action': return <Zap className={iconClass} />;
      case 'start': return <Play className={iconClass} />;
      case 'end': return <CheckCircle2 className={iconClass} />;
      default: return <ClipboardList className={iconClass} />;
    }
  };

  const getTypeLabel = () => {
    const labelMap: Record<string, string> = {
      'collect_information': 'Ask User',
      'decision_point': 'User Choice',
      'evaluate_condition': 'If Condition',
      'provide_instructions': 'Show Instructions',
      'execute_action': 'Run Action',
    };
    return labelMap[type] || type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const getSummary = (): string => {
    if (configSummary) return configSummary;
    const c = config as Record<string, any>;
    if (c?.prompt) return c.prompt.length > 50 ? c.prompt.substring(0, 50) + '...' : c.prompt;
    if (c?.instructions_text) return c.instructions_text.length > 50 ? c.instructions_text.substring(0, 50) + '...' : c.instructions_text;
    if (c?.field_name) return `Input: ${c.field_name}`;
    if (c?.action_type) return `Action: ${c.action_type}`;
    if (c?.conditions?.length) return `${c.conditions.length} condition(s)`;
    if (c?.options?.length) return `${c.options.length} option(s)`;
    return '';
  };

  const getStatusBadge = () => {
    if (hasWarning) {
      return (
        <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-500 border-2 border-background flex items-center justify-center shadow-lg">
          <AlertTriangle className="w-3 h-3 text-white" />
        </div>
      );
    }

    if (configured) {
      return (
        <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center shadow-lg">
          <CheckCircle2 className="w-3 h-3 text-white" />
        </div>
      );
    }

    return (
      <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-steel-600 border-2 border-background flex items-center justify-center shadow-lg">
        <Circle className="w-2.5 h-2.5 text-steel-300 fill-current" />
      </div>
    );
  };

  const colors = getNodeColors();
  const summary = getSummary();

  return (
    <div className="relative">
      <div
        className={cn(
          'relative',
          colors.bg,
          colors.border,
          colors.glow,
          'min-w-[260px] max-w-[320px]',
          'rounded-xl border-2 shadow-2xl backdrop-blur-md',
          'transition-all duration-200',
          'hover:shadow-2xl hover:scale-[1.03]',
          'cursor-pointer',
          'group'
        )}
      >
        {/* Target Handle */}
        <Handle
          type="target"
          position={Position.Top}
          className="!w-4 !h-4 !bg-primary !border-2 !border-background !-top-2 transition-all group-hover:!w-5 group-hover:!h-5"
        />

        {/* Status Badge */}
        {getStatusBadge()}

        {/* Header with Icon */}
        <div className="flex items-start gap-3 px-4 pt-4 pb-2">
          <div className={cn('p-2 rounded-lg shrink-0', colors.icon)}>
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="font-semibold text-sm text-foreground leading-tight mb-1">
              {label}
            </h3>
            <span className={cn(
              'inline-block text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full',
              colors.badge
            )}>
              {getTypeLabel()}
            </span>
          </div>
        </div>

        {/* Summary/Description */}
        {summary && (
          <div className="px-4 py-2">
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {summary}
            </p>
          </div>
        )}

        {/* Footer with Step ID */}
        <div className="px-4 pb-3 pt-2 border-t border-border/20 mt-1">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground/70 font-mono truncate flex-1">
              {stepId}
            </p>
            {!configured && !hasWarning && (
              <span className="text-[9px] text-amber-400/80 uppercase tracking-wide font-medium ml-2">
                Setup
              </span>
            )}
          </div>
        </div>

        {/* Source Handle */}
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-4 !h-4 !bg-primary !border-2 !border-background !-bottom-2 transition-all group-hover:!w-5 group-hover:!h-5"
        />
      </div>
    </div>
  );
});

FlowNode.displayName = 'FlowNode';

export default FlowNode;

// Helper function to determine if a node is configured
function isNodeConfigured(type: string, config: Record<string, unknown>): boolean {
  const c = config as Record<string, any>;

  switch (type) {
    case 'collect_information':
      return !!(c?.prompt && c?.field_name);
    case 'decision_point':
      return !!(c?.prompt && c?.options && c.options.length > 0);
    case 'evaluate_condition':
      return !!(c?.conditions && c.conditions.length > 0);
    case 'provide_instructions':
      return !!c?.instructions_text;
    case 'execute_action':
      return !!c?.action_type;
    default:
      return false;
  }
}
