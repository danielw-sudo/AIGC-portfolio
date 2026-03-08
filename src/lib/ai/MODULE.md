# Module: ai

## Purpose
Workers AI integration. Model catalog, tier configuration, text analysis, vision tagging, response parsing.

## Depends On
- `core` — types (TagRow only)

## Exposes

### Classes
- `AIService(ai, db)` — `.analyze(prompt, tier, config): AnalyzeResult`
- `VisionService(ai, db)` — `.analyzeImage(imageUrl): VisionResult`, `.recoverPrompt(imageUrl): PromptResult`

### Functions
- `parseAIMarkdown(md)` — parse gallery AI markdown into typed fields
- `parseBlogAIMarkdown(md)` — parse blog AI markdown into typed fields

### Config
- `AI_MODEL_CATALOG` — 26-model array with provider/size/description
- `findModel(modelId)` — lookup in catalog
- `DEFAULT_TIER_MODELS` — { fast, balanced, quality } model IDs
- `DEFAULT_RECIPE` — system prompt template with `{{TAGS}}` placeholder
- `DEFAULT_AI_CONFIG` — combined defaults

### Types
- `AIModelTier` — 'fast' | 'balanced' | 'quality'
- `AIConfig` — { fast, balanced, quality, recipe }
- `AIModelInfo` — catalog entry shape
- `AnalyzeResult` — { markdown, model, parsed: ParsedAIResponse }
- `ParsedAIResponse` — { title, prompt, description, tags[], newTags[] }
- `ParsedBlogAIResponse` — { title, summary, body, topics[], newTopics[] }
- `VisionResult` — { tags[], model }
- `PromptResult` — { prompt, model }

## Files
| File | Lines | Purpose |
|------|-------|---------|
| service.ts | 65 | AIService — Workers AI wrapper + parser integration |
| models.ts | 171 | Model catalog + config defaults |
| parsers.ts | 95 | Unified parser — gallery + blog AI markdown → structured fields |
| vision.ts | 55 | VisionService — image analysis via vision model |
| index.ts | 14 | Barrel exports |

## Used By
- `api/analyze.ts` — AI analysis endpoint (text + vision)
- `api/blog-analyze.ts` — Blog AI analysis endpoint
- `api/settings.ts` — reads/writes AI config
- `admin/settings.astro` — model tier UI + recipe editor
- `data/settings.ts` — imports defaults for fallback
