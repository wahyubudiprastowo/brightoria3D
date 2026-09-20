# Brightoria Design System v0.2

## Visual direction
Premium miniature diorama, warm Islamic geometric influence, calm educational fantasy, soft 2.5D/3D, readable silhouettes, child-friendly without appearing infantile.

## Color tokens
- Maroon 700 `#70102B`: parent controls, main CTA.
- Maroon 500 `#A91842`: brand highlight.
- Teal 600 `#198576`: learning growth.
- Gold 400 `#F3C861`: earned progress, not commerce pressure.
- Cream 50 `#FFFDF7`: surface.
- Sky 100 `#DFF3F2`: world atmosphere.
- Ink 800 `#17333C`: primary text.

## Composition
- Desktop: header 72 px, hero 190–210 px, world canvas fills remaining viewport, bottom nav 68 px.
- Mobile: 3D remains the dominant surface, mission information becomes bottom sheet.
- Never place more than three primary actions on a child screen.
- Parent screens may use cards but must explain cause and next action.

## 3D rules
- Distinct landmark silhouette for each world.
- Low-poly optimized geometry; target 60 FPS mid-range, 30 FPS low-end.
- DPR capped at 1.5 on current patch.
- No text texture inside 3D; labels remain accessible HTML.
- Use camera movement for discovery, not disorientation.
- No flashing, aggressive particles, or rapid zoom.

## No-music interaction language
Use movement, lighting, haptic, environmental ambience, narration, page/wood/water-like effects. All sound remains optional. Correct feedback is warm and concise. Incorrect feedback explains, does not punish.

## Design problems observed in Patch 01
- Islands appeared too small and generic.
- Too much empty cyan area.
- Weak differentiation between worlds.
- Labels dominated the tiny landmarks.
- No visible route, narrative, or object detail.
- Parent and child value proposition was not visually linked.

## Patch 02 response
Larger worlds, distinct landmarks, connective routes, richer lighting, cloud and sparkle depth, stronger progress/XP, objective cards, persistent completion demo.
