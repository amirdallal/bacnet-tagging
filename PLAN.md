# BACnet Semantic Intelligence Service — Implementation Plan

## Data Analysis Summary
- **55,620 total objects** across 2 sites (35,496 supported)
- Monarch Beach: 124 devices, 13,644 objects (Delta Controls, abbreviation naming)
- Biscayne Blvd: 67 devices, 41,976 objects (Trane, pipe-separated naming `Name|device-ref`)
- 6,795 vendor proprietary objects (unsupported, will be skipped/flagged)
- Top categories: VAV (21K), setpoints (7K), temperature (5K), valve/damper (5K), flow (3K)

## Technology Stack
- **Runtime**: TypeScript + Node.js (type safety for complex BRICK/Haystack structures)
- **API Framework**: Express.js with middleware (auth, CORS, error handling)
- **AI Providers**: Pluggable — Ollama (local/free) + Claude API (paid, cached)
- **Cache**: In-memory Map with TTL (Redis-ready interface for future)
- **Testing**: Vitest (fast, TypeScript-native)
- **Container**: Docker + docker-compose (includes optional Ollama sidecar)
- **Build**: tsup (fast TypeScript bundler)

## Project Structure
```
bacnet-tagging/
├── src/
│   ├── server.ts                    # Express app entry point
│   ├── config.ts                    # Environment-driven configuration
│   ├── routes/
│   │   ├── health.ts                # GET /health
│   │   ├── stats.ts                 # GET /api/stats
│   │   ├── parse.ts                 # POST /api/parse
│   │   ├── enrich.ts                # POST /api/enrich
│   │   ├── enhance.ts               # POST /api/enhance-with-ai
│   │   ├── generateTd.ts            # POST /api/generate-td
│   │   ├── updateInference.ts       # POST /api/update-inference
│   │   └── review.ts                # GET/POST /api/review/*
│   ├── services/
│   │   ├── DiscoveryReportParser.ts # Parse JSON/CSV BACnet reports
│   │   ├── SemanticEnricher.ts      # Pattern matching engine
│   │   ├── ConfidenceClassifier.ts  # Score stratification + flagging
│   │   ├── PatternCacheService.ts   # In-memory cache with TTL
│   │   ├── AIEnhancementService.ts  # Pluggable AI (Ollama + Claude)
│   │   ├── LearningService.ts       # Record corrections, suggest patterns
│   │   └── ThingDescriptionGenerator.ts # W3C TD output
│   ├── middleware/
│   │   ├── auth.ts                  # Basic Auth middleware
│   │   └── errorHandler.ts          # Global error handling
│   ├── patterns/
│   │   └── index.ts                 # 200+ regex patterns (compiled)
│   └── types/
│       ├── bacnet.ts                # BACnet input types
│       ├── enrichment.ts            # Enrichment result types
│       └── td.ts                    # Thing Description types
├── test/
│   ├── parser.test.ts
│   ├── enricher.test.ts
│   ├── patterns.test.ts
│   └── td-generator.test.ts
├── data/                            # Sample test data (small extracts)
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
└── .env.example
```

## Implementation Steps (10 steps)

### Step 1: Project scaffolding
- Initialize npm project, install TypeScript, Express, vitest, tsup
- Configure tsconfig.json, .env.example
- Create type definitions for all data structures (bacnet.ts, enrichment.ts, td.ts)

### Step 2: DiscoveryReportParser
- Parse JSON discovery reports (the exact format from the real files)
- Handle pipe-separated names from Biscayne (`Name|device-ref` → split into name + equipment ref)
- Normalize device/object structures into typed interfaces
- Skip vendor proprietary objects (flag them separately)
- Statistics output: device count, object count, type distribution, vendor breakdown

