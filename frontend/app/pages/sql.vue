<template>
  <div style="display:flex;flex-direction:column;height:100%;overflow:hidden;">
    <TerminalTopBar />

    <div class="term-section-header" style="flex-shrink:0;">
      <span>SQL TERMINAL</span>
      <span class="tc-dim">—</span>
      <span :class="isStaff ? 'tc-amber' : 'tc-dim'">ROLE: {{ currentUser }}</span>
      <button class="term-refresh-btn" @click="isStaff ? logout() : showLogin = !showLogin">
        {{ isStaff ? 'LOGOUT' : 'LOGIN' }}
      </button>
    </div>

    <div v-if="showLogin" class="term-login-bar">
      <span class="tc-dim">USER</span>
      <input v-model="loginUser" class="term-input" placeholder="username" />
      <span class="tc-dim">PASS</span>
      <input v-model="loginPass" class="term-input" type="password" placeholder="password" />
      <button class="term-refresh-btn" @click="authenticate">CONNECT</button>
      <span v-if="loginError" class="tc-red" style="font-size:9px;">{{ loginError }}</span>
    </div>

    <div class="term-body" style="flex:1;min-height:0;">

      <!-- SQL Builder or Editor -->
      <div class="term-col" style="flex:1;">
        <div class="term-section" style="flex:1;min-height:0;overflow-y:auto;">
          <div class="term-section-header">
            QUERY BUILDER
            <button class="term-refresh-btn" :class="{ 'tc-amber': mode === 'builder' }" @click="mode = 'builder'">BUILDER</button>
            <button class="term-refresh-btn" :class="{ 'tc-amber': mode === 'editor' }" @click="mode = 'editor'">EDITOR</button>
            <button v-if="mode === 'builder'" class="term-refresh-btn" style="margin-left:auto;" @click="runBuilderQuery" :disabled="running">▶ RUN</button>
          </div>

          <!-- SQL Builder Form -->
          <template v-if="mode === 'builder'">
            <div class="term-builder">
              <div class="term-builder-row">
                <label class="term-builder-label">OPERATION</label>
                <select v-model="builder.operation" class="term-select">
                  <option value="find_books">Find Books</option>
                  <option value="find_members">Find Members</option>
                  <option value="active_loans">Active Loans</option>
                  <option value="loan_history">Loan History</option>
                  <option value="overdue">Overdue Loans</option>
                  <option value="reservations">Reservations</option>
                  <option value="fees">Members with Fees</option>
                  <option value="most_borrowed">Most Borrowed Books</option>
                  <option value="staff_activity">Staff Activity</option>
                </select>
              </div>

              <template v-if="builder.operation === 'find_books'">
                <div class="term-builder-row">
                  <label class="term-builder-label">TITLE</label>
                  <input v-model="builder.bookTitle" class="term-input" style="flex:1;" placeholder="partial match..." />
                </div>
                <div class="term-builder-row">
                  <label class="term-builder-label">AUTHOR</label>
                  <input v-model="builder.bookAuthor" class="term-input" style="flex:1;" placeholder="partial match..." />
                </div>
              </template>

              <template v-if="builder.operation === 'find_members'">
                <div class="term-builder-row">
                  <label class="term-builder-label">MEMBER ID</label>
                  <input v-model="builder.memberId" class="term-input" style="flex:1;" placeholder="e.g. 42" />
                </div>
              </template>

              <template v-if="['loan_history', 'reservations'].includes(builder.operation)">
                <div class="term-builder-row">
                  <label class="term-builder-label">MEMBER ID</label>
                  <input v-model="builder.memberId" class="term-input" style="flex:1;" placeholder="optional" />
                </div>
              </template>

              <template v-if="builder.operation === 'loan_history'">
                <div class="term-builder-row">
                  <label class="term-builder-label">BOOK SERIAL</label>
                  <input v-model="builder.bookSerial" class="term-input" style="flex:1;" placeholder="e.g. SN20006" />
                </div>
              </template>

              <div class="term-builder-row">
                <label class="term-builder-label">ORDER BY</label>
                <select v-model="builder.orderBy" class="term-select">
                  <option value="">— none —</option>
                  <option v-for="col in orderByOptions" :key="col.value" :value="col.value">{{ col.label }}</option>
                </select>
                <select v-model="builder.orderDir" class="term-select" style="width:90px;flex:none;">
                  <option value="ASC">ASC</option>
                  <option value="DESC">DESC</option>
                </select>
              </div>

              <div class="term-builder-row">
                <label class="term-builder-label">LIMIT</label>
                <select v-model="builder.limit" class="term-select">
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>

              <div class="term-builder-preview">
                <div class="tc-dim" style="font-size:9px;margin-bottom:4px;">GENERATED SQL</div>
                <div class="tc-amber" style="font-size:10px;white-space:pre-wrap;line-height:1.6;">{{ generatedSql }}</div>
              </div>
            </div>
          </template>

          <!-- Editor -->
          <template v-else>
            <textarea
              v-model="query"
              class="term-editor"
              style="flex:1;"
              spellcheck="false"
              @keydown.ctrl.enter.prevent="runEditorQuery"
              @keydown.meta.enter.prevent="runEditorQuery"
              placeholder="SELECT * FROM member LIMIT 10;"
            />
          </template>
        </div>
      </div>

      <!-- SQL query results -->
      <div class="term-col" style="flex:1;">
        <div class="term-section" style="flex:1;min-height:0;">
          <div class="term-section-header">
            RESULTS
            <span v-if="rows.length" class="tc-dim" style="font-size:9px;">{{ rows.length }} rows</span>
            <span v-if="execTime" class="tc-dim" style="font-size:9px;margin-left:4px;">· {{ execTime }}ms</span>
          </div>
          <div class="term-table-wrap">
            <div v-if="!rows.length && !error && !running" class="term-empty">CTRL+ENTER OR ▶ RUN</div>
            <div v-if="running" class="term-empty tc-amber">EXECUTING...</div>
            <div v-if="error && !running" class="term-error">{{ error }}</div>
            <table v-if="rows.length && !running" class="term-table">
              <thead>
                <tr><th v-for="col in columns" :key="col">{{ col }}</th></tr>
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

