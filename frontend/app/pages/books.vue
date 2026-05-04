<template>
  <div style="display:flex;flex-direction:column;height:100%;overflow:hidden;">
    <TerminalTopBar />

    <!-- Stat Tiles -->
    <div class="term-tiles" style="grid-template-columns:repeat(6,1fr);">
      <div class="term-tile">
        <div class="term-tile-label">TOTAL TITLES</div>
        <div class="term-tile-value tc-text">{{ stats.totalTitles.toLocaleString() }}</div>
        <div class="term-tile-change tc-dim">= IN CATALOG</div>
      </div>
      <div class="term-tile">
        <div class="term-tile-label">TOTAL COPIES</div>
        <div class="term-tile-value tc-text">{{ stats.totalCopies.toLocaleString() }}</div>
        <div class="term-tile-change tc-dim">= PHYSICAL STOCK</div>
      </div>
      <div class="term-tile">
        <div class="term-tile-label">AVAILABLE</div>
        <div class="term-tile-value tc-green">{{ stats.available.toLocaleString() }}</div>
        <div class="term-tile-change tc-green">▲ READY TO LOAN</div>
      </div>
      <div class="term-tile">
        <div class="term-tile-label">ON LOAN</div>
        <div class="term-tile-value tc-amber">{{ stats.onLoan.toLocaleString() }}</div>
        <div class="term-tile-change tc-amber">▲ CURRENTLY OUT</div>
      </div>
      <div class="term-tile">
        <div class="term-tile-label">RESERVED</div>
        <div class="term-tile-value tc-blue">{{ stats.reserved.toLocaleString() }}</div>
        <div class="term-tile-change tc-dim">= ON HOLD</div>
      </div>
      <div class="term-tile" style="border-right:none;">
        <div class="term-tile-label">OVERDUE</div>
        <div class="term-tile-value" :class="stats.overdue > 0 ? 'tc-red' : 'tc-text'">{{ stats.overdue }}</div>
        <div class="term-tile-change" :class="stats.overdue > 0 ? 'tc-red' : 'tc-dim'">
          {{ stats.overdue > 0 ? '▲ ACTION REQUIRED' : '= NONE' }}
        </div>
      </div>
    </div>

    <!-- Body -->
    <div class="books-body">

      <!-- Left: Catalog Table -->
      <div class="term-col">
        <div class="term-section" style="flex:1;min-height:0;">

          <div class="term-section-header">
            <span class="tc-amber" style="font-weight:600;letter-spacing:.12em;">BOOK CATALOG</span>
            <span class="tc-dim">—</span>
            <span class="term-live-dot" style="width:6px;height:6px;" />
            <span class="tc-green" style="font-size:9px;">{{ filteredBooks.length }} RECORDS</span>
            <button class="term-refresh-btn" style="margin-left:auto;" @click="loadAll" :disabled="loading">↻</button>
          </div>

          <!-- Toolbar -->
          <div class="books-toolbar">
            <div class="books-search-wrap">
              <span class="tc-dim" style="font-size:9px;">▶</span>
              <input
                v-model="searchQuery"
                class="books-search-input"
                placeholder="SEARCH TITLE / AUTHOR / SERIAL..."
                spellcheck="false"
              />
              <button v-if="searchQuery" class="books-clear-btn tc-dim" @click="searchQuery = ''">✕</button>
            </div>
            <div class="books-filters">
              <button
                v-for="s in statusFilters" :key="s"
                class="books-filter-btn"
                :class="{ active: activeStatus === s }"
                @click="activeStatus = s"
              >{{ s }}</button>
            </div>
          </div>

          <!-- Table -->
          <div class="term-table-wrap">
            <div v-if="loading" class="term-empty tc-amber">FETCHING CATALOG...</div>
            <div v-else-if="loadError" class="term-error">{{ loadError }}</div>
            <table v-else class="term-table books-table">
              <thead>
                <tr>
                  <th class="col-serial" @click="setSort('serial_number')">SERIAL <span class="sort-arrow">{{ sortArrow('serial_number') }}</span></th>
                  <th class="col-title"  @click="setSort('name')">TITLE <span class="sort-arrow">{{ sortArrow('name') }}</span></th>
                  <th class="col-author" @click="setSort('author')">AUTHOR <span class="sort-arrow">{{ sortArrow('author') }}</span></th>
                  <th class="col-num"    @click="setSort('total_copies')">COPIES <span class="sort-arrow">{{ sortArrow('total_copies') }}</span></th>
                  <th class="col-num"    @click="setSort('available')">AVAIL <span class="sort-arrow">{{ sortArrow('available') }}</span></th>
                  <th class="col-num"    @click="setSort('on_loan')">LOAN <span class="sort-arrow">{{ sortArrow('on_loan') }}</span></th>
                  <th class="col-num">RESV</th>
                  <th class="col-year"   @click="setSort('date_published')">YEAR <span class="sort-arrow">{{ sortArrow('date_published') }}</span></th>
                  <th class="col-status">STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="book in sortedBooks" :key="book.serial_number"
                  class="books-row"
                  :class="{ selected: selectedBook?.serial_number === book.serial_number }"
                  @click="selectedBook = selectedBook?.serial_number === book.serial_number ? null : book"
                >
                  <td class="tc-dim">{{ book.serial_number }}</td>
                  <td class="tc-text books-title-cell">{{ book.name }}</td>
                  <td class="tc-dim  books-trunc-cell">{{ book.author }}</td>
                  <td style="text-align:right;" class="tc-text">{{ book.total_copies }}</td>
                  <td style="text-align:right;" class="tc-green">{{ book.available }}</td>
                  <td style="text-align:right;" class="tc-amber">{{ book.on_loan }}</td>
                  <td style="text-align:right;" class="tc-blue">{{ book.reserved }}</td>
                  <td class="tc-dim">{{ book.date_published ? new Date(book.date_published).getFullYear() : '—' }}</td>
                  <td><span class="books-status" :class="statusClass(book)">{{ statusLabel(book) }}</span></td>
                </tr>
                <tr v-if="!loading && sortedBooks.length === 0 && !loadError">
                  <td colspan="9"><div class="term-empty">NO RECORDS MATCH FILTER</div></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="term-bar-totals">
            <span>SHOWING {{ sortedBooks.length }} / {{ books.length }} TITLES</span>
            <span>SORT: <span class="tc-amber">{{ sortKey.toUpperCase() }} {{ sortDir === 'asc' ? '↑' : '↓' }}</span></span>
            <span>FETCHED: <span class="tc-amber">{{ lastUpdated }}</span></span>
          </div>
        </div>
      </div>

      <!-- Right Panel -->
      <div class="term-col">

        <!-- Book Detail -->
        <div class="term-section books-detail-section">
          <div class="term-section-header">
            <span class="tc-amber" style="font-weight:600;letter-spacing:.12em;">BOOK DETAIL</span>
            <span v-if="selectedBook" class="tc-dim">— {{ selectedBook.serial_number }}</span>
            <span v-else class="tc-dim">— SELECT A ROW</span>
          </div>

          <div v-if="selectedBook" class="books-detail-body">
            <div class="books-detail-title tc-text">{{ selectedBook.name }}</div>
            <div class="books-detail-author tc-dim">{{ selectedBook.author }}</div>

            <div class="books-detail-row">
              <span class="books-detail-label tc-dim">SERIAL</span>
              <span class="tc-amber">{{ selectedBook.serial_number }}</span>
            </div>
            <div class="books-detail-row">
              <span class="books-detail-label tc-dim">PUBLISHER ID</span>
              <span class="tc-text">{{ selectedBook.publisher_id ?? '—' }}</span>
            </div>
            <div class="books-detail-row">
              <span class="books-detail-label tc-dim">PUBLISHED</span>
              <span class="tc-text">{{ selectedBook.date_published ? new Date(selectedBook.date_published).toLocaleDateString('en-GB') : '—' }}</span>
            </div>
            <div class="books-detail-row">
              <span class="books-detail-label tc-dim">DATE ADDED</span>
              <span class="tc-text">{{ selectedBook.date_added ? new Date(selectedBook.date_added).toLocaleDateString('en-GB') : '—' }}</span>
            </div>
            <div class="books-detail-row">
              <span class="books-detail-label tc-dim">PAGES</span>
              <span class="tc-text">{{ selectedBook.number_of_pages ?? '—' }}</span>
            </div>

            <div class="books-detail-divider" />

            <div class="books-detail-metrics">
              <div class="books-metric-block">
                <div class="books-metric-val tc-text">{{ selectedBook.total_copies }}</div>
                <div class="books-metric-label tc-dim">COPIES</div>
              </div>
              <div class="books-metric-block">
                <div class="books-metric-val tc-green">{{ selectedBook.available }}</div>
                <div class="books-metric-label tc-dim">AVAIL</div>
              </div>
              <div class="books-metric-block">
                <div class="books-metric-val tc-amber">{{ selectedBook.on_loan }}</div>
                <div class="books-metric-label tc-dim">ON LOAN</div>
              </div>
              <div class="books-metric-block">
                <div class="books-metric-val tc-blue">{{ selectedBook.reserved }}</div>
                <div class="books-metric-label tc-dim">RESERVED</div>
              </div>
            </div>

            <div class="books-avail-bar-track" v-if="selectedBook.total_copies > 0">
              <div class="books-avail-segment" style="background:var(--term-green);"
                :style="{ width: pct(selectedBook.available, selectedBook.total_copies) + '%' }" />
              <div class="books-avail-segment" style="background:var(--term-amber);"
                :style="{ width: pct(selectedBook.on_loan, selectedBook.total_copies) + '%' }" />
              <div class="books-avail-segment" style="background:var(--term-blue);opacity:.7;"
                :style="{ width: pct(selectedBook.reserved, selectedBook.total_copies) + '%' }" />
            </div>
            <div class="books-avail-legend">
              <span class="tc-green">■ AVAIL</span>
              <span class="tc-amber">■ LOAN</span>
              <span class="tc-blue">■ RESV</span>
            </div>

            <div class="books-detail-row" style="margin-top:8px;">
              <span class="books-detail-label tc-dim">STATUS</span>
              <span class="books-status" :class="statusClass(selectedBook)">{{ statusLabel(selectedBook) }}</span>
            </div>
          </div>

          <div v-else class="term-empty" style="height:220px;">SELECT A BOOK TO VIEW DETAILS</div>
        </div>

        <!-- Top Borrowed -->
        <div class="term-section" style="flex:1;min-height:0;">
          <div class="term-section-header">
            <span class="tc-amber" style="font-weight:600;letter-spacing:.12em;">TOP BORROWED</span>
            <span class="tc-dim">— ALL TIME</span>
          </div>
          <div class="term-table-wrap">
            <div v-if="loading" class="term-empty tc-amber">LOADING...</div>
            <table v-else class="term-table">
              <thead>
                <tr>
                  <th style="width:24px;">#</th>
                  <th>TITLE</th>
                  <th>AUTHOR</th>
                  <th style="text-align:right;">LOANS</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(book, i) in topBorrowed" :key="book.serial_number">
                  <td class="tc-amber" style="font-weight:700;">{{ i + 1 }}</td>
                  <td class="tc-text books-title-cell">{{ book.name }}</td>
                  <td class="tc-dim  books-trunc-cell">{{ book.author }}</td>
                  <td class="tc-amber" style="text-align:right;">{{ book.borrow_count }}</td>
                </tr>
                <tr v-if="!loading && topBorrowed.length === 0">
                  <td colspan="4"><div class="term-empty">NO DATA</div></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Copy Condition Breakdown -->
        <div class="term-section" style="flex-shrink:0;">
          <div class="term-section-header">
            <span class="tc-amber" style="font-weight:600;letter-spacing:.12em;">COPY CONDITIONS</span>
            <span class="tc-dim">— FROM book_copy</span>
          </div>
          <div style="padding:6px 0;">
            <div v-if="loading" class="term-empty tc-amber" style="height:60px;">LOADING...</div>
            <template v-else>
              <div v-for="item in conditionStats" :key="item.condition" class="term-bar-row">
                <div class="term-bar-label">{{ (item.condition ?? 'UNKNOWN').slice(0, 10).toUpperCase() }}</div>
                <div class="term-bar-track">
                  <div class="term-bar-fill" :style="{ width: item.pct + '%', background: conditionColor(item.condition) }" />
                </div>
                <div class="term-bar-pct" :style="{ color: conditionColor(item.condition) }">{{ item.count }}</div>
              </div>
            </template>
          </div>
          <div class="term-bar-totals">
            <span>{{ conditionStats.length }} CONDITIONS</span>
            <span>TOTAL COPIES: <span class="tc-amber">{{ stats.totalCopies }}</span></span>
          </div>
        </div>

      </div>
    </div>

    <div class="term-footer">
      <span>Alexandria Console — CS 4347.004 — TEAM 12</span>
      <div class="term-footer-right">
        <span>POSTGRESQL {{ pgVersion }}</span>
        <span class="term-conn-ok">CONN OK</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface BookRow {
  serial_number:   string
  name:            string
  author:          string
  publisher_id:    number | null
  date_published:  string | null
  date_added:      string | null
  number_of_pages: number | null
  total_copies:    number
  on_loan:         number
  reserved:        number
  available:       number
}

