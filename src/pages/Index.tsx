import { useCallback } from 'react';
import Header from '@/components/Header';
import FlowToolbox from '@/components/FlowToolbox';
import MainWorkspace from '@/components/MainWorkspace';
import NodeInspector from '@/components/NodeInspector';
import AICopilot from '@/components/AICopilot';
import { useFlowStore, StepType } from '@/store/flowStore';

const Index = () => {
  const { selectedStepId } = useFlowStore();

  const handleDragStart = useCallback((event: React.DragEvent, nodeType: StepType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-steel-950 overflow-hidden">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Toolbox Palette */}
        <FlowToolbox onDragStart={handleDragStart} />
        
        {/* Center: Canvas + Tabs */}
        <MainWorkspace />
        
        {/* Right: Inspector or AI Copilot */}
        {selectedStepId ? <NodeInspector /> : <AICopilot />}
      </div>
    </div>
  );
};

export default Index;
