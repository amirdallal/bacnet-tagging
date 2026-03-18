import { config } from '../config.js';
import type { ParsedPoint } from '../types/bacnet.js';
import type { EnrichmentResult, BrickClass, HaystackTags } from '../types/enrichment.js';

/** Provider interface for pluggable AI backends */
interface AIProvider {
  name: string;
  available(): Promise<boolean>;
  enhance(point: ParsedPoint, systemPrompt: string, userPrompt: string): Promise<AIResponse | null>;
}

interface AIResponse {
  brickClass: BrickClass;
  haystackTags: HaystackTags;
  confidence: number;
  reasoning: string;
}

/** Context passed to AI for richer classification */
export interface AIContext {
  /** Other points on the same device (up to 20) */
  siblingPoints?: Array<{ name: string; type: string; units: string; brickLabel?: string }>;
  /** Device metadata */
  device?: { vendorName?: string; modelName?: string; displayName?: string; deviceId?: string };
  /** Few-shot examples from user corrections */
  corrections?: Array<{ name: string; type: string; units: string; brickLabel: string; markers: string[] }>;
}

const SYSTEM_PROMPT = `You are an expert in BACnet building automation, BRICK ontology (https://brickschema.org/), and Project Haystack (https://project-haystack.org/) semantic tagging.

Your task: Given a BACnet point, classify it with the MOST SPECIFIC and COMPLETE set of tags possible.

BRICK ONTOLOGY:
- Use the most specific BRICK class that fits (e.g., "Zone_Air_Temperature_Sensor" not just "Temperature_Sensor")
- Use the full URI format: https://brickschema.org/schema/Brick#Class_Name

HAYSTACK TAGS - be EXHAUSTIVE:
- Include ALL applicable marker tags. Common markers: point, sensor, cmd, sp, cur, his, air, water, temp, flow, pressure, humidity, co2, elec, power, energy, current, volt, freq, run, enable, alarm, fault, status, fan, pump, valve, damper, chiller, boiler, ahu, vav, heating, cooling, supply, return, discharge, mixed, outside, zone, occupied, unoccupied, hot, chilled, condenser, exhaust, relief, motor, vfd, speed, lead, lag, isolation, reheat, economizer, enthalpy, dew, wetBulb
- Include value tags where applicable: unit (fahrenheit, celsius, cfm, percent, psi, kW, kWh, ppm, inH2O), kind (Number, Bool, Str), equipRef, siteRef

CONFIDENCE:
- 0.95+ = exact match with high certainty
- 0.80-0.94 = strong match with context support
- 0.60-0.79 = reasonable match, some ambiguity
- Below 0.60 = uncertain

Respond ONLY with valid JSON:
{
  "brickUri": "https://brickschema.org/schema/Brick#Class_Name",
  "brickLabel": "Human Readable Label",
  "brickCategory": "Category",
  "haystackMarkers": ["tag1", "tag2", "tag3", ...],
  "haystackValues": {"unit": "fahrenheit", "kind": "Number"},
  "confidence": 0.85,
  "reasoning": "Brief explanation of classification"
}`;

/**
 * Build a rich user prompt with device context, siblings, and few-shot examples.
 */
function buildUserPrompt(point: ParsedPoint, context?: AIContext): string {
  const lines: string[] = [];

  lines.push(`Classify this BACnet point with the most specific BRICK class and ALL applicable Haystack tags:`);
  lines.push(``);
  lines.push(`POINT TO CLASSIFY:`);
  lines.push(`- Name: "${point.objectName}"`);
  lines.push(`- Object Type: ${point.objectType}`);
  lines.push(`- Units: ${point.units || 'none'}`);
  if (point.description) lines.push(`- Description: ${point.description}`);

  if (context?.device) {
    const d = context.device;
    lines.push(``);
    lines.push(`DEVICE CONTEXT:`);
    if (d.vendorName) lines.push(`- Vendor: ${d.vendorName}`);
    if (d.modelName) lines.push(`- Model: ${d.modelName}`);
    if (d.displayName) lines.push(`- Device Name: ${d.displayName}`);
    if (d.deviceId) lines.push(`- Device ID: ${d.deviceId}`);
  }

  if (context?.siblingPoints && context.siblingPoints.length > 0) {
    lines.push(``);
    lines.push(`OTHER POINTS ON THE SAME DEVICE (use these to infer equipment type and context):`);
    for (const s of context.siblingPoints) {
      const classified = s.brickLabel ? ` → ${s.brickLabel}` : '';
      lines.push(`- "${s.name}" [${s.type}] ${s.units || ''}${classified}`);
    }
  }

  if (context?.corrections && context.corrections.length > 0) {
    lines.push(``);
    lines.push(`REFERENCE EXAMPLES (user-verified classifications for similar points):`);
    for (const c of context.corrections) {
      lines.push(`- "${c.name}" [${c.type}] ${c.units} → ${c.brickLabel} | tags: ${c.markers.join(', ')}`);
    }
  }

  lines.push(``);
  lines.push(`Be EXHAUSTIVE with Haystack tags. Include equipment context tags (ahu, vav, chiller, pump, etc.) when identifiable from the device or name. Include value tags (unit, kind) when applicable.`);

  return lines.join('\n');
}