interface TopBook {
  serial_number: string
  name:          string
  author:        string
  borrow_count:  number
}

interface ConditionStat {
  condition: string
  count:     number
  pct:       number
}

const { pgVersion } = useSystemStats()
const q = (sql: string) => $fetch('/api/query', { method: 'POST', body: { sql } }) as Promise<any[]>

const loading      = ref(false)
const loadError    = ref('')
const lastUpdated  = ref('—')

const books          = ref<BookRow[]>([])
const topBorrowed    = ref<TopBook[]>([])
const conditionStats = ref<ConditionStat[]>([])

const searchQuery  = ref('')
const activeStatus = ref('ALL')
const sortKey      = ref('name')
const sortDir      = ref<'asc' | 'desc'>('asc')
const selectedBook = ref<BookRow | null>(null)

const statusFilters = ['ALL', 'IN STOCK', 'PARTIAL', 'ALL OUT', 'RESERVED']

const stats = computed(() => ({
  totalTitles: books.value.length,
  totalCopies: books.value.reduce((s, b) => s + b.total_copies, 0),
  available:   books.value.reduce((s, b) => s + b.available,    0),
  onLoan:      books.value.reduce((s, b) => s + b.on_loan,      0),
  reserved:    books.value.reduce((s, b) => s + b.reserved,     0),
  overdue:     0,
}))

