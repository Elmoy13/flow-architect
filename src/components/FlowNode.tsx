import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { GitBranch, PlayCircle, CheckCircle2, Zap } from 'lucide-react';

interface FlowNodeData {
  label: string;
  description: string;
  stepType: 'decision' | 'action' | 'start' | 'end';
  options?: Array<{ label: string; next_step: string }>;
  [key: string]: unknown;
}

const FlowNode = memo(({ data }: NodeProps) => {
  const nodeData = data as FlowNodeData;
  const { label, description, stepType, options } = nodeData;

  const getNodeStyle = () => {
    switch (stepType) {
      case 'decision':
        return 'flow-node-decision';
      case 'action':
        return 'flow-node-action';
      case 'start':
      case 'end':
        return 'flow-node-start';
      default:
        return 'flow-node-action';
    }
  };

  const getIcon = () => {
    switch (stepType) {
      case 'decision':
        return <GitBranch className="w-4 h-4" />;
      case 'action':
        return <Zap className="w-4 h-4" />;
      case 'start':
        return <PlayCircle className="w-4 h-4" />;
      case 'end':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const getTypeLabel = () => {
    switch (stepType) {
      case 'decision':
        return 'Decision';
      case 'action':
        return 'Action';
      case 'start':
        return 'Start';
      case 'end':
        return 'End';
      default:
        return 'Step';
    }
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
      <p className="text-xs opacity-80 leading-relaxed">{description}</p>
      
      {options && options.length > 0 && (
        <div className="mt-3 pt-2 border-t border-current/20">
          <p className="text-xs opacity-60 mb-1">Options:</p>
          <div className="flex flex-wrap gap-1">
            {options.map((opt, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-0.5 rounded bg-current/10"
              >
                {opt.label}
              </span>
            ))}
          </div>
        </div>
      )}
      
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
