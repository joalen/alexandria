<template>
  <div class="books-root">

    <!-- Stat Tiles -->
    <div class="books-tiles">
      <div class="term-tile">
        <div class="term-tile-label">TOTAL TITLES</div>
        <div class="term-tile-value tc-text">{{ stats.totalTitles }}</div>
        <div class="term-tile-change tc-dim">= IN CATALOG</div>
      </div>
      <div class="term-tile">
        <div class="term-tile-label">TOTAL COPIES</div>
        <div class="term-tile-value tc-text">{{ stats.totalCopies }}</div>
        <div class="term-tile-change tc-dim">= PHYSICAL STOCK</div>
      </div>
      <div class="term-tile">
        <div class="term-tile-label">AVAILABLE</div>
        <div class="term-tile-value tc-green">{{ stats.available }}</div>
        <div class="term-tile-change tc-green">▲ READY TO LOAN</div>
      </div>
      <div class="term-tile">
        <div class="term-tile-label">ON LOAN</div>
        <div class="term-tile-value tc-amber">{{ stats.onLoan }}</div>
        <div class="term-tile-change tc-amber">▲ CURRENTLY OUT</div>
      </div>
      <div class="term-tile">
        <div class="term-tile-label">RESERVED</div>
        <div class="term-tile-value tc-blue">{{ stats.reserved }}</div>
        <div class="term-tile-change tc-dim">= ON HOLD</div>
      </div>
      <div class="term-tile" style="border-right: none;">
        <div class="term-tile-label">OVERDUE</div>
        <div class="term-tile-value" :class="stats.overdue > 0 ? 'tc-red' : 'tc-text'">
          {{ stats.overdue }}
        </div>
        <div class="term-tile-change" :class="stats.overdue > 0 ? 'tc-red' : 'tc-dim'">
          {{ stats.overdue > 0 ? '▲ ACTION REQUIRED' : '= NONE' }}
        </div>
      </div>
    </div>

    <!-- Body -->
    <div class="books-body">

      <!-- Left: Catalog -->
      <div class="term-col">
        <div class="term-section" style="flex: 1; min-height: 0;">

          <!-- Section Header -->
          <div class="term-section-header">
            <span class="tc-amber" style="font-weight: 600; letter-spacing: 0.12em;">BOOK CATALOG</span>
            <span class="tc-dim">—</span>
            <span class="term-live-dot" style="width:6px;height:6px;"></span>
            <span class="tc-green" style="font-size:9px;">{{ filteredBooks.length }} RECORDS</span>
            <div style="margin-left: auto; display: flex; gap: 8px; align-items: center;">
              <button class="books-action-btn tc-green" @click="showAddModal = true">+ ADD BOOK</button>
              <button
                class="books-action-btn"
                :class="selectedBook ? 'tc-amber' : 'tc-dim'"
                :disabled="!selectedBook"
                @click="selectedBook && (showEditModal = true)"
              >✎ EDIT</button>
              <button
                class="books-action-btn"
                :class="selectedBook ? 'tc-red' : 'tc-dim'"
                :disabled="!selectedBook"
                @click="selectedBook && confirmDelete()"
              >✕ REMOVE</button>
            </div>
          </div>

          <!-- Toolbar -->
          <div class="books-toolbar">
            <div class="books-search-wrap">
              <span class="tc-dim books-search-icon">▶</span>
              <input
                v-model="searchQuery"
                class="books-search-input"
                placeholder="SEARCH TITLE / AUTHOR / ISBN..."
                spellcheck="false"
              />
              <button v-if="searchQuery" class="books-clear-btn tc-dim" @click="searchQuery = ''">✕</button>
            </div>
            <div class="books-filters">
              <button
                v-for="g in ['ALL', ...genres]"
                :key="g"
                class="books-filter-btn"
                :class="{ active: activeGenre === g }"
                @click="activeGenre = g"
              >{{ g }}</button>
            </div>
          </div>

          <!-- Table -->
          <div class="term-table-wrap">
            <table class="term-table books-table">
              <thead>
                <tr>
                  <th class="col-id" @click="setSort('id')">
                    BOOK ID <span class="sort-arrow">{{ sortArrow('id') }}</span>
                  </th>
                  <th class="col-title" @click="setSort('title')">
                    TITLE <span class="sort-arrow">{{ sortArrow('title') }}</span>
                  </th>
                  <th class="col-author" @click="setSort('author')">
                    AUTHOR <span class="sort-arrow">{{ sortArrow('author') }}</span>
                  </th>
                  <th class="col-genre" @click="setSort('genre')">
                    GENRE <span class="sort-arrow">{{ sortArrow('genre') }}</span>
                  </th>
                  <th class="col-num" @click="setSort('copies')">
                    COPIES <span class="sort-arrow">{{ sortArrow('copies') }}</span>
                  </th>
                  <th class="col-num" @click="setSort('available')">
                    AVAIL <span class="sort-arrow">{{ sortArrow('available') }}</span>
                  </th>
                  <th class="col-num" @click="setSort('onLoan')">
                    LOAN <span class="sort-arrow">{{ sortArrow('onLoan') }}</span>
                  </th>
                  <th class="col-num">RESV</th>
                  <th class="col-status">STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="book in sortedBooks"
                  :key="book.id"
                  class="books-row"
                  :class="{ selected: selectedBook?.id === book.id }"
                  @click="selectBook(book)"
                >
                  <td class="tc-dim">{{ book.id }}</td>
                  <td class="tc-text books-title-cell">{{ book.title }}</td>
                  <td class="tc-dim">{{ book.author }}</td>
                  <td>
                    <span class="books-genre-tag" :style="genreStyle(book.genre)">{{ book.genre }}</span>
                  </td>
                  <td class="tc-text" style="text-align:right;">{{ book.copies }}</td>
                  <td class="tc-green" style="text-align:right;">{{ book.available }}</td>
                  <td class="tc-amber" style="text-align:right;">{{ book.onLoan }}</td>
                  <td class="tc-blue" style="text-align:right;">{{ book.reserved }}</td>
                  <td>
                    <span class="books-status" :class="statusClass(book)">{{ statusLabel(book) }}</span>
                  </td>
                </tr>
                <tr v-if="sortedBooks.length === 0">
                  <td colspan="9">
                    <div class="term-empty">NO RECORDS MATCH FILTER</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Table Footer -->
          <div class="term-bar-totals">
            <span>SHOWING {{ sortedBooks.length }} / {{ books.length }} TITLES</span>
            <span>SORT: <span class="tc-amber">{{ sortKey.toUpperCase() }} {{ sortDir === 'asc' ? '↑' : '↓' }}</span></span>
            <span>LAST UPDATED: <span class="tc-amber">{{ lastUpdated }}</span></span>
          </div>
        </div>
      </div>

      <!-- Right: Detail + Genre Breakdown -->
      <div class="term-col">

        <!-- Book Detail Panel -->
        <div class="term-section books-detail-section">
          <div class="term-section-header">
            <span class="tc-amber" style="font-weight:600;letter-spacing:.12em;">BOOK DETAIL</span>
            <span v-if="selectedBook" class="tc-dim" style="margin-left:4px;">— {{ selectedBook.id }}</span>
            <span v-else class="tc-dim" style="margin-left:4px;">— SELECT A ROW</span>
          </div>

          <div v-if="selectedBook" class="books-detail-body">
            <div class="books-detail-title tc-text">{{ selectedBook.title }}</div>
            <div class="books-detail-author tc-dim">{{ selectedBook.author }}</div>
            <div class="books-detail-row">
              <span class="books-detail-label tc-dim">ISBN</span>
              <span class="tc-amber">{{ selectedBook.isbn }}</span>
            </div>
            <div class="books-detail-row">
              <span class="books-detail-label tc-dim">GENRE</span>
              <span class="books-genre-tag" :style="genreStyle(selectedBook.genre)">{{ selectedBook.genre }}</span>
            </div>
            <div class="books-detail-row">
              <span class="books-detail-label tc-dim">PUBLISHED</span>
              <span class="tc-text">{{ selectedBook.year }}</span>
            </div>
            <div class="books-detail-row">
              <span class="books-detail-label tc-dim">PUBLISHER</span>
              <span class="tc-text">{{ selectedBook.publisher }}</span>
            </div>
            <div class="books-detail-divider"></div>
            <div class="books-detail-metrics">
              <div class="books-metric-block">
                <div class="books-metric-val tc-text">{{ selectedBook.copies }}</div>
                <div class="books-metric-label tc-dim">COPIES</div>
              </div>
              <div class="books-metric-block">
                <div class="books-metric-val tc-green">{{ selectedBook.available }}</div>
                <div class="books-metric-label tc-dim">AVAIL</div>
              </div>
              <div class="books-metric-block">
                <div class="books-metric-val tc-amber">{{ selectedBook.onLoan }}</div>
                <div class="books-metric-label tc-dim">ON LOAN</div>
              </div>
              <div class="books-metric-block">
                <div class="books-metric-val tc-blue">{{ selectedBook.reserved }}</div>
                <div class="books-metric-label tc-dim">RESERVED</div>
              </div>
            </div>
            <!-- Copy availability bar -->
            <div class="books-avail-bar-wrap">
              <div class="books-avail-bar-track">
                <div
                  class="books-avail-segment"
                  style="background: var(--term-green);"
                  :style="{ width: pct(selectedBook.available, selectedBook.copies) + '%' }"
                ></div>
                <div
                  class="books-avail-segment"
                  style="background: var(--term-amber);"
                  :style="{ width: pct(selectedBook.onLoan, selectedBook.copies) + '%' }"
                ></div>
                <div
                  class="books-avail-segment"
                  style="background: var(--term-blue); opacity: 0.7;"
                  :style="{ width: pct(selectedBook.reserved, selectedBook.copies) + '%' }"
                ></div>
              </div>
              <div class="books-avail-legend">
                <span class="tc-green">■ AVAIL</span>
                <span class="tc-amber">■ LOAN</span>
                <span class="tc-blue">■ RESV</span>
              </div>
            </div>
            <div class="books-detail-row" style="margin-top:8px;">
              <span class="books-detail-label tc-dim">STATUS</span>
              <span class="books-status" :class="statusClass(selectedBook)">{{ statusLabel(selectedBook) }}</span>
            </div>
            <div class="books-detail-row">
              <span class="books-detail-label tc-dim">LOCATION</span>
              <span class="tc-text">{{ selectedBook.location }}</span>
            </div>
          </div>

          <div v-else class="term-empty" style="height:220px;">SELECT A BOOK TO VIEW DETAILS</div>
        </div>

        <!-- Genre Breakdown -->
        <div class="term-section" style="flex:1; min-height:0;">
          <div class="term-section-header">
            <span class="tc-amber" style="font-weight:600;letter-spacing:.12em;">GENRE BREAKDOWN</span>
            <span class="tc-dim">— BY COPY COUNT</span>
          </div>
          <div class="term-table-wrap">
            <div class="term-bars">
              <div v-for="item in genreStats" :key="item.genre" class="term-bar-row">
                <div class="term-bar-label">{{ item.genre }}</div>
                <div class="term-bar-track">
                  <div
                    class="term-bar-fill"
                    :style="{ width: item.pct + '%', background: item.color }"
                  ></div>
                </div>
                <div class="term-bar-pct" :style="{ color: item.color }">{{ item.copies }}</div>
              </div>
            </div>
          </div>
          <div class="term-bar-totals">
            <span>{{ genres.length }} GENRES</span>
            <span>TOTAL COPIES: <span class="tc-amber">{{ stats.totalCopies }}</span></span>
            <span>AVG PER TITLE: <span class="tc-amber">{{ avgCopies }}</span></span>
          </div>
        </div>

        <!-- Top Borrowed -->
        <div class="term-section">
          <div class="term-section-header">
            <span class="tc-amber" style="font-weight:600;letter-spacing:.12em;">TOP BORROWED</span>
            <span class="tc-dim">— ALL TIME</span>
          </div>
          <div class="term-table-wrap" style="max-height: 160px;">
            <table class="term-table">
              <thead>
                <tr>
                  <th style="width:28px;">#</th>
                  <th>TITLE</th>
                  <th style="text-align:right;">LOANS</th>
                  <th style="text-align:right;">UTIL%</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(book, i) in topBorrowed" :key="book.id">
                  <td class="tc-amber" style="font-weight:700;">{{ i + 1 }}</td>
                  <td class="tc-text" style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ book.title }}</td>
                  <td class="tc-amber" style="text-align:right;">{{ book.totalLoans }}</td>
                  <td :class="book.util >= 80 ? 'tc-red' : book.util >= 50 ? 'tc-amber' : 'tc-green'" style="text-align:right;">
                    {{ book.util }}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>

    <!-- Add / Edit Modal -->
    <Teleport to="body">
      <div v-if="showAddModal || showEditModal" class="books-modal-overlay" @click.self="closeModals">
        <div class="books-modal">
          <div class="books-modal-header">
            <span class="tc-amber" style="font-weight:700;letter-spacing:.1em;">
              {{ showAddModal ? '+ ADD NEW BOOK' : '✎ EDIT BOOK' }}
            </span>
            <button class="books-modal-close tc-dim" @click="closeModals">✕</button>
          </div>
          <div class="books-modal-body">
            <div class="books-form-row">
              <label class="books-form-label tc-dim">TITLE</label>
              <input v-model="form.title" class="term-input books-form-input" placeholder="Book title..." />
            </div>
            <div class="books-form-row">
              <label class="books-form-label tc-dim">AUTHOR</label>
              <input v-model="form.author" class="term-input books-form-input" placeholder="Author name..." />
            </div>
            <div class="books-form-row">
              <label class="books-form-label tc-dim">ISBN</label>
              <input v-model="form.isbn" class="term-input books-form-input" placeholder="978-..." />
            </div>
            <div class="books-form-row">
              <label class="books-form-label tc-dim">GENRE</label>
              <select v-model="form.genre" class="term-select books-form-input">
                <option v-for="g in genres" :key="g" :value="g">{{ g }}</option>
              </select>
            </div>
            <div class="books-form-row">
              <label class="books-form-label tc-dim">PUBLISHER</label>
              <input v-model="form.publisher" class="term-input books-form-input" placeholder="Publisher..." />
            </div>
            <div class="books-form-row">
              <label class="books-form-label tc-dim">YEAR</label>
              <input v-model="form.year" class="term-input books-form-input" type="number" placeholder="2024" />
            </div>
            <div class="books-form-row">
              <label class="books-form-label tc-dim">COPIES</label>
              <input v-model.number="form.copies" class="term-input books-form-input" type="number" min="1" placeholder="1" />
            </div>
            <div class="books-form-row">
              <label class="books-form-label tc-dim">LOCATION</label>
              <input v-model="form.location" class="term-input books-form-input" placeholder="e.g. SHELF A-3" />
            </div>
          </div>
          <div class="books-modal-footer">
            <button class="books-action-btn tc-dim" @click="closeModals">CANCEL</button>
            <button class="books-action-btn tc-green" style="border-color: var(--term-green);" @click="saveBook">
              {{ showAddModal ? 'ADD BOOK' : 'SAVE CHANGES' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const books = ref([
  { id: 'BK#0001', title: 'Harry Potter and the Sorcerer\'s Stone', author: 'J.K. Rowling',      isbn: '978-0439708180', genre: 'FANTASY',   copies: 5, available: 2, onLoan: 2, reserved: 1, year: 1997, publisher: 'Scholastic',      location: 'SHELF A-1', totalLoans: 48, util: 80 },
  { id: 'BK#0002', title: 'Harry Potter and the Chamber of Secrets',  author: 'J.K. Rowling',      isbn: '978-0439064873', genre: 'FANTASY',   copies: 4, available: 1, onLoan: 2, reserved: 1, year: 1998, publisher: 'Scholastic',      location: 'SHELF A-1', totalLoans: 41, util: 75 },
  { id: 'BK#0003', title: 'Harry Potter and the Prisoner of Azkaban', author: 'J.K. Rowling',      isbn: '978-0439136365', genre: 'FANTASY',   copies: 4, available: 1, onLoan: 3, reserved: 0, year: 1999, publisher: 'Scholastic',      location: 'SHELF A-2', totalLoans: 39, util: 75 },
  { id: 'BK#0004', title: 'Murder on the Orient Express',             author: 'Agatha Christie',   isbn: '978-0062693662', genre: 'MYSTERY',   copies: 3, available: 1, onLoan: 1, reserved: 1, year: 1934, publisher: 'HarperCollins',  location: 'SHELF B-1', totalLoans: 34, util: 67 },
  { id: 'BK#0005', title: 'Death on the Nile',                        author: 'Agatha Christie',   isbn: '978-0062073556', genre: 'MYSTERY',   copies: 3, available: 2, onLoan: 1, reserved: 0, year: 1937, publisher: 'HarperCollins',  location: 'SHELF B-1', totalLoans: 29, util: 33 },
  { id: 'BK#0006', title: 'Along Came a Spider',                      author: 'James Patterson',   isbn: '978-0446364164', genre: 'THRILLER',  copies: 2, available: 1, onLoan: 1, reserved: 0, year: 1993, publisher: 'Little, Brown',  location: 'SHELF B-3', totalLoans: 27, util: 50 },
  { id: 'BK#0007', title: 'Kiss the Girls',                           author: 'James Patterson',   isbn: '978-0446602341', genre: 'THRILLER',  copies: 2, available: 1, onLoan: 1, reserved: 0, year: 1995, publisher: 'Little, Brown',  location: 'SHELF B-3', totalLoans: 24, util: 50 },
  { id: 'BK#0008', title: 'Crime and Punishment',                     author: 'Fyodor Dostoevsky', isbn: '978-0486415871', genre: 'CLASSIC',   copies: 3, available: 2, onLoan: 1, reserved: 0, year: 1866, publisher: 'Dover',          location: 'SHELF C-1', totalLoans: 22, util: 33 },
  { id: 'BK#0009', title: 'American Gods',                            author: 'Neil Gaiman',       isbn: '978-0062572233', genre: 'FANTASY',   copies: 2, available: 1, onLoan: 1, reserved: 0, year: 2001, publisher: 'Morrow',          location: 'SHELF A-3', totalLoans: 20, util: 50 },
  { id: 'BK#0010', title: 'The Alchemist',                            author: 'Paulo Coelho',      isbn: '978-0062315007', genre: 'FICTION',   copies: 3, available: 2, onLoan: 1, reserved: 0, year: 1988, publisher: 'HarperOne',      location: 'SHELF D-2', totalLoans: 33, util: 33 },
  { id: 'BK#0011', title: 'A Study in Scarlet',                       author: 'Arthur Conan Doyle',isbn: '978-0486474656', genre: 'MYSTERY',   copies: 2, available: 2, onLoan: 0, reserved: 0, year: 1887, publisher: 'Dover',          location: 'SHELF B-2', totalLoans: 18, util: 0  },
  { id: 'BK#0012', title: 'Dune',                                     author: 'Frank Herbert',     isbn: '978-0441013593', genre: 'SCI-FI',    copies: 4, available: 3, onLoan: 1, reserved: 0, year: 1965, publisher: 'Ace',             location: 'SHELF E-1', totalLoans: 31, util: 25 },
  { id: 'BK#0013', title: 'Neuromancer',                              author: 'William Gibson',    isbn: '978-0441569595', genre: 'SCI-FI',    copies: 2, available: 0, onLoan: 2, reserved: 0, year: 1984, publisher: 'Ace',             location: 'SHELF E-2', totalLoans: 19, util: 100},
  { id: 'BK#0014', title: 'The Name of the Wind',                     author: 'Patrick Rothfuss',  isbn: '978-0756404741', genre: 'FANTASY',   copies: 3, available: 1, onLoan: 2, reserved: 0, year: 2007, publisher: 'DAW',             location: 'SHELF A-4', totalLoans: 25, util: 67 },
  { id: 'BK#0015', title: 'Sapiens',                                  author: 'Yuval Noah Harari', isbn: '978-0062316110', genre: 'NON-FICTION',copies:2, available: 1, onLoan: 1, reserved: 0, year: 2011, publisher: 'Harper',          location: 'SHELF F-1', totalLoans: 17, util: 50 },
])

const searchQuery  = ref('')
const activeGenre  = ref('ALL')
const sortKey      = ref('id')
const sortDir      = ref('asc')
const selectedBook = ref(null)
const showAddModal = ref(false)
const showEditModal= ref(false)
const lastUpdated  = ref(new Date().toLocaleTimeString('en-GB', { hour12: false }))

const emptyForm = () => ({
  title: '', author: '', isbn: '', genre: 'FICTION',
  publisher: '', year: new Date().getFullYear(),
  copies: 1, location: ''
})
const form = ref(emptyForm())

const genres = computed(() => [...new Set(books.value.map(b => b.genre))].sort())

const stats = computed(() => ({
  totalTitles: books.value.length,
  totalCopies: books.value.reduce((s, b) => s + b.copies, 0),
  available:   books.value.reduce((s, b) => s + b.available, 0),
  onLoan:      books.value.reduce((s, b) => s + b.onLoan, 0),
  reserved:    books.value.reduce((s, b) => s + b.reserved, 0),
  overdue:     0,
}))

const avgCopies = computed(() =>
  books.value.length ? (stats.value.totalCopies / books.value.length).toFixed(1) : 0
)

const filteredBooks = computed(() => {
  let list = books.value
  if (activeGenre.value !== 'ALL') list = list.filter(b => b.genre === activeGenre.value)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(b =>
      b.title.toLowerCase().includes(q)  ||
      b.author.toLowerCase().includes(q) ||
      b.isbn.includes(q)                 ||
      b.id.toLowerCase().includes(q)
    )
  }
  return list
})

const sortedBooks = computed(() => {
  return [...filteredBooks.value].sort((a, b) => {
    const av = a[sortKey.value], bv = b[sortKey.value]
    if (av == null) return 1
    if (bv == null) return -1
    const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv
    return sortDir.value === 'asc' ? cmp : -cmp
  })
})

const topBorrowed = computed(() =>
  [...books.value].sort((a, b) => b.totalLoans - a.totalLoans).slice(0, 5)
)

const genreColors = {
  'FANTASY':    '#4d9fff',
  'MYSTERY':    '#ffb300',
  'THRILLER':   '#ff4444',
  'CLASSIC':    '#888',
  'FICTION':    '#00c853',
  'SCI-FI':     '#a855f7',
  'NON-FICTION':'#f97316',
}

const genreStats = computed(() => {
  const maxCopies = Math.max(...genres.value.map(g =>
    books.value.filter(b => b.genre === g).reduce((s, b) => s + b.copies, 0)
  ), 1)
  return genres.value.map(g => {
    const copies = books.value.filter(b => b.genre === g).reduce((s, b) => s + b.copies, 0)
    return { genre: g, copies, pct: Math.round((copies / maxCopies) * 100), color: genreColors[g] || '#888' }
  }).sort((a, b) => b.copies - a.copies)
})

function statusLabel(book) {
  if (book.available === 0 && book.reserved > 0) return 'RESERVED'
  if (book.available === 0) return 'ALL OUT'
  if (book.available === book.copies) return 'IN STOCK'
  return 'PARTIAL'
}

function statusClass(book) {
  if (book.available === 0 && book.reserved > 0) return 'status-blue'
  if (book.available === 0) return 'status-red'
  if (book.available === book.copies) return 'status-green'
  return 'status-amber'
}

function genreStyle(genre) {
  const c = genreColors[genre] || '#888'
  return { color: c, borderColor: c }
}

function pct(val, total) {
  return total ? Math.round((val / total) * 100) : 0
}

function setSort(key) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}