const filteredBooks = computed(() => {
  let list = books.value
  if (searchQuery.value.trim()) {
    const needle = searchQuery.value.toLowerCase()
    list = list.filter(b =>
      b.name?.toLowerCase().includes(needle)   ||
      b.author?.toLowerCase().includes(needle) ||
      b.serial_number?.toLowerCase().includes(needle)
    )
  }
  if (activeStatus.value !== 'ALL')
    list = list.filter(b => statusLabel(b) === activeStatus.value)
  return list
})

const sortedBooks = computed(() => {
  return [...filteredBooks.value].sort((a, b) => {
    const av = (a as any)[sortKey.value]
    const bv = (b as any)[sortKey.value]
    if (av == null) return 1
    if (bv == null) return -1
    const cmp = typeof av === 'string' ? av.localeCompare(bv) : Number(av) - Number(bv)
    return sortDir.value === 'asc' ? cmp : -cmp
  })
})


function statusLabel(book: BookRow) {
  if (book.available === 0 && book.reserved > 0) return 'RESERVED'
  if (book.available === 0)                      return 'ALL OUT'
  if (book.available === book.total_copies)      return 'IN STOCK'
  return 'PARTIAL'
}

function statusClass(book: BookRow) {
  return { 'RESERVED': 'status-blue', 'ALL OUT': 'status-red', 'IN STOCK': 'status-green', 'PARTIAL': 'status-amber' }[statusLabel(book)] ?? ''
}

