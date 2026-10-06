# Mio / Kobeni-inspired asset pipeline

The included PNG was generated with the built-in image tool. It is an original adult office-worker character, not official Kobeni artwork. The exact successful prompt is in `mio-generation.txt`. Actual output: 1,254 × 1,254 RGBA with six expressions. Generated alignment is approximate; the atlas metadata compensates for row offsets. It is a sprite preview, not a rig-ready export.

## Identity anchor

> Original adult anime woman Mio, mid-twenties. Charcoal-black short bob with a tiny low ponytail, two pale-teal hairpins, amber-brown eyes. Modest dark office jacket worn normally over an opaque, fully buttoned white collared shirt and charcoal tie. Timid, warm energy. Clean 2D anime illustration with precise linework, flat cel shading and subtle highlights. Keep the approved reference's exact face proportions, head position, lighting, costume, camera and silhouette. Transparent alpha, no text, borders, scenery or logos.

Provide the approved reference to each edit. Request ONLY the expression change, and visually verify alignment; prompts cannot guarantee pixel consistency.

| Output | Append to the anchor | Location |
| --- | --- | --- |
| Concept | Full-body front, three-quarter and side references; neutral posture and consistent adult proportions. | Private source-art workspace |
| Base | Single half-body front-facing portrait, relaxed arms, attentive eyes and closed mouth. | `base/neutral.png` |
| Neutral | Preserve the approved base; soft attentive eyes, closed lips. | `expressions/neutral.png` |
| Happy | Change only face: gentle warm smile, lifted cheeks, relaxed brows. | `expressions/happy.png` |
| Shy | Change only face: modest blush and bashful eyes; preserve head angle. | `expressions/shy.png` |
| Surprised | Change only face: widened eyes, raised brows, small open mouth. | `expressions/surprised.png` |
| Sad | Change only face: softened eyes, inner brows raised, downturned mouth corners. | `expressions/sad.png` |
| Flustered | Change only face: embarrassed flush, lightly furrowed brows, small protesting mouth. | `expressions/flustered.png` |
| Blink | Change only eyelids: fully closed; preserve eyebrows and neutral closed mouth. | `eyes/blink.png` |
| Mouth | Aligned closed/A/I/U/E/O/smile shapes; unchanged facial geometry; include skin patches so the original mouth is covered. | `mouth/<shape>.png` |

For production, generate variants individually against the approved base, manually align them and export exact rectangles. Preserve prompts and provenance. The current sheet uses closed/open-mouth sprites; it does not contain isolated mouth/eye parts.

## Layers for Live2D

An image generator produces raster art, not a layered PSD, deformers or `.moc3`. A separate art/rigging pass must separate and redraw hidden regions:

- Back hair, ponytail, fringe, side locks and hairpins.
- Face skin, ears, neck and separate eyebrows.
- Left/right sclera, iris, pupils, highlights, lids and lashes.
- Mouth interior, lips, optional teeth/tongue and covering skin patch.
- Torso, shirt, collar, tie, jacket panels, sleeves, arms and hands.

Use consistent canvases and named layers. Import the prepared PSD into Cubism, create meshes/deformers, rig mouth/eyes/angles/body/hair, add expressions and physics, and export model/texture/motion files. Check asset and runtime licensing. Integrate a renderer using `AvatarState`, with GPU resources disposed on unmount.

## Replace the shipping art

1. Put the replacement atlas in `public/avatars/kobeni-inspired/expressions/sheet.png`.
2. Update its width/height, frame size and coordinates in `metadata/manifest.json`.
3. Update `expressionMap` in `characters/index.ts`. Static portrait mode uses frame 0.
4. For a single standalone portrait, set `avatar.base` and omit `sheet`/`atlas`.
5. Check every state at display size for eye/chin movement and neighboring-cell bleed. Check alpha, lip movement, reduced motion, missing-asset fallback and the production build.

Everything under `public/` is browser-accessible. Do not place private reference photos or credentials there.
