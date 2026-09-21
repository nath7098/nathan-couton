<script setup lang="ts">
import { EXPERIENCE } from '~/data/timeline'
</script>

<template>
  <NcTimeline
    :entries="EXPERIENCE"
    variant="detailed"
  />
</template>
