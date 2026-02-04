import yaml from 'js-yaml';
import type { FlowData, FlowStep } from '@/store/flowStore';

interface ParsedSection {
  title: string;
  content: string;
  isQuestion: boolean;
  options: string[];
}

/**
 * Attempts to programmatically parse document text into a YAML flow structure.
 * This is a rule-based approach that looks for common patterns in documents.
 */
export function programmaticParse(rawText: string, fileName: string): { success: boolean; yaml?: string; error?: string } {
  try {
    // Clean and normalize text
    const cleanText = rawText
      .replace(/\r\n/g, '\n')
      .replace(/\t/g, ' ')
      .trim();

    if (cleanText.length < 20) {
      return { success: false, error: 'Document too short to parse' };
    }

    // Try to extract sections/steps from the document
    const sections = extractSections(cleanText);
    
    if (sections.length < 2) {
      return { success: false, error: 'Could not identify enough sections/steps in the document' };
    }

    // Build the flow structure
    const flowData = buildFlowFromSections(sections, fileName);
    
    // Convert to YAML
    const yamlString = yaml.dump(flowData, {
      indent: 2,
      lineWidth: -1,
      quotingType: '"',
      forceQuotes: true,
    });

    return { success: true, yaml: yamlString };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown parsing error' 
    };
  }
}

function extractSections(text: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  
  // Common patterns for section headers
  const headerPatterns = [
    /^(?:paso|step|etapa)\s*(\d+)[:\.\-\s]*(.*)/gim,
    /^(\d+)[\.:\-\)]\s*(.+)/gm,
    /^[•\-\*]\s*(.+)/gm,
    /^#{1,3}\s*(.+)/gm,
  ];

  // Try numbered patterns first
  const numberedPattern = /(?:^|\n)(?:(?:paso|step|etapa)\s*)?(\d+)[\.:\-\)\s]+([^\n]+)(?:\n((?:(?!(?:paso|step|etapa)?\s*\d+[\.:\-\)]).)*))?/gi;
  let matches = [...text.matchAll(numberedPattern)];

  if (matches.length >= 2) {
    for (const match of matches) {
      const title = match[2]?.trim() || `Step ${match[1]}`;
      const content = match[3]?.trim() || '';
      const isQuestion = containsQuestion(title + ' ' + content);
      const options = extractOptions(content);
      
      sections.push({ title, content, isQuestion, options });
    }
    return sections;
  }

  // Try bullet point patterns
  const bulletPattern = /(?:^|\n)[•\-\*]\s*([^\n]+)(?:\n((?:(?![•\-\*]).)*))?/g;
  matches = [...text.matchAll(bulletPattern)];

  if (matches.length >= 2) {
    for (const match of matches) {
      const title = match[1]?.trim() || 'Step';
      const content = match[2]?.trim() || '';
      const isQuestion = containsQuestion(title + ' ' + content);
      const options = extractOptions(content);
      
      sections.push({ title, content, isQuestion, options });
    }
    return sections;
  }

  // Fallback: split by double newlines (paragraphs)
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 10);
  
  if (paragraphs.length >= 2) {
    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i].trim();
      const firstLine = para.split('\n')[0] || para.substring(0, 50);
      const content = para.split('\n').slice(1).join('\n');
      const isQuestion = containsQuestion(para);
      const options = extractOptions(para);
      
      sections.push({ 
        title: firstLine.length > 60 ? firstLine.substring(0, 60) + '...' : firstLine,
        content,
        isQuestion,
        options 
      });
    }
    return sections;
  }

  return sections;
}

function containsQuestion(text: string): boolean {
  const questionIndicators = [
    /\?/,
    /^¿/,
    /si\s+.+\s+entonces/i,
    /es\s+.+\s+o\s+/i,
    /verificar/i,
    /comprobar/i,
    /check/i,
    /is\s+.+\s+or\s+/i,
    /decide/i,
    /decisión/i,
  ];
  
  return questionIndicators.some(pattern => pattern.test(text));
}

function extractOptions(text: string): string[] {
  const options: string[] = [];
  
  // Look for yes/no patterns
  if (/\b(sí|si|yes)\b.*\b(no)\b/i.test(text) || /\b(no)\b.*\b(sí|si|yes)\b/i.test(text)) {
    return ['Sí', 'No'];
  }
  
  // Look for a/b patterns
  const abPattern = /(?:^|\n)\s*[a-d][\.\)\-]\s*([^\n]+)/gi;
  const abMatches = [...text.matchAll(abPattern)];
  if (abMatches.length >= 2) {
    return abMatches.map(m => m[1].trim()).slice(0, 4);
  }
  
  // Look for "or" patterns
  const orPattern = /(.+?)\s+(?:o|or)\s+(.+)/i;
  const orMatch = text.match(orPattern);
  if (orMatch) {
    return [orMatch[1].trim(), orMatch[2].trim()].filter(o => o.length < 50);
  }
  
  return options;
}

function buildFlowFromSections(sections: ParsedSection[], fileName: string): FlowData {
  const flowId = fileName
    .replace(/\.docx$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  const steps: Record<string, FlowStep> = {};
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const stepKey = `step_${i + 1}`;
    const isLast = i === sections.length - 1;
    const nextStepKey = isLast ? undefined : `step_${i + 2}`;
    
    // Determine step type
    let type: FlowStep['type'];
    if (i === 0) {
      type = 'start';
    } else if (isLast) {
      type = 'end';
    } else if (section.isQuestion && section.options.length >= 2) {
      type = 'decision';
    } else if (section.isQuestion) {
      type = 'decision';
    } else {
      type = 'action';
    }
    
    const step: FlowStep = {
      type,
      label: section.title.length > 40 ? section.title.substring(0, 40) + '...' : section.title,
      description: section.content || section.title,
    };
    
    if (type === 'decision') {
      // Create options for decision nodes
      if (section.options.length >= 2) {
        step.options = section.options.slice(0, 2).map((opt, idx) => ({
          label: opt,
          next_step: nextStepKey || stepKey, // Point to next or loop
        }));
      } else {
        // Default yes/no
        step.options = [
          { label: 'Sí', next_step: nextStepKey || stepKey },
          { label: 'No', next_step: nextStepKey || stepKey },
        ];
      }
    } else if (!isLast) {
      step.next_step = nextStepKey;
    }
    
    steps[stepKey] = step;
  }
  
  return {
    flow_id: flowId || 'parsed_flow',
    name: fileName.replace(/\.docx$/i, '') || 'Parsed Flow',
    steps,
  };
}
