import { create } from 'zustand';
import yaml from 'js-yaml';

export interface FlowStep {
  type: 'decision' | 'action' | 'start' | 'end';
  label: string;
  description: string;
  next_step?: string;
  options?: Array<{
    label: string;
    next_step: string;
  }>;
}

export interface FlowData {
  flow_id: string;
  name: string;
  steps: Record<string, FlowStep>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface FlowStore {
  // YAML content
  yamlContent: string;
  setYamlContent: (content: string) => void;
  
  // Parsed flow data
  flowData: FlowData | null;
  parseYaml: () => void;
  
  // API Key
  apiKey: string;
  setApiKey: (key: string) => void;
  
  // View mode
  viewMode: 'visual' | 'code' | 'split';
  setViewMode: (mode: 'visual' | 'code' | 'split') => void;
  
  // AI Copilot
  isCopilotOpen: boolean;
  toggleCopilot: () => void;
  chatMessages: ChatMessage[];
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  
  // History
  flowHistory: Array<{ name: string; timestamp: Date }>;
  addToHistory: (name: string) => void;
  
  // File handling
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

const DEFAULT_YAML = `flow_id: "problema_temporal"
name: "Problema Temporal XVIEW+"
steps:
  step_1_connection:
    type: "decision"
    label: "Validación de Conexión"
    description: "¿Es Wi-Fi o Ethernet?"
    options:
      - label: "Ethernet"
        next_step: "step_2_restart"
      - label: "Wi-Fi"
        next_step: "step_1a_check_rssi"
  step_1a_check_rssi:
    type: "decision"
    label: "Revisar RSSI"
    description: "¿El nivel es menor a -65dBm?"
    options:
      - label: "Sí (Mala señal)"
        next_step: "step_offer_upgrade"
      - label: "No (Buena señal)"
        next_step: "step_2_restart"
  step_offer_upgrade:
    type: "action"
    label: "Ofrecer Upgrade"
    description: "Vender paquete superior o Wifi Ultra"
    next_step: "step_2_restart"
  step_2_restart:
    type: "action"
    label: "Reiniciar Caja"
    description: "Reiniciar desde control remoto"
    next_step: "step_3_validate"
  step_3_validate:
    type: "end"
    label: "Validar Servicio"
    description: "¿Funciona?"`;

export const useFlowStore = create<FlowStore>((set, get) => ({
  yamlContent: DEFAULT_YAML,
  setYamlContent: (content) => {
    set({ yamlContent: content });
    get().parseYaml();
  },
  
  flowData: null,
  parseYaml: () => {
    try {
      const parsed = yaml.load(get().yamlContent) as FlowData;
      set({ flowData: parsed });
    } catch (error) {
      console.error('Failed to parse YAML:', error);
      set({ flowData: null });
    }
  },
  
  apiKey: '',
  setApiKey: (key) => set({ apiKey: key }),
  
  viewMode: 'visual',
  setViewMode: (mode) => set({ viewMode: mode }),
  
  isCopilotOpen: true,
  toggleCopilot: () => set((state) => ({ isCopilotOpen: !state.isCopilotOpen })),
  
  chatMessages: [],
  addChatMessage: (message) => set((state) => ({
    chatMessages: [
      ...state.chatMessages,
      {
        ...message,
        id: crypto.randomUUID(),
        timestamp: new Date(),
      },
    ],
  })),
  
  flowHistory: [],
  addToHistory: (name) => set((state) => ({
    flowHistory: [
      { name, timestamp: new Date() },
      ...state.flowHistory.slice(0, 9),
    ],
  })),
  
  isProcessing: false,
  setIsProcessing: (processing) => set({ isProcessing: processing }),
}));

// Initialize parsed data
useFlowStore.getState().parseYaml();