const mode = ref<'builder' | 'editor'>('builder')
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
const currentUser = ref('READONLY')

const builder = reactive({
  operation: 'find_books',
  bookTitle:  '',
  bookAuthor: '',
  memberId:   '',
  bookSerial: '',
  orderBy:    '',
  orderDir:   'ASC',
  limit:      '10',
})

const orderByOptions = computed(() => {
  const map: Record<string, { label: string; value: string }[]> = {
    find_books:     [{ label: 'Title', value: 'b.name' }, { label: 'Date Added', value: 'b.date_added' }],
    find_members:   [{ label: 'Member ID', value: 'm.member_id' }, { label: 'Date Joined', value: 'm.date_joined' }],
    active_loans:   [{ label: 'Date Issued', value: 'l.date_issued' }, { label: 'Member ID', value: 'l.member_id' }],
    loan_history:   [{ label: 'Date Issued', value: 'l.date_issued' }, { label: 'Date Returned', value: 'l.date_returned' }],
    overdue:        [{ label: 'Date Issued', value: 'l.date_issued' }, { label: 'Member ID', value: 'l.member_id' }],
    reservations:   [{ label: 'Date Reserved', value: 'r.date_reserved' }, { label: 'Member ID', value: 'r.member_id' }],
    fees:           [{ label: 'Late Fees', value: 'm.late_fees' }, { label: 'Member ID', value: 'm.member_id' }],
    most_borrowed:  [{ label: 'Borrow Count', value: 'borrow_count' }],
    staff_activity: [{ label: 'Date Hired', value: 's.date_hired' }, { label: 'Salary', value: 's.salary' }],
  }
  return map[builder.operation] ?? []
})

