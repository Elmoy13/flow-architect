import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFlowStore } from '@/store/flowStore';
import { FileText, Layers } from 'lucide-react';
import FlowMetadataForm from './builder/FlowMetadataForm';
import StepConstructor from './builder/StepConstructor';

export default function FlowBuilder() {
  const { builderTab, setBuilderTab } = useFlowStore();

  return (
    <div className="w-[400px] h-full glass-panel border-r border-border flex flex-col">
      <Tabs value={builderTab} onValueChange={(v) => setBuilderTab(v as 'metadata' | 'steps')} className="flex flex-col h-full">
        <div className="border-b border-border p-2">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="metadata" className="gap-2">
              <FileText className="w-4 h-4" />
              Metadata
            </TabsTrigger>
            <TabsTrigger value="steps" className="gap-2">
              <Layers className="w-4 h-4" />
              Steps
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="metadata" className="flex-1 overflow-y-auto m-0 p-4">
          <FlowMetadataForm />
        </TabsContent>
        
        <TabsContent value="steps" className="flex-1 overflow-hidden m-0 flex flex-col">
          <StepConstructor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
