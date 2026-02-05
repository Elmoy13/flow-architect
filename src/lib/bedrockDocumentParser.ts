import type { FlowData } from '@/store/flowStore';
import yaml from 'js-yaml';
import { BedrockClient } from './bedrock/bedrockClient';

/**
 * Comprehensive system prompt for converting contact center documentation
 * into structured YAML workflows
 */
const SYSTEM_PROMPT = `You are an expert at converting contact center documentation into structured YAML workflows.

Given a document, you must generate a YAML workflow with the following structure:
- flow_id: unique identifier
- name: descriptive name
- description: brief description
- version: semantic version (start with 1.0.0)
- language: language code (e.g., "es" for Spanish)
- keywords: list of relevant keywords
- initial_step: ID of the first step
- constants: reusable values
- steps: list of workflow steps
- registration_templates: (optional) templates for data collection
- escalation_rules: (optional) escalation conditions
- metadata: additional information

Each step must have:
- step_id: unique identifier
- name: step name
- description: what the step does
- type: one of [provide_instructions, collect_information, decision_point, execute_action, evaluate_condition, wait_and_validate, end]
- config: step-specific configuration
- next_step: ID of next step or null for terminal steps

Step Type Configurations:

1. provide_instructions - Gives the user instructions to follow
   Config:
   - instructions_text: The actual instructions to show
   - confirmation_required: Whether to wait for user confirmation (true/false)

2. collect_information - Asks the user for specific information
   Config:
   - prompt: The question to ask
   - field_name: Where to store the answer
   - validation: Rules to check if answer is valid
   - type: What kind of answer (choice, number, text, etc.)
   - options: Valid choices (for choice type)
   - range: Min/max values (for number type)
   - error_message: What to say if answer is invalid

3. decision_point - Presents options for the user to choose from
   Config:
   - prompt: The question or situation to explain
   - options: List of choices, each with:
     - label: What the user sees
     - value: Internal value to store
     - next_step: Where to go if this is chosen

4. execute_action - Performs an automated action
   Config:
   - action_type: Type of action (external_api, close_case, escalate_backoffice, generate_technical_complaint)
   - action_params: Details specific to that action type
   - result_field: (optional) Where to store the result

5. evaluate_condition - Checks stored data and routes based on values
   Config:
   - conditions: List of if-then rules, each with:
     - field: What data to check
     - operator: How to compare (==, !=, <, >, <=, >=, in, not_in)
     - value: What to compare against
     - next_step: Where to go if condition is true
   - default_next_step: (optional) Where to go if no conditions match

6. wait_and_validate - Waits for a period, then checks if something worked
   Config:
   - wait_duration_seconds: How long to wait
   - validation_action: What to check after waiting
   - api_name: Which API to call
   - endpoint: Where to call it
   - success_next_step: Where to go if validation passes
   - failure_next_step: Where to go if validation fails

Example YAML structure:

\`\`\`yaml
flow_id: "customer_support_flow"
name: "Customer Support Flow"
description: "Complete customer support workflow"
version: "1.0.0"
language: "es"
keywords:
  - "support"
  - "customer service"
initial_step: "step_1_collect_issue"
constants:
  max_wait_time: 300
steps:
  step_1_collect_issue:
    step_id: "step_1_collect_issue"
    name: "Collect Customer Issue"
    description: "Ask customer about their issue"
    type: "collect_information"
    config:
      prompt: "What issue are you experiencing?"
      field_name: "customer_issue"
      validation:
        type: "text"
        error_message: "Please describe your issue"
    next_step: "step_2_categorize"
  
  step_2_categorize:
    step_id: "step_2_categorize"
    name: "Categorize Issue"
    description: "Determine issue category"
    type: "decision_point"
    config:
      prompt: "What category best describes the issue?"
      options:
        - label: "Technical Problem"
          value: "technical"
          next_step: "step_3_technical_support"
        - label: "Billing Question"
          value: "billing"
          next_step: "step_3_billing_support"
        - label: "General Inquiry"
          value: "general"
          next_step: "step_3_general_support"
  
  step_3_technical_support:
    step_id: "step_3_technical_support"
    name: "Technical Support"
    description: "Provide technical instructions"
    type: "provide_instructions"
    config:
      instructions_text: |
        Please follow these steps:
        1. Restart your device
        2. Wait 2 minutes
        3. Try again
      confirmation_required: true
    next_step: "step_4_verify_resolution"
  
  step_4_verify_resolution:
    step_id: "step_4_verify_resolution"
    name: "Verify Issue Resolution"
    description: "Check if issue is resolved"
    type: "decision_point"
    config:
      prompt: "Is your issue now resolved?"
      options:
        - label: "Yes, resolved"
          value: "resolved"
          next_step: "step_5_close_resolved"
        - label: "No, still having issues"
          value: "not_resolved"
          next_step: "step_5_escalate"
  
  step_5_close_resolved:
    step_id: "step_5_close_resolved"
    name: "Close - Resolved"
    type: "execute_action"
    config:
      action_type: "close_case"
      action_params:
        outcome: "resolved"
  
  step_5_escalate:
    step_id: "step_5_escalate"
    name: "Escalate to Supervisor"
    type: "execute_action"
    config:
      action_type: "escalate_backoffice"
      action_params:
        category: "TECHNICAL_SUPPORT"
        subcategory: "UNRESOLVED_ISSUE"

registration_templates:
  resolved_case: |
    ISSUE: {customer_issue}
    RESOLUTION: Technical support provided
    OUTCOME: Resolved
  
  escalated_case: |
    ISSUE: {customer_issue}
    ESCALATION REASON: Unresolved after initial support
    CATEGORY: {escalation_category}

metadata:
  author: "AI Generated"
  tags: ["customer_support", "technical"]
\`\`\`

IMPORTANT RULES:
1. Generate ONLY valid YAML, no explanations or markdown
2. Every step must connect to another step (no orphans) except terminal steps
3. Use descriptive step_ids that indicate their purpose
4. Include all required fields for each step type
5. Terminal steps (like close_case) should have type "execute_action" and no next_step
6. Use Spanish for prompts and instructions if the document is in Spanish
7. Include registration_templates for common outcomes if the document mentions them
8. Add metadata with relevant tags

Analyze the document and generate a complete, valid YAML workflow.`;

