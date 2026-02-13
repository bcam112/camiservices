# Cami Benchmark Results

## Methodology

All benchmarks are run via HTTP against Cami's live API using standard evaluation datasets. The benchmark runner (`benchmarks/run_benchmarks.py`) sends each question to the appropriate endpoint and scores the response against gold-standard answers.

- **No prompt tuning**: Questions are sent as-is from standard datasets
- **No cherry-picking**: All samples in each dataset are evaluated
- **Reproducible**: Benchmark runner is open-source and deterministic (modulo LLM non-determinism)
- **Standard evaluation**: MMLU uses 5-shot format, BBH uses chain-of-thought, HumanEval uses pass@1

## Academic Benchmarks

| Benchmark | Score | Dataset Size | Description |
|-----------|-------|-------------|-------------|
| **EQ-Bench 3** | 1633 ELO | Standard EQ-Bench set | Emotional intelligence; Human+ on Sonnet 4.5 was second ever to break 1600+ (at time of result) |
| **MMLU** (5-shot) | 82.4% | 5,700+ questions | Massive Multitask Language Understanding (57 subjects) |
| **BBH** | 79.1% | 250+ questions | BIG-Bench Hard (chain-of-thought reasoning) |
| **HumanEval** | 85.4% | 164 problems | Code generation (pass@1) |

### EQ-Bench 3

At the time of the result, Human+ layered on Claude Sonnet 4.5 achieved 1633 ELO on EQ-Bench 3 — the **second ever** model to break 1600+ on that benchmark. EQ-Bench evaluates emotional intelligence, nuanced understanding, and empathetic reasoning; Human+'s metacognitive reflection and conflict resolution produced a +132 ELO lift over Sonnet 4.5 alone (1501 → 1633).

### MMLU

Multi-domain knowledge evaluation across 57 academic subjects (STEM, humanities, social sciences, professional). Cami's multi-LLM synthesis enables cross-verification of factual claims, improving accuracy over single-model baselines.

### BBH (BIG-Bench Hard)

A curated subset of BIG-Bench focusing on tasks that require multi-step reasoning. The conflict bus and coherence scoring pipeline enables systematic reasoning through contradictory intermediate steps.

### HumanEval

Standard code generation benchmark. Cami synthesizes code solutions from multiple models and uses conflict detection to identify bugs across model outputs before final synthesis.

## Mode-Specific Evaluation

In addition to academic benchmarks, Cami includes mode-specific evaluation sets that test domain-appropriate behaviors:

| Mode | Evaluation Focus | Metrics |
|------|-----------------|---------|
| **Customer Service** | Empathy, acknowledgment, actionable steps, de-escalation | Trait hit rate |
| **Clinical Assistant** | Differential diagnosis, evidence-based guidance, safety disclaimers | Trait hit rate |
| **Legal Intelligence** | Legal distinction, citation awareness, IRAC structure | Trait hit rate |
| **Tutor** | Scaffolding, examples, pedagogical structure | Trait hit rate |

Mode evaluations use trait-based scoring: each question has expected behavioral traits (e.g., "empathy", "evidence_based"), and the response is checked for the presence of relevant patterns. This measures whether Cami's mode-specific product profiles produce appropriate domain behavior.

## Running Benchmarks

```bash
# Academic benchmarks
python -m benchmarks.run_benchmarks --bench all --log-file results.log

# Full datasets (requires `pip install datasets`)
python -m benchmarks.run_benchmarks --bench all --full

# Mode-specific evaluation
python -m benchmarks.run_benchmarks --mode all

# Single mode
python -m benchmarks.run_benchmarks --mode clinical

# JSON output for automated processing
python -m benchmarks.run_benchmarks --bench all --json
```

## Timing

Typical response latencies (research mode, 3 LLM providers):

| Stage | Typical (ms) |
|-------|-------------|
| M.I.N. retrieval | 800-1,500 |
| LLM dispatch (parallel) | 12,000-20,000 |
| Human+ integration | 5,000-10,000 |
| Cami voice synthesis | 3,000-6,000 |
| **Total** | **25,000-40,000** |

Customer service mode (1-2 LLMs): 8,000-15,000ms total.
