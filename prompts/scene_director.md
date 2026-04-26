# Scene Director (Reserved for Future Use)

> Currently `scene_splitter.py` is deterministic Python (no AI call) — fast and free.
> If we ever want AI-driven scene direction (richer visuals per beat), this prompt is the contract.

---

Given a `conceptized` JSON (4 beats + keywords) and a target scene count,
produce N scene specs:

```json
[
  {
    "idx": 0,
    "kind": "hook|core|mechanism|recap|opening|closing",
    "text": "string spoken in this scene",
    "direction": "string visual direction for image_gen"
  }
]
```

## Constraints

- Total N is fixed (default 14)
- Distribution: opening 1, hook 2, core 3, mechanism 5, recap 2, closing 1
- `direction` must be specific enough to drive a single image generation
  (not just "concept"); cite shapes, layout, what to highlight
- For mechanism scenes, sequence steps logically: step 1 → 2 → ...
- Keywords should be referenced when relevant (`emphasize 'softmax'`)