### Step 3: Pattern matching engine (SemanticEnricher)
Build 200+ regex patterns organized by category, tuned against the real data:
- **Temperature** (15 patterns): OSA Temp, CHWRT, CHWST, HWR_TEMP, Space Temperature, etc.
- **Flow/CFM** (10 patterns): Airflow, Discharge Air Flow, Ventilation Setpoint, etc.
- **Pressure** (8 patterns): Static Pressure, DP, Differential Pressure, etc.
- **Humidity** (6 patterns): OSA Humidity, spaceHumidity, RH, etc.
- **Power/Energy** (12 patterns): KW, KWH, Amps, Volts, etc.
- **Setpoints** (15 patterns): Heating Setpoint, Cooling Setpoint, SP, SPT, etc.
- **Valve/Damper** (12 patterns): CHW_VALVE, ECON_DAMPER, Air Valve Position, etc.
- **Fan/Motor** (10 patterns): Fan Status, Drive HZ, Drive Percent, VFD, etc.
- **VAV controls** (20 patterns): VAV zone temp, airflow, reheat, etc.
- **Status/Alarm** (10 patterns): ALARM, STATUS, FAULT, etc.
- **CO2** (5 patterns): Room CO2, Return Air CO2, CO2 Setpoint, etc.
- **Occupancy** (8 patterns): Occupied, System Occupied, occupiedMode, etc.
- **Chiller/Boiler** (15 patterns): CH_1, Chiller, Condenser, Cooling Tower, etc.
- **Pump** (8 patterns): CWP, SCHWP, HW_PUMP, etc.
- **Miscellaneous** (46+ patterns): Schedule, Override, Communication Link, etc.

Each pattern includes: regex, BRICK class, Haystack tags, confidence, unit validation.
Handle both naming conventions: `OSA Temp` (space-separated) and `spaceTemperature|vav-75` (camelCase pipe).

### Step 4: ConfidenceClassifier
- Calculate composite confidence from pattern match + unit validation
- Stratify: HIGH (≥0.80), MEDIUM (0.50-0.79), LOW (0.20-0.49), NO_MATCH (<0.20)
- Flag for review based on thresholds
- Track alternative matches when multiple patterns compete

### Step 5: PatternCacheService
- In-memory Map with TTL (24h default)
- Cache key: `hash(objectName + objectType + units)`
- Hit/miss tracking for stats
- Interface compatible with future Redis/PostgreSQL swap

### Step 6: AIEnhancementService (pluggable)
- **Provider interface**: `enhance(point, context) → EnrichmentResult`
- **OllamaProvider**: Local LLM via Ollama HTTP API (http://localhost:11434)
  - Uses models like `llama3.1`, `mistral`, or `qwen2.5` — user's choice
  - Zero cost, runs locally, good for 70-80% of AI cases
- **ClaudeProvider**: Anthropic API for highest accuracy
  - Claude Sonnet for cost efficiency
  - 24h+ cache TTL
  - Budget controls with daily limits
- **Fallback chain**: Pattern → Cache → Ollama → Claude API → return low-confidence
- Cost tracking per call

### Step 7: LearningService
- In-memory store for user corrections
- Record original vs. corrected classification
- Apply corrections to similar points (cache update)
- Suggest pattern improvements when trends emerge (3+ corrections)

### Step 8: ThingDescriptionGenerator
- Generate W3C-compliant Thing Descriptions (JSON-LD)
- Include BRICK class as @type, Haystack tags, confidence, enrichment metadata
- Per-device TD with all enriched objects as properties
- Enrichment summary (high/medium/low counts, flagged for review)

### Step 9: REST API + Docker
- Express server with all endpoints from the spec
- Basic Auth middleware
- CORS support
- File upload via multer (POST /api/parse)
- Docker + docker-compose with optional Ollama sidecar
- Health check, stats, all enrichment endpoints

### Step 10: Tests + validation against real data
- Unit tests for parser, enricher, patterns, TD generator
- Integration test: full pipeline with sample data extracted from real files
- Pattern coverage report against all 35,496 supported objects

## Key Design Decisions
1. **Pipe-separated names**: Split on `|`, use left part for enrichment, right part as equipment reference
2. **Vendor proprietary objects**: Skip enrichment, flag as NO_MATCH with reason "vendor_proprietary"
3. **Unsupported objects**: Include in output but mark as unsupported, don't enrich
4. **camelCase handling**: Patterns handle both `spaceTemperature` and `Space Temperature`
5. **AI is optional**: System works fully with patterns only; AI enhances uncertain points
6. **Ollama default**: Docker-compose includes Ollama for zero-cost local AI
