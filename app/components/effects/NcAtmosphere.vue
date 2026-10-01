<script setup lang="ts">
import type { SectionId } from '~/data/sections'
import type { ParticlePreset } from '~/utils/particles'

/**
 * The page's weather — the "compile" half of Compile → Run, made visible.
 *
 * Behind every section, fixed to the viewport: three washes of Greenpath's own
 * colours (teal, moss, indigo, sampled off the plates) and one particle field.
 * As the visitor goes down the file, the washes come up one by one and the
 * particles change kind — falling code at the top, dust through the profile
 * and the history, then a few fireflies among the projects — so that by the
 * time the finale opens, the page is already the colour of the cavern and the
 * first lights of it are already in the air.
 *
 * Driven by the active section, as a discrete zone: each wash is a layer whose
 * opacity eases between a handful of values. No custom property is animated
 * at the root and nothing is recomputed per frame (HANDOFF, "Performance").
 */
const { active } = useSections()

const PRESETS: Record<SectionId, ParticlePreset> = {
  home: 'code-rain',
  about: 'dust',
  parcours: 'dust',
  skills: 'fireflies',
  projects: 'fireflies',
  contact: 'fireflies',
}

const preset = computed(() => PRESETS[active.value])
</script>

<template>
  <div
    class="atmo"
    :data-zone="active"
    aria-hidden="true"
  >
    <div class="atmo__wash atmo__wash--teal" />
    <div class="atmo__wash atmo__wash--moss" />
    <div class="atmo__wash atmo__wash--indigo" />
    <NcParticleField
      :preset="preset"
      :seed="0x51a7"
    />
  </div>
</template>

<style scoped>
.atmo {
  --strength: 1;

  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

:root[data-theme='light'] .atmo {
  --strength: 0.45;
}

.atmo__wash {
  position: absolute;
  inset: 0;
  opacity: 0;
  will-change: opacity;
  transition: opacity 1.6s var(--ease-out-expo);
}

.atmo__wash--teal {
  background: radial-gradient(120% 90% at 85% 10%, color-mix(in oklab, var(--gp-teal) 70%, transparent), transparent 60%);
}

.atmo__wash--moss {
  background: radial-gradient(90% 70% at 10% 100%, color-mix(in oklab, var(--gp-moss) 55%, transparent), transparent 65%);
}

.atmo__wash--indigo {
  background: linear-gradient(to bottom, transparent 30%, color-mix(in oklab, var(--gp-indigo) 70%, transparent));
}

[data-zone='about'] .atmo__wash--teal { opacity: calc(0.25 * var(--strength)); }

[data-zone='parcours'] .atmo__wash--teal { opacity: calc(0.4 * var(--strength)); }
[data-zone='parcours'] .atmo__wash--moss { opacity: calc(0.15 * var(--strength)); }

[data-zone='skills'] .atmo__wash--teal { opacity: calc(0.55 * var(--strength)); }
[data-zone='skills'] .atmo__wash--moss { opacity: calc(0.35 * var(--strength)); }

[data-zone='projects'] .atmo__wash--teal,
[data-zone='contact'] .atmo__wash--teal { opacity: calc(0.7 * var(--strength)); }

[data-zone='projects'] .atmo__wash--moss,
[data-zone='contact'] .atmo__wash--moss { opacity: calc(0.5 * var(--strength)); }

[data-zone='projects'] .atmo__wash--indigo,
[data-zone='contact'] .atmo__wash--indigo { opacity: calc(0.8 * var(--strength)); }

.atmo :deep(.particles) {
  z-index: 0;
}
</style>
