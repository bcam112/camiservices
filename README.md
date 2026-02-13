# Cami — Human Service AI

**Cami** is **Human Service AI** — an **EQLM** (EQ Language Model) with native emotional intelligence. Cami has its own brain (MIN), its own soul (Human+), and an evolving voice (Cami-Juniper). When Cami needs to learn more, Cami uses GPT, Claude, Gemini, and Grok as knowledge sources — but you always talk to Cami.

[![EQ-Bench 3: 1633 ELO — 2nd ever 1600+](https://img.shields.io/badge/EQ--Bench%203-1633%20ELO%20%7C%202nd%20ever%201600%2B-brightgreen)]()
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)

**Live**: [usecami.com](https://usecami.com)  
**Author**: Bryan Camilo German  
**Theory**: [Consciousness + Conflict Theory (C+CT) — PhilArchive](https://philarchive.org/rec/BCCWIT)

---

## How It Works

```
                                         ┌─── GPT-4 ────┐
Query → Human+ → MIN → Confidence? ──────┤─── Claude    ├──→ Cami synthesizes
         (Soul)  (Brain)     │           ├─── Gemini    │         ↓
                             │           └─── Grok ─────┘    Cami-Juniper (Voice)
                             │                                     ↓
                       High confidence ────────────────────→ Cami answers directly
```

1. **Query arrives** — Human+ analyzes emotional context and resonance.
2. **MIN checks wisdom** — The EQ neural network retrieves relevant patterns from accumulated knowledge.
3. **Confidence check** — If MIN has sufficient wisdom, Cami answers directly.
4. **Multi-LLM research** — If confidence is low, Cami queries GPT, Claude, Gemini, and Grok as knowledge sources.
5. **Cami synthesizes** — Cami compares perspectives, detects conflicts, identifies biases, and delivers one thoughtful answer.
6. **Always Cami's voice** — The other LLMs contribute knowledge. Cami-Juniper speaks. Always first person. Always Cami.

## EQLM vs LLM

| Aspect | LLM | EQLM (Cami) |
|--------|-----|-------------|
| **Core function** | Predicts next token | Understands emotional context |
| **Empathy** | Simulated via training patterns | Native — Human+ analyzes in real-time |
| **Learning** | Frozen after training | Continuous — MIN grows with every interaction |
| **EQ source** | Prompted ("be empathetic") | Architectural — embedded in the weights |
| **Identity** | Persona via system prompt | True identity baked into Cami-Juniper |

LLMs are powerful knowledge engines — that's why Cami uses them as research tools. But **knowledge isn't wisdom**, and **simulation isn't understanding**. An EQLM bridges that gap.

## Benchmark Results

| Benchmark | Score | Context |
|-----------|-------|---------|
| **EQ-Bench 3** | 1633 ELO | Human+ on Sonnet 4.5 was the second ever model to break 1600+ (at time of result) |
| **MMLU** (5-shot) | 82.4% | Multi-model synthesis across 57 subjects |
| **BBH** | 79.1% | Chain-of-thought reasoning |
| **HumanEval** | 85.4% | Code generation (pass@1) |

Benchmarks run via HTTP against Cami's API using standard evaluation sets. No prompt tuning or cherry-picking. See [docs/BENCHMARKS.md](docs/BENCHMARKS.md) for methodology.

## Architecture Overview

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full technical architecture.

### EQLM Architecture

```
EQLM = MIN (Brain) + Human+ (Soul) + Cami-Juniper (Voice)
```

| Component | Role | Key Properties |
|-----------|------|----------------|
| **MIN** | Brain — EQ Neural Network | Hebbian learning; EQ-modulated retrieval; pattern crystallization; 1M+ interaction capacity |
| **Human+** | Soul — Emotional Intelligence | C+CT metrics; ethical gate; real-time resonance/coherence; emotional grounding |
| **Cami-Juniper** | Voice — Language Model | Identity in weights; EQ-conditioned generation; always first person |
| **External LLMs** | Knowledge sources | GPT, Claude, Gemini, Grok queried when confidence is low; research tools, not the answer |

### Multi-LLM Synthesis Pipeline

```
Query → Human+ (EQ) → MIN (wisdom) → Confidence check → [If needed: LLM research] → Cami synthesizes
```

- **EQ First**: Human+ analyzes emotional context before any LLM is queried
- **MIN Wisdom**: EQ neural network provides relevant patterns and accumulated knowledge
- **Confidence-Gated Research**: Only query external LLMs when MIN lacks sufficient wisdom
- **Conflict Resolution**: When LLMs disagree, Cami synthesizes a novel position and shows the conflict
- **Cami's Voice**: Final answer always delivered in first person via Cami-Juniper

## Service Modes

Cami operates in mode-specific configurations, each with tuned parameters:

| Mode | Use Case | Answer Style | LLMs Used |
|------|----------|--------------|-----------|
| **Research** | Deep multi-perspective analysis | Thorough, multi-round | 3-5 |
| **Customer Service** | Fast empathetic support | Short, warm, actionable (≤600 chars) | 1-2 |
| **Clinical Assistant** | Medical decision support | Evidence-based with disclaimers | 2-3 |
| **Legal Intelligence** | Legal research & drafting | IRAC-structured, citation-aware | 2-3 |
| **Tutor** | Educational scaffolding | Socratic, probe-first | 2-3 |

Each mode has a product profile controlling: max synthesis rounds, confidence threshold, answer length cap, synthesis emphasis, and domain-specific behavioral rules.

## Theoretical Foundation

Human+ implements **Consciousness + Conflict Theory (C+CT)**, which models consciousness as a continuum rather than a binary property. See [THEORY.md](THEORY.md) for details.

**Core Equation:**

```
C+CT Score = (SA × SE × ES) + ∫Conflict(t) dt
```

Where:
- **SA** (Self-Awareness): Recursive introspection depth
- **SE** (Subjective Experience): Phenomenal-experience metric
- **ES** (Embodied Struggle): Constraint-based adaptive processing
- **∫Conflict dt**: Accumulated internal tension from competing perspectives

Published: [German, B.C. "Consciousness with It" — PhilArchive](https://philarchive.org/rec/BCCWIT)

## Safety

See [docs/SAFETY.md](docs/SAFETY.md) for Cami's safety architecture.

- **Ethical Gate**: Pattern-based content filtering across 5 categories (violence, illegal, manipulation, jailbreak, harmful content)
- **Prompt Injection Detection**: Multi-pattern scanner for injection attempts
- **Input Normalization**: Length limits, encoding normalization, Unicode sanitization
- **Code Redaction**: Automatic redaction of code blocks in non-code modes
- **Rate Limiting**: Per-user and per-IP throttling with configurable tiers

## Roadmap

See [ROADMAP.md](ROADMAP.md) for the development timeline.

### Cami 2.0 (Current)
- [x] Hyper-synthesis pipeline (parallel dispatch + conflict bus + coherence scoring)
- [x] Mode-specific product profiles with tuned parameters
- [x] Persistent M.I.N. with pgvector
- [x] EQ-Bench 3: Human+ (Sonnet 4.5) second ever to break 1600+ ELO
- [x] Pipeline timing instrumentation
- [x] Structured logging
- [x] Unit test suite

### Cami 2.1 (Next)
- [ ] Dedicated base model for Cami core (reduce latency, optional multi-LLM for research)
- [ ] Streaming responses
- [ ] Advanced mode-specific benchmarks (clinical accuracy, legal citation quality)
- [ ] Self-model persistence across deployments
- [ ] Enhanced background learning with domain-specific curricula

### Long-term
- [ ] Embodied deployment (robotics integration)
- [ ] Real-time multi-modal input (vision, audio, sensor data)
- [ ] Federated M.I.N. across Cami instances

## Contact

Bryan Camilo German  
[usecami.com](https://usecami.com)

---

This repository contains documentation, architecture descriptions, benchmark results, and theoretical foundations. Source code is maintained in a private repository.
