import { useState } from 'react';
import { useFlowStore, FlowStep, StepType } from '@/store/flowStore';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Plus, 
  Trash2, 
  AlertTriangle,
  GitBranch,
  MessageSquare,
  Zap,
  ClipboardList,
  Play
} from 'lucide-react';
import { cn } from '@/lib/utils';
import StepForm from './StepForm';

const STEP_TYPE_INFO: Record<StepType, { icon: React.ElementType; label: string; color: string }> = {
  collect_information: { icon: MessageSquare, label: 'Collect Info', color: 'text-purple-400' },
  evaluate_condition: { icon: GitBranch, label: 'Evaluate', color: 'text-orange-400' },
  decision_point: { icon: GitBranch, label: 'Decision', color: 'text-amber-400' },
  provide_instructions: { icon: ClipboardList, label: 'Instructions', color: 'text-blue-400' },
  execute_action: { icon: Zap, label: 'Action', color: 'text-green-400' },
};

export default function StepConstructor() {
  const { flowData, addStep, deleteStep, selectedStepId, setSelectedStepId, getOrphanSteps } = useFlowStore();
  const [expandedStep, setExpandedStep] = useState<string | undefined>(selectedStepId || undefined);
  
  const stepIds = Object.keys(flowData.steps);
  const orphanSteps = getOrphanSteps();

  const handleAddStep = () => {
    const newStepId = `step_${Date.now()}`;
    const newStep: FlowStep = {
      step_id: newStepId,
      name: 'New Step',
      type: 'provide_instructions',
      config: {
        instructions_text: '',
        confirmation_required: false,
      },
    };
    addStep(newStep);
    setExpandedStep(newStepId);
    setSelectedStepId(newStepId);
  };

  const handleDeleteStep = (stepId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteStep(stepId);
  };

  const handleAccordionChange = (value: string) => {
    setExpandedStep(value);
    setSelectedStepId(value || null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{stepIds.length} Steps</h3>
          {orphanSteps.length > 0 && (
            <p className="text-xs text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {orphanSteps.length} orphan step(s)
            </p>
          )}
        </div>
        <Button onClick={handleAddStep} size="sm" className="gap-1">
          <Plus className="w-4 h-4" />
          Add Step
        </Button>
      </div>

      {/* Step List */}
      <ScrollArea className="flex-1">
        <Accordion
          type="single"
          collapsible
          value={expandedStep}
          onValueChange={handleAccordionChange}
          className="px-4 py-2"
        >
          {stepIds.map((stepId, index) => {
            const step = flowData.steps[stepId];
            if (!step) return null;
            
            const typeInfo = STEP_TYPE_INFO[step.type];
            const Icon = typeInfo?.icon || Play;
            const isOrphan = orphanSteps.includes(stepId);

            return (
              <AccordionItem
                key={stepId}
                value={stepId}
                className={cn(
                  'border rounded-lg mb-2 overflow-hidden',
                  isOrphan && 'border-amber-500/50 bg-amber-500/5',
                  selectedStepId === stepId && 'ring-2 ring-primary'
                )}
              >
                <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-muted/50">
                  <div className="flex items-center gap-3 flex-1 text-left">
                    <span className="text-xs text-muted-foreground font-mono w-6">
                      {index + 1}
                    </span>
                    <Icon className={cn('w-4 h-4 shrink-0', typeInfo?.color)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{step.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{step.step_id}</p>
                    </div>
                    {isOrphan && (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDeleteStep(stepId, e)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <StepForm stepId={stepId} />
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {stepIds.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Zap className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-sm">No steps yet</p>
            <p className="text-xs mt-1">Click "Add Step" to start building</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