const generatedSql = computed(() => {
  const orderClause = builder.orderBy ? `ORDER BY ${builder.orderBy} ${builder.orderDir}` : ''
  const limitClause = `LIMIT ${builder.limit}`
  const conditions: string[] = []

  switch (builder.operation) {
    case 'find_books': {
      if (builder.bookTitle)  conditions.push(`b.name ILIKE '%${builder.bookTitle}%'`)
      if (builder.bookAuthor) conditions.push(`b.author ILIKE '%${builder.bookAuthor}%'`)
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
      return `SELECT b.name, b.author, b.serial_number, b.date_published\nFROM book b\n${where}\n${orderClause}\n${limitClause};`
    }
    case 'find_members': {
      if (builder.memberId) conditions.push(`m.member_id = ${builder.memberId}`)
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
      return `SELECT m.member_id, m.date_joined, m.number_of_books_rented, m.late_fees\nFROM member m\n${where}\n${orderClause}\n${limitClause};`
    }
    case 'active_loans':
      return `SELECT l.loan_number, l.date_issued, b.name AS book, l.member_id\nFROM loan l\nJOIN book b ON l.book_serial_number = b.serial_number\nWHERE l.date_returned IS NULL\n${orderClause}\n${limitClause};`
    case 'loan_history': {
      if (builder.memberId)   conditions.push(`l.member_id = ${builder.memberId}`)
      if (builder.bookSerial) conditions.push(`l.book_serial_number = '${builder.bookSerial}'`)
      const where = conditions.length ? `AND ${conditions.join(' AND ')}` : ''
      return `SELECT l.loan_number, l.date_issued, l.date_returned, b.name AS book, l.member_id\nFROM loan l\nJOIN book b ON l.book_serial_number = b.serial_number\nWHERE 1=1 ${where}\n${orderClause}\n${limitClause};`
    }
    case 'overdue':
      return `SELECT l.loan_number, l.date_issued, b.name AS book, l.member_id\nFROM loan l\nJOIN book b ON l.book_serial_number = b.serial_number\nWHERE l.date_returned IS NULL\nAND l.date_issued < NOW() - INTERVAL '30 days'\n${orderClause}\n${limitClause};`
    case 'reservations': {
      if (builder.memberId) conditions.push(`r.member_id = ${builder.memberId}`)
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
      return `SELECT r.reservation_id, r.date_reserved, b.name AS book, r.member_id\nFROM reservation r\nJOIN book b ON r.book_serial = b.serial_number\n${where}\n${orderClause}\n${limitClause};`
    }
    case 'fees':
      return `SELECT m.member_id, m.late_fees, m.number_of_books_rented\nFROM member m\nWHERE m.late_fees > 0\n${orderClause || 'ORDER BY m.late_fees DESC'}\n${limitClause};`
    case 'most_borrowed':
      return `SELECT b.name, b.author, COUNT(*) AS borrow_count\nFROM loan l\nJOIN book b ON l.book_serial_number = b.serial_number\nGROUP BY b.name, b.author\n${orderClause || 'ORDER BY borrow_count DESC'}\n${limitClause};`
    case 'staff_activity':
      return `SELECT s.staff_id, s.date_hired, s.salary, s.hours\nFROM staff s\n${orderClause}\n${limitClause};`
    default:
      return ''
  }
})

const BLOCKED = ['drop ', 'truncate ', 'delete ', 'insert ', 'update ', 'alter ']

const executeQuery = async (sql: string) => {
  const q = sql.trim().toLowerCase()
  if (!isStaff.value && BLOCKED.some(k => q.startsWith(k))) {
    error.value = 'PERMISSION DENIED — authenticate as staff to run write operations'
    return
  }
  running.value = true
  error.value = ''
  rows.value = []
  const t0 = Date.now()
  try {
    const res = await $fetch('/api/query' as string, { method: 'POST', body: { sql } }) as any[]
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

const runBuilderQuery = () => executeQuery(generatedSql.value)
const runEditorQuery  = () => executeQuery(query.value)

const authenticate = async () => {
  loginError.value = ''
  try {
    const res = await $fetch<{ user: string }>('/api/auth' as string, {
      method: 'POST',
      body: { username: loginUser.value, password: loginPass.value }
    })
    isStaff.value    = true
    currentUser.value = res.user.toUpperCase()
    showLogin.value  = false
    loginUser.value  = ''
    loginPass.value  = ''
  }
  catch { loginError.value = 'INVALID CREDENTIALS' }
}

const logout = async () => {
  await $fetch('/api/logout' as string, { method: 'POST' })
  isStaff.value    = false
  currentUser.value = 'READONLY'
  rows.value       = []
  error.value      = ''
  showLogin.value  = false
}
</script>