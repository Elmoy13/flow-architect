import type { FlowData } from '@/store/flowStore';
import yaml from 'js-yaml';

const SYSTEM_PROMPT = `You are a document analyzer that converts procedural documents into structured YAML flows.

Given a document's text content, extract the workflow steps and convert them to this exact YAML structure:

\`\`\`yaml
flow_id: "unique_id"
name: "Flow Name"
steps:
  step_1:
    type: "start" | "decision" | "action" | "end"
    label: "Short Label"
    description: "Description"
    next_step: "step_2"  # For action/start nodes
    options:  # For decision nodes
      - label: "Option 1"
        next_step: "step_2"
      - label: "Option 2"
        next_step: "step_3"
\`\`\`

Rules:
1. First step should be type "start"
2. Last step should be type "end"
3. Questions/conditionals should be type "decision" with options
4. Regular actions should be type "action"
5. Every step must connect to another (no orphans)
6. Return ONLY valid YAML, no explanations

Analyze the document and create a logical flow.`;

export async function parseWithOpenAI(
  rawText: string, 
  fileName: string, 
  apiKey: string
): Promise<{ success: boolean; yaml?: string; error?: string }> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { 
            role: 'user', 
            content: `Document name: ${fileName}\n\nDocument content:\n${rawText.substring(0, 8000)}` 
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        return { success: false, error: 'Invalid API key' };
      }
      if (response.status === 429) {
        return { success: false, error: 'Rate limit exceeded. Try again later.' };
      }
      if (response.status === 402 || response.status === 403) {
        return { success: false, error: 'API quota exceeded or access denied' };
      }
      
      return { 
        success: false, 
        error: errorData.error?.message || `API error: ${response.status}` 
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return { success: false, error: 'Empty response from AI' };
    }

    // Extract YAML from response (might be wrapped in ```yaml blocks)
    let yamlString = content;
    const yamlMatch = content.match(/```(?:yaml)?\s*([\s\S]*?)```/);
    if (yamlMatch) {
      yamlString = yamlMatch[1];
    }

    // Validate the YAML
    const parsed = yaml.load(yamlString) as FlowData;
    
    if (!parsed.flow_id || !parsed.name || !parsed.steps) {
      return { success: false, error: 'Invalid flow structure returned by AI' };
    }

    // Re-stringify for consistent formatting
    const cleanYaml = yaml.dump(parsed, {
      indent: 2,
      lineWidth: -1,
      quotingType: '"',
    });

    return { success: true, yaml: cleanYaml };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'YAMLException') {
        return { success: false, error: 'AI returned invalid YAML structure' };
      }
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown error during AI processing' };
  }
}
