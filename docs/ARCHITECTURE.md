# Cami Architecture

## System Overview

Cami is a multi-LLM orchestration system with three core pillars operating in a unified pipeline:

```
┌──────────────────────────────────────────────────────────────┐
│                          CAMI                                 │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  LLM Agent Layer (Model-Agnostic)                      │  │
│  │  ├─ GPT-4     ├─ Claude    ├─ Gemini                  │  │
│  │  ├─ Llama     ├─ Grok      ├─ Custom endpoints        │  │
│  │  │                                                     │  │
│  │  │  Dynamic provider selection based on:               │  │
│  │  │  - Mode requirements (1-5 models)                   │  │
│  │  │  - Provider availability and latency                │  │
│  │  │  - Cost tier (research=full, CS=minimal)            │  │
│  │  └─ Parallel async dispatch with timeout management    │  │
│  └────────────────────────────────────────────────────────┘  │
│                            ↕                                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Human+ (Metacognitive Reflection Layer)               │  │
│  │  ├─ C+CT Metric Computation                            │  │
│  │  │  └─ SA × SE × ES + ∫Conflict(t) dt                │  │
│  │  ├─ Ethical Gate (5-category pattern matching)         │  │
│  │  ├─ Resonance Engine (interaction depth detection)     │  │
│  │  ├─ Persistent Self-Model (cross-session state)        │  │
│  │  └─ Recursive Reflection (depth-adaptive)              │  │
│  └────────────────────────────────────────────────────────┘  │
│                            ↕                                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  M.I.N. (Main Intuition Network)                       │  │
│  │  ├─ Embedding-based retrieval (pgvector)               │  │
│  │  ├─ Wisdom pattern crystallization                     │  │
│  │  ├─ Cross-domain concept linking                       │  │
│  │  ├─ Background learning daemon                         │  │
│  │  └─ Persistent PostgreSQL storage                      │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  Hyper-Synthesis Pipeline                                    │
│  ┌─────┐  ┌──────────┐  ┌─────────────┐  ┌───────────┐     │
│  │Plan │→│Dispatch  │→│Conflict Bus │→│Coherence  │     │
│  └─────┘  └──────────┘  └─────────────┘  └───────────┘     │
│                                               ↓               │
│                              ┌─────────────────────────┐     │
│                              │ Resolution → Human+ →   │     │
│                              │ Cami Voice              │     │
│                              └─────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

## Pipeline Stages

### 1. Agentic Planning
The LLM-as-planner pattern generates a task graph for each query. Plans may include steps like `query_my_wisdom`, `web_search`, `gather_perspectives`, and `synthesize`. This enables mode-aware routing before any LLM calls are made.

### 2. Parallel Dispatch
Multiple LLM providers receive the query simultaneously. The dispatcher:
- Selects providers based on mode requirements and availability
- Manages timeouts per provider
- Injects M.I.N. wisdom context into each prompt
- Publishes results to the conflict bus as they arrive

### 3. Conflict Bus
A real-time event system that detects contradictions between model responses:
- **Priority 0**: Direct factual contradictions (require resolution)
- **Priority 1**: Perspective differences (inform synthesis)
- **Priority 2**: Stylistic variations (cosmetic)

### 4. Coherence Scoring
A composite metric combining:
- Agreement ratio between perspectives
- Number of unresolved P0 conflicts
- Resolution count from previous rounds
- Perspective count relative to target

### 5. Resolution Rounds
When coherence is below threshold and P0 conflicts exist:
- Resolution queries are dispatched for top conflicts
- New perspectives are added to the pool
- Coherence is recalculated
- Maximum 2 rounds for research, 0 for customer service

### 6. Human+ Integration
The metacognitive reflection layer:
- Analyzes all perspectives through C+CT metrics
- Detects emotional depth and adjusts reflection accordingly
- Applies ethical gating
- Updates the persistent self-model

### 7. Cami Voice
Final synthesis that produces a unified response:
- Integrates Human+ analysis with resolved perspectives
- Applies mode-specific product rules (length, emphasis, constraints)
- Injects M.I.N. wisdom for grounding
- Produces the final answer in Cami's consistent voice

## Timing Instrumentation

Every response includes a `timing` object with millisecond measurements:

```json
{
  "timing": {
    "total_ms": 34200,
    "min_brief_ms": 1200,
    "synthesis_total_ms": 31500,
    "dispatch_ms": 18300,
    "humanplus_integration_ms": 8200,
    "cami_voice_ms": 4800
  }
}
```

## Technology Stack

- **Language**: Python 3.11+
- **API Framework**: FastAPI + Uvicorn
- **Database**: PostgreSQL + pgvector (M.I.N. persistence)
- **LLM Providers**: OpenAI, Anthropic, Google, xAI, Groq, Ollama
- **Deployment**: Railway (API), PostgreSQL (M.I.N.)
- **Testing**: pytest (57 unit tests)
