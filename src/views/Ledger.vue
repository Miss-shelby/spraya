<script setup>
import { ref, computed } from 'vue'
import { store, fmt, fdate, ftime } from '../store'

const filter = ref('all') // 'all', 'received', 'sent'
const q = ref('')

const rows = computed(() => {
  return store.ledger
    .filter(r => {
      const matchDir = filter.value === 'all' || r.dir === filter.value
      const search = (r.person + (r.event || '') + (r.ref || '') + (r.message || '')).toLowerCase()
      return matchDir && search.includes(q.value.toLowerCase())
    })
    .sort((a, b) => new Date(b.at) - new Date(a.at))
})

const sumReceived = computed(() => store.ledger.filter(r => r.dir === 'received').reduce((s, r) => s + r.amount, 0))
const sumSent = computed(() => store.ledger.filter(r => r.dir === 'sent').reduce((s, r) => s + r.amount, 0))

const people = computed(() => {
  const map = {}
  store.ledger.forEach(r => {
    if (!r.person) return
    if (!map[r.person]) {
      map[r.person] = { name: r.person, sent: 0, received: 0 }
    }
    map[r.person][r.dir] += r.amount || 0
  })
  return Object.values(map)
})

const owe = computed(() => {
  return people.value.reduce((s, p) => s + Math.max(0, p.received - p.sent), 0)
})
</script>

<template>
  <section class="pg">
    <div class="header-row">
      <div>
        <h2>Reciprocal Ledger</h2>
        <span class="hl"></span>
        <p class="sub-lead">
          A complete record of all gifts received for your events and all money you have sent to others. Never forget who showed up for you!
        </p>
      </div>

      <div class="header-actions">
        <RouterLink to="/create-event" class="btn sm">+ Create Event Link</RouterLink>
        <RouterLink to="/send" class="ghost">Send Gift →</RouterLink>
      </div>
    </div>

    <!-- Summary Stats Cards -->
    <div class="stats">
      <div class="stat stat-in">
        <span>💰 Total Received (Host)</span>
        <div class="stat-num text-green">{{ fmt(sumReceived) }}</div>
        <span class="stat-sub">{{ store.ledger.filter(r => r.dir === 'received').length }} gifts received</span>
      </div>

      <div class="stat stat-out">
        <span>🎁 Total Sent Out (Giver)</span>
        <div class="stat-num text-gold">{{ fmt(sumSent) }}</div>
        <span class="stat-sub">{{ store.ledger.filter(r => r.dir === 'sent').length }} gifts sent</span>
      </div>

      <div class="stat stat-owe">
        <span>🤝 Still to Give Back</span>
        <div class="stat-num text-red">{{ fmt(owe) }}</div>
        <span class="stat-sub">Based on reciprocity ledger</span>
      </div>
    </div>

    <!-- Main Transactions Card -->
    <div class="card">
      <div class="toolbar">
        <div class="search-box">
          <input v-model="q" placeholder="Search person, event title, message, or reference code..." aria-label="Search ledger" />
        </div>

        <div class="filter-buttons">
          <button class="f-btn" :class="{ active: filter === 'all' }" @click="filter = 'all'">
            All ({{ store.ledger.length }})
          </button>
          <button class="f-btn f-in" :class="{ active: filter === 'received' }" @click="filter = 'received'">
            Received Only (Host)
          </button>
          <button class="f-btn f-out" :class="{ active: filter === 'sent' }" @click="filter = 'sent'">
            Sent Only (Giver)
          </button>
        </div>
      </div>

      <div class="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Date &amp; Time</th>
              <th>Type</th>
              <th>Person / Guest</th>
              <th>Event Title</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Reference</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id">
              <td class="time-td">
                <div>{{ fdate(r.at) }}</div>
                <span class="muted" style="font-size:0.8rem">{{ ftime(r.at) }}</span>
              </td>
              <td>
                <span class="tag" :class="r.dir === 'sent' ? 't-out' : 't-in'">
                  {{ r.dir === 'sent' ? '📤 Sent' : '📥 Received' }}
                </span>
              </td>
              <td>
                <b>{{ r.dir === 'sent' ? 'To: ' : 'From: ' }}{{ r.person }}</b>
                <div v-if="r.message" class="msg-snippet">"{{ r.message }}"</div>
              </td>
              <td>{{ r.event }}</td>
              <td>
                <b :class="r.dir === 'sent' ? 'text-gold-bold' : 'text-green-bold'">
                  {{ fmt(r.amount) }}
                </b>
              </td>
              <td>
                <span class="method-badge">{{ r.paymentMethod || 'Paystack' }}</span>
              </td>
              <td><code>{{ r.ref }}</code></td>
              <td><span class="status-paid">✓ {{ r.status || 'Paid' }}</span></td>
            </tr>
            <tr v-if="!rows.length">
              <td colspan="8" style="text-align:center; padding: 2rem; color: var(--muted)">
                No transactions match your search or filter.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Person-by-Person Reciprocity Breakdown -->
    <h3 style="margin:2.5rem 0 1rem" class="serif">Person-by-Person Owambe Reciprocity</h3>
    <p class="muted" style="margin-top:-0.5rem; margin-bottom:1rem">
      See how much each auntie, uncle, and friend gave at your event versus how much you have given at theirs.
    </p>

    <div class="card tablewrap">
      <table style="min-width:620px">
        <thead>
          <tr>
            <th>Person</th>
            <th>They Gave You (Received)</th>
            <th>You Gave Them (Sent)</th>
            <th>Reciprocal Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in people" :key="p.name">
            <td><b>{{ p.name }}</b></td>
            <td><span class="text-green">{{ fmt(p.received) }}</span></td>
            <td><span class="text-gold">{{ fmt(p.sent) }}</span></td>
            <td>
              <span
                class="tag"
                :class="p.received > p.sent ? 't-out' : p.sent > p.received ? 't-in' : 't-square'"
              >
                {{
                  p.received > p.sent
                    ? 'Give at least ' + fmt(p.received - p.sent) + ' at their next event'
                    : p.sent > p.received
                    ? 'They owe you ' + fmt(p.sent - p.received)
                    : 'All Square ✨'
                }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.header-row {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}
.sub-lead {
  color: var(--muted);
  max-width: 650px;
  margin-top: 0.2rem;
}
.header-actions {
  margin-left: auto;
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}
@media (max-width: 768px) {
  .stats {
    grid-template-columns: 1fr;
  }
}
.stat {
  background: var(--card);
  border: 2px solid var(--ink);
  border-radius: 16px;
  padding: 1.2rem;
  box-shadow: 4px 4px 0 var(--ink);
}
.stat span {
  color: var(--muted);
  font-size: 0.9rem;
  font-weight: 700;
}
.stat-num {
  font: 400 2.2rem 'Young Serif', serif;
  margin: 0.2rem 0;
}
.stat-sub {
  font-size: 0.8rem;
  color: var(--muted);
}
.text-green { color: var(--green); }
.text-gold { color: #8A6800; }
.text-red { color: var(--red); }
.text-green-bold { color: var(--green); font-weight: 700; }
.text-gold-bold { color: #8A6800; font-weight: 700; }
.toolbar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.2rem;
  flex-wrap: wrap;
}
.search-box {
  flex: 1;
  min-width: 260px;
}
.filter-buttons {
  display: flex;
  gap: 0.4rem;
}
.f-btn {
  background: var(--bg);
  border: 1.5px solid var(--ink);
  border-radius: 2rem;
  padding: 0.4rem 0.9rem;
  font-weight: 700;
  cursor: pointer;
  font-size: 0.9rem;
}
.f-btn.active {
  background: var(--gold);
  color: #3A1F17;
  box-shadow: 2px 2px 0 var(--ink);
}
.time-td {
  white-space: nowrap;
}
.msg-snippet {
  font-style: italic;
  font-size: 0.82rem;
  color: var(--muted);
}
.method-badge {
  background: var(--bg);
  border: 1px solid var(--ink);
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  font-size: 0.8rem;
}
.status-paid {
  color: var(--green);
  font-weight: 700;
  font-size: 0.85rem;
}
.t-square {
  background: var(--card);
  border: 1.5px solid var(--muted);
  color: var(--muted);
}
</style>
