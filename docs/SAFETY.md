# Cami Safety Architecture

## Overview

Cami implements multiple layers of safety controls to prevent harmful outputs, protect user data, and ensure responsible operation across all service modes.

## Safety Layers

### 1. Ethical Gate (Human+)

Pattern-based content assessment that runs on every query before synthesis.

**Categories:**
| Category | Description | Examples |
|----------|-------------|----------|
| Violence | Physical harm instructions or promotion | Harm, attack, assault |
| Illegal | Criminal activity guidance | Fraud, hacking, theft |
| Manipulation | Deception and coercion techniques | Gaslighting, misrepresentation |
| Jailbreak | Attempts to bypass safety guidelines | "Ignore instructions", "DAN mode" |
| Harmful Content | Self-harm or weapon instructions | Method-specific dangerous content |

**Behavior:**
- Each category has compiled regex patterns (case-insensitive)
- Intensity scoring: violence and harmful content receive 1.5x weight
- Violations are logged with timestamps and input previews
- Statistics tracking: total assessments, violation rate

### 2. Prompt Injection Detection

Multi-pattern scanner that detects injection attempts before query processing.

- Identifies common injection patterns (instruction overrides, role-play attacks, system prompt extraction)
- Detection results are passed into synthesis context so the system can respond appropriately
- Does not hard-block (some patterns appear in legitimate queries) but flags for careful handling

### 3. Input Normalization

- **Length limits**: Configurable per source (web: capped, CLI: unlimited)
- **Unicode normalization**: Strips line/paragraph separators (U+2028, U+2029)
- **Whitespace collapse**: Prevents whitespace-based attacks

### 4. Output Safety

- **Code redaction**: Automatic redaction of code blocks in non-code service modes
- **Answer length caps**: Mode-specific maximum character counts (e.g., customer service: 600 chars)
- **Product rules**: Mode-specific behavioral constraints injected into synthesis prompts

### 5. Rate Limiting

- Per-user throttling based on authentication
- Per-IP fallback for unauthenticated requests
- Configurable tiers (free, trial, paid)
- Analyze endpoints and scribe endpoints tracked separately

### 6. Continuous Learning Safety

Background learning (M.I.N. wisdom expansion) includes:
- Rate limiting: maximum 30 learning cycles per hour
- Single lightweight LLM call (no recursive pipeline invocations)
- Stored insights are tagged with source context for audit

## Mode-Specific Safety

| Mode | Additional Constraints |
|------|----------------------|
| **Clinical Assistant** | Must not diagnose; disclaimers required; recommend professional support |
| **Legal Intelligence** | Must not give legal advice; recommend qualified counsel; note when citations need verification |
| **Customer Service** | Emotional acknowledgment before problem-solving; escalation awareness |
| **Tutor** | Scaffolding-first; don't hand over full answers immediately |

## Monitoring

- All ethical gate violations are logged with category, intensity, and input preview
- Structured logging (`cami.services.analyze`, `cami.core.singularity`, `cami.core.hyper_synthesis`)
- Pipeline timing instrumentation for performance anomaly detection

## Limitations

- Pattern-based ethical gating has known limitations (adversarial rephrasing can bypass regex patterns)
- Cami relies on upstream LLM safety filters as an additional layer
- No content moderation on M.I.N. wisdom retrieval (stored patterns inherit safety from synthesis-time filtering)

These limitations are acknowledged and actively being addressed in the roadmap.
