import { useState } from 'react';
import { Settings, Workflow, Download, FileText, Upload, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFlowStore } from '@/store/flowStore';
import { useToast } from '@/hooks/use-toast';

export default function Header() {
  const {
    apiKey,
    setApiKey,
    flowData,
    yamlContent,
    leftPanelMode,
    setLeftPanelMode,
    awsAccessKey,
    awsSecretKey,
    awsRegion,
    bedrockModelId,
    aiProvider,
    setAwsConfig,
    setAiProvider
  } = useFlowStore();

  const { toast } = useToast();
  const [tempKey, setTempKey] = useState(apiKey);
  const [tempAwsAccessKey, setTempAwsAccessKey] = useState(awsAccessKey);
  const [tempAwsSecretKey, setTempAwsSecretKey] = useState(awsSecretKey);
  const [tempAwsRegion, setTempAwsRegion] = useState(awsRegion);
  const [tempBedrockModelId, setTempBedrockModelId] = useState(bedrockModelId);
  const [tempAiProvider, setTempAiProvider] = useState<'openai' | 'bedrock'>(aiProvider);
  const [isOpen, setIsOpen] = useState(false);

  const handleSaveKey = () => {
    setApiKey(tempKey);
    setAiProvider(tempAiProvider);

    if (tempAiProvider === 'bedrock') {
      setAwsConfig({
        accessKey: tempAwsAccessKey,
        secretKey: tempAwsSecretKey,
        region: tempAwsRegion,
        modelId: tempBedrockModelId,
      });
    }

    setIsOpen(false);
    toast({
      title: 'Configuración guardada',
      description: tempAiProvider === 'bedrock'
        ? `AWS Bedrock configurado (${tempAwsRegion})`
        : tempKey ? 'OpenAI API configurada' : 'Modo simulación',
    });
  };

  const handleDownloadYaml = () => {
    const blob = new Blob([yamlContent], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${flowData.flow_id || 'flow'}.yaml`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: 'Downloaded!',
      description: 'YAML file saved',
    });
  };

  const handleCopyYaml = async () => {
    await navigator.clipboard.writeText(yamlContent);
    toast({
      title: 'Copied!',
      description: 'YAML copied to clipboard',
    });
  };

  return (
    <header className="h-14 glass-panel border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/20 electric-glow">
          <Workflow className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">
            KIZUKU <span className="text-primary">Architect</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Workflow Builder
          </p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
        <Button
          variant={leftPanelMode === 'upload' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setLeftPanelMode('upload')}
          className="gap-2 h-8"
        >
          <Upload className="w-4 h-4" />
          Import Doc
        </Button>
        <Button
          variant={leftPanelMode === 'builder' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setLeftPanelMode('builder')}
          className="gap-2 h-8"
        >
          <Layers className="w-4 h-4" />
          Flow Builder
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {/* Publish dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleDownloadYaml} className="gap-2">
              <FileText className="w-4 h-4" />
              Download YAML
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyYaml} className="gap-2">
              <FileText className="w-4 h-4" />
              Copy to Clipboard
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Settings */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Settings className="w-4 h-4" />
              {!apiKey && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-panel border-border max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Settings</DialogTitle>
              <DialogDescription>
                Configure tu proveedor de IA para funciones potenciadas con AI.
              </DialogDescription>
            </DialogHeader>

            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="space-y-4 pt-4">
                {/* AI Provider Selection */}
                <div className="space-y-2">
                  <Label>Proveedor de IA</Label>
                  <select
                    value={tempAiProvider}
                    onChange={(e) => setTempAiProvider(e.target.value as 'openai' | 'bedrock')}
                    className="w-full p-2 rounded-md border bg-background text-sm"
                  >
                    <option value="bedrock">AWS Bedrock (Recomendado)</option>
                    <option value="openai">OpenAI</option>
                  </select>
                </div>

                {/* AWS Bedrock Configuration */}
                {tempAiProvider === 'bedrock' && (
                  <div className="space-y-4 p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span className="text-sm font-medium">Configuración AWS Bedrock</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="awsAccessKey" className="text-xs">AWS Access Key ID</Label>
                        <Input
                          id="awsAccessKey"
                          type="password"
                          placeholder="AKIA..."
                          value={tempAwsAccessKey}
                          onChange={(e) => setTempAwsAccessKey(e.target.value)}
                          className="font-mono text-xs h-9"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="awsSecretKey" className="text-xs">AWS Secret Access Key</Label>
                        <Input
                          id="awsSecretKey"
                          type="password"
                          placeholder="********************"
                          value={tempAwsSecretKey}
                          onChange={(e) => setTempAwsSecretKey(e.target.value)}
                          className="font-mono text-xs h-9"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="awsRegion" className="text-xs">AWS Region</Label>
                        <Input
                          id="awsRegion"
                          placeholder="us-east-1"
                          value={tempAwsRegion}
                          onChange={(e) => setTempAwsRegion(e.target.value)}
                          className="font-mono text-xs h-9"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bedrockModel" className="text-xs">Modelo Bedrock</Label>
                        <select
                          id="bedrockModel"
                          value={tempBedrockModelId}
                          onChange={(e) => setTempBedrockModelId(e.target.value)}
                          className="w-full p-2 rounded-md border bg-background text-xs font-mono h-9"
                        >
                          {/* Anthropic - Claude 3.7 & 3.5 (Recomendado) */}
                          <optgroup label="🔥 Anthropic Claude (Recomendado)">
                            <option value="anthropic.claude-3-7-sonnet-20250219-v1:0">Claude 3.7 Sonnet (Más avanzado)</option>
                            <option value="anthropic.claude-3-5-sonnet-v2:0">Claude 3.5 Sonnet v2</option>
                            <option value="anthropic.claude-3-5-sonnet-20240620-v1:0">Claude 3.5 Sonnet</option>
                            <option value="anthropic.claude-3-5-haiku-20241022-v1:0">Claude 3.5 Haiku (Rápido)</option>
                          </optgroup>

                          {/* Anthropic - Claude 3 (Legacy) */}
                          <optgroup label="Anthropic Claude 3">
                            <option value="anthropic.claude-3-opus-20240229-v1:0">Claude 3 Opus</option>
                            <option value="anthropic.claude-3-sonnet-20240229-v1:0">Claude 3 Sonnet</option>
                            <option value="anthropic.claude-3-haiku-20240307-v1:0">Claude 3 Haiku</option>
                          </optgroup>

                          {/* Amazon Nova */}
                          <optgroup label="⚡ Amazon Nova (Nuevo 2026)">
                            <option value="amazon.nova-pro-v1:0">Nova Pro (RAG & Multimodal)</option>
                            <option value="amazon.nova-lite-v1:0">Nova Lite (Rápido)</option>
                            <option value="amazon.nova-micro-v1:0">Nova Micro (Ultra rápido)</option>
                          </optgroup>

                          {/* Amazon Titan */}
                          <optgroup label="Amazon Titan">
                            <option value="amazon.titan-text-premier-v1:0">Titan Text Premier</option>
                            <option value="amazon.titan-text-express-v1:0">Titan Text Express</option>
                            <option value="amazon.titan-text-lite-v1:0">Titan Text Lite</option>
                          </optgroup>

                          {/* Meta Llama */}
                          <optgroup label="🦙 Meta Llama 3 (Open Source)">
                            <option value="meta.llama3-2-90b-instruct-v1:0">Llama 3.2 90B Instruct</option>
                            <option value="meta.llama3-2-11b-instruct-v1:0">Llama 3.2 11B Instruct</option>
                            <option value="meta.llama3-2-3b-instruct-v1:0">Llama 3.2 3B Instruct</option>
                            <option value="meta.llama3-2-1b-instruct-v1:0">Llama 3.2 1B Instruct</option>
                            <option value="meta.llama3-1-405b-instruct-v1:0">Llama 3.1 405B Instruct</option>
                            <option value="meta.llama3-1-70b-instruct-v1:0">Llama 3.1 70B Instruct</option>
                            <option value="meta.llama3-1-8b-instruct-v1:0">Llama 3.1 8B Instruct</option>
                          </optgroup>

                          {/* Mistral AI */}
                          <optgroup label="🚀 Mistral AI">
                            <option value="mistral.mistral-large-2407-v1:0">Mistral Large 3 (Multilingüe)</option>
                            <option value="mistral.mistral-small-2402-v1:0">Mistral Small</option>
                            <option value="mistral.mixtral-8x7b-instruct-v0:1">Mixtral 8x7B</option>
                            <option value="mistral.ministral-3b-2410-v1:0">Ministral 3B (Bajo costo)</option>
                            <option value="mistral.ministral-8b-2410-v1:0">Ministral 8B</option>
                          </optgroup>

                          {/* DeepSeek */}
                          <optgroup label="🧮 DeepSeek (Razonamiento)">
                            <option value="deepseek.deepseek-r1-distill-llama-70b-v1:0">DeepSeek R1 Llama 70B</option>
                            <option value="deepseek.deepseek-r1-distill-qwen-32b-v1:0">DeepSeek R1 Qwen 32B</option>
                            <option value="deepseek.deepseek-r1-distill-qwen-14b-v1:0">DeepSeek R1 Qwen 14B</option>
                            <option value="deepseek.deepseek-r1-distill-qwen-7b-v1:0">DeepSeek R1 Qwen 7B</option>
                            <option value="deepseek.deepseek-r1-distill-qwen-1-5b-v1:0">DeepSeek R1 Qwen 1.5B</option>
                          </optgroup>

                          {/* Cohere */}
                          <optgroup label="🔍 Cohere (RAG Optimizado)">
                            <option value="cohere.command-r-plus-v1:0">Command R+ (RAG Premium)</option>
                            <option value="cohere.command-r-v1:0">Command R</option>
                            <option value="cohere.command-light-v14">Command Light</option>
                          </optgroup>

                          {/* AI21 Labs */}
                          <optgroup label="AI21 Labs">
                            <option value="ai21.jamba-1-5-large-v1:0">Jamba 1.5 Large (Híbrido SSM)</option>
                            <option value="ai21.jamba-1-5-mini-v1:0">Jamba 1.5 Mini</option>
                            <option value="ai21.j2-ultra-v1">Jurassic-2 Ultra</option>
                            <option value="ai21.j2-mid-v1">Jurassic-2 Mid</option>
                          </optgroup>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 p-2 rounded bg-primary/10 border border-primary/20">
                      <span className="text-xs">💡</span>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        <strong>Recomendado:</strong> Claude 3.7 Sonnet (mejor razonamiento), Nova Pro (RAG), o Llama 3.2 1B (bajo costo).
                      </p>
                    </div>
                  </div>
                )}

                {/* OpenAI Configuration */}
                {tempAiProvider === 'openai' && (
                  <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span className="text-sm font-medium">Configuración OpenAI</span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="apiKey" className="text-xs">OpenAI API Key</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        placeholder="sk-xxxxxxxx"
                        value={tempKey}
                        onChange={(e) => setTempKey(e.target.value)}
                        className="font-mono text-xs h-9"
                      />
                      <p className="text-xs text-muted-foreground">
                        Sin API key, el AI Copilot corre en modo simulación.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Fixed footer with buttons */}
            <div className="flex gap-2 justify-end pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setIsOpen(false)} size="sm">
                Cancelar
              </Button>
              <Button onClick={handleSaveKey} size="sm">
                Guardar Configuración
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