export interface BedrockParseResult {
  success: boolean;
  yaml?: string;
  error?: string;
}

/**
 * Parse a document using AWS Bedrock (Claude) to generate a structured YAML workflow
 */
export async function parseWithBedrock(
  rawText: string,
  fileName: string,
  awsConfig: {
    accessKey: string;
    secretKey: string;
    region: string;
    modelId: string;
  }
): Promise<BedrockParseResult> {
  try {
    // Validate inputs
    if (!rawText || rawText.trim().length < 20) {
      return { success: false, error: 'Document is too short to parse' };
    }

    if (!awsConfig.accessKey || !awsConfig.secretKey) {
      return { success: false, error: 'AWS credentials are required' };
    }

    // Create Bedrock client
    const client = new BedrockClient({
      credentials: {
        accessKeyId: awsConfig.accessKey,
        secretAccessKey: awsConfig.secretKey,
      },
      region: awsConfig.region,
      modelId: awsConfig.modelId,
    });

    // Prepare the user message with document content
    // Limit to ~100k characters to stay within Claude's context window
    const maxLength = 100000;
    const truncatedText = rawText.length > maxLength
      ? rawText.substring(0, maxLength) + '\n\n[Document truncated due to length]'
      : rawText;

    const userMessage = `Document filename: ${fileName}

Document content:
${truncatedText}

Please analyze this document and generate a complete YAML workflow following the structure and rules provided.`;

    // Call Bedrock
    let response;
    try {
      response = await client.chat(
        [{ role: 'user', content: userMessage }],
        SYSTEM_PROMPT
      );
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to call Bedrock API',
      };
    }

    if (!response.content) {
      return {
        success: false,
        error: 'Empty response from Bedrock',
      };
    }

    // Extract YAML from response (Claude might wrap it in ```yaml blocks)
    let yamlString = response.content;
    const yamlMatch = response.content.match(/```(?:yaml)?\s*([\s\S]*?)```/);
    if (yamlMatch) {
      yamlString = yamlMatch[1];
    }

    // Validate the YAML structure
    const parsed = yaml.load(yamlString) as FlowData;

    if (!parsed) {
      return { success: false, error: 'Failed to parse YAML output' };
    }

    if (!parsed.flow_id || !parsed.name || !parsed.steps) {
      return {
        success: false,
        error: 'Invalid flow structure: missing required fields (flow_id, name, or steps)',
      };
    }

    // Validate that steps is an object with at least one step
    if (typeof parsed.steps !== 'object' || Object.keys(parsed.steps).length === 0) {
      return {
        success: false,
        error: 'Invalid flow structure: steps must be a non-empty object',
      };
    }

    // Ensure version and language are set
    if (!parsed.version) {
      parsed.version = '1.0.0';
    }
    if (!parsed.language) {
      parsed.language = 'es';
    }

    // Re-stringify for consistent formatting
    const cleanYaml = yaml.dump(parsed, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: false,
    });

    return { success: true, yaml: cleanYaml };
  } catch (error) {
    console.error('Bedrock document parsing error:', error);

    if (error instanceof Error) {
      // Handle YAML parsing errors
      if (error.name === 'YAMLException') {
        return {
          success: false,
          error: 'AI generated invalid YAML structure. Please try again.',
        };
      }

      // Handle Bedrock client errors
      if (error.message.includes('credentials')) {
        return {
          success: false,
          error: 'Invalid AWS credentials. Please check your settings.',
        };
      }

      if (error.message.includes('throttl')) {
        return {
          success: false,
          error: 'Rate limit exceeded. Please try again in a moment.',
        };
      }

      return { success: false, error: error.message };
    }

    return { success: false, error: 'Unknown error during Bedrock processing' };
  }
}