function sortArrow(key) {
  if (sortKey.value !== key) return '⇅'
  return sortDir.value === 'asc' ? '↑' : '↓'
}

function selectBook(book) {
  selectedBook.value = selectedBook.value?.id === book.id ? null : book
}

function closeModals() {
  showAddModal.value  = false
  showEditModal.value = false
  form.value = emptyForm()
}

function saveBook() {
  if (!form.value.title || !form.value.author) return
  if (showAddModal.value) {
    const newId = `BK#${String(books.value.length + 1).padStart(4, '0')}`
    books.value.push({
      ...form.value,
      id: newId,
      available: form.value.copies,
      onLoan: 0,
      reserved: 0,
      totalLoans: 0,
      util: 0,
    })
  } else if (showEditModal.value && selectedBook.value) {
    const idx = books.value.findIndex(b => b.id === selectedBook.value.id)
    if (idx !== -1) Object.assign(books.value[idx], form.value)
    selectedBook.value = books.value[idx]
  }
  lastUpdated.value = new Date().toLocaleTimeString('en-GB', { hour12: false })
  closeModals()
}

function confirmDelete() {
  if (!selectedBook.value) return
  books.value = books.value.filter(b => b.id !== selectedBook.value.id)
  selectedBook.value = null
  lastUpdated.value = new Date().toLocaleTimeString('en-GB', { hour12: false })
}

