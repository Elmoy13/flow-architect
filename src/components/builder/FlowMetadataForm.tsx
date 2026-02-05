import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useFlowStore } from '@/store/flowStore';
import { flowMetadataSchema, type FlowMetadataFormData } from '@/lib/validationSchemas';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';

export default function FlowMetadataForm() {
  const { flowData, updateMetadata, setConstant, deleteConstant } = useFlowStore();
  
  const form = useForm<FlowMetadataFormData>({
    resolver: zodResolver(flowMetadataSchema),
    defaultValues: {
      flow_id: flowData.flow_id,
      name: flowData.name,
      version: flowData.version,
      description: flowData.description || '',
    },
  });

  // Sync form with store changes
  useEffect(() => {
    form.reset({
      flow_id: flowData.flow_id,
      name: flowData.name,
      version: flowData.version,
      description: flowData.description || '',
    });
  }, [flowData.flow_id, flowData.name, flowData.version, flowData.description]);

  const onSubmit = (data: FlowMetadataFormData) => {
    updateMetadata(data);
  };

  const handleAddConstant = () => {
    const key = `new_constant_${Date.now()}`;
    setConstant(key, '');
  };

  const handleConstantKeyChange = (oldKey: string, newKey: string, value: string | number | boolean) => {
    if (oldKey !== newKey) {
      deleteConstant(oldKey);
      setConstant(newKey, value);
    }
  };

  const handleConstantValueChange = (key: string, value: string) => {
    // Try to parse as number
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setConstant(key, numValue);
    } else if (value === 'true') {
      setConstant(key, true);
    } else if (value === 'false') {
      setConstant(key, false);
    } else {
      setConstant(key, value);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onBlur={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="flow_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Flow ID</FormLabel>
                <FormControl>
                  <Input placeholder="my_flow_id" {...field} className="font-mono" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="My Workflow" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="version"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Version</FormLabel>
                <FormControl>
                  <Input placeholder="1.0.0" {...field} className="font-mono" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe the purpose of this flow..."
                    className="resize-none"
                    rows={3}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>

      {/* Constants Editor */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Constants</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddConstant}
            className="gap-1"
          >
            <Plus className="w-3 h-3" />
            Add
          </Button>
        </div>

        <div className="space-y-2">
          {flowData.constants && Object.entries(flowData.constants).map(([key, value]) => (
            <div key={key} className="flex gap-2 items-center">
              <Input
                defaultValue={key}
                placeholder="key"
                className="font-mono text-xs flex-1"
                onBlur={(e) => handleConstantKeyChange(key, e.target.value, value)}
              />
              <Input
                defaultValue={String(value)}
                placeholder="value"
                className="font-mono text-xs flex-1"
                onBlur={(e) => handleConstantValueChange(key, e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                onClick={() => deleteConstant(key)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          {(!flowData.constants || Object.keys(flowData.constants).length === 0) && (
            <p className="text-xs text-muted-foreground italic text-center py-2">
              No constants defined
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
