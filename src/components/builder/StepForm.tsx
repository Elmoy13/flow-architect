import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useFlowStore, FlowStep, StepType } from '@/store/flowStore';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

interface StepFormProps {
  stepId: string;
}

const STEP_TYPES: { value: StepType; label: string }[] = [
  { value: 'collect_information', label: 'Collect Information' },
  { value: 'evaluate_condition', label: 'Evaluate Condition' },
  { value: 'decision_point', label: 'Decision Point' },
  { value: 'provide_instructions', label: 'Provide Instructions' },
  { value: 'execute_action', label: 'Execute Action' },
];

const OPERATORS = ['==', '!=', '<', '>', '<=', '>=', 'contains', 'startsWith'];
const VALIDATION_TYPES = ['text', 'number', 'email', 'choice', 'regex'];

export default function StepForm({ stepId }: StepFormProps) {
  const { flowData, updateStep, getStepIds } = useFlowStore();
  const step = flowData.steps[stepId];
  const allStepIds = getStepIds();

  const { register, watch, setValue, reset } = useForm({
    defaultValues: {
      step_id: step?.step_id || '',
      name: step?.name || '',
      type: step?.type || 'provide_instructions',
      next_step: step?.next_step || '',
      config: step?.config || {},
    },
  });

  useEffect(() => {
    if (step) {
      reset({
        step_id: step.step_id,
        name: step.name,
        type: step.type,
        next_step: step.next_step || '',
        config: step.config,
      });
    }
  }, [step, reset]);

  const currentType = watch('type') as StepType;

  const handleFieldChange = (field: keyof FlowStep, value: unknown) => {
    updateStep(stepId, { [field]: value });
  };

  const handleConfigChange = (configField: string, value: unknown) => {
    const newConfig = { ...step.config, [configField]: value };
    updateStep(stepId, { config: newConfig });
  };

  const handleTypeChange = (newType: StepType) => {
    // Reset config when type changes
    let newConfig = {};
    switch (newType) {
      case 'collect_information':
        newConfig = { prompt: '', field_name: '', validation: { type: 'text' } };
        break;
      case 'evaluate_condition':
        newConfig = { conditions: [{ field: '', operator: '==', value: '', next_step: '' }], default_next_step: '' };
        break;
      case 'decision_point':
        newConfig = { prompt: '', options: [{ label: '', value: '', next_step: '' }] };
        break;
      case 'provide_instructions':
        newConfig = { instructions_text: '', confirmation_required: false };
        break;
      case 'execute_action':
        newConfig = { action_type: '', action_params: {} };
        break;
    }
    updateStep(stepId, { type: newType, config: newConfig });
  };

  if (!step) return null;

  return (
    <div className="space-y-4">
      {/* Base fields */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Step ID</Label>
          <Input
            {...register('step_id')}
            className="font-mono text-xs"
            onBlur={(e) => handleFieldChange('step_id', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Name</Label>
          <Input
            {...register('name')}
            className="text-xs"
            onBlur={(e) => handleFieldChange('name', e.target.value)}
          />
        </div>
      </div>

      {/* Type selector */}
      <div className="space-y-1.5">
        <Label className="text-xs">Type</Label>
        <Select value={currentType} onValueChange={handleTypeChange}>
          <SelectTrigger className="text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STEP_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value} className="text-xs">
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Type-specific config forms */}
      {currentType === 'collect_information' && (
        <CollectInformationConfig step={step} onConfigChange={handleConfigChange} />
      )}

      {currentType === 'evaluate_condition' && (
        <EvaluateConditionConfig step={step} onConfigChange={handleConfigChange} allStepIds={allStepIds} />
      )}

      {currentType === 'decision_point' && (
        <DecisionPointConfig step={step} onConfigChange={handleConfigChange} allStepIds={allStepIds} />
      )}

      {currentType === 'provide_instructions' && (
        <ProvideInstructionsConfig step={step} onConfigChange={handleConfigChange} />
      )}

      {currentType === 'execute_action' && (
        <ExecuteActionConfig step={step} onConfigChange={handleConfigChange} />
      )}

      {/* Next step (for non-branching types) */}
      {!['evaluate_condition', 'decision_point'].includes(currentType) && (
        <div className="space-y-1.5">
          <Label className="text-xs">Next Step</Label>
          <Select
            value={step.next_step || '__END__'}
            onValueChange={(v) => handleFieldChange('next_step', v === '__END__' ? undefined : v)}
          >
            <SelectTrigger className="text-xs font-mono">
              <SelectValue placeholder="(End of flow)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__END__" className="text-xs">(End of flow)</SelectItem>
              {allStepIds.filter(id => id !== stepId).map((id) => (
                <SelectItem key={id} value={id} className="text-xs font-mono">
                  {id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

// Config forms for each step type

function CollectInformationConfig({ step, onConfigChange }: { step: FlowStep; onConfigChange: (field: string, value: unknown) => void }) {
  const config = step.config;

  return (
    <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
      <div className="space-y-1.5">
        <Label className="text-xs">Prompt</Label>
        <Textarea
          value={config.prompt || ''}
          onChange={(e) => onConfigChange('prompt', e.target.value)}
          className="text-xs resize-none"
          rows={2}
          placeholder="What information to collect?"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Field Name</Label>
        <Input
          value={config.field_name || ''}
          onChange={(e) => onConfigChange('field_name', e.target.value)}
          className="font-mono text-xs"
          placeholder="field_name"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Validation Type</Label>
        <Select
          value={config.validation?.type || 'text'}
          onValueChange={(v) => onConfigChange('validation', { ...config.validation, type: v })}
        >
          <SelectTrigger className="text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VALIDATION_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {config.validation?.type === 'choice' && (
        <div className="space-y-1.5">
          <Label className="text-xs">Options (comma-separated)</Label>
          <Input
            value={config.validation?.options?.join(', ') || ''}
            onChange={(e) => onConfigChange('validation', {
              ...config.validation,
              options: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
            })}
            className="text-xs"
            placeholder="option1, option2, option3"
          />
        </div>
      )}
    </div>
  );
}

function EvaluateConditionConfig({ step, onConfigChange, allStepIds }: { step: FlowStep; onConfigChange: (field: string, value: unknown) => void; allStepIds: string[] }) {
  const conditions = step.config.conditions || [];

  const addCondition = () => {
    const newConditions = [...conditions, { field: '', operator: '==' as const, value: '', next_step: '' }];
    onConfigChange('conditions', newConditions);
  };

  const updateCondition = (index: number, field: string, value: unknown) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    onConfigChange('conditions', newConditions);
  };

  const removeCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    onConfigChange('conditions', newConditions);
  };

  return (
    <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Conditions</Label>
        <Button type="button" variant="outline" size="sm" onClick={addCondition} className="h-6 text-xs gap-1">
          <Plus className="w-3 h-3" /> Add
        </Button>
      </div>

      {conditions.map((condition, index) => (
        <div key={index} className="space-y-2 p-2 bg-background/50 rounded border">
          <div className="grid grid-cols-3 gap-2">
            <Input
              value={condition.field || ''}
              onChange={(e) => updateCondition(index, 'field', e.target.value)}
              className="font-mono text-xs"
              placeholder="field"
            />
            <Select
              value={condition.operator || '=='}
              onValueChange={(v) => updateCondition(index, 'operator', v)}
            >
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPERATORS.map((op) => (
                  <SelectItem key={op} value={op} className="text-xs font-mono">{op}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={String(condition.value || '')}
              onChange={(e) => updateCondition(index, 'value', e.target.value)}
              className="text-xs"
              placeholder="value"
            />
          </div>
          <div className="flex gap-2 items-center">
            <Select
              value={condition.next_step || ''}
              onValueChange={(v) => updateCondition(index, 'next_step', v)}
            >
              <SelectTrigger className="text-xs font-mono flex-1">
                <SelectValue placeholder="Next step..." />
              </SelectTrigger>
              <SelectContent>
                {allStepIds.filter(id => id !== step.step_id).map((id) => (
                  <SelectItem key={id} value={id} className="text-xs font-mono">{id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={() => removeCondition(index)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ))}

      <div className="space-y-1.5">
        <Label className="text-xs">Default Next Step</Label>
        <Select
          value={step.config.default_next_step || '__NONE__'}
          onValueChange={(v) => onConfigChange('default_next_step', v === '__NONE__' ? undefined : v)}
        >
          <SelectTrigger className="text-xs font-mono">
            <SelectValue placeholder="(None)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__NONE__" className="text-xs">(None)</SelectItem>
            {allStepIds.filter(id => id !== step.step_id).map((id) => (
              <SelectItem key={id} value={id} className="text-xs font-mono">{id}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function DecisionPointConfig({ step, onConfigChange, allStepIds }: { step: FlowStep; onConfigChange: (field: string, value: unknown) => void; allStepIds: string[] }) {
  const options = step.config.options || [];

  const addOption = () => {
    const newOptions = [...options, { label: '', value: '', next_step: '' }];
    onConfigChange('options', newOptions);
  };

  const updateOption = (index: number, field: string, value: unknown) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    onConfigChange('options', newOptions);
  };

  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    onConfigChange('options', newOptions);
  };

  return (
    <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
      <div className="space-y-1.5">
        <Label className="text-xs">Prompt</Label>
        <Textarea
          value={step.config.prompt || ''}
          onChange={(e) => onConfigChange('prompt', e.target.value)}
          className="text-xs resize-none"
          rows={2}
          placeholder="What should the user decide?"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-xs">Options</Label>
        <Button type="button" variant="outline" size="sm" onClick={addOption} className="h-6 text-xs gap-1">
          <Plus className="w-3 h-3" /> Add
        </Button>
      </div>

      {options.map((option, index) => (
        <div key={index} className="space-y-2 p-2 bg-background/50 rounded border">
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={option.label || ''}
              onChange={(e) => updateOption(index, 'label', e.target.value)}
              className="text-xs"
              placeholder="Label"
            />
            <Input
              value={option.value || ''}
              onChange={(e) => updateOption(index, 'value', e.target.value)}
              className="font-mono text-xs"
              placeholder="value"
            />
          </div>
          <div className="flex gap-2 items-center">
            <Select
              value={option.next_step || ''}
              onValueChange={(v) => updateOption(index, 'next_step', v)}
            >
              <SelectTrigger className="text-xs font-mono flex-1">
                <SelectValue placeholder="Next step..." />
              </SelectTrigger>
              <SelectContent>
                {allStepIds.filter(id => id !== step.step_id).map((id) => (
                  <SelectItem key={id} value={id} className="text-xs font-mono">{id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={() => removeOption(index)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProvideInstructionsConfig({ step, onConfigChange }: { step: FlowStep; onConfigChange: (field: string, value: unknown) => void }) {
  return (
    <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
      <div className="space-y-1.5">
        <Label className="text-xs">Instructions</Label>
        <Textarea
          value={step.config.instructions_text || ''}
          onChange={(e) => onConfigChange('instructions_text', e.target.value)}
          className="text-xs resize-none"
          rows={3}
          placeholder="Enter instructions for the agent..."
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id={`confirmation-${step.step_id}`}
          checked={step.config.confirmation_required || false}
          onCheckedChange={(checked) => onConfigChange('confirmation_required', checked)}
        />
        <Label htmlFor={`confirmation-${step.step_id}`} className="text-xs">
          Require confirmation
        </Label>
      </div>
    </div>
  );
}

function ExecuteActionConfig({ step, onConfigChange }: { step: FlowStep; onConfigChange: (field: string, value: unknown) => void }) {
  return (
    <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
      <div className="space-y-1.5">
        <Label className="text-xs">Action Type</Label>
        <Input
          value={step.config.action_type || ''}
          onChange={(e) => onConfigChange('action_type', e.target.value)}
          className="font-mono text-xs"
          placeholder="close_case"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Parameters (JSON)</Label>
        <Textarea
          value={step.config.action_params ? JSON.stringify(step.config.action_params, null, 2) : ''}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value || '{}');
              onConfigChange('action_params', parsed);
            } catch {
              // Invalid JSON, don't update
            }
          }}
          className="font-mono text-xs resize-none"
          rows={3}
          placeholder="{}"
        />
      </div>
    </div>
  );
}
