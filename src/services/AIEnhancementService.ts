import { config } from '../config.js';
import type { ParsedPoint } from '../types/bacnet.js';
import type { EnrichmentResult, BrickClass, HaystackTags } from '../types/enrichment.js';

/** Provider interface for pluggable AI backends */
interface AIProvider {
  name: string;
  available(): Promise<boolean>;
  enhance(point: ParsedPoint, context?: string): Promise<AIResponse | null>;
}

interface AIResponse {
  brickClass: BrickClass;
  haystackTags: HaystackTags;
  confidence: number;
  reasoning: string;
}

const SYSTEM_PROMPT = `You are a BACnet/BRICK/Haystack semantic tagging expert. Given a BACnet point name, object type, and units, classify it with:
1. The most specific BRICK ontology class URI
2. Appropriate Haystack tags (marker tags as array, value tags as object)
3. A confidence score from 0.0 to 1.0

Respond ONLY with valid JSON in this exact format:
{
  "brickUri": "https://brickschema.org/schema/Brick#Class_Name",
  "brickLabel": "Human Readable Label",
  "brickCategory": "Category",
  "haystackMarkers": ["tag1", "tag2"],
  "haystackValues": {"key": "value"},
  "confidence": 0.85,
  "reasoning": "Brief explanation"
}`;

/**
 * Ollama provider — local, free LLM inference.
 */
class OllamaProvider implements AIProvider {
  name = 'ollama';

  async available(): Promise<boolean> {
    try {
      const res = await fetch(`${config.ollama.url}/api/tags`, { signal: AbortSignal.timeout(3000) });
      return res.ok;
    } catch {
      return false;
    }
  }

  async enhance(point: ParsedPoint, context?: string): Promise<AIResponse | null> {
    const userPrompt = this.buildPrompt(point, context);
    try {
      const res = await fetch(`${config.ollama.url}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.ollama.model,
          prompt: userPrompt,
          system: SYSTEM_PROMPT,
          stream: false,
          options: { temperature: 0.1 },
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) return null;
      const data = await res.json() as { response: string };
      return this.parseResponse(data.response);
    } catch {
      return null;
    }
  }

  private buildPrompt(point: ParsedPoint, context?: string): string {
    let prompt = `Classify this BACnet point:\n- Name: "${point.objectName}"\n- Object Type: ${point.objectType}\n- Units: ${point.units || 'none'}\n- Vendor: ${point.vendorName}\n- Equipment Ref: ${point.equipmentRef || 'none'}`;
    if (context) prompt += `\n- Additional Context: ${context}`;
    return prompt;
  }

  private parseResponse(text: string): AIResponse | null {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;
      const parsed = JSON.parse(jsonMatch[0]) as {
        brickUri: string;
        brickLabel: string;
        brickCategory: string;
        haystackMarkers: string[];
        haystackValues: Record<string, string>;
        confidence: number;
        reasoning: string;
      };
      return {
        brickClass: {
          uri: parsed.brickUri,
          label: parsed.brickLabel,
          category: parsed.brickCategory,
        },
        haystackTags: {
          marker: parsed.haystackMarkers ?? [],
          value: parsed.haystackValues ?? {},
        },
        confidence: Math.min(1.0, Math.max(0.0, parsed.confidence ?? 0.5)),
        reasoning: parsed.reasoning ?? '',
      };
    } catch {
      return null;
    }
  }
}

/**
 * Claude API provider — higher accuracy, paid.
 */
class ClaudeProvider implements AIProvider {
  name = 'claude';
  private dailySpendCents = 0;
  private lastResetDate = new Date().toDateString();

  async available(): Promise<boolean> {
    if (!config.claude.apiKey) return false;
    this.resetDailyBudget();
    return this.dailySpendCents < config.claude.dailyBudgetUsd * 100;
  }

  async enhance(point: ParsedPoint, context?: string): Promise<AIResponse | null> {
    if (!config.claude.apiKey) return null;
    this.resetDailyBudget();
    if (this.dailySpendCents >= config.claude.dailyBudgetUsd * 100) return null;

    const userPrompt = `Classify this BACnet point:\n- Name: "${point.objectName}"\n- Object Type: ${point.objectType}\n- Units: ${point.units || 'none'}\n- Vendor: ${point.vendorName}\n- Equipment Ref: ${point.equipmentRef || 'none'}${context ? `\n- Context: ${context}` : ''}`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.claude.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.claude.model,
          max_tokens: 500,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userPrompt }],
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) return null;

      const data = await res.json() as {
        content: Array<{ text: string }>;
        usage: { input_tokens: number; output_tokens: number };
      };
      // Estimate cost (rough: $3/M input, $15/M output for Sonnet)
      const costCents = ((data.usage.input_tokens * 3 + data.usage.output_tokens * 15) / 1_000_000) * 100;
      this.dailySpendCents += costCents;

      const text = data.content?.[0]?.text ?? '';
      return this.parseResponse(text);
    } catch {
      return null;
    }
  }

  private parseResponse(text: string): AIResponse | null {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;
      const parsed = JSON.parse(jsonMatch[0]) as {
        brickUri: string;
        brickLabel: string;
        brickCategory: string;
        haystackMarkers: string[];
        haystackValues: Record<string, string>;
        confidence: number;
        reasoning: string;
      };
      return {
        brickClass: { uri: parsed.brickUri, label: parsed.brickLabel, category: parsed.brickCategory },
        haystackTags: { marker: parsed.haystackMarkers ?? [], value: parsed.haystackValues ?? {} },
        confidence: Math.min(1.0, Math.max(0.0, parsed.confidence ?? 0.5)),
        reasoning: parsed.reasoning ?? '',
      };
    } catch {
      return null;
    }
  }

  private resetDailyBudget(): void {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.dailySpendCents = 0;
      this.lastResetDate = today;
    }
  }
}

/**
 * AIEnhancementService — pluggable AI with fallback chain.
 * Order: Ollama (free, local) → Claude API (paid, higher accuracy)
 */
export class AIEnhancementService {
  private providers: AIProvider[] = [new OllamaProvider(), new ClaudeProvider()];
  private callCount = 0;

  /**
   * Enhance a point using AI providers (fallback chain).
   */
  async enhance(point: ParsedPoint, context?: string): Promise<EnrichmentResult | null> {
    const start = performance.now();

    for (const provider of this.providers) {
      if (!(await provider.available())) continue;

      const response = await provider.enhance(point, context);
      if (response) {
        this.callCount++;
        return {
          pointId: point.id,
          brickClass: response.brickClass,
          haystackTags: response.haystackTags,
          confidence: response.confidence,
          confidenceLevel: response.confidence >= 0.80 ? 'HIGH' : response.confidence >= 0.50 ? 'MEDIUM' : 'LOW',
          matchedPattern: null,
          alternativeMatches: [],
          flaggedForReview: response.confidence < 0.50,
          reviewReason: response.confidence < 0.50 ? 'AI classification below medium confidence' : null,
          enrichmentSource: provider.name === 'ollama' ? 'ai-ollama' : 'ai-claude',
          processingTimeMs: performance.now() - start,
        };
      }
    }

    return null; // All providers failed or unavailable
  }

  getStats(): { callCount: number; providers: string[] } {
    return {
      callCount: this.callCount,
      providers: this.providers.map(p => p.name),
    };
  }
}
