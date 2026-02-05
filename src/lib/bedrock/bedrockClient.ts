import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandOutput
} from "@aws-sdk/client-bedrock-runtime";

export interface BedrockConfig {
  region: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  modelId?: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface BedrockResponse {
  content: string;
  stopReason?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Client for interacting with AWS Bedrock (Claude models)
 */
export class BedrockClient {
  private client: BedrockRuntimeClient;
  private modelId: string;

  constructor(config: BedrockConfig) {
    this.client = new BedrockRuntimeClient({
      region: config.region,
      credentials: config.credentials,
    });

    // Default to Claude 3 Sonnet
    this.modelId = config.modelId || 'anthropic.claude-3-sonnet-20240229-v1:0';
  }

  /**
   * Send a chat message to Claude via Bedrock
   */
  async chat(messages: Message[], systemPrompt?: string): Promise<BedrockResponse> {
    try {
      // Format request for Claude 3 via Bedrock
      const requestBody = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 4096,
        temperature: 0.7,
        system: systemPrompt || "You are a helpful assistant.",
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      };

      const command = new InvokeModelCommand({
        modelId: this.modelId,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify(requestBody),
      });

      const response: InvokeModelCommandOutput = await this.client.send(command);

      if (!response.body) {
        throw new Error('No response body from Bedrock');
      }

      // Parse the response
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      return {
        content: responseBody.content[0].text,
        stopReason: responseBody.stop_reason,
        usage: {
          inputTokens: responseBody.usage?.input_tokens || 0,
          outputTokens: responseBody.usage?.output_tokens || 0,
        }
      };
    } catch (error) {
      console.error('Bedrock API Error:', error);
      throw error;
    }
  }

  /**
   * Test the connection to Bedrock
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.chat(
        [{ role: 'user', content: 'Hello! Respond with just "OK" if you can hear me.' }],
        'You are a test assistant. Respond briefly.'
      );
      return response.content.includes('OK') || response.content.includes('ok');
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

/**
 * Create a Bedrock client with retry logic
 */
export async function createBedrockClient(config: BedrockConfig): Promise<BedrockClient> {
  const client = new BedrockClient(config);

  // Test the connection
  const isConnected = await client.testConnection();
  if (!isConnected) {
    throw new Error('Failed to connect to AWS Bedrock. Please check your credentials.');
  }

  return client;
}
