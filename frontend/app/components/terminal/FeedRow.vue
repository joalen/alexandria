<template>
  <tr>
    <td class="tc-dim">{{ time }}</td>
    <td :class="eventClass">{{ event }}</td>
    <td class="tc-amber">{{ title }}</td>
    <td>{{ member }}</td>
    <td class="tc-dim">{{ copy }}</td>
  </tr>
</template>

<script setup lang="ts">
const props = defineProps<{
  time: string
  event: string
  title: string
  member: string
  copy: string
}>()

const eventClass = computed(() => ({
  ISSUED:   'tc-green',
  RETURNED: 'tc-blue',
  EXTENDED: 'tc-dim',
  RESERVED: 'tc-amber',
}[props.event] ?? ''))
</script>