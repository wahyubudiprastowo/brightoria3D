# Production Visual Prompts

These prompts are for image/3D asset generation. Maintain one visual language across all assets.

## Master art-direction prompt
Create a premium child-friendly educational fantasy world for “Brightoria by Bright Academy”, designed as an interactive low-poly miniature diorama for children aged 6–12. Warm cream, deep maroon, teal, soft sky blue, and restrained gold palette. Elegant Islamic geometric influence in architecture and paving patterns without dense ornamentation. Calm daylight, soft global illumination, rounded readable silhouettes, handcrafted clay-and-paper texture, sophisticated rather than toddler-like, no background music references, no casino styling, no neon arcade aesthetic, no weapons, no text, no logos, no numbers, no UI, no empty space. Isometric three-quarter view, composition filled edge to edge, game-ready visual hierarchy, optimized forms suitable for conversion to glTF/GLB.

## World map hero
A connected archipelago of six floating educational islands in one coherent miniature fantasy world. Each island has a unique recognizable landmark: luminous garden gateway and flowing water; warm village of choices and responsibilities; mathematical observatory with bridges and geometric forms; Arabic oasis with calligraphic-shaped paths but no readable letters; English harbor with sails and signal flags without text; digital safety citadel with protective light shields. Curved golden pathways connect islands, clouds below, morning light, calm premium 3D game art, no text, no logo, no characters, no empty space.

## Taman Al-Qur’an
A serene floating garden island for Quran and tajwid learning, luminous arched gateway, small stream, stepping stones, lantern-like abstract light forms, geometric garden layout, teal vegetation and restrained gold accents, respectful abstract visual language, no scripture text, no readable Arabic, no people, no text, no logo, no empty space, premium low-poly diorama, warm daylight.

## Kampung Adab
A welcoming floating village built around everyday choices and good habits, several small homes, bridge, community courtyard, task boards with blank surfaces, branching paths symbolizing decisions, warm terracotta and cream, trees and soft gold details, no people, no text, no logos, full composition, premium low-poly educational game diorama.

## Pulau Numeria
A playful mathematical island with a broken bridge reconstructed using fraction-shaped geometric blocks, observatory, balance scale, rotating polygons, measurement towers, blue and gold palette, meaningful interactive affordances, no equations or numbers printed, no text, no logos, no empty space, premium low-poly game environment.

## Oasis Bahasa Arab
A lush floating oasis with water pool, shaded learning pavilion, object-market stalls with blank signs, paths shaped like flowing calligraphy without readable characters, purple, teal and cream palette, no readable Arabic, no text, no people, no logo, no empty space, premium low-poly interactive diorama.

## English Harbor
A floating harbor island with small sailboat, lighthouse, dialogue stage, object-labeling area using blank signboards, warm orange, blue and cream, no flags with real national identity, no words, no logos, no people, no empty space, premium low-poly child learning game environment.

## Digital Guardian Citadel
A calm protective digital fortress on a floating island, translucent shield gates, safe-message sorting terminals represented by abstract cards, password tower represented by interlocking shapes, navy, teal and pale blue, no alarming cyber imagery, no skulls, no text, no numbers, no logos, full composition, premium low-poly educational diorama.

## Bri mascot
An abstract lantern-of-knowledge companion named Bri, non-human and non-animal, small floating faceted light core inside a rounded geometric frame, maroon and warm gold with teal accent, no face required but expressive through tilt and light intensity, calm friendly premium 3D style, transparent background, no text, no logo.

## Negative prompt shared by all assets
photorealistic humans, readable text, Arabic scripture, logo, watermark, music instruments, casino, loot box, neon arcade, aggressive combat, weapon, horror, dark dystopia, excessive particles, cluttered UI, toddler nursery style, flat generic corporate illustration, empty background.

## GLB generation/conversion constraints
- One landmark asset per file.
- Real-world scale consistent across worlds.
- Prefer 20k–80k triangles per hero island after optimization.
- PBR materials, maximum 2K textures; 1K for Android default.
- Draco or Meshopt compression.
- Separate named interactive nodes, for example `bridge_block_01`, `gate`, `terminal_safe`.
- Pivot centered at island base.
- No baked text.
