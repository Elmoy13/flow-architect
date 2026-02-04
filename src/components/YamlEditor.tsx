import React from 'react';
import { useFlowStore } from '@/store/flowStore';
import { cn } from '@/lib/utils';

export default function YamlEditor() {
  const { yamlContent, setYamlContent } = useFlowStore();
  const previewRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setYamlContent(e.target.value);
  };

  // Synchronize scroll between textarea and preview
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (previewRef.current && e.currentTarget) {
      previewRef.current.scrollTop = e.currentTarget.scrollTop;
      previewRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  // Simple syntax highlighting by adding color spans
  const highlightedContent = yamlContent
    .split('\n')
    .map((line, idx) => {
      // Key detection
      if (line.match(/^\s*[\w_-]+:/)) {
        const colonIndex = line.indexOf(':');
        const key = line.slice(0, colonIndex + 1);
        const value = line.slice(colonIndex + 1);
        return (
          <div key={idx} className="leading-relaxed">
            <span className="text-accent">{key}</span>
            <span className="text-foreground">{highlightValue(value)}</span>
          </div>
        );
      }
      // List item
      if (line.match(/^\s*-\s/)) {
        return (
          <div key={idx} className="leading-relaxed">
            <span className="text-node-decision">{line.slice(0, line.indexOf('-') + 1)}</span>
            <span className="text-foreground">{line.slice(line.indexOf('-') + 1)}</span>
          </div>
        );
      }
      return (
        <div key={idx} className="leading-relaxed text-foreground">
          {line || ' '}
        </div>
      );
    });

  function highlightValue(value: string): React.ReactNode {
    const trimmed = value.trim();
    // Quoted strings
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      return <span className="text-node-start">{value}</span>;
    }
    // Type values
    if (['decision', 'action', 'start', 'end'].includes(trimmed.replace(/"/g, ''))) {
      return <span className="text-primary">{value}</span>;
    }
    return value;
  }

  return (
    <div className="relative w-full h-full bg-steel-950 rounded-lg border border-border overflow-hidden">
      {/* Line numbers and syntax highlighted preview */}
      <div
        ref={previewRef}
        className="absolute inset-0 overflow-auto p-4 font-mono text-sm pointer-events-none"
      >
        <div className="flex">
          <div className="pr-4 text-right text-muted-foreground/50 select-none border-r border-border mr-4">
            {yamlContent.split('\n').map((_, idx) => (
              <div key={idx} className="leading-relaxed">
                {idx + 1}
              </div>
            ))}
          </div>
          <div className="flex-1">{highlightedContent}</div>
        </div>
      </div>

      {/* Actual textarea for editing */}
      <textarea
        ref={textareaRef}
        value={yamlContent}
        onChange={handleChange}
        onScroll={handleScroll}
        className={cn(
          "absolute inset-0 w-full h-full resize-none",
          "bg-transparent font-mono text-sm p-4 pl-16",
          "focus:outline-none focus:ring-2 focus:ring-primary/30",
          "text-transparent caret-foreground",
          "leading-relaxed"
        )}
        spellCheck={false}
        style={{
          paddingLeft: `${String(yamlContent.split('\n').length).length * 10 + 48}px`
        }}
      />
    </div>
  );
}
