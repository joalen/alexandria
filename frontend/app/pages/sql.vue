<template>
  <div style="display:flex;flex-direction:column;height:100%;overflow:hidden;">
    <TerminalTopBar />

    <div class="term-section-header" style="flex-shrink:0;">
      <span>SQL TERMINAL</span>
      <span class="tc-dim">—</span>
      <span :class="isStaff ? 'tc-amber' : 'tc-dim'">ROLE: {{ isStaff ? 'STAFF' : 'READONLY' }}</span>
      <button class="term-refresh-btn" @click="showLogin = !showLogin">
        {{ isStaff ? 'LOGOUT' : 'LOGIN' }}
      </button>
      <button class="term-refresh-btn tc-amber" @click="runQuery" :disabled="running">
        ▶ RUN
      </button>
      <span v-if="execTime" class="tc-dim" style="font-size:9px;">{{ execTime }}ms</span>
      <span v-if="error" class="tc-red" style="font-size:9px;margin-left:auto;">{{ error }}</span>
    </div>

    <!-- Login form -->
    <div v-if="showLogin" class="term-login-bar">
      <span class="tc-dim">USER</span>
      <input v-model="loginUser" class="term-input" placeholder="username" />
      <span class="tc-dim">PASS</span>
      <input v-model="loginPass" class="term-input" type="password" placeholder="password" />
      <button class="term-refresh-btn" @click="authenticate">CONNECT</button>
      <span v-if="loginError" class="tc-red" style="font-size:9px;">{{ loginError }}</span>
    </div>

    <div class="term-body" style="flex:1;min-height:0;">
      <!-- Editor -->
      <div class="term-col" style="flex:1;">
        <div class="term-section" style="flex:1;min-height:0;">
          <div class="term-section-header">QUERY EDITOR</div>
          <div style="flex:1;min-height:0;position:relative;">
            <textarea
              v-model="query"
              class="term-editor"
              spellcheck="false"
              @keydown.ctrl.enter.prevent="runQuery"
              @keydown.meta.enter.prevent="runQuery"
              placeholder="SELECT * FROM member LIMIT 10;"
            />
          </div>
        </div>
      </div>

      <!-- Results -->
      <div class="term-col" style="flex:1;">
        <div class="term-section" style="flex:1;min-height:0;">
          <div class="term-section-header">
            RESULTS
            <span v-if="rows.length" class="tc-dim" style="font-size:9px;">{{ rows.length }} rows</span>
          </div>
          <div class="term-table-wrap">
            <div v-if="!rows.length && !error && !running" class="term-empty">
              CTRL+ENTER TO EXECUTE
            </div>
            <div v-if="running" class="term-empty tc-amber">EXECUTING...</div>
            <div v-if="error && !running" class="term-error">{{ error }}</div>
            <table v-if="rows.length && !running" class="term-table">
              <thead>
                <tr>
                  <th v-for="col in columns" :key="col">{{ col }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, i) in rows" :key="i">
                  <td v-for="col in columns" :key="col">{{ row[col] ?? 'NULL' }}</td>
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
        <span>POSTGRESQL {{ pgVersion }}</span>
        <span class="term-conn-ok">CONN OK</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { pgVersion } = useSystemStats()

const query      = ref('SELECT * FROM member LIMIT 10;')
const rows       = ref<any[]>([])
const columns    = ref<string[]>([])
const running    = ref(false)
const error      = ref('')
const execTime   = ref<number | null>(null)
const showLogin  = ref(false)
const isStaff    = ref(false)
const loginUser  = ref('')
const loginPass  = ref('')
const loginError = ref('')

const BLOCKED = ['drop ', 'truncate ', 'delete ', 'insert ', 'update ', 'alter ', 'create ']

const runQuery = async () => {
  const q = query.value.trim().toLowerCase()
  if (!isStaff.value && BLOCKED.some(k => q.startsWith(k))) {
    error.value = 'PERMISSION DENIED — authenticate as staff to run write operations'
    return
  }
  running.value = true
  error.value = ''
  rows.value = []
  const t0 = Date.now()
  try {
    const res = await $fetch('/api/query', { method: 'POST', body: { sql: query.value } }) as any[]
    execTime.value = Date.now() - t0
    rows.value = res
    columns.value = res.length ? Object.keys(res[0]) : []
  }
  catch (e: any) {
    error.value = e?.data?.message ?? e?.message ?? 'Query failed'
    execTime.value = Date.now() - t0
  }
  finally { running.value = false }
}

const authenticate = async () => {
  loginError.value = ''
  try {
    await $fetch('/api/auth', {
      method: 'POST',
      body: { username: loginUser.value, password: loginPass.value }
    })
    isStaff.value   = true
    showLogin.value = false
    loginUser.value = ''
    loginPass.value = ''
  }
  catch {
    loginError.value = 'INVALID CREDENTIALS'
  }
}
</script>