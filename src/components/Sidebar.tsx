import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  Download, 
  Copy, 
  Check, 
  Clock,
  Loader2,
  Cpu,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFlowStore } from '@/store/flowStore';
import { useToast } from '@/hooks/use-toast';
import mammoth from 'mammoth';
import { programmaticParse } from '@/lib/programmaticParser';
import { parseWithOpenAI } from '@/lib/openaiParser';

export default function Sidebar() {
  const { 
    yamlContent, 
    flowHistory, 
    addToHistory, 
    setYamlContent,
    isProcessing,
    setIsProcessing,
    flowData,
    apiKey
  } = useFlowStore();
  
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const docxFile = files.find(f => f.name.endsWith('.docx'));

    if (!docxFile) {
      toast({
        title: 'Invalid file',
        description: 'Please upload a .docx file',
        variant: 'destructive',
      });
      return;
    }

    await processDocxFile(docxFile);
  }, []);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processDocxFile(file);
    }
    e.target.value = '';
  };

  const processDocxFile = async (file: File) => {
    setIsProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const rawText = result.value;

      if (!rawText || rawText.trim().length < 20) {
        toast({
          title: 'Empty document',
          description: 'The document appears to be empty or too short.',
          variant: 'destructive',
        });
        return;
      }

      // STEP 1: Try programmatic parsing first
      toast({
        title: 'Analyzing document...',
        description: 'Attempting rule-based parsing',
      });

      const programmaticResult = programmaticParse(rawText, file.name);

      if (programmaticResult.success && programmaticResult.yaml) {
        // Programmatic parsing succeeded!
        toast({
          title: '✅ Parsed successfully',
          description: 'Document converted using rule-based analysis',
        });
        addToHistory(file.name);
        setYamlContent(programmaticResult.yaml);
        return;
      }

      // STEP 2: Programmatic failed, try OpenAI if we have a key
      if (apiKey && apiKey.length > 10 && !apiKey.includes('xxxxxxxx')) {
        toast({
          title: 'Rule-based parsing failed',
          description: 'Trying AI conversion...',
        });

        const aiResult = await parseWithOpenAI(rawText, file.name, apiKey);

        if (aiResult.success && aiResult.yaml) {
          toast({
            title: '✨ AI conversion successful',
            description: 'Document converted using OpenAI',
          });
          addToHistory(file.name);
          setYamlContent(aiResult.yaml);
          return;
        }

        // AI also failed
        toast({
          title: 'AI conversion failed',
          description: aiResult.error || 'Could not parse document with AI',
          variant: 'destructive',
        });
        return;
      }

      // STEP 3: No valid API key and programmatic failed
      toast({
        title: 'Conversion failed',
        description: `${programmaticResult.error || 'Could not parse document structure'}. Add an OpenAI API key to try AI-powered conversion.`,
        variant: 'destructive',
      });
    } catch (error) {
      toast({
        title: 'Error processing file',
        description: error instanceof Error ? error.message : 'Failed to extract text from document',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadYaml = () => {
    const blob = new Blob([yamlContent], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${flowData?.flow_id || 'flow'}.yaml`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Downloaded!',
      description: 'YAML file saved successfully',
    });
  };

  const handleCopyToClipboard = async () => {
    await navigator.clipboard.writeText(yamlContent);
    setCopied(true);
    toast({
      title: 'Copied!',
      description: 'YAML copied to clipboard',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-[250px] h-full glass-panel border-r border-border flex flex-col">
      {/* Upload Zone */}
      <div className="p-4 border-b border-border">
        <label
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`dropzone flex flex-col items-center justify-center p-6 text-center ${
            isDragging ? 'dropzone-active' : ''
          }`}
        >
          <input
            type="file"
            accept=".docx"
            onChange={handleFileInput}
            className="hidden"
          />
          {isProcessing ? (
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
          ) : (
            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
          )}
          <p className="text-sm font-medium text-foreground">
            {isProcessing ? 'Processing...' : 'Drop .docx here'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            or click to browse
          </p>
        </label>
      </div>

      {/* History */}
      <div className="flex-1 p-4 overflow-y-auto">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Clock className="w-3 h-3" />
          Detected Flows
        </h3>
        
        {flowHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground/60 italic">
            No flows yet
          </p>
        ) : (
          <div className="space-y-2">
            {flowHistory.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Export Actions */}
      <div className="p-4 border-t border-border space-y-2">
        <Button
          onClick={handleDownloadYaml}
          className="w-full justify-start gap-2"
          variant="secondary"
        >
          <Download className="w-4 h-4" />
          Download YAML
        </Button>
        <Button
          onClick={handleCopyToClipboard}
          className="w-full justify-start gap-2"
          variant="outline"
        >

          {copied ? (
            <Check className="w-4 h-4 text-node-start" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </Button>
      </div>
    </div>
  );
}
