import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings2, Code2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFlowStore, FlowStep, StepType } from '@/store/flowStore';

const STEP_EXAMPLES: Record<StepType, string> = {
  collect_information: `Este paso solicita información al usuario.
  
Ejemplo: "Por favor, proporcione su número de cuenta"

El agente muestra el prompt configurado y 
espera la respuesta del cliente. La respuesta
se guarda en el campo especificado para uso
posterior en el flujo.`,
  decision_point: `Este paso presenta opciones al usuario.

Ejemplo: "¿Desea continuar con el plan A o B?"

Se muestran las opciones configuradas como
botones o lista. Cada opción lleva a un
paso diferente del flujo.`,
  evaluate_condition: `Este paso evalúa condiciones automáticamente.

Ejemplo: Si RSSI < -65 → Ofrecer upgrade

Las condiciones se evalúan en orden. La primera
que se cumpla determina el siguiente paso.
Si ninguna se cumple, se usa el paso por defecto.`,
  provide_instructions: `Este paso muestra instrucciones al agente.

Ejemplo: "Solicite al cliente reiniciar el modem"

El agente lee las instrucciones y las sigue.
Opcionalmente requiere confirmación del agente
antes de continuar al siguiente paso.`,
  execute_action: `Este paso ejecuta una acción del sistema.

Ejemplo: Crear ticket, cerrar caso, enviar email

Se ejecuta la acción configurada con los
parámetros especificados. Ideal para integrar
con sistemas externos.`,
};

export default function NodeInspector() {
  const { selectedStepId, flowData, updateStep, setSelectedStepId, getStepIds } = useFlowStore();
  const [activeTab, setActiveTab] = useState('config');

  if (!selectedStepId) return null;

  const step = flowData.steps[selectedStepId];
  if (!step) return null;

  const stepIds = getStepIds();

  const handleUpdate = (field: keyof FlowStep, value: any) => {
    updateStep(selectedStepId, { [field]: value });
  };

  const handleConfigUpdate = (key: string, value: any) => {
    updateStep(selectedStepId, {
      config: { ...step.config, [key]: value }
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        key="inspector"
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 340, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="h-full glass-panel border-l border-border flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Settings2 className="w-4 h-4 text-primary shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm font-semibold truncate">{step.name}</h3>
              <p className="text-[10px] text-muted-foreground font-mono">{step.step_id}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setSelectedStepId(null)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-3 mt-2 grid grid-cols-3">
            <TabsTrigger value="config" className="text-xs gap-1">
              <Settings2 className="w-3 h-3" /> Config
            </TabsTrigger>
            <TabsTrigger value="json" className="text-xs gap-1">
              <Code2 className="w-3 h-3" /> JSON
            </TabsTrigger>
            <TabsTrigger value="example" className="text-xs gap-1">
              <BookOpen className="w-3 h-3" /> Ejemplo
            </TabsTrigger>
          </TabsList>

          {/* Config Tab */}
          <TabsContent value="config" className="flex-1 overflow-hidden m-0">
            <ScrollArea className="h-full">
              <div className="p-3 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nombre</Label>
                  <Input
                    value={step.name}
                    onChange={(e) => handleUpdate('name', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo</Label>
                  <Select value={step.type} onValueChange={(v) => handleUpdate('type', v)}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="collect_information">Collect Information</SelectItem>
                      <SelectItem value="decision_point">Decision Point</SelectItem>
                      <SelectItem value="evaluate_condition">Evaluate Condition</SelectItem>
                      <SelectItem value="provide_instructions">Provide Instructions</SelectItem>
                      <SelectItem value="execute_action">Execute Action</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Dynamic config fields based on type */}
                {(step.type === 'collect_information' || step.type === 'decision_point') && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Prompt</Label>
                    <Textarea
                      value={step.config.prompt || ''}
                      onChange={(e) => handleConfigUpdate('prompt', e.target.value)}
                      className="text-sm min-h-[60px]"
                      rows={3}
                    />
                  </div>
                )}

                {step.type === 'collect_information' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Campo</Label>
                    <Input
                      value={step.config.field_name || ''}
                      onChange={(e) => handleConfigUpdate('field_name', e.target.value)}
                      className="h-8 text-sm font-mono"
                    />
                  </div>
                )}

                {step.type === 'provide_instructions' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Instrucciones</Label>
                    <Textarea
                      value={step.config.instructions_text || ''}
                      onChange={(e) => handleConfigUpdate('instructions_text', e.target.value)}
                      className="text-sm min-h-[80px]"
                      rows={4}
                    />
                  </div>
                )}

                {step.type === 'execute_action' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tipo de Acción</Label>
                    <Input
                      value={step.config.action_type || ''}
                      onChange={(e) => handleConfigUpdate('action_type', e.target.value)}
                      className="h-8 text-sm font-mono"
                    />
                  </div>
                )}

                {/* Next Step */}
                {step.type !== 'decision_point' && step.type !== 'evaluate_condition' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Siguiente Paso</Label>
                    <Select
                      value={step.next_step || '__none__'}
                      onValueChange={(v) => handleUpdate('next_step', v === '__none__' ? undefined : v)}
                    >
                      <SelectTrigger className="h-8 text-sm font-mono">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Ninguno —</SelectItem>
                        {stepIds.filter(id => id !== selectedStepId).map(id => (
                          <SelectItem key={id} value={id} className="font-mono text-xs">{id}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Options preview for decision_point */}
                {step.type === 'decision_point' && step.config.options && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Opciones ({step.config.options.length})</Label>
                    <div className="space-y-1">
                      {step.config.options.map((opt, i) => (
                        <div key={i} className="text-xs p-2 rounded bg-muted/50 border border-border/50">
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-muted-foreground"> → {opt.next_step || '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conditions preview for evaluate_condition */}
                {step.type === 'evaluate_condition' && step.config.conditions && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Condiciones ({step.config.conditions.length})</Label>
                    <div className="space-y-1">
                      {step.config.conditions.map((cond, i) => (
                        <div key={i} className="text-xs p-2 rounded bg-muted/50 border border-border/50 font-mono">
                          {cond.field} {cond.operator} {String(cond.value)} → {cond.next_step || '—'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* JSON Tab */}
          <TabsContent value="json" className="flex-1 overflow-hidden m-0">
            <ScrollArea className="h-full">
              <pre className="p-3 text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                {JSON.stringify({ [step.step_id]: step }, null, 2)}
              </pre>
            </ScrollArea>
          </TabsContent>

          {/* Example Tab */}
          <TabsContent value="example" className="flex-1 overflow-hidden m-0">
            <ScrollArea className="h-full">
              <div className="p-3">
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {STEP_EXAMPLES[step.type] || 'Sin ejemplo disponible.'}
                  </pre>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </motion.div>
    </AnimatePresence>
  );
}
