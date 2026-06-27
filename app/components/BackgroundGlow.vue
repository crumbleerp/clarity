<script lang="ts" setup>
import type { ViewerProps } from './shader/Viewer.vue'

const props = defineProps<Omit<ViewerProps, 'shader'>>()
</script>

<template>
  <div>
    <ShaderViewer
      shader="
          // Soft hash
          vec3 hash33(vec3 p) {
              p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
                        dot(p, vec3(269.5, 183.3, 246.1)),
                        dot(p, vec3(113.5, 271.9, 124.6)));
              return fract(sin(p) * 43758.5453);
          }

          // Smooth 2D noise
          float noise(vec2 p) {
              vec2 i = floor(p);
              vec2 f = fract(p);
              f = f * f * (3.0 - 2.0 * f);

              float a = hash33(vec3(i, 0.0)).x;
              float b = hash33(vec3(i + vec2(1.0, 0.0), 0.0)).x;
              float c = hash33(vec3(i + vec2(0.0, 1.0), 0.0)).x;
              float d = hash33(vec3(i + vec2(1.0, 1.0), 0.0)).x;

              return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
          }

          // FBM for organic cloud-like shapes
          float fbm(vec2 p) {
              float val = 0.0;
              float amp = 0.5;
              for (int i = 0; i < 5; i++) {
                  val += amp * noise(p);
                  p *= 2.1;
                  amp *= 0.5;
              }
              return val;
          }

          // Soft glowing orb
          float softOrb(vec2 p, vec2 center, float radius) {
              float d = length(p - center);
              // Very soft falloff — no hard edges
              return exp(-pow(d / radius, 1.8));
          }

          void mainImage(out vec4 fragColor, vec2 fragCoord) {
              vec2 uv = fragCoord / iResolution.xy;
              vec2 p = uv * 2.0 - 1.0;
              p.x *= iResolution.x / iResolution.y;

              float t = iTime * 0.15; // Slow, ambient motion

              // Colors
              vec3 purple = vec3(0.557, 0.318, 1.0);   // #8e51ff
              vec3 lavender = vec3(0.769, 0.706, 1.0); // #C4B4FF
              vec3 deepPurple = vec3(0.35, 0.15, 0.7);

              // === ORBS ===
              // Large slow-moving blobs, positioned to avoid text area (center-left)

              // Top-right large orb
              vec2 orb1Pos = vec2(0.6 + sin(t * 0.7) * 0.3, 0.4 + cos(t * 0.5) * 0.2);
              float orb1 = softOrb(p, orb1Pos, 0.9);

              // Bottom-right orb
              vec2 orb2Pos = vec2(0.5 + cos(t * 0.6 + 1.0) * 0.25, -0.5 + sin(t * 0.4) * 0.2);
              float orb2 = softOrb(p, orb2Pos, 0.7);

              // Top-left subtle orb (very faint, behind text area)
              vec2 orb3Pos = vec2(-0.7 + sin(t * 0.3) * 0.2, 0.6 + cos(t * 0.8) * 0.15);
              float orb3 = softOrb(p, orb3Pos, 1.1) * 0.4; // Dimmed

              // Bottom-left subtle
              vec2 orb4Pos = vec2(-0.5 + cos(t * 0.5 + 2.0) * 0.3, -0.4 + sin(t * 0.7) * 0.2);
              float orb4 = softOrb(p, orb4Pos, 0.8) * 0.5;

              // === FBM NOISE LAYER ===
              // Adds texture and prevents «plastic» look
              float n1 = fbm(p * 1.5 + t * 0.3 + vec2(0.0, t * 0.2));
              float n2 = fbm(p * 2.0 - t * 0.2 + vec2(t * 0.15, 0.0));
              float noiseLayer = n1 * 0.5 + n2 * 0.5;

              // === COMBINE ===
              // Vignette to keep center dark for text readability
              float vignette = 1.0 - smoothstep(0.3, 1.2, length(p * vec2(0.8, 1.0)));

              // Color mixing
              vec3 color = vec3(0.0);

              // Each orb contributes color
              color += purple * orb1 * (0.6 + noiseLayer * 0.4);
              color += lavender * orb2 * (0.5 + noiseLayer * 0.3);
              color += mix(purple, lavender, 0.5) * orb3;
              color += deepPurple * orb4 * 0.6;

              // Cross-pollination between orbs
              color += mix(purple, lavender, sin(t) * 0.5 + 0.5) * (orb1 * orb2) * 0.5;

              // Noise texture tint
              color += purple * noiseLayer * 0.08;

              // Apply vignette (darker center)
              color *= vignette;

              // Very subtle overall brightness modulation
              color *= 0.9 + sin(t * 0.3) * 0.1;

              // === ALPHA ===
              // Very low overall opacity — it's a background hint, not a layer
              float alpha = max(max(orb1, orb2), max(orb3, orb4)) * vignette * 0.85;
              alpha = clamp(alpha + noiseLayer * 0.05, 0.0, 0.9);

              fragColor = vec4(color, alpha);
          }
      "
      v-bind="props"
    />
  </div>
</template>
