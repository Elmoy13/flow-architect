import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import FlowBuilder from '@/components/FlowBuilder';
import MainWorkspace from '@/components/MainWorkspace';
import AICopilot from '@/components/AICopilot';
import { useFlowStore } from '@/store/flowStore';

const Index = () => {
  const { leftPanelMode } = useFlowStore();

  return (
    <div className="h-screen w-screen flex flex-col bg-steel-950 overflow-hidden">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        {leftPanelMode === 'upload' ? <Sidebar /> : <FlowBuilder />}
        <MainWorkspace />
        <AICopilot />
      </div>
    </div>
  );
};

export default Index;
