import { useState } from 'react';
import { Settings, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFlowStore } from '@/store/flowStore';
import { useToast } from '@/hooks/use-toast';

export default function Header() {
  const { apiKey, setApiKey } = useFlowStore();
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

  return (
    <header className="h-16 glass-panel border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/20 electric-glow">
          <Workflow className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            DocFlow <span className="text-primary">AI</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            YAML Converter & Visualizer
          </p>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <Settings className="w-5 h-5" />
            {!apiKey && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-node-decision rounded-full animate-pulse" />
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="glass-panel border-border">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Configure your OpenAI API key for AI-powered flow modifications.
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
                Without an API key, the app runs in simulation mode.
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
    </header>
  );
}