// Pre-fill form on edit
watch(showEditModal, (val) => {
  if (val && selectedBook.value) form.value = { ...selectedBook.value }
})
</script>

<script>
import { watch } from 'vue'
export default { name: 'BooksPage' }
</script>

<style scoped>
.books-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* Tiles */
.books-tiles {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  border-bottom: 2px solid var(--term-border);
  flex-shrink: 0;
}
.books-tiles .term-tile { border-right: 1px solid var(--term-border); }

/* Body split */
.books-body {
  display: grid;
  grid-template-columns: 62fr 38fr;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.books-body .term-col:first-child { border-right: 2px solid var(--term-border); }

/* Toolbar */
.books-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
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
  min-width: 200px;
  background: var(--term-bg);
}
.books-search-wrap:focus-within { border-color: var(--term-amber); }

.books-search-icon { font-size: 9px; }

.books-search-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--term-text);
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.04em;
  caret-color: var(--term-amber);
}
.books-search-input::placeholder { color: var(--term-dim); }

.books-clear-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 10px;
  padding: 0;
  font-family: inherit;
  transition: color 0.15s;
}
.books-clear-btn:hover { color: var(--term-red); }

.books-filters {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

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
.books-filter-btn:hover { border-color: var(--term-amber); color: var(--term-amber); }
.books-filter-btn.active { border-color: var(--term-amber); color: var(--term-amber); background: rgba(255,179,0,0.08); }

/* Action buttons */
.books-action-btn {
  background: none;
  border: 1px solid var(--term-border);
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.08em;
  padding: 2px 8px;
  cursor: pointer;
  transition: all 0.12s;
}
.books-action-btn:not(:disabled):hover { background: rgba(255,255,255,0.04); }
.books-action-btn:disabled { opacity: 0.35; cursor: default; }

/* Table */
.books-table .col-id     { width: 80px; }
.books-table .col-title  { min-width: 160px; }
.books-table .col-author { width: 140px; }
.books-table .col-genre  { width: 100px; }
.books-table .col-num    { width: 52px; text-align: right; }
.books-table .col-status { width: 80px; }

.books-title-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.books-row { cursor: pointer; transition: background 0.08s; }
.books-row:hover { background: rgba(255,179,0,0.04); }
.books-row.selected { background: rgba(255,179,0,0.09); }

.books-genre-tag {
  font-size: 9px;
  letter-spacing: 0.08em;
  border: 1px solid;
  padding: 1px 5px;
}

.books-status {
  font-size: 9px;
  letter-spacing: 0.08em;
  font-weight: 600;
}
.status-green { color: var(--term-green); }
.status-amber { color: var(--term-amber); }
.status-red   { color: var(--term-red);   }
.status-blue  { color: var(--term-blue);  }

.sort-arrow { color: var(--term-dim); font-size: 9px; margin-left: 2px; }

/* Detail panel */
.books-detail-section { flex-shrink: 0; }

.books-detail-body {
  padding: 10px 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.books-detail-title {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1.4;
}
.books-detail-author { font-size: 11px; margin-bottom: 4px; }

.books-detail-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}
.books-detail-label { width: 76px; flex-shrink: 0; font-size: 9px; letter-spacing: 0.08em; }

.books-detail-divider {
  height: 1px;
  background: var(--term-border);
  margin: 6px 0;
}

.books-detail-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  border: 1px solid var(--term-border);
  background: var(--term-border);
  margin-bottom: 8px;
}
.books-metric-block {
  background: var(--term-panel);
  padding: 6px 8px;
  text-align: center;
}
.books-metric-val   { font-size: 18px; font-weight: 700; line-height: 1; }
.books-metric-label { font-size: 8px; letter-spacing: 0.1em; margin-top: 3px; }

