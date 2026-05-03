<template>
  <div style="display:flex;flex-direction:column;height:100%;overflow:hidden;">
    <TerminalTopBar />

    <div class="term-tiles">
      <TerminalQuoteTile v-for="t in tiles" :key="t.label" v-bind="t" />
    </div>

    <div class="term-body">
      <div class="term-col">
        <div class="term-section" style="height:50%;flex-shrink:0;">
          <div class="term-section-header">LOAN VOL — 12M &nbsp; MONTHLY TRANSACTIONS</div>
          <div class="term-chart-wrap">
            <ChartsLineChart v-if="chartData.length" :data="chartData" :labels="chartLabels" :y-min="chartMin" :y-max="chartMax" />
          </div>
        </div>

        <div class="term-section" style="flex:1;min-height:0;">
          <div class="term-section-header">
            LOAN ACTIVITY FEED
            <span class="term-live-dot" />
            <span class="tc-green" style="font-size:10px;letter-spacing:0.1em;">LIVE</span>
            <button class="term-refresh-btn" @click="loadAll" :disabled="loading">↻</button>
          </div>
          <div class="term-table-wrap">
            <table class="term-table">
              <thead><tr><th>TIME</th><th>EVENT</th><th>TITLE</th><th>MEMBER</th><th>COPY</th></tr></thead>
              <tbody>
                <TerminalFeedRow v-for="row in feed" :key="row.id" v-bind="row" />
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="term-col">
        <div class="term-section" style="flex:1;min-height:0;">
          <div class="term-section-header">
            MEMBER LATE FEES
            <span class="tc-red" style="font-weight:700;">&nbsp;{{ memberFees.filter(f => f.status === 'CRITICAL').length }} CRITICAL</span>
          </div>
          <div class="term-table-wrap">
            <table class="term-table">
              <thead><tr><th>MEMBER</th><th>FEES</th><th>STATUS</th></tr></thead>
              <tbody>
                <tr v-for="a in memberFees" :key="a.member">
                  <td>{{ a.member }}</td>
                  <td class="tc-red">${{ a.late_fees }}</td>
                  <td :class="statusClass(a.status)">{{ a.status }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="term-section" style="flex:1;min-height:0;">
          <div class="term-section-header">RESERVATION ACTIVITY</div>
          <div class="term-table-wrap">
            <table class="term-table">
              <thead><tr><th>DATE</th><th>BOOK</th><th>MEMBER</th></tr></thead>
              <tbody>
                <tr v-for="r in reservations" :key="r.id">
                  <td class="tc-dim">{{ r.date }}</td>
                  <td class="tc-amber">{{ r.book }}</td>
                  <td>{{ r.member }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div class="term-footer">
      <span>LIBRARYDB ANALYTICS — CS 4347.004 — TEAM 12</span>
      <div class="term-footer-right">
        <span>POSTGRESQL 17</span>
        <span class="term-conn-ok">CONN OK</span>
        <span>LATENCY {{ latency }}ms</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface FeedItem { id: number; time: string; event: string; title: string; member: string; copy: string }
interface FeeItem  { member: string; late_fees: string; status: string }
interface ResItem  { id: number; date: string; book: string; member: string }

const q = (sql: string) => $fetch('/api/query', { method: 'POST', body: { sql } }) as Promise<any[]>

const loading      = ref(false)
const latency      = ref(0)
const feed         = ref<FeedItem[]>([])
const memberFees   = ref<FeeItem[]>([])
const reservations = ref<ResItem[]>([])
const chartData    = ref<number[]>([])
const chartLabels  = ref<string[]>([])

const stats = reactive({ activeLoans: 0, reservations: 0, lateFees: 0, totalReturned: 0, totalMembers: 0 })

const chartMin = computed(() => 0)
const chartMax = computed(() => Math.ceil(Math.max(...chartData.value) / 5) * 5 + 5)

const tiles = computed(() => [
  { label: 'ACTIVE LOANS',   value: stats.activeLoans.toLocaleString(),        change: 'CURRENTLY OUT', changeDir: 'up',   valueColor: 'amber', changeColor: 'dim' },
  { label: 'RESERVATIONS',   value: stats.reservations.toLocaleString(),        change: 'ON HOLD',       changeDir: 'flat', valueColor: 'blue',  changeColor: 'dim' },
  { label: 'TOTAL RETURNED', value: stats.totalReturned.toLocaleString(),        change: 'ALL TIME',      changeDir: 'up',   valueColor: 'green', changeColor: 'dim' },
  { label: 'TOTAL MEMBERS',  value: stats.totalMembers.toLocaleString(),         change: 'REGISTERED',    changeDir: 'flat', valueColor: 'text',  changeColor: 'dim' },
  { label: 'LATE FEES',      value: `$${Number(stats.lateFees).toFixed(2)}`,    change: 'OUTSTANDING',   changeDir: 'up',   valueColor: 'red',   changeColor: 'red' },
])

const statusClass = (s: string) => ({ CRITICAL: 'tc-red', NOTIFY: 'tc-amber', PENDING: 'tc-dim' }[s] ?? '')

const loadAll = async () => {
  loading.value = true
  const t0 = Date.now()
  try {
    const [dashRes, feedRes, chartRes, feesRes, membersRes, resRes] = await Promise.all([
      q(`SELECT * FROM v_dashboard_stats`),
      q(`SELECT * FROM v_loan_feed`),
      q(`SELECT * FROM v_loan_volume_12m`),
      q(`SELECT * FROM v_member_fees`),
      q(`SELECT COUNT(*) AS count FROM member`),
      q(`SELECT * FROM v_reservations`),
    ])

    latency.value = Date.now() - t0

    const dash = dashRes[0] ?? {}
    stats.activeLoans   = Number(dash.active_loans   ?? 0)
    stats.reservations  = Number(dash.reservations   ?? 0)
    stats.lateFees      = Number(dash.late_fees      ?? 0)
    stats.totalReturned = Number(dash.total_returned ?? 0)
    stats.totalMembers  = Number(membersRes[0]?.count ?? 0)

    feed.value = (feedRes as any[]).map((r, i) => ({
      id:     i,
      time:   r.time,
      event:  r.event,
      title:  r.title,
      member: `M#${String(r.member).padStart(4, '0')}`,
      copy:   r.copy,
    }))

    memberFees.value = (feesRes as any[]).map(r => ({
      member:    `M#${String(r.member_id).padStart(4, '0')}`,
      late_fees: Number(r.late_fees).toFixed(2),
      status:    r.status,
    }))

    chartLabels.value = (chartRes as any[]).map(r => r.label)
    chartData.value   = (chartRes as any[]).map(r => Number(r.count))

    reservations.value = (resRes as any[]).map(r => ({
      id:     r.id,
      date:   r.date,
      book:   r.book,
      member: `M#${String(r.member).padStart(4, '0')}`,
    }))
  }
  catch (e) { console.error('Dashboard load failed', e) }
  finally   { loading.value = false }
}

onMounted(loadAll)
</script>