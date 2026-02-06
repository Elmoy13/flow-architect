import { useState, useEffect } from 'react';
import { useFlowStore } from '@/store/flowStore';
import Header from '@/components/Header';
import FlowToolbox from '@/components/FlowToolbox';
import MainWorkspace from '@/components/MainWorkspace';
import NodeInspector from '@/components/NodeInspector';
import AICopilot from '@/components/AICopilot';
import WelcomeModal from '@/components/WelcomeModal';
import { StepType } from '@/store/flowStore';

const Index = () => {
  const { selectedStepId, flowData } = useFlowStore();
  const [showWelcome, setShowWelcome] = useState(false);

  // Show welcome modal if no steps exist
  useEffect(() => {
    const hasSteps = Object.keys(flowData.steps).length > 0;
    if (!hasSteps) {
      // Small delay to avoid flash
      const timer = setTimeout(() => setShowWelcome(true), 500);
      return () => clearTimeout(timer);
    } else {
      setShowWelcome(false);
    }
  }, [flowData.steps]);

  const handleDragStart = (event: React.DragEvent, nodeType: StepType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

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

      {/* Welcome Modal */}
      <WelcomeModal isOpen={showWelcome} onClose={() => setShowWelcome(false)} />
    </div>
  );
};

export default Index;
