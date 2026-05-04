<template>
  <div style="display:flex;flex-direction:column;height:100%;overflow:hidden;">
    <TerminalTopBar />

    <!-- Stat Tiles -->
    <div class="term-tiles" style="grid-template-columns:repeat(5,1fr);">
      <div class="term-tile">
        <div class="term-tile-label">TOTAL MEMBERS</div>
        <div class="term-tile-value tc-text">{{ stats.totalMembers.toLocaleString() }}</div>
        <div class="term-tile-change tc-dim">= REGISTERED</div>
      </div>
      <div class="term-tile">
        <div class="term-tile-label">ACTIVE LOANS</div>
        <div class="term-tile-value tc-amber">{{ stats.activeLoans.toLocaleString() }}</div>
        <div class="term-tile-change tc-amber">▲ CURRENTLY OUT</div>
      </div>
      <div class="term-tile">
        <div class="term-tile-label">RESERVATIONS</div>
        <div class="term-tile-value tc-blue">{{ stats.totalReservations.toLocaleString() }}</div>
        <div class="term-tile-change tc-dim">= ON HOLD</div>
      </div>
      <div class="term-tile">
        <div class="term-tile-label">LATE FEES</div>
        <div class="term-tile-value" :class="stats.totalFees > 0 ? 'tc-red' : 'tc-text'">
          ${{ stats.totalFees.toFixed(2) }}
        </div>
        <div class="term-tile-change" :class="stats.totalFees > 0 ? 'tc-red' : 'tc-dim'">
          {{ stats.totalFees > 0 ? '▲ OUTSTANDING' : '= CLEAR' }}
        </div>
      </div>
      <div class="term-tile" style="border-right:none;">
        <div class="term-tile-label">ROLE</div>
        <div class="term-tile-value" style="font-size:18px;" :class="isStaff ? 'tc-amber' : 'tc-dim'">
          {{ isStaff ? 'STAFF' : 'READ' }}
        </div>
        <div class="term-tile-change">
          <button class="term-refresh-btn" :class="isStaff ? 'tc-red' : 'tc-amber'"
            @click="isStaff ? logout() : showLogin = !showLogin">
            {{ isStaff ? 'LOGOUT' : 'LOGIN AS STAFF' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Staff Login Bar -->
    <div v-if="showLogin" class="term-login-bar">
      <span class="tc-dim">USER</span>
      <input v-model="loginUser" class="term-input" placeholder="username" />
      <span class="tc-dim">PASS</span>
      <input v-model="loginPass" class="term-input" type="password" placeholder="password" />
      <button class="term-refresh-btn tc-amber" @click="authenticate">CONNECT</button>
      <span v-if="loginError" class="tc-red" style="font-size:9px;">{{ loginError }}</span>
    </div>

    <!-- Body -->
    <div class="members-body">

      <!-- Left: Member Catalog -->
      <div class="term-col">
        <div class="term-section" style="flex:1;min-height:0;">

          <div class="term-section-header">
            <span class="tc-amber" style="font-weight:600;letter-spacing:.12em;">MEMBER CATALOG</span>
            <span class="tc-dim">—</span>
            <span class="term-live-dot" style="width:6px;height:6px;" />
            <span class="tc-green" style="font-size:9px;">{{ filteredMembers.length }} RECORDS</span>
            <button class="term-refresh-btn" style="margin-left:auto;" @click="loadAll" :disabled="loading">↻</button>
          </div>

          <!-- Toolbar -->
          <div class="members-toolbar">
            <div class="members-search-wrap">
              <span class="tc-dim" style="font-size:9px;">▶</span>
              <input
                v-model="searchQuery"
                class="members-search-input"
                placeholder="SEARCH MEMBER ID..."
                spellcheck="false"
              />
              <button v-if="searchQuery" class="members-clear-btn tc-dim" @click="searchQuery = ''">✕</button>
            </div>
            <div class="members-filters">
              <button
                v-for="f in memberFilters"
                :key="f"
                class="members-filter-btn"
                :class="{ active: activeFilter === f }"
                @click="activeFilter = f"
              >{{ f }}</button>
            </div>
          </div>

          <!-- Table -->
          <div class="term-table-wrap">
            <div v-if="loading"        class="term-empty tc-amber">FETCHING MEMBERS...</div>
            <div v-else-if="loadError" class="term-error">{{ loadError }}</div>
            <table v-else class="term-table members-table">
              <thead>
                <tr>
                  <th @click="setSort('member_id')">MEMBER ID <span class="sort-arrow">{{ sortArrow('member_id') }}</span></th>
                  <th @click="setSort('date_joined')">JOINED <span class="sort-arrow">{{ sortArrow('date_joined') }}</span></th>
                  <th @click="setSort('number_of_books_rented')" style="text-align:right;">TOTAL RENTED <span class="sort-arrow">{{ sortArrow('number_of_books_rented') }}</span></th>
                  <th @click="setSort('active_loans')"           style="text-align:right;">ACTIVE <span class="sort-arrow">{{ sortArrow('active_loans') }}</span></th>
                  <th @click="setSort('active_reservations')"    style="text-align:right;">RESV <span class="sort-arrow">{{ sortArrow('active_reservations') }}</span></th>
                  <th @click="setSort('late_fees')"              style="text-align:right;">FEES <span class="sort-arrow">{{ sortArrow('late_fees') }}</span></th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="m in sortedMembers"
                  :key="m.member_id"
                  class="members-row"
                  :class="{ selected: selectedMember?.member_id === m.member_id }"
                  @click="selectMember(m)"
                >
                  <td class="tc-amber" style="font-weight:600;">M#{{ String(m.member_id).padStart(4, '0') }}</td>
                  <td class="tc-dim">{{ m.date_joined ? new Date(m.date_joined).toLocaleDateString('en-GB') : '—' }}</td>
                  <td class="tc-text"  style="text-align:right;">{{ m.number_of_books_rented }}</td>
                  <td class="tc-amber" style="text-align:right;">{{ m.active_loans }}</td>
                  <td class="tc-blue"  style="text-align:right;">{{ m.active_reservations }}</td>
                  <td :class="Number(m.late_fees) > 0 ? 'tc-red' : 'tc-green'" style="text-align:right;">
                    ${{ Number(m.late_fees).toFixed(2) }}
                  </td>
                  <td>
                    <span class="members-status" :class="memberStatusClass(m)">{{ memberStatusLabel(m) }}</span>
                  </td>
                </tr>
                <tr v-if="!loading && sortedMembers.length === 0 && !loadError">
                  <td colspan="7"><div class="term-empty">NO RECORDS MATCH FILTER</div></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="term-bar-totals">
            <span>SHOWING {{ sortedMembers.length }} / {{ members.length }} MEMBERS</span>
            <span>SORT: <span class="tc-amber">{{ sortKey.toUpperCase() }} {{ sortDir === 'asc' ? '↑' : '↓' }}</span></span>
            <span>FETCHED: <span class="tc-amber">{{ lastUpdated }}</span></span>
          </div>
        </div>
      </div>

      <!-- Right Panel -->
      <div class="term-col">

        <!-- Member Detail -->
        <div class="term-section members-detail-section">
          <div class="term-section-header">
            <span class="tc-amber" style="font-weight:600;letter-spacing:.12em;">MEMBER DETAIL</span>
            <span v-if="selectedMember" class="tc-dim">
              — M#{{ String(selectedMember.member_id).padStart(4, '0') }}
            </span>
            <span v-else class="tc-dim">— SELECT A ROW</span>
          </div>

          <div v-if="selectedMember" class="members-detail-body">
            <div class="members-detail-metrics">
              <div class="members-metric-block">
                <div class="members-metric-val tc-text">{{ selectedMember.number_of_books_rented }}</div>
                <div class="members-metric-label tc-dim">TOTAL RENTED</div>
              </div>
              <div class="members-metric-block">
                <div class="members-metric-val tc-amber">{{ selectedMember.active_loans }}</div>
                <div class="members-metric-label tc-dim">ACTIVE LOANS</div>
              </div>
              <div class="members-metric-block">
                <div class="members-metric-val tc-blue">{{ selectedMember.active_reservations }}</div>
                <div class="members-metric-label tc-dim">RESERVATIONS</div>
              </div>
              <div class="members-metric-block">
                <div class="members-metric-val" :class="Number(selectedMember.late_fees) > 0 ? 'tc-red' : 'tc-green'">
                  ${{ Number(selectedMember.late_fees).toFixed(2) }}
                </div>
                <div class="members-metric-label tc-dim">LATE FEES</div>
              </div>
            </div>

            <div class="members-detail-row">
              <span class="members-detail-label tc-dim">MEMBER ID</span>
              <span class="tc-amber">M#{{ String(selectedMember.member_id).padStart(4, '0') }}</span>
            </div>
            <div class="members-detail-row">
              <span class="members-detail-label tc-dim">DATE JOINED</span>
              <span class="tc-text">{{ selectedMember.date_joined ? new Date(selectedMember.date_joined).toLocaleDateString('en-GB') : '—' }}</span>
            </div>
            <div class="members-detail-row">
              <span class="members-detail-label tc-dim">STATUS</span>
              <span class="members-status" :class="memberStatusClass(selectedMember)">{{ memberStatusLabel(selectedMember) }}</span>
            </div>

            <!-- Staff Actions -->
            <template v-if="isStaff">
              <div style="font-size:9px;" class="tc-dim">STAFF: {{ isStaff }}</div>
              <div class="members-detail-divider" />
              <div class="members-staff-label tc-dim">STAFF ACTIONS</div>
              <div class="members-actions">
                <button class="members-action-btn tc-green"  @click="openModal('loan')">+ ISSUE LOAN</button>
                <button class="members-action-btn tc-amber"  @click="openModal('return')" :disabled="selectedMember.active_loans === 0">↩ PROCESS RETURN</button>
                <button class="members-action-btn tc-blue"   @click="openModal('reservation')">⊕ PLACE RESERVATION</button>
                <button class="members-action-btn tc-red"    @click="openModal('fee')" :disabled="Number(selectedMember.late_fees) === 0">$ CLEAR FEES</button>
              </div>
            </template>
          </div>

          <div v-else class="term-empty" style="height:180px;">SELECT A MEMBER TO VIEW DETAILS</div>
        </div>

        <!-- Active Loans / Reservations Tabs -->
        <div class="term-section" style="flex:1;min-height:0;">
          <div class="term-section-header">
            <button
              class="term-refresh-btn"
              :class="{ 'tc-amber': detailTab === 'loans' }"
              @click="detailTab = 'loans'"
            >ACTIVE LOANS</button>
            <button
              class="term-refresh-btn"
              :class="{ 'tc-amber': detailTab === 'reservations' }"
              @click="detailTab = 'reservations'"
            >RESERVATIONS</button>
            <button
              class="term-refresh-btn"
              :class="{ 'tc-amber': detailTab === 'history' }"
              @click="detailTab = 'history'"
            >LOAN HISTORY</button>
            <span v-if="detailLoading" class="tc-amber" style="font-size:9px;margin-left:4px;">LOADING...</span>
          </div>

          <div class="term-table-wrap">
            <div v-if="!selectedMember" class="term-empty">SELECT A MEMBER FIRST</div>

            <!-- Active Loans -->
            <table v-else-if="detailTab === 'loans'" class="term-table">
              <thead>
                <tr>
                  <th>LOAN #</th>
                  <th>BOOK</th>
                  <th>AUTHOR</th>
                  <th>ISSUED</th>
                  <th>DAYS OUT</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="l in activeLoans" :key="l.loan_number">
                  <td class="tc-dim">{{ l.loan_number }}</td>
                  <td class="tc-text members-trunc-cell">{{ l.book_name }}</td>
                  <td class="tc-dim  members-trunc-cell">{{ l.author }}</td>
                  <td class="tc-dim">{{ l.date_issued ? new Date(l.date_issued).toLocaleDateString('en-GB') : '—' }}</td>
                  <td :class="daysOut(l.date_issued) > 30 ? 'tc-red' : 'tc-amber'">
                    {{ daysOut(l.date_issued) }}d
                  </td>
                </tr>
                <tr v-if="!detailLoading && activeLoans.length === 0">
                  <td colspan="5"><div class="term-empty">NO ACTIVE LOANS</div></td>
                </tr>
              </tbody>
            </table>

            <!-- Reservations -->
            <table v-else-if="detailTab === 'reservations'" class="term-table">
              <thead>
                <tr>
                  <th>RESV #</th>
                  <th>BOOK</th>
                  <th>AUTHOR</th>
                  <th>DATE RESERVED</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in memberReservations" :key="r.reservation_id">
                  <td class="tc-dim">{{ r.reservation_id }}</td>
                  <td class="tc-text members-trunc-cell">{{ r.book_name }}</td>
                  <td class="tc-dim  members-trunc-cell">{{ r.author }}</td>
                  <td class="tc-dim">{{ r.date_reserved ? new Date(r.date_reserved).toLocaleDateString('en-GB') : '—' }}</td>
                </tr>
                <tr v-if="!detailLoading && memberReservations.length === 0">
                  <td colspan="4"><div class="term-empty">NO ACTIVE RESERVATIONS</div></td>
                </tr>
              </tbody>
            </table>

            <!-- Loan History -->
            <table v-else-if="detailTab === 'history'" class="term-table">
              <thead>
                <tr>
                  <th>LOAN #</th>
                  <th>BOOK</th>
                  <th>ISSUED</th>
                  <th>RETURNED</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="l in loanHistory" :key="l.loan_number">
                  <td class="tc-dim">{{ l.loan_number }}</td>
                  <td class="tc-text members-trunc-cell">{{ l.book_name }}</td>
                  <td class="tc-dim">{{ l.date_issued   ? new Date(l.date_issued).toLocaleDateString('en-GB')   : '—' }}</td>
                  <td :class="l.date_returned ? 'tc-green' : 'tc-amber'">
                    {{ l.date_returned ? new Date(l.date_returned).toLocaleDateString('en-GB') : 'ACTIVE' }}
                  </td>
                </tr>
                <tr v-if="!detailLoading && loanHistory.length === 0">
                  <td colspan="4"><div class="term-empty">NO LOAN HISTORY</div></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>

    <!-- Staff Action -->
    <div v-if="activeModal" class="members-modal-overlay" @click.self="closeModal">
      <div class="members-modal">

        <!-- Loan Issue template -->
        <template v-if="activeModal === 'loan'">
          <div class="members-modal-header">
            <span class="tc-green" style="font-weight:700;letter-spacing:.1em;">+ ISSUE LOAN</span>
            <span class="tc-dim" style="font-size:10px;">
              MEMBER M#{{ String(selectedMember!.member_id).padStart(4,'0') }}
            </span>
            <button class="members-modal-close tc-dim" @click="closeModal">✕</button>
          </div>
          <div class="members-modal-body">
            <div class="members-form-row">
              <label class="members-form-label tc-dim">BOOK SERIAL</label>
              <input v-model="actionForm.bookSerial" class="term-input members-form-input" placeholder="e.g. SN20006" />
            </div>
            <div class="members-form-row">
              <label class="members-form-label tc-dim">STAFF ID</label>
              <input v-model="actionForm.staffId" class="term-input members-form-input" type="number" placeholder="your staff ID" />
            </div>
            <div v-if="actionError" class="tc-red" style="font-size:10px;padding:4px 0;">{{ actionError }}</div>
            <div v-if="actionSuccess" class="tc-green" style="font-size:10px;padding:4px 0;">{{ actionSuccess }}</div>
          </div>
          <div class="members-modal-footer">
            <button class="members-action-btn tc-dim" @click="closeModal">CANCEL</button>
            <button class="members-action-btn tc-green" style="border-color:var(--term-green);"
              @click="issueLoan" :disabled="actionLoading">
              {{ actionLoading ? 'PROCESSING...' : 'CONFIRM LOAN' }}
            </button>
          </div>
        </template>

        <!-- PROCESS RETURN -->
        <template v-else-if="activeModal === 'return'">
          <div class="members-modal-header">
            <span class="tc-amber" style="font-weight:700;letter-spacing:.1em;">↩ PROCESS RETURN</span>
            <span class="tc-dim" style="font-size:10px;">
              MEMBER M#{{ String(selectedMember!.member_id).padStart(4,'0') }}
            </span>
            <button class="members-modal-close tc-dim" @click="closeModal">✕</button>
          </div>
          <div class="members-modal-body">
            <div class="members-form-row">
              <label class="members-form-label tc-dim">LOAN #</label>
              <select v-model="actionForm.loanNumber" class="term-select members-form-input">
                <option value="">— select loan —</option>
                <option v-for="l in activeLoans" :key="l.loan_number" :value="l.loan_number">
                  #{{ l.loan_number }} — {{ l.book_name }}
                </option>
              </select>
            </div>
            <div v-if="actionError"   class="tc-red"   style="font-size:10px;padding:4px 0;">{{ actionError }}</div>
            <div v-if="actionSuccess" class="tc-green" style="font-size:10px;padding:4px 0;">{{ actionSuccess }}</div>
          </div>
          <div class="members-modal-footer">
            <button class="members-action-btn tc-dim" @click="closeModal">CANCEL</button>
            <button class="members-action-btn tc-amber" style="border-color:var(--term-amber);"
              @click="processReturn" :disabled="actionLoading || !actionForm.loanNumber">
              {{ actionLoading ? 'PROCESSING...' : 'CONFIRM RETURN' }}
            </button>
          </div>
        </template>

        <!-- PLACE RESERVATION -->
        <template v-else-if="activeModal === 'reservation'">
          <div class="members-modal-header">
            <span class="tc-blue" style="font-weight:700;letter-spacing:.1em;">⊕ PLACE RESERVATION</span>
            <span class="tc-dim" style="font-size:10px;">
              MEMBER M#{{ String(selectedMember!.member_id).padStart(4,'0') }}
            </span>
            <button class="members-modal-close tc-dim" @click="closeModal">✕</button>
          </div>
          <div class="members-modal-body">
            <div class="members-form-row">
              <label class="members-form-label tc-dim">BOOK SERIAL</label>
              <input v-model="actionForm.bookSerial" class="term-input members-form-input" placeholder="e.g. SN20006" />
            </div>
            <div v-if="actionError"   class="tc-red"   style="font-size:10px;padding:4px 0;">{{ actionError }}</div>
            <div v-if="actionSuccess" class="tc-green" style="font-size:10px;padding:4px 0;">{{ actionSuccess }}</div>
          </div>
          <div class="members-modal-footer">
            <button class="members-action-btn tc-dim" @click="closeModal">CANCEL</button>
            <button class="members-action-btn tc-blue" style="border-color:var(--term-blue);"
              @click="placeReservation" :disabled="actionLoading">
              {{ actionLoading ? 'PROCESSING...' : 'CONFIRM RESERVATION' }}
            </button>
          </div>
        </template>

        <!-- CLEAR FEES -->
        <template v-else-if="activeModal === 'fee'">
          <div class="members-modal-header">
            <span class="tc-red" style="font-weight:700;letter-spacing:.1em;">$ CLEAR LATE FEES</span>
            <button class="members-modal-close tc-dim" @click="closeModal">✕</button>
          </div>
          <div class="members-modal-body">
            <div class="members-form-row">
              <span class="tc-dim members-form-label">MEMBER</span>
              <span class="tc-amber">M#{{ String(selectedMember!.member_id).padStart(4,'0') }}</span>
            </div>
            <div class="members-form-row">
              <span class="tc-dim members-form-label">AMOUNT</span>
              <span class="tc-red" style="font-size:16px;font-weight:700;">
                ${{ Number(selectedMember!.late_fees).toFixed(2) }}
              </span>
            </div>
            <div v-if="actionError"   class="tc-red"   style="font-size:10px;padding:4px 0;">{{ actionError }}</div>
            <div v-if="actionSuccess" class="tc-green" style="font-size:10px;padding:4px 0;">{{ actionSuccess }}</div>
          </div>
          <div class="members-modal-footer">
            <button class="members-action-btn tc-dim" @click="closeModal">CANCEL</button>
            <button class="members-action-btn tc-red" style="border-color:var(--term-red);"
              @click="clearFees" :disabled="actionLoading">
              {{ actionLoading ? 'PROCESSING...' : 'CLEAR FEES' }}
            </button>
          </div>
        </template>

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
interface MemberRow {
  member_id:              number
  date_joined:            string | null
  number_of_books_rented: number
  late_fees:              number
  active_loans:           number
  active_reservations:    number
}

interface LoanRow {
  loan_number:      number
  member_id:        number
  date_issued:      string | null
  date_returned:    string | null
  book_serial_number: string
  book_name:        string
  author:           string
  staff_id:         number | null
}

interface ReservationRow {
  reservation_id: number
  member_id:      number
  date_reserved:  string | null
  book_serial:    string
  book_name:      string
  author:         string
}

const { pgVersion } = useSystemStats()
const q  = (sql: string) => $fetch('/api/query', { method: 'POST', body: { sql } }) as Promise<any[]>
const qw = (sql: string) => $fetch('/api/query', { method: 'POST', body: { sql } }) as Promise<any[]>

const { isStaff, showLogin, loginUser, loginPass, loginError, authenticate, logout } = useAuth()

const loading      = ref(false)
const loadError    = ref('')
const lastUpdated  = ref('—')
const members      = ref<MemberRow[]>([])
const searchQuery  = ref('')
const activeFilter = ref('ALL')
const sortKey      = ref('member_id')
const sortDir      = ref<'asc' | 'desc'>('asc')
const selectedMember = ref<MemberRow | null>(null)

const memberFilters = ['ALL', 'ACTIVE', 'OVERDUE', 'FEES DUE', 'CLEAR']
const detailTab          = ref<'loans' | 'reservations' | 'history'>('loans')
const detailLoading      = ref(false)
const activeLoans        = ref<LoanRow[]>([])
const memberReservations = ref<ReservationRow[]>([])
const loanHistory        = ref<LoanRow[]>([])

const activeModal   = ref<'loan' | 'return' | 'reservation' | 'fee' | null>(null)
const actionLoading = ref(false)
const actionError   = ref('')
const actionSuccess = ref('')
const actionForm    = reactive({ bookSerial: '', loanNumber: '' as number | '', staffId: '' as number | '' })

const stats = computed(() => ({
  totalMembers:      members.value.length,
  activeLoans:       members.value.reduce((s, m) => s + Number(m.active_loans),           0),
  totalReservations: members.value.reduce((s, m) => s + Number(m.active_reservations),    0),
  totalFees:         members.value.reduce((s, m) => s + Number(m.late_fees),              0),
}))

const filteredMembers = computed(() => {
  let list = members.value
  if (searchQuery.value.trim()) {
    const needle = searchQuery.value.toLowerCase()
    list = list.filter(m => String(m.member_id).includes(needle))
  }
  if (activeFilter.value === 'ACTIVE')   list = list.filter(m => m.active_loans > 0)
  if (activeFilter.value === 'OVERDUE')  list = list.filter(m => Number(m.late_fees) > 0 && m.active_loans > 0)
  if (activeFilter.value === 'FEES DUE') list = list.filter(m => Number(m.late_fees) > 0)
  if (activeFilter.value === 'CLEAR')    list = list.filter(m => Number(m.late_fees) === 0 && m.active_loans === 0)
  return list
})

const sortedMembers = computed(() => {
  return [...filteredMembers.value].sort((a, b) => {
    const av = (a as any)[sortKey.value]
    const bv = (b as any)[sortKey.value]
    if (av == null) return 1
    if (bv == null) return -1
    const cmp = typeof av === 'string' ? av.localeCompare(bv) : Number(av) - Number(bv)
    return sortDir.value === 'asc' ? cmp : -cmp
  })
})

function memberStatusLabel(m: MemberRow) {
  if (Number(m.late_fees) > 0 && m.active_loans > 0) return 'OVERDUE'
  if (Number(m.late_fees) > 0)                        return 'FEES DUE'
  if (m.active_loans > 0)                             return 'ACTIVE'
  return 'CLEAR'
}
function memberStatusClass(m: MemberRow) {
  const l = memberStatusLabel(m)
  return { 'OVERDUE': 'status-red', 'FEES DUE': 'status-amber', 'ACTIVE': 'status-blue', 'CLEAR': 'status-green' }[l] ?? ''
}
function setSort(key: string) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}
function sortArrow(key: string) {
  if (sortKey.value !== key) return '⇅'
  return sortDir.value === 'asc' ? '↑' : '↓'
}
function daysOut(dateIssued: string | null) {
  if (!dateIssued) return 0
  return Math.floor((Date.now() - new Date(dateIssued).getTime()) / 86_400_000)
}

const selectMember = async (m: MemberRow) => {
  if (selectedMember.value?.member_id === m.member_id) {
    selectedMember.value = null
    activeLoans.value = []
    memberReservations.value = []
    loanHistory.value = []
    return
  }
  selectedMember.value = m
  detailLoading.value  = true
  try {
    const [loansRes, resvRes, histRes] = await Promise.all([
      q(`SELECT * FROM v_member_loans WHERE member_id = ${m.member_id} AND date_returned IS NULL ORDER BY date_issued DESC;`),
      q(`SELECT * FROM v_member_reservations WHERE member_id = ${m.member_id} ORDER BY date_reserved DESC;`),
      q(`SELECT * FROM v_member_loans WHERE member_id = ${m.member_id} ORDER BY date_issued DESC LIMIT 50;`),
    ])
    activeLoans.value        = loansRes as LoanRow[]
    memberReservations.value = resvRes  as ReservationRow[]
    loanHistory.value        = histRes  as LoanRow[]
  }
  finally { detailLoading.value = false }
}

function openModal(type: typeof activeModal.value) {
  activeModal.value   = type
  actionError.value   = ''
  actionSuccess.value = ''
  actionForm.bookSerial  = ''
  actionForm.loanNumber  = ''
  actionForm.staffId = ''
}
function closeModal() {
  if (actionSuccess.value) loadAll()
  activeModal.value   = null
  actionError.value   = ''
  actionSuccess.value = ''
}

const issueLoan = async () => {
  if (!actionForm.bookSerial || !actionForm.staffId) {
    actionError.value = 'BOOK SERIAL AND STAFF ID REQUIRED'
    return
  }
  actionLoading.value = true
  actionError.value   = ''
  try {
    // Guard: check book exists and has available copies
    const avail = await q(`
      SELECT available FROM v_book_catalog WHERE serial_number = '${actionForm.bookSerial}';
    `)
    if (!avail.length)            throw new Error('BOOK SERIAL NOT FOUND')
    if (Number((avail[0] as any).available) < 1) throw new Error('NO COPIES AVAILABLE')

    await qw(`
      INSERT INTO loan (member_id, staff_id, book_serial_number, date_issued)
      VALUES (${selectedMember.value!.member_id}, ${actionForm.staffId}, '${actionForm.bookSerial}', CURRENT_DATE);
    `)
    actionSuccess.value = `LOAN ISSUED — ${actionForm.bookSerial} → M#${String(selectedMember.value!.member_id).padStart(4,'0')}`
    await refreshMember()
  }
  catch (e: any) { actionError.value = e?.data?.message ?? e?.message ?? 'LOAN FAILED' }
  finally { actionLoading.value = false }
}

const processReturn = async () => {
  if (!actionForm.loanNumber) { actionError.value = 'SELECT A LOAN'; return }
  actionLoading.value = true
  actionError.value   = ''
  try {
    await qw(`
      UPDATE loan SET date_returned = CURRENT_DATE WHERE loan_number = ${actionForm.loanNumber};
    `)
    actionSuccess.value = `LOAN #${actionForm.loanNumber} RETURNED`
    await refreshMember()
  }
  catch (e: any) { actionError.value = e?.data?.message ?? e?.message ?? 'RETURN FAILED' }
  finally { actionLoading.value = false }
}

const refreshMember = async () => {
  if (!selectedMember.value) return
  const m = selectedMember.value
  detailLoading.value = true
  try {
    const [loansRes, resvRes, histRes] = await Promise.all([
      q(`SELECT * FROM v_member_loans WHERE member_id = ${m.member_id} AND date_returned IS NULL ORDER BY date_issued DESC;`),
      q(`SELECT * FROM v_member_reservations WHERE member_id = ${m.member_id} ORDER BY date_reserved DESC;`),
      q(`SELECT * FROM v_member_loans WHERE member_id = ${m.member_id} ORDER BY date_issued DESC LIMIT 50;`),
    ])
    activeLoans.value        = loansRes as LoanRow[]
    memberReservations.value = resvRes  as ReservationRow[]
    loanHistory.value        = histRes  as LoanRow[]
  }
  finally { detailLoading.value = false }
}

const placeReservation = async () => {
  if (!actionForm.bookSerial) { actionError.value = 'BOOK SERIAL REQUIRED'; return }
  actionLoading.value = true
  actionError.value   = ''
  try {
    // Guard for checking book existence
    const exists = await q(`SELECT serial_number FROM book WHERE serial_number = '${actionForm.bookSerial}';`)
    if (!exists.length) throw new Error('BOOK SERIAL NOT FOUND')

    await qw(`
      INSERT INTO reservation (member_id, book_serial, date_reserved)
      VALUES (${selectedMember.value!.member_id}, '${actionForm.bookSerial}', CURRENT_DATE);
    `)
    actionSuccess.value = `RESERVATION PLACED — ${actionForm.bookSerial}`
    await refreshMember()
  }
  catch (e: any) { actionError.value = e?.data?.message ?? e?.message ?? 'RESERVATION FAILED' }
  finally { actionLoading.value = false }
}

const clearFees = async () => {
  actionLoading.value = true
  actionError.value   = ''
  try {
    await qw(`UPDATE member SET late_fees = 0 WHERE member_id = ${selectedMember.value!.member_id};`)
    actionSuccess.value = 'FEES CLEARED'
    await loadAll()
  }
  catch (e: any) { actionError.value = e?.data?.message ?? e?.message ?? 'FAILED TO CLEAR FEES' }
  finally { actionLoading.value = false }
}

const loadAll = async () => {
  loading.value   = true
  loadError.value = ''
  try {
    const res = await q(`SELECT * FROM v_member_catalog ORDER BY member_id;`)
    members.value = (res as any[]).map(r => ({
      member_id:              Number(r.member_id),
      date_joined:            r.date_joined,
      number_of_books_rented: Number(r.number_of_books_rented),
      late_fees:              Number(r.late_fees),
      active_loans:           Number(r.active_loans),
      active_reservations:    Number(r.active_reservations),
    }))
    // Refresh selected member data if one is selected
    if (selectedMember.value) {
      const fresh = members.value.find(m => m.member_id === selectedMember.value!.member_id)
      if (fresh) selectedMember.value = fresh
    }
    lastUpdated.value = new Date().toLocaleTimeString('en-GB', { hour12: false })
  }
  catch (e: any) { loadError.value = e?.data?.message ?? e?.message ?? 'Failed to load members' }
  finally { loading.value = false }
}

onMounted(loadAll)
</script>

<style scoped>
.members-body {
  display: grid;
  grid-template-columns: 58fr 42fr;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.members-body .term-col:first-child { border-right: 2px solid var(--term-border); }

/* Toolbar */
.members-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  background: var(--term-panel);
  border-bottom: 1px solid var(--term-border);
  flex-shrink: 0;
  flex-wrap: wrap;
}
.members-search-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--term-border);
  padding: 2px 8px;
  flex: 1;
  min-width: 160px;
  background: var(--term-bg);
}
.members-search-wrap:focus-within { border-color: var(--term-amber); }
.members-search-input {
  flex: 1; background: none; border: none; outline: none;
  color: var(--term-text); font-family: 'JetBrains Mono', monospace;
  font-size: 11px; caret-color: var(--term-amber);
}
.members-search-input::placeholder { color: var(--term-dim); }
.members-clear-btn {
  background: none; border: none; cursor: pointer;
  font-size: 10px; padding: 0; font-family: inherit;
}
.members-clear-btn:hover { color: var(--term-red); }
.members-filters { display: flex; gap: 3px; flex-wrap: wrap; }
.members-filter-btn {
  background: none; border: 1px solid var(--term-border);
  color: var(--term-dim); font-family: 'JetBrains Mono', monospace;
  font-size: 9px; letter-spacing: 0.08em; padding: 2px 7px;
  cursor: pointer; transition: all 0.12s;
}
.members-filter-btn:hover  { border-color: var(--term-amber); color: var(--term-amber); }
.members-filter-btn.active { border-color: var(--term-amber); color: var(--term-amber); background: rgba(255,179,0,0.08); }

/* Table */
.members-row          { cursor: pointer; transition: background 0.08s; }
.members-row:hover    { background: rgba(255,179,0,0.04); }
.members-row.selected { background: rgba(255,179,0,0.09); }
.sort-arrow           { color: var(--term-dim); font-size: 9px; margin-left: 2px; }
.members-trunc-cell   { max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.members-status  { font-size: 9px; letter-spacing: 0.08em; font-weight: 600; }
.status-green    { color: var(--term-green); }
.status-amber    { color: var(--term-amber); }
.status-red      { color: var(--term-red);   }
.status-blue     { color: var(--term-blue);  }

/* Detail panel */
.members-detail-section { flex-shrink: 0; }
.members-detail-body    { padding: 10px 14px 12px; display: flex; flex-direction: column; gap: 6px; }
.members-detail-metrics {
  display: grid; grid-template-columns: repeat(4,1fr);
  gap: 1px; border: 1px solid var(--term-border);
  background: var(--term-border); margin-bottom: 6px;
}
.members-metric-block  { background: var(--term-panel); padding: 6px 8px; text-align: center; }
.members-metric-val    { font-size: 18px; font-weight: 700; line-height: 1; }
.members-metric-label  { font-size: 8px; letter-spacing: 0.1em; margin-top: 3px; }
.members-detail-row    { display: flex; align-items: center; gap: 8px; font-size: 11px; }
.members-detail-label  { width: 80px; flex-shrink: 0; font-size: 9px; letter-spacing: 0.08em; }
.members-detail-divider { height: 1px; background: var(--term-border); margin: 4px 0; }
.members-staff-label   { font-size: 9px; letter-spacing: 0.1em; margin-bottom: 4px; }

.members-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.members-action-btn {
  background: none; border: 1px solid var(--term-border);
  font-family: 'JetBrains Mono', monospace; font-size: 9px;
  letter-spacing: 0.08em; padding: 3px 9px; cursor: pointer; transition: all 0.12s;
}
.members-action-btn:not(:disabled):hover { background: rgba(255,255,255,0.04); }
.members-action-btn:disabled { opacity: 0.35; cursor: default; }

/* Modal */
.members-modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.75);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.members-modal {
  background: var(--term-panel); border: 1px solid var(--term-amber); width: 420px;
}
.members-modal-header {
  display: flex; align-items: center; gap: 8px; justify-content: space-between;
  padding: 8px 14px; background: var(--term-header);
  border-bottom: 1px solid var(--term-border); font-size: 11px; letter-spacing: 0.08em;
}
.members-modal-close {
  background: none; border: none; font-size: 13px;
  cursor: pointer; font-family: inherit; transition: color 0.15s; margin-left: auto;
}
.members-modal-close:hover { color: var(--term-red); }
.members-modal-body   { padding: 14px; display: flex; flex-direction: column; gap: 8px; }
.members-form-row     { display: flex; align-items: center; gap: 10px; }
.members-form-label   { width: 80px; flex-shrink: 0; font-size: 9px; letter-spacing: 0.1em; }
.members-form-input   { flex: 1; width: 100%; }
.members-modal-footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 8px 14px; border-top: 1px solid var(--term-border); background: var(--term-header);
}
</style>