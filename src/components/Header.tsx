import { useState } from 'react';
import { Settings, Workflow, Download, FileText, Upload, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFlowStore } from '@/store/flowStore';
import { useToast } from '@/hooks/use-toast';

export default function Header() {
  const {
    apiKey, setApiKey, flowData, yamlContent,
    awsAccessKey, awsSecretKey, awsRegion, bedrockModelId, aiProvider,
    setAwsConfig, setAiProvider
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
      setAwsConfig({ accessKey: tempAwsAccessKey, secretKey: tempAwsSecretKey, region: tempAwsRegion, modelId: tempBedrockModelId });
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
    toast({ title: 'Downloaded!', description: 'YAML file saved' });
  };

  const handleCopyYaml = async () => {
    await navigator.clipboard.writeText(yamlContent);
    toast({ title: 'Copied!', description: 'YAML copied to clipboard' });
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
          <p className="text-xs text-muted-foreground">Workflow Builder</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default" size="sm" className="gap-2">
              <Download className="w-4 h-4" /> Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleDownloadYaml} className="gap-2">
              <FileText className="w-4 h-4" /> Download YAML
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyYaml} className="gap-2">
              <FileText className="w-4 h-4" /> Copy to Clipboard
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Settings className="w-4 h-4" />
              {!apiKey && !awsAccessKey && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-panel border-border max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Settings</DialogTitle>
              <DialogDescription>Configura tu proveedor de IA.</DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="space-y-4 pt-4">
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

                {tempAiProvider === 'bedrock' && (
                  <div className="space-y-4 p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">AWS Access Key ID</Label>
                        <Input type="password" placeholder="AKIA..." value={tempAwsAccessKey} onChange={(e) => setTempAwsAccessKey(e.target.value)} className="font-mono text-xs h-9" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">AWS Secret Access Key</Label>
                        <Input type="password" value={tempAwsSecretKey} onChange={(e) => setTempAwsSecretKey(e.target.value)} className="font-mono text-xs h-9" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">AWS Region</Label>
                        <Input placeholder="us-east-1" value={tempAwsRegion} onChange={(e) => setTempAwsRegion(e.target.value)} className="font-mono text-xs h-9" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Modelo Bedrock</Label>
                        <select value={tempBedrockModelId} onChange={(e) => setTempBedrockModelId(e.target.value)} className="w-full p-2 rounded-md border bg-background text-xs font-mono h-9">
                          <optgroup label="Anthropic Claude">
                            <option value="anthropic.claude-3-7-sonnet-20250219-v1:0">Claude 3.7 Sonnet</option>
                            <option value="anthropic.claude-3-5-sonnet-v2:0">Claude 3.5 Sonnet v2</option>
                            <option value="anthropic.claude-3-sonnet-20240229-v1:0">Claude 3 Sonnet</option>
                            <option value="anthropic.claude-3-haiku-20240307-v1:0">Claude 3 Haiku</option>
                          </optgroup>
                          <optgroup label="Amazon Nova">
                            <option value="amazon.nova-pro-v1:0">Nova Pro</option>
                            <option value="amazon.nova-lite-v1:0">Nova Lite</option>
                          </optgroup>
                          <optgroup label="Meta Llama">
                            <option value="meta.llama3-1-70b-instruct-v1:0">Llama 3.1 70B</option>
                            <option value="meta.llama3-1-8b-instruct-v1:0">Llama 3.1 8B</option>
                          </optgroup>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {tempAiProvider === 'openai' && (
                  <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="space-y-2">
                      <Label className="text-xs">OpenAI API Key</Label>
                      <Input type="password" placeholder="sk-xxxxxxxx" value={tempKey} onChange={(e) => setTempKey(e.target.value)} className="font-mono text-xs h-9" />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setIsOpen(false)} size="sm">Cancelar</Button>
              <Button onClick={handleSaveKey} size="sm">Guardar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
