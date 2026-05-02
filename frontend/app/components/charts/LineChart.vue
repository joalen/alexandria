<template>
  <svg class="term-chart" viewBox="0 0 700 220" preserveAspectRatio="none">
    <defs>
      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="var(--term-amber)" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="var(--term-amber)" stop-opacity="0"/>
      </linearGradient>
    </defs>

    <!-- Grid lines + Y labels -->
    <g v-for="v in yGrid" :key="v">
      <line :x1="PL" :y1="yS(v)" :x2="W-PR" :y2="yS(v)"
            stroke="var(--term-border)" stroke-width="1"/>
      <text :x="PL-6" :y="yS(v)+4" text-anchor="end"
            fill="var(--term-dim)" font-family="JetBrains Mono,monospace" font-size="11">
        {{ v }}
      </text>
    </g>

    <!-- Area -->
    <path :d="areaPath" fill="url(#chartGrad)"/>

    <!-- Line -->
    <path :d="linePath" fill="none" stroke="var(--term-amber)" stroke-width="2.5" stroke-linejoin="round"/>

    <!-- Dots -->
    <circle v-for="(p, i) in pts" :key="i" :cx="p.x" :cy="p.y" r="4" fill="var(--term-amber)"/>

    <!-- X labels -->
    <text v-for="(label, i) in labels" :key="`x${i}`"
          :x="xS(i)" :y="H-4" text-anchor="middle"
          fill="var(--term-dim)" font-family="JetBrains Mono,monospace" font-size="10">
      {{ label }}
    </text>
  </svg>
</template>

<script setup lang="ts">
const props = defineProps<{
  data: number[]
  labels: string[]
  yMin: number
  yMax: number
}>()

const W = 700; const H = 220
const PL = 50; const PR = 16; const PT = 14; const PB = 28

const xS = (i: number) => PL + (i / (props.data.length - 1)) * (W - PL - PR)
const yS = (v: number) => PT + (H - PT - PB) - ((v - props.yMin) / (props.yMax - props.yMin)) * (H - PT - PB)

const pts = computed(() => props.data.map((v, i) => ({ x: xS(i), y: yS(v) })))

const linePath = computed(() =>
  pts.value.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
)

const areaPath = computed(() => {
  const bot = PT + (H - PT - PB)
  const f = pts.value[0], l = pts.value[pts.value.length - 1]
  return `${linePath.value} L${l.x.toFixed(1)},${bot} L${f.x.toFixed(1)},${bot} Z`
})

const yGrid = computed(() =>
  Array.from({ length: 7 }, (_, i) => props.yMin + ((props.yMax - props.yMin) / 6) * i)
)
</script>