import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Rocket, FileText, Zap, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFlowStore, FlowData } from '@/store/flowStore';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface WelcomeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Template workflows
const TEMPLATES: Array<{
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    flow: FlowData;
}> = [
        {
            id: 'customer_support',
            name: 'Customer Support Flow',
            description: 'Handle customer inquiries with automated routing',
            icon: <Zap className="w-8 h-8" />,
            flow: {
                name: 'Customer Support Flow',
                description: 'Automated customer support workflow',
                initial_step: 'greet',
                steps: {
                    greet: {
                        step_id: 'greet',
                        name: 'Greet Customer',
                        type: 'provide_instructions',
                        config: {
                            instructions_text: 'Hello! How can I help you today?',
                        },
                        next_step: 'get_issue',
                    },
                    get_issue: {
                        step_id: 'get_issue',
                        name: 'Collect Issue',
                        type: 'collect_information',
                        config: {
                            prompt: 'Please describe your issue',
                            field_name: 'customer_issue',
                        },
                        next_step: 'route_issue',
                    },
                    route_issue: {
                        step_id: 'route_issue',
                        name: 'Route Issue',
                        type: 'decision_point',
                        config: {
                            prompt: 'What type of issue is this?',
                            options: [
                                { label: 'Technical', value: 'technical', next_step: 'tech_support' },
                                { label: 'Billing', value: 'billing', next_step: 'billing_support' },
                                { label: 'General', value: 'general', next_step: 'general_support' },
                            ],
                        },
                    },
                    tech_support: {
                        step_id: 'tech_support',
                        name: 'Technical Support',
                        type: 'provide_instructions',
                        config: {
                            instructions_text: 'Let me connect you with our technical team...',
                        },
                        next_step: 'close',
                    },
                    billing_support: {
                        step_id: 'billing_support',
                        name: 'Billing Support',
                        type: 'provide_instructions',
                        config: {
                            instructions_text: 'Let me connect you with our billing team...',
                        },
                        next_step: 'close',
                    },
                    general_support: {
                        step_id: 'general_support',
                        name: 'General Support',
                        type: 'provide_instructions',
                        config: {
                            instructions_text: 'I can help you with that...',
                        },
                        next_step: 'close',
                    },
                    close: {
                        step_id: 'close',
                        name: 'Close Case',
                        type: 'execute_action',
                        config: {
                            action_type: 'close_case',
                        },
                    },
                },
                constants: {},
            },
        },
        {
            id: 'tech_diagnosis',
            name: 'Technical Diagnosis',
            description: 'Diagnose technical problems step-by-step',
            icon: <FileText className="w-8 h-8" />,
            flow: {
                name: 'Technical Diagnosis',
                description: 'Step-by-step technical troubleshooting',
                initial_step: 'start',
                steps: {
                    start: {
                        step_id: 'start',
                        name: 'Start Diagnosis',
                        type: 'provide_instructions',
                        config: {
                            instructions_text: 'Let\'s diagnose the technical issue together.',
                        },
                        next_step: 'get_symptoms',
                    },
                    get_symptoms: {
                        step_id: 'get_symptoms',
                        name: 'Get Symptoms',
                        type: 'collect_information',
                        config: {
                            prompt: 'What symptoms are you experiencing?',
                            field_name: 'symptoms',
                        },
                        next_step: 'check_basics',
                    },
                    check_basics: {
                        step_id: 'check_basics',
                        name: 'Check Basics',
                        type: 'decision_point',
                        config: {
                            prompt: 'Have you tried restarting the device?',
                            options: [
                                { label: 'Yes', value: 'yes', next_step: 'advanced_check' },
                                { label: 'No', value: 'no', next_step: 'restart_instructions' },
                            ],
                        },
                    },
                    restart_instructions: {
                        step_id: 'restart_instructions',
                        name: 'Restart Instructions',
                        type: 'provide_instructions',
                        config: {
                            instructions_text: 'Please restart your device and wait 2 minutes.',
                        },
                        next_step: 'check_resolved',
                    },
                    advanced_check: {
                        step_id: 'advanced_check',
                        name: 'Advanced Check',
                        type: 'provide_instructions',
                        config: {
                            instructions_text: 'Let\'s run some advanced diagnostics...',
                        },
                        next_step: 'check_resolved',
                    },
                    check_resolved: {
                        step_id: 'check_resolved',
                        name: 'Check if Resolved',
                        type: 'decision_point',
                        config: {
                            prompt: 'Is the issue resolved?',
                            options: [
                                { label: 'Yes', value: 'yes', next_step: 'close_success' },
                                { label: 'No', value: 'no', next_step: 'escalate' },
                            ],
                        },
                    },
                    escalate: {
                        step_id: 'escalate',
                        name: 'Escalate',
                        type: 'execute_action',
                        config: {
                            action_type: 'escalate_to_specialist',
                        },
                    },
                    close_success: {
                        step_id: 'close_success',
                        name: 'Close Successfully',
                        type: 'execute_action',
                        config: {
                            action_type: 'close_case',
                        },
                    },
                },
                constants: {},
            },
        },
    ];

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
    const { setFlowData, pushFlowHistory } = useFlowStore();
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

    const handleStartBlank = () => {
        onClose();
    };

    const handleUseTemplate = (templateId: string) => {
        const template = TEMPLATES.find((t) => t.id === templateId);
        if (template) {
            pushFlowHistory();
            setFlowData(template.flow);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
                <div className="space-y-6 py-2">
                    {/* Header */}
                    <div className="text-center space-y-3">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
                            <Rocket className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold">Welcome to KIZUKU Flow Architect</h2>
                        <p className="text-muted-foreground">
                            Build powerful workflows visually, without code
                        </p>
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                        {/* Start from scratch */}
                        <button
                            onClick={handleStartBlank}
                            className="w-full p-4 rounded-lg border-2 border-border hover:border-primary/50 hover:bg-muted/50 transition-all text-left group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                                    <Play className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-base">Start from Scratch</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Build your workflow from the ground up
                                    </p>
                                </div>
                            </div>
                        </button>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">Or use a template</span>
                            </div>
                        </div>

                        {/* Templates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {TEMPLATES.map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => handleUseTemplate(template.id)}
                                    onMouseEnter={() => setSelectedTemplate(template.id)}
                                    onMouseLeave={() => setSelectedTemplate(null)}
                                    className={`
                    p-4 rounded-lg border-2 transition-all text-left
                    ${selectedTemplate === template.id
                                            ? 'border-primary bg-primary/5 scale-[1.02]'
                                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                                        }
                  `}
                                >
                                    <div className="space-y-3">
                                        <div className={`
                      inline-flex p-3 rounded-lg transition-colors
                      ${selectedTemplate === template.id ? 'bg-primary/20' : 'bg-muted'}
                    `}>
                                            {template.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-sm mb-1">{template.name}</h3>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                {template.description}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-4 border-t border-border">
                        <p className="text-xs text-center text-muted-foreground">
                            💡 <strong>Tip:</strong> Double-click any node to quickly edit it
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