/**
 * Parse AI JSON response into structured result.
 */
function parseAIResponse(text: string): AIResponse | null {
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

// ============================================================
// Ollama provider — local, free LLM inference
// ============================================================
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

  async enhance(point: ParsedPoint, systemPrompt: string, userPrompt: string): Promise<AIResponse | null> {
    try {
      const res = await fetch(`${config.ollama.url}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.ollama.model,
          prompt: userPrompt,
          system: systemPrompt,
          stream: false,
          options: { temperature: 0.1 },
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) return null;
      const data = await res.json() as { response: string };
      return parseAIResponse(data.response);
    } catch {
      return null;
    }
  }
}

// ============================================================
// Claude API provider — higher accuracy, paid
// ============================================================
class ClaudeProvider implements AIProvider {
  name = 'claude';
  private dailySpendCents = 0;
  private lastResetDate = new Date().toDateString();

  async available(): Promise<boolean> {
    if (!config.claude.apiKey) return false;
    this.resetDailyBudget();
    return this.dailySpendCents < config.claude.dailyBudgetUsd * 100;
  }

  async enhance(point: ParsedPoint, systemPrompt: string, userPrompt: string): Promise<AIResponse | null> {
    if (!config.claude.apiKey) return null;
    this.resetDailyBudget();
    if (this.dailySpendCents >= config.claude.dailyBudgetUsd * 100) return null;

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
          max_tokens: 600,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) return null;

      const data = await res.json() as {
        content: Array<{ text: string }>;
        usage: { input_tokens: number; output_tokens: number };
      };
      // Cost estimate (Sonnet: ~$3/M input, $15/M output)
      const costCents = ((data.usage.input_tokens * 3 + data.usage.output_tokens * 15) / 1_000_000) * 100;
      this.dailySpendCents += costCents;

      const text = data.content?.[0]?.text ?? '';
      return parseAIResponse(text);
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

// ============================================================
// AIEnhancementService — pluggable AI with context-aware prompts
// ============================================================
export class AIEnhancementService {
  private ollama = new OllamaProvider();
  private claude = new ClaudeProvider();
  private providers: AIProvider[] = [this.ollama, this.claude];
  private callCount = 0;

  async isOllamaAvailable(): Promise<boolean> {
    return this.ollama.available();
  }

  /** Enhance using Ollama only (for auto-enrichment during parse) */
  async enhanceWithOllama(point: ParsedPoint, context?: AIContext): Promise<EnrichmentResult | null> {
    if (!(await this.ollama.available())) return null;
    return this.enhanceWith(this.ollama, point, context);
  }

  /** Enhance using full fallback chain: Ollama → Claude */
  async enhance(point: ParsedPoint, context?: AIContext): Promise<EnrichmentResult | null> {
    for (const provider of this.providers) {
      if (!(await provider.available())) continue;
      const result = await this.enhanceWith(provider, point, context);
      if (result) return result;
    }
    return null;
  }

  private async enhanceWith(provider: AIProvider, point: ParsedPoint, context?: AIContext): Promise<EnrichmentResult | null> {
    const start = performance.now();
    const userPrompt = buildUserPrompt(point, context);
    const response = await provider.enhance(point, SYSTEM_PROMPT, userPrompt);
    if (!response) return null;

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

  getStats(): { callCount: number; providers: string[] } {
    return { callCount: this.callCount, providers: this.providers.map(p => p.name) };
  }
}
