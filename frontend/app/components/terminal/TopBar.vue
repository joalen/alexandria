<template>
  <div>
    <div class="term-topbar">
      <div class="term-logo">
        <span class="term-logo-name">LIBRARYDB</span>
        <span class="term-logo-sub">ANALYTICS TERMINAL v1.0</span>
      </div>

      <nav class="term-nav">
        <NuxtLink to="/"        class="term-nav-tab" :class="{ active: route.path === '/' }">
          <span class="term-nav-key">F1</span> DASH
        </NuxtLink>
        <NuxtLink to="/sql"     class="term-nav-tab" :class="{ active: route.path === '/sql' }">
          <span class="term-nav-key">F2</span> SQL
        </NuxtLink>
        <NuxtLink to="/books"   class="term-nav-tab" :class="{ active: route.path === '/books' }">
          <span class="term-nav-key">F3</span> BOOKS
        </NuxtLink>
        <NuxtLink to="/members" class="term-nav-tab" :class="{ active: route.path === '/members' }">
          <span class="term-nav-key">F4</span> MEMBERS
        </NuxtLink>

        <button class="term-theme-toggle" @click="toggle">
          {{ theme === 'dark' ? '◑' : '◐' }}
        </button>
      </nav>
    </div>

    <div class="term-statusbar">
      <span class="term-live-dot" />
      <span class="term-status-live">LIVE</span>
      <span class="term-status-rec">{{ recCount }} REC</span>
      <span class="term-status-time">{{ clock }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { theme, toggle } = useTheme()
const { recCount } = useSystemStats()
const clock = ref('')
let interval: ReturnType<typeof setInterval>

onMounted(() => {
  const tick = () => { clock.value = new Date().toTimeString().slice(0, 8) }
  tick()
  interval = setInterval(tick, 1000)
})

onUnmounted(() => clearInterval(interval))
</script>