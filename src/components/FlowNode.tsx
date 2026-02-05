import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { 
  GitBranch, 
  CheckCircle2, 
  Zap, 
  MessageSquare,
  ClipboardList,
  Play
} from 'lucide-react';

interface FlowNodeData {
  label: string;
  stepId: string;
  stepType: 'decision' | 'action' | 'start' | 'end' | 'collect';
  type: string;
  config: Record<string, unknown>;
  [key: string]: unknown;
}

const FlowNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as FlowNodeData;
  const { label, stepId, stepType, type } = nodeData;

  const getNodeStyle = () => {
    const baseStyle = selected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : '';
    switch (stepType) {
      case 'decision':
        return `flow-node-decision ${baseStyle}`;
      case 'collect':
        return `flow-node-collect ${baseStyle}`;
      case 'action':
        return `flow-node-action ${baseStyle}`;
      case 'start':
      case 'end':
        return `flow-node-start ${baseStyle}`;
      default:
        return `flow-node-action ${baseStyle}`;
    }
  };

  const getIcon = () => {
    switch (stepType) {
      case 'decision':
        return <GitBranch className="w-4 h-4" />;
      case 'collect':
        return <MessageSquare className="w-4 h-4" />;
      case 'action':
        return <Zap className="w-4 h-4" />;
      case 'start':
        return <Play className="w-4 h-4" />;
      case 'end':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <ClipboardList className="w-4 h-4" />;
    }
  };

  const getTypeLabel = () => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className={`flow-node ${getNodeStyle()} min-w-[200px] max-w-[280px]`}>
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-primary !border-2 !border-primary-foreground"
      />
      
      <div className="flex items-center gap-2 mb-2">
        {getIcon()}
        <span className="text-xs font-medium uppercase opacity-70">
          {getTypeLabel()}
        </span>
      </div>
      
      <h3 className="font-semibold text-sm mb-1">{label}</h3>
      <p className="text-xs opacity-60 font-mono">{stepId}</p>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-primary !border-2 !border-primary-foreground"
      />
    </div>
  );
});

FlowNode.displayName = 'FlowNode';

export default FlowNode;
