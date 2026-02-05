import { useState } from 'react';
import { Settings, Workflow, Download, FileText } from 'lucide-react';
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
  const { apiKey, setApiKey, flowData, yamlContent } = useFlowStore();
  const { toast } = useToast();
  const [tempKey, setTempKey] = useState(apiKey);
  const [isOpen, setIsOpen] = useState(false);

  const handleSaveKey = () => {
    setApiKey(tempKey);
    setIsOpen(false);
    toast({
      title: 'API Key saved',
      description: tempKey ? 'Real AI mode enabled' : 'Simulation mode enabled',
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
            DocFlow <span className="text-primary">Architect</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Workflow Builder
          </p>
        </div>
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
          <DialogContent className="glass-panel border-border">
            <DialogHeader>
              <DialogTitle>Settings</DialogTitle>
              <DialogDescription>
                Configure your OpenAI API key for AI-powered features.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">OpenAI API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="sk-xxxxxxxx"
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Without an API key, the AI Copilot runs in simulation mode.
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveKey}>
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