function pct(val: number, total: number) {
  return total ? Math.round((val / total) * 100) : 0
}

function setSort(key: string) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}

function sortArrow(key: string) {
  if (sortKey.value !== key) return '⇅'
  return sortDir.value === 'asc' ? '↑' : '↓'
}

function conditionColor(condition: string) {
  const c = (condition ?? '').toLowerCase()
  if (c.includes('new') || c.includes('excellent')) return 'var(--term-green)'
  if (c.includes('good'))                           return 'var(--term-amber)'
  if (c.includes('fair') || c.includes('worn'))     return 'var(--term-blue)'
  if (c.includes('poor') || c.includes('damage'))   return 'var(--term-red)'
  return 'var(--term-dim)'
}

const loadAll = async () => {
  loading.value   = true
  loadError.value = ''
  try {
    const [catalogRes, topRes, conditionRes] = await Promise.all([
      q(`SELECT * FROM v_book_catalog ORDER BY name LIMIT 500;`),
      q(`SELECT * FROM v_top_borrowed LIMIT 10;`),
      q(`SELECT condition, COUNT(*) AS count FROM book_copy GROUP BY condition ORDER BY count DESC;`),
    ])

    books.value = (catalogRes as any[]).map(r => ({
      serial_number:   r.serial_number,
      name:            r.name,
      author:          r.author ?? '—',
      publisher_id:    r.publisher_id != null ? Number(r.publisher_id) : null,
      date_published:  r.date_published,
      date_added:      r.date_added,
      number_of_pages: r.number_of_pages != null ? Number(r.number_of_pages) : null,
      total_copies:    Number(r.total_copies),
      on_loan:         Number(r.on_loan),
      reserved:        Number(r.reserved),
      available:       Number(r.available),
    }))

    topBorrowed.value = (topRes as any[]).map(r => ({
      serial_number: r.serial_number,
      name:          r.name,
      author:        r.author ?? '—',
      borrow_count:  Number(r.borrow_count),
    }))

    const maxCond = Math.max(...(conditionRes as any[]).map(r => Number(r.count)), 1)
    conditionStats.value = (conditionRes as any[]).map(r => ({
      condition: r.condition,
      count:     Number(r.count),
      pct:       Math.round((Number(r.count) / maxCond) * 100),
    }))

    lastUpdated.value = new Date().toLocaleTimeString('en-GB', { hour12: false })
  }
  catch (e: any) {
    loadError.value = e?.data?.message ?? e?.message ?? 'Failed to load book catalog'
  }
  finally {
    loading.value = false
  }
}