/* Availability bar */
.books-avail-bar-wrap { display: flex; flex-direction: column; gap: 4px; }
.books-avail-bar-track {
  height: 8px;
  background: var(--term-border);
  display: flex;
  overflow: hidden;
}
.books-avail-segment { height: 100%; transition: width 0.3s ease; }
.books-avail-legend {
  display: flex;
  gap: 10px;
  font-size: 9px;
  letter-spacing: 0.06em;
}

/* Modal */
.books-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.books-modal {
  background: var(--term-panel);
  border: 1px solid var(--term-amber);
  width: 480px;
  display: flex;
  flex-direction: column;
}

.books-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  background: var(--term-header);
  border-bottom: 1px solid var(--term-border);
  font-size: 11px;
  letter-spacing: 0.08em;
}

.books-modal-close {
  background: none;
  border: none;
  font-size: 13px;
  cursor: pointer;
  font-family: inherit;
  transition: color 0.15s;
}
.books-modal-close:hover { color: var(--term-red); }

.books-modal-body {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.books-form-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.books-form-label {
  width: 80px;
  flex-shrink: 0;
  font-size: 9px;
  letter-spacing: 0.1em;
}
.books-form-input { flex: 1; width: 100%; }

.books-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 8px 14px;
  border-top: 1px solid var(--term-border);
  background: var(--term-header);
}
</style>