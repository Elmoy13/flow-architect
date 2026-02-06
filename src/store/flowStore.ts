import { create } from 'zustand';
import yaml from 'js-yaml';

// Enhanced YAML structure for the Builder Edition
export interface StepCondition {
  field: string;
  operator: '==' | '!=' | '<' | '>' | '<=' | '>=' | 'contains' | 'startsWith';
  value: string | number;
  next_step: string;
}

export interface StepOption {
  label: string;
  value: string;
  next_step: string;
}

export interface StepValidation {
  type: 'text' | 'number' | 'email' | 'choice' | 'regex';
  options?: string[];
  range?: [number, number];
  pattern?: string;
  error_message?: string;
}

export interface StepConfig {
  prompt?: string;
  field_name?: string;
  validation?: StepValidation;
  conditions?: StepCondition[];
  default_next_step?: string;
  options?: StepOption[];
  instructions_text?: string;
  confirmation_required?: boolean;
  action_type?: string;
  action_params?: Record<string, unknown>;
}

export type StepType =
  | 'collect_information'
  | 'evaluate_condition'
  | 'decision_point'
  | 'provide_instructions'
  | 'execute_action';

export interface FlowStep {
  step_id: string;
  name: string;
  type: StepType;
  config: StepConfig;
  next_step?: string;
}

export interface FlowConstants {
  [key: string]: string | number | boolean;
}

export interface FlowData {
  flow_id: string;
  name: string;
  version: string;
  description?: string;
  language?: string;
  keywords?: string[];
  initial_step?: string;
  constants?: FlowConstants;
  steps: Record<string, FlowStep>;
  registration_templates?: Record<string, string>;
  escalation_rules?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  createdSteps?: string[];
  analysis?: {
    problems_found?: string[];
    improvements?: string[];
    affected_steps?: string[];
  };
}

interface FlowStore {
  // Flow data (source of truth)
  flowData: FlowData;
  setFlowData: (data: FlowData) => void;

  // YAML content (derived from flowData)
  yamlContent: string;
  updateYamlFromFlowData: () => void;
  setYamlContent: (content: string) => void;

  // Flow metadata
  updateMetadata: (updates: Partial<Pick<FlowData, 'flow_id' | 'name' | 'version' | 'description'>>) => void;

  // Constants management
  setConstant: (key: string, value: string | number | boolean) => void;
  deleteConstant: (key: string) => void;

  // Step management
  addStep: (step: FlowStep) => void;
  updateStep: (stepId: string, updates: Partial<FlowStep>) => void;
  deleteStep: (stepId: string) => void;
  reorderSteps: (stepIds: string[]) => void;
  getStepIds: () => string[];
  getOrphanSteps: () => string[];

  // Selected step for editing
  selectedStepId: string | null;
  setSelectedStepId: (id: string | null) => void;

  // API Key
  apiKey: string;
  setApiKey: (key: string) => void;

  // Left panel mode
  leftPanelMode: 'builder' | 'upload';
  setLeftPanelMode: (mode: 'builder' | 'upload') => void;

  // Builder tab
  builderTab: 'metadata' | 'steps';
  setBuilderTab: (tab: 'metadata' | 'steps') => void;

  // AWS / AI Config
  awsAccessKey: string;
  awsSecretKey: string;
  awsRegion: string;
  bedrockModelId: string;
  aiProvider: 'openai' | 'bedrock';
  setAwsConfig: (config: { accessKey?: string; secretKey?: string; region?: string; modelId?: string }) => void;
  setAiProvider: (provider: 'openai' | 'bedrock') => void;

  // AI Copilot (legacy)
  isCopilotOpen: boolean;
  toggleCopilot: () => void;
  chatMessages: ChatMessage[];
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;

  // Persistent Agentic Chat
  persistentChatMessages: ChatMessage[];
  addPersistentChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChatHistory: () => void;

  // Agent Context Tracking
  agentContext: {
    lastModifications: Array<{
      timestamp: Date;
      action: string;
      affectedSteps: string[];
    }>;
    flowHistory: FlowData[];
  };
  pushFlowHistory: () => void;
  undoLastChange: () => void;

  // Animation Settings
  animationEnabled: boolean;
  animationSpeed: 'fast' | 'normal' | 'slow';
  setAnimationEnabled: (enabled: boolean) => void;
  setAnimationSpeed: (speed: 'fast' | 'normal' | 'slow') => void;

  // History
  flowHistory: Array<{ name: string; timestamp: Date }>;
  addToHistory: (name: string) => void;

  // Processing state
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

const DEFAULT_FLOW_DATA: FlowData = {
  flow_id: "problema_temporal",
  name: "Problema Temporal XVIEW+",
  version: "2.0.0",
  description: "Diagnóstico para error 'Problema Temporal' en XVIEW+",
  constants: {
    rssi_threshold: -65,
    wifi_ultra_price: 50.00
  },
  steps: {
    step_1_connection_type: {
      step_id: "step_1_connection_type",
      name: "Validación de Conexión",
      type: "collect_information",
      config: {
        prompt: "¿Su equipo está conectado por Wi-Fi o por Ethernet?",
        field_name: "connection_type",
        validation: { type: "choice", options: ["wifi", "ethernet"] }
      },
      next_step: "step_1_route_connection"
    },
    step_1_route_connection: {
      step_id: "step_1_route_connection",
      name: "Enrutar Conexión",
      type: "evaluate_condition",
      config: {
        conditions: [
          { field: "connection_type", operator: "==", value: "ethernet", next_step: "step_2_restart_device" },
          { field: "connection_type", operator: "==", value: "wifi", next_step: "step_1a_collect_rssi" }
        ],
        default_next_step: "step_2_restart_device"
      }
    },
    step_1a_collect_rssi: {
      step_id: "step_1a_collect_rssi",
      name: "Recolectar RSSI",
      type: "collect_information",
      config: {
        prompt: "Ingrese el valor de WIFI RSSI (ej: -60)",
        field_name: "rssi_value",
        validation: { type: "number" }
      },
      next_step: "step_1b_evaluate_rssi"
    },
    step_1b_evaluate_rssi: {
      step_id: "step_1b_evaluate_rssi",
      name: "Evaluar Umbral",
      type: "evaluate_condition",
      config: {
        conditions: [
          { field: "rssi_value", operator: "<", value: -65, next_step: "step_1c_offer_upgrade" }
        ],
        default_next_step: "step_2_restart_device"
      }
    },
    step_1c_offer_upgrade: {
      step_id: "step_1c_offer_upgrade",
      name: "Ofrecer Upgrade",
      type: "decision_point",
      config: {
        prompt: "Señal débil detectada. ¿Cliente acepta Upgrade?",
        options: [
          { label: "Sí, acepta", value: "accept", next_step: "step_close_upgrade" },
          { label: "No, gracias", value: "decline", next_step: "step_1d_offer_wifi_ultra" }
        ]
      }
    },
    step_1d_offer_wifi_ultra: {
      step_id: "step_1d_offer_wifi_ultra",
      name: "Ofrecer Wifi Ultra",
      type: "decision_point",
      config: {
        prompt: "¿Desea contratar Wifi Ultra por $50.00?",
        options: [
          { label: "Sí, contratar", value: "accept", next_step: "step_close_wifi_ultra" },
          { label: "No, continuar", value: "decline", next_step: "step_2_restart_device" }
        ]
      }
    },
    step_2_restart_device: {
      step_id: "step_2_restart_device",
      name: "Reiniciar Caja",
      type: "provide_instructions",
      config: {
        instructions_text: "Reinicie la caja (Power 5s). Espere 2 min.",
        confirmation_required: true
      },
      next_step: "step_end_process"
    },
    step_close_upgrade: {
      step_id: "step_close_upgrade",
      name: "Cierre - Upgrade Vendido",
      type: "execute_action",
      config: {
        action_type: "close_case",
        action_params: { disposition: "sale_upgrade" }
      }
    },
    step_close_wifi_ultra: {
      step_id: "step_close_wifi_ultra",
      name: "Cierre - Wifi Ultra Vendido",
      type: "execute_action",
      config: {
        action_type: "close_case",
        action_params: { disposition: "sale_wifi_ultra" }
      }
    },
    step_end_process: {
      step_id: "step_end_process",
      name: "Fin del Proceso",
      type: "execute_action",
      config: {
        action_type: "close_case"
      }
    }
  }
};

function flowDataToYaml(data: FlowData): string {
  try {
    return yaml.dump(data, { indent: 2, lineWidth: -1, noRefs: true, sortKeys: false });
  } catch {
    return '';
  }
}

function yamlToFlowData(yamlStr: string): FlowData | null {
  try {
    const parsed = yaml.load(yamlStr) as FlowData;
    if (parsed && parsed.flow_id && parsed.steps) return parsed;
    return null;
  } catch {
    return null;
  }
}

const CHAT_HISTORY_KEY = 'agentic_chat_history';

function loadPersistedChat(): ChatMessage[] {
  try {
    const stored = localStorage.getItem(CHAT_HISTORY_KEY);
    if (stored) {
      return JSON.parse(stored).map((msg: any) => ({ ...msg, timestamp: new Date(msg.timestamp) }));
    }
  } catch (e) {
    console.error("Failed to load chat history", e);
  }
  return [];
}

function savePersistedChat(messages: ChatMessage[]) {
  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(
      messages.map(msg => ({ ...msg, timestamp: msg.timestamp.toISOString() }))
    ));
  } catch (e) {
    console.error("Failed to save chat history", e);
  }
}

export const useFlowStore = create<FlowStore>((set, get) => ({
  flowData: DEFAULT_FLOW_DATA,
  setFlowData: (data) => set({ flowData: data, yamlContent: flowDataToYaml(data) }),

  yamlContent: flowDataToYaml(DEFAULT_FLOW_DATA),
  updateYamlFromFlowData: () => set({ yamlContent: flowDataToYaml(get().flowData) }),
  setYamlContent: (content) => {
    const parsed = yamlToFlowData(content);
    if (parsed) set({ yamlContent: content, flowData: parsed });
    else set({ yamlContent: content });
  },

  updateMetadata: (updates) => {
    const newFlowData = { ...get().flowData, ...updates };
    set({ flowData: newFlowData, yamlContent: flowDataToYaml(newFlowData) });
  },

  setConstant: (key, value) => {
    const { flowData } = get();
    const newFlowData = { ...flowData, constants: { ...flowData.constants, [key]: value } };
    set({ flowData: newFlowData, yamlContent: flowDataToYaml(newFlowData) });
  },
  deleteConstant: (key) => {
    const { flowData } = get();
    const newConstants = { ...flowData.constants };
    delete newConstants[key];
    const newFlowData = { ...flowData, constants: newConstants };
    set({ flowData: newFlowData, yamlContent: flowDataToYaml(newFlowData) });
  },

  addStep: (step) => {
    const { flowData } = get();
    const newFlowData = { ...flowData, steps: { ...flowData.steps, [step.step_id]: step } };
    set({ flowData: newFlowData, yamlContent: flowDataToYaml(newFlowData) });
  },
  updateStep: (stepId, updates) => {
    const { flowData } = get();
    const existing = flowData.steps[stepId];
    if (!existing) return;
    const newFlowData = { ...flowData, steps: { ...flowData.steps, [stepId]: { ...existing, ...updates } } };
    set({ flowData: newFlowData, yamlContent: flowDataToYaml(newFlowData) });
  },
  deleteStep: (stepId) => {
    const { flowData, selectedStepId } = get();
    const newSteps = { ...flowData.steps };
    delete newSteps[stepId];
    const newFlowData = { ...flowData, steps: newSteps };
    set({ flowData: newFlowData, yamlContent: flowDataToYaml(newFlowData), selectedStepId: selectedStepId === stepId ? null : selectedStepId });
  },
  reorderSteps: (stepIds) => {
    const { flowData } = get();
    const newSteps: Record<string, FlowStep> = {};
    stepIds.forEach(id => { if (flowData.steps[id]) newSteps[id] = flowData.steps[id]; });
    const newFlowData = { ...flowData, steps: newSteps };
    set({ flowData: newFlowData, yamlContent: flowDataToYaml(newFlowData) });
  },
  getStepIds: () => Object.keys(get().flowData.steps),
  getOrphanSteps: () => {
    const { flowData } = get();
    const stepIds = Object.keys(flowData.steps);
    const referenced = new Set<string>();
    Object.values(flowData.steps).forEach(step => {
      if (step.next_step) referenced.add(step.next_step);
      step.config.conditions?.forEach(c => referenced.add(c.next_step));
      step.config.options?.forEach(o => referenced.add(o.next_step));
      if (step.config.default_next_step) referenced.add(step.config.default_next_step);
    });
    const firstStepId = stepIds[0];
    return stepIds.filter(id => id !== firstStepId && !referenced.has(id));
  },

  selectedStepId: null,
  setSelectedStepId: (id) => set({ selectedStepId: id }),

  apiKey: '',
  setApiKey: (key) => set({ apiKey: key }),

  leftPanelMode: 'builder',
  setLeftPanelMode: (mode) => set({ leftPanelMode: mode }),

  // AWS / AI Config
  awsAccessKey: '',
  awsSecretKey: '',
  awsRegion: 'us-east-1',
  bedrockModelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
  aiProvider: 'bedrock' as const,
  setAwsConfig: (config) => set((state) => ({
    awsAccessKey: config.accessKey ?? state.awsAccessKey,
    awsSecretKey: config.secretKey ?? state.awsSecretKey,
    awsRegion: config.region ?? state.awsRegion,
    bedrockModelId: config.modelId ?? state.bedrockModelId,
  })),
  setAiProvider: (provider) => set({ aiProvider: provider }),

  builderTab: 'steps',
  setBuilderTab: (tab) => set({ builderTab: tab }),

  isCopilotOpen: true,
  toggleCopilot: () => set((state) => ({ isCopilotOpen: !state.isCopilotOpen })),

  chatMessages: [],
  addChatMessage: (message) => set((state) => ({
    chatMessages: [...state.chatMessages, { ...message, id: crypto.randomUUID(), timestamp: new Date() }],
  })),

  persistentChatMessages: loadPersistedChat(),
  addPersistentChatMessage: (message) => {
    const newMessage: ChatMessage = { ...message, id: Date.now().toString(), timestamp: new Date() };
    set((state) => {
      const trimmed = [...state.persistentChatMessages, newMessage].slice(-50);
      savePersistedChat(trimmed);
      return { persistentChatMessages: trimmed };
    });
  },
  clearChatHistory: () => {
    set({ persistentChatMessages: [] });
    savePersistedChat([]);
  },

  agentContext: { lastModifications: [], flowHistory: [] },
  pushFlowHistory: () => {
    set((state) => ({
      agentContext: {
        ...state.agentContext,
        flowHistory: [...state.agentContext.flowHistory, { ...get().flowData }].slice(-10),
      },
    }));
  },
  undoLastChange: () => {
    const history = get().agentContext.flowHistory;
    if (history.length > 0) {
      const previousFlow = history[history.length - 1];
      set({
        flowData: previousFlow,
        yamlContent: flowDataToYaml(previousFlow),
        agentContext: { ...get().agentContext, flowHistory: history.slice(0, -1) },
      });
    }
  },

  animationEnabled: localStorage.getItem('animationEnabled') !== 'false',
  animationSpeed: (localStorage.getItem('animationSpeed') as 'fast' | 'normal' | 'slow') || 'normal',
  setAnimationEnabled: (enabled) => { localStorage.setItem('animationEnabled', enabled.toString()); set({ animationEnabled: enabled }); },
  setAnimationSpeed: (speed) => { localStorage.setItem('animationSpeed', speed); set({ animationSpeed: speed }); },

  flowHistory: [],
  addToHistory: (name) => set((state) => ({
    flowHistory: [{ name, timestamp: new Date() }, ...state.flowHistory.slice(0, 9)],
  })),

  isProcessing: false,
  setIsProcessing: (processing) => set({ isProcessing: processing }),
}));
