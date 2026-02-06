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
} from 'lucide-react';

interface FlowNodeData {
  label: string;
  stepId: string;
  stepType: 'decision' | 'action' | 'start' | 'end' | 'collect';
  type: string;
  config: Record<string, unknown>;
  configSummary?: string;
  hasWarning?: boolean;
  [key: string]: unknown;
}

const FlowNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as FlowNodeData;
  const { label, stepId, stepType, type, config, configSummary, hasWarning } = nodeData;

  const getNodeColors = () => {
    switch (stepType) {
      case 'decision':
        return {
          bg: 'bg-orange-500/10',
          border: selected ? 'border-orange-400 ring-2 ring-orange-400/30' : 'border-orange-500/40',
          icon: 'bg-orange-500/20 text-orange-400',
          badge: 'bg-orange-500/20 text-orange-300',
        };
      case 'collect':
        return {
          bg: 'bg-purple-500/10',
          border: selected ? 'border-purple-400 ring-2 ring-purple-400/30' : 'border-purple-500/40',
          icon: 'bg-purple-500/20 text-purple-400',
          badge: 'bg-purple-500/20 text-purple-300',
        };
      case 'action':
        return {
          bg: 'bg-blue-500/10',
          border: selected ? 'border-blue-400 ring-2 ring-blue-400/30' : 'border-blue-500/40',
          icon: 'bg-blue-500/20 text-blue-400',
          badge: 'bg-blue-500/20 text-blue-300',
        };
      case 'start':
        return {
          bg: 'bg-emerald-500/10',
          border: selected ? 'border-emerald-400 ring-2 ring-emerald-400/30' : 'border-emerald-500/40',
          icon: 'bg-emerald-500/20 text-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300',
        };
      case 'end':
        return {
          bg: 'bg-emerald-500/10',
          border: selected ? 'border-emerald-400 ring-2 ring-emerald-400/30' : 'border-emerald-500/40',
          icon: 'bg-emerald-500/20 text-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300',
        };
      default:
        return {
          bg: 'bg-slate-500/10',
          border: selected ? 'border-slate-400 ring-2 ring-slate-400/30' : 'border-slate-500/40',
          icon: 'bg-slate-500/20 text-slate-400',
          badge: 'bg-slate-500/20 text-slate-300',
        };
    }
  };

  const getIcon = () => {
    switch (stepType) {
      case 'decision': return <GitBranch className="w-4 h-4" />;
      case 'collect': return <MessageSquare className="w-4 h-4" />;
      case 'action': return <Zap className="w-4 h-4" />;
      case 'start': return <Play className="w-4 h-4" />;
      case 'end': return <CheckCircle2 className="w-4 h-4" />;
      default: return <ClipboardList className="w-4 h-4" />;
    }
  };

  const getTypeLabel = () => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const getSummary = (): string => {
    if (configSummary) return configSummary;
    const c = config as Record<string, any>;
    if (c?.prompt) return c.prompt.length > 60 ? c.prompt.substring(0, 60) + '...' : c.prompt;
    if (c?.instructions_text) return c.instructions_text.length > 60 ? c.instructions_text.substring(0, 60) + '...' : c.instructions_text;
    if (c?.field_name) return `Input: ${c.field_name}`;
    if (c?.action_type) return `Action: ${c.action_type}`;
    if (c?.conditions?.length) return `${c.conditions.length} condition(s)`;
    if (c?.options?.length) return `${c.options.length} option(s)`;
    return '';
  };

  const colors = getNodeColors();
  const summary = getSummary();

  return (
    <div
      className={`
        ${colors.bg} ${colors.border}
        min-w-[220px] max-w-[280px]
        rounded-xl border-2 shadow-xl backdrop-blur-md
        transition-all duration-200
        hover:shadow-2xl hover:scale-[1.02]
        cursor-pointer
      `}
    >
      {/* Target Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background !-top-1.5"
      />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-1">
        <div className={`p-1.5 rounded-lg ${colors.icon}`}>
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground truncate">{label}</h3>
        </div>
        {hasWarning && (
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        )}
      </div>

      {/* Badge */}
      <div className="px-3 py-1">
        <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full ${colors.badge}`}>
          {getTypeLabel()}
        </span>
      </div>

      {/* Summary */}
      {summary && (
        <div className="px-3 pb-2">
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{summary}</p>
        </div>
      )}

      {/* Footer with Step ID */}
      <div className="px-3 pb-2.5 pt-1 border-t border-border/30">
        <p className="text-[10px] text-muted-foreground font-mono truncate">{stepId}</p>
      </div>

      {/* Source Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background !-bottom-1.5"
      />
    </div>
  );
});

FlowNode.displayName = 'FlowNode';

export default FlowNode;
