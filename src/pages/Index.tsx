import Header from '@/components/Header';
import FlowBuilder from '@/components/FlowBuilder';
import MainWorkspace from '@/components/MainWorkspace';
import AICopilot from '@/components/AICopilot';

const Index = () => {
  return (
    <div className="h-screen w-screen flex flex-col bg-steel-950 overflow-hidden">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <FlowBuilder />
        <MainWorkspace />
        <AICopilot />
      </div>
    </div>
  );
};

export default Index;