onMounted(loadAll)
</script>

<style scoped>
.books-body {
  display: grid;
  grid-template-columns: 62fr 38fr;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.books-body .term-col:first-child { border-right: 2px solid var(--term-border); }

.books-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  background: var(--term-panel);
  border-bottom: 1px solid var(--term-border);
  flex-shrink: 0;
  flex-wrap: wrap;
}
.books-search-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--term-border);
  padding: 2px 8px;
  flex: 1;
  min-width: 180px;
  background: var(--term-bg);
}
.books-search-wrap:focus-within { border-color: var(--term-amber); }
.books-search-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--term-text);
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  caret-color: var(--term-amber);
}
.books-search-input::placeholder { color: var(--term-dim); }
.books-clear-btn {
  background: none; border: none; cursor: pointer;
  font-size: 10px; padding: 0; font-family: inherit;
}
.books-clear-btn:hover { color: var(--term-red); }

.books-filters { display: flex; gap: 3px; flex-wrap: wrap; }
.books-filter-btn {
  background: none;
  border: 1px solid var(--term-border);
  color: var(--term-dim);
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.08em;
  padding: 2px 7px;
  cursor: pointer;
  transition: all 0.12s;
}
.books-filter-btn:hover  { border-color: var(--term-amber); color: var(--term-amber); }
.books-filter-btn.active { border-color: var(--term-amber); color: var(--term-amber); background: rgba(255,179,0,0.08); }

.books-table .col-serial { width: 90px; }
.books-table .col-title  { min-width: 140px; }
.books-table .col-author { width: 140px; }
.books-table .col-num    { width: 50px; text-align: right; }
.books-table .col-year   { width: 46px; }
.books-table .col-status { width: 76px; }

.books-title-cell,
.books-trunc-cell {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.books-row          { cursor: pointer; transition: background 0.08s; }
.books-row:hover    { background: rgba(255,179,0,0.04); }
.books-row.selected { background: rgba(255,179,0,0.09); }
.sort-arrow         { color: var(--term-dim); font-size: 9px; margin-left: 2px; }

.books-status  { font-size: 9px; letter-spacing: 0.08em; font-weight: 600; }
.status-green  { color: var(--term-green); }
.status-amber  { color: var(--term-amber); }
.status-red    { color: var(--term-red);   }
.status-blue   { color: var(--term-blue);  }

.books-detail-section  { flex-shrink: 0; }
.books-detail-body     { padding: 10px 14px 12px; display: flex; flex-direction: column; gap: 5px; }
.books-detail-title    { font-size: 13px; font-weight: 600; line-height: 1.4; }
.books-detail-author   { font-size: 11px; margin-bottom: 4px; }
.books-detail-row      { display: flex; align-items: center; gap: 8px; font-size: 11px; }
.books-detail-label    { width: 80px; flex-shrink: 0; font-size: 9px; letter-spacing: 0.08em; }
.books-detail-divider  { height: 1px; background: var(--term-border); margin: 6px 0; }

.books-detail-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  border: 1px solid var(--term-border);
  background: var(--term-border);
  margin-bottom: 8px;
}
.books-metric-block { background: var(--term-panel); padding: 6px 8px; text-align: center; }
.books-metric-val   { font-size: 18px; font-weight: 700; line-height: 1; }
.books-metric-label { font-size: 8px; letter-spacing: 0.1em; margin-top: 3px; }

.books-avail-bar-track {
  height: 8px;
  background: var(--term-border);
  display: flex;
  overflow: hidden;
  margin-bottom: 4px;
}
.books-avail-segment { height: 100%; transition: width 0.3s; }
.books-avail-legend  { display: flex; gap: 10px; font-size: 9px; letter-spacing: 0.06em; }
</style>