import { z } from 'zod';

// Flow metadata schema
export const flowMetadataSchema = z.object({
  flow_id: z.string()
    .min(1, 'Flow ID is required')
    .regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores'),
  name: z.string().min(1, 'Name is required').max(100),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Use semantic versioning (e.g., 1.0.0)'),
  description: z.string().optional(),
});

// Constant schema
export const constantSchema = z.object({
  key: z.string()
    .min(1, 'Key is required')
    .regex(/^[a-z_][a-z0-9_]*$/, 'Use snake_case'),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

// Step validation schema
export const stepValidationSchema = z.object({
  type: z.enum(['text', 'number', 'email', 'choice', 'regex']),
  options: z.array(z.string()).optional(),
  range: z.tuple([z.number(), z.number()]).optional(),
  pattern: z.string().optional(),
  error_message: z.string().optional(),
});

// Condition schema
export const conditionSchema = z.object({
  field: z.string().min(1, 'Field is required'),
  operator: z.enum(['==', '!=', '<', '>', '<=', '>=', 'contains', 'startsWith']),
  value: z.union([z.string(), z.number()]),
  next_step: z.string().min(1, 'Next step is required'),
});

// Option schema
export const optionSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  value: z.string().min(1, 'Value is required'),
  next_step: z.string().min(1, 'Next step is required'),
});

// Base step schema
const baseStepSchema = z.object({
  step_id: z.string()
    .min(1, 'Step ID is required')
    .regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores'),
  name: z.string().min(1, 'Name is required').max(100),
});

// Type-specific config schemas
export const collectInformationConfigSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  field_name: z.string()
    .min(1, 'Field name is required')
    .regex(/^[a-z_][a-z0-9_]*$/, 'Use snake_case'),
  validation: stepValidationSchema.optional(),
});

export const evaluateConditionConfigSchema = z.object({
  conditions: z.array(conditionSchema).min(1, 'At least one condition is required'),
  default_next_step: z.string().optional(),
});

export const decisionPointConfigSchema = z.object({
  prompt: z.string().optional(),
  options: z.array(optionSchema).min(2, 'At least two options are required'),
});

export const provideInstructionsConfigSchema = z.object({
  instructions_text: z.string().min(1, 'Instructions are required'),
  confirmation_required: z.boolean().optional(),
});

export const executeActionConfigSchema = z.object({
  action_type: z.string().min(1, 'Action type is required'),
  action_params: z.record(z.unknown()).optional(),
});

// Full step schemas by type
export const collectInformationStepSchema = baseStepSchema.extend({
  type: z.literal('collect_information'),
  config: collectInformationConfigSchema,
  next_step: z.string().optional(),
});

export const evaluateConditionStepSchema = baseStepSchema.extend({
  type: z.literal('evaluate_condition'),
  config: evaluateConditionConfigSchema,
  next_step: z.string().optional(),
});

export const decisionPointStepSchema = baseStepSchema.extend({
  type: z.literal('decision_point'),
  config: decisionPointConfigSchema,
  next_step: z.string().optional(),
});

export const provideInstructionsStepSchema = baseStepSchema.extend({
  type: z.literal('provide_instructions'),
  config: provideInstructionsConfigSchema,
  next_step: z.string().optional(),
});

export const executeActionStepSchema = baseStepSchema.extend({
  type: z.literal('execute_action'),
  config: executeActionConfigSchema,
  next_step: z.string().optional(),
});

export const stepSchema = z.discriminatedUnion('type', [
  collectInformationStepSchema,
  evaluateConditionStepSchema,
  decisionPointStepSchema,
  provideInstructionsStepSchema,
  executeActionStepSchema,
]);

export type FlowMetadataFormData = z.infer<typeof flowMetadataSchema>;
export type StepFormData = z.infer<typeof stepSchema>;
