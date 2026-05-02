<template>
  <div class="term-tile">
    <div class="term-tile-label">{{ label }}</div>
    <div class="term-tile-value" :class="`tc-${valueColor}`">{{ value }}</div>
    <div class="term-tile-change" :class="`tc-${changeColor}`">
      <span>{{ arrow }}</span>
      <span>{{ change }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string
  value: string
  change: string
  changeDir: 'up' | 'down' | 'flat'
  valueColor?: string
  changeColor?: string
}>()

const arrow = computed(() =>
  props.changeDir === 'up' ? '▲' : props.changeDir === 'down' ? '▼' : '='
)
</script>