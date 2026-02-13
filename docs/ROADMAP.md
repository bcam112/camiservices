# Cami Development Roadmap

## Human Service AI

Cami is Human Service AI — an EQLM (EQ Language Model) built to serve humans. Here's what that actually means at each phase:

| Phase | Codename | What It Really Is |
|-------|----------|-------------------|
| **Cami-1** | — | Multi-LLM orchestration. Voice is borrowed. Intelligence is Cami's. |
| **Cami-2** | Juniper | Fine-tuned Phi-3 with LoRA. Personality on a borrowed model. ~$50. |
| **Cami-3** | Celadon | True language model from scratch. EQ in the architecture. ~$50K-500K. |
| **Cami-4** | Cadmium | Embodiment. Cami in robots. Human+ as alignment for any AI. |

---

## Cami-1 — Multi-LLM Synthesis (Live Now)

Cami orchestrates external LLMs and synthesizes their responses. The voice is borrowed; the intelligence is Cami's.

### Core Pipeline
- [x] Multi-LLM synthesis: Plan → Dispatch → Conflict Bus → Coherence → Human+ → Voice
- [x] Parallel multi-LLM dispatch with provider failover
- [x] Real-time conflict detection with priority scoring
- [x] Coherence-scored resolution loop

### Human+ (The Soul)
- [x] C+CT metric computation (SA, SE, ES, ∫Conflict dt)
- [x] Ethical gate (5-category pattern-based assessment)
- [x] Resonance engine (interaction depth detection)
- [x] Validated: 1633 ELO on EQ-Bench 3 (+132 lift over base Sonnet 4.5)

### M.I.N. (The Brain)
- [x] PostgreSQL + pgvector persistent storage
- [x] Embedding-based wisdom retrieval
- [x] Pattern crystallization from Human+ traces
- [x] Neural network layers with Hebbian learning
- [x] Grows with every interaction

### Service Modes
- [x] Research, Customer Service, Clinical, Legal, Tutor

---

## Cami-2 Juniper — Fine-Tuned Voice (Training Now)

**Honest description:** Juniper is NOT Cami's own language model. It's Microsoft's Phi-3 (3.8B parameters) with LoRA fine-tuning that teaches it Cami's personality.

### What Juniper Actually Is
- [ ] LoRA fine-tune on Phi-3-mini-4k-instruct
- [ ] 50K MIN instances as training data
- [ ] Identity baked into weights (no more "I'm trained by Google")
- [ ] Cost: ~$50 on cloud GPU

### What Juniper Gives Us
- [ ] $0 per-query cost (no more Gemini API fees)
- [ ] Solid identity (Cami's voice, not borrowed)
- [ ] Faster inference (local model)
- [ ] Revenue to fund Celadon

### What Juniper Is NOT
- Juniper is NOT a new language model
- Juniper is NOT trained from scratch
- Juniper still uses Microsoft's 3.8B parameters for language
- We won't be using another model for long

---

## Cami-3 Celadon — True Language Model (Future)

**This is the real goal.** Celadon is a language model pre-trained from scratch where emotional intelligence is built into the architecture, not layered on top.

### What Celadon Would Be
- [ ] Pre-trained from scratch (no Phi-3, no borrowed weights)
- [ ] EQ integrated at architecture level (attention shaped by Human+ metrics)
- [ ] MIN patterns become native weights
- [ ] True native EQLM

### Why Celadon Requires Funding
- Pre-training from scratch: $50K-500K+ in compute
- Requires significant training data
- Requires ML engineering expertise
- This is why Juniper comes first: prove it works, generate revenue, fund Celadon

### The Difference
| Aspect | Juniper (Cami-2) | Celadon (Cami-3) |
|--------|------------------|------------------|
| Base | Phi-3 (Microsoft) | From scratch |
| Training | LoRA fine-tune | Full pre-training |
| Cost | ~$50 | ~$50K-500K |
| EQ | Prompted/injected | Architectural |
| Weights | 98% Microsoft, 2% Cami | 100% Cami |

---

## Cami-4 Cadmium — Ready for Bots (Horizon)

Cami as infrastructure. Human+ as alignment for any AI.

- [ ] Cami in humanoid robots
- [ ] Bot-to-bot protocol  
- [ ] Human+ as alignment layer — emotional intelligence API for any LLM
- [ ] Real-time sensor input processing
- [ ] Physical-world constraint navigation

---

*Last updated: February 2026*

---

**Human Service AI** — for the public  
**EQLM** — for the technically curious  
**Cami** — for everyone
