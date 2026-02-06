import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useFlowStore, FlowStep, StepType } from '@/store/flowStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface QuickEditModalProps {
    stepId: string | null;
    onClose: () => void;
}

export default function QuickEditModal({ stepId, onClose }: QuickEditModalProps) {
    const { flowData, updateStep, setSelectedStepId } = useFlowStore();
    const [formData, setFormData] = useState<Partial<FlowStep>>({});

    const step = stepId ? flowData.steps[stepId] : null;

    useEffect(() => {
        if (step) {
            setFormData({
                name: step.name,
                type: step.type,
                config: { ...step.config },
                next_step: step.next_step,
            });
        }
    }, [step]);

    if (!step) return null;

    const handleSave = () => {
        if (stepId) {
            updateStep(stepId, formData);
            onClose();
        }
    };

    const handleAdvancedEdit = () => {
        setSelectedStepId(stepId);
        onClose();
    };

    const updateConfig = (key: string, value: any) => {
        setFormData({
            ...formData,
            config: { ...formData.config, [key]: value },
        });
    };

    const renderQuickFields = () => {
        const config = formData.config || {};

        switch (step.type) {
            case 'collect_information':
                return (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="prompt" className="text-sm font-medium">
                                Question to Ask
                            </Label>
                            <Textarea
                                id="prompt"
                                value={(config.prompt as string) || ''}
                                onChange={(e) => updateConfig('prompt', e.target.value)}
                                placeholder="e.g., What is your email address?"
                                className="text-sm min-h-[70px]"
                                rows={3}
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="field_name" className="text-sm font-medium">
                                Save Answer As
                            </Label>
                            <Input
                                id="field_name"
                                value={(config.field_name as string) || ''}
                                onChange={(e) => updateConfig('field_name', e.target.value)}
                                placeholder="e.g., customer_email"
                                className="text-sm font-mono"
                            />
                        </div>
                    </>
                );

            case 'decision_point':
                return (
                    <div className="space-y-2">
                        <Label htmlFor="prompt" className="text-sm font-medium">
                            Question or Choice
                        </Label>
                        <Textarea
                            id="prompt"
                            value={(config.prompt as string) || ''}
                            onChange={(e) => updateConfig('prompt', e.target.value)}
                            placeholder="e.g., Would you like to continue?"
                            className="text-sm min-h-[70px]"
                            rows={3}
                            autoFocus
                        />
                        <p className="text-xs text-muted-foreground">
                            Use <strong>Advanced Edit</strong> to configure options
                        </p>
                    </div>
                );

            case 'provide_instructions':
                return (
                    <div className="space-y-2">
                        <Label htmlFor="instructions" className="text-sm font-medium">
                            Instructions
                        </Label>
                        <Textarea
                            id="instructions"
                            value={(config.instructions_text as string) || ''}
                            onChange={(e) => updateConfig('instructions_text', e.target.value)}
                            placeholder="e.g., Please restart the device and wait 2 minutes..."
                            className="text-sm min-h-[100px]"
                            rows={5}
                            autoFocus
                        />
                    </div>
                );

            case 'execute_action':
                return (
                    <div className="space-y-2">
                        <Label htmlFor="action_type" className="text-sm font-medium">
                            Action Type
                        </Label>
                        <Input
                            id="action_type"
                            value={(config.action_type as string) || ''}
                            onChange={(e) => updateConfig('action_type', e.target.value)}
                            placeholder="e.g., create_ticket, close_case, send_email"
                            className="text-sm font-mono"
                            autoFocus
                        />
                        <p className="text-xs text-muted-foreground">
                            Use <strong>Advanced Edit</strong> for action parameters
                        </p>
                    </div>
                );

            case 'evaluate_condition':
                return (
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            Conditions require advanced configuration.
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Click <strong>Advanced Edit</strong> to configure rules and conditions.
                        </p>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Dialog open={!!stepId} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings2 className="w-5 h-5 text-primary" />
                        Quick Edit: {step.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Node Name */}
                    <div className="space-y-2">
                        <Label htmlFor="node_name" className="text-sm font-medium">
                            Node Name
                        </Label>
                        <Input
                            id="node_name"
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Node name..."
                            className="text-sm"
                        />
                    </div>

                    {/* Type-specific fields */}
                    {renderQuickFields()}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-3 pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={handleAdvancedEdit}
                        className="text-sm"
                        size="sm"
                    >
                        <Settings2 className="w-3.5 h-3.5 mr-1.5" />
                        Advanced Edit
                    </Button>

                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={onClose} size="sm">
                            Cancel
                        </Button>
                        <Button onClick={handleSave} size="sm" className="gap-1.5">
                            <Save className="w-3.5 h-3.5" />
                            Save
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
