<script setup lang="ts">
import { SKILL_FAMILIES } from '~/data/skills'
</script>

<template>
  <div class="skills">
    <NcSkillWheel
      v-for="(family, index) in SKILL_FAMILIES"
      :key="family.id"
      :family="family"
      class="skills__wheel"
      :style="{ '--i': index }"
    />
  </div>
</template>

<style scoped>
.skills {
  display: flex;
  align-content: center;
  flex-wrap: wrap;
  gap: clamp(2rem, 5vw, 5rem);
  align-items: center;
  justify-content: center;
}

/* Wheels arrive in sequence as the scene sweeps in. */
.skills__wheel {
  --delay: calc(var(--i) * 0.08);
  /* Held in its own property: nesting clamp() inside calc() trips the CSS
     pipeline's parser, and this reads better anyway. */
  --reveal: clamp(0, calc((var(--scene-progress, 1) - var(--delay)) * 6), 1);

  opacity: var(--reveal);
  transform: translate3d(0, calc((1 - var(--reveal)) * 1.5rem), 0);
}

@media not all and (min-width: 1024px) {
  .skills__wheel {
    opacity: 1;
    transform: none;
  }
}
</style>
