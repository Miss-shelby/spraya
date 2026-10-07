<script setup>
import { computed, ref } from 'vue'
import { store, fmt, fmtWords, fdate, ftime, getHostEvents, getHostLedger, getEventTotalReceived, deleteEvent } from '../store'
import GoogleAuth from '../components/GoogleAuth.vue'

const origin = ref(typeof window !== 'undefined' ? window.location.origin : '')
const userEmail = computed(() => store.user ? store.user.email : '')

const hostEvents = computed(() => getHostEvents(userEmail.value))
const hostLedger = computed(() => getHostLedger(userEmail.value))

const totalReceived = computed(() => hostLedger.value.reduce((s, r) => s + r.amount, 0))

const totalTargetGoals = computed(() => hostEvents.value.reduce((s, e) => s + (e.targetAmount || 0), 0))
const overallProgress = computed(() => {
  if (!totalTargetGoals.value) return 0
  return Math.min(100, Math.round((totalReceived.value / totalTargetGoals.value) * 100))
})

const copiedId = ref(null)

function getShareUrl(ev) {
  return `${origin.value}/pay/${ev.id}`
}

async function copyLink(ev) {
  const url = getShareUrl(ev)
  try {
    await navigator.clipboard.writeText(url)
    copiedId.value = ev.id
    setTimeout(() => { copiedId.value = null }, 2500)
  } catch (e) {
    console.error(e)
  }
}

function getEventProgress(ev) {
  const collected = getEventTotalReceived(ev.id)
  if (!ev.targetAmount || ev.targetAmount <= 0) return { collected, percent: 0, hasTarget: false }
  const percent = Math.min(100, Math.round((collected / ev.targetAmount) * 100))
  return { collected, percent, hasTarget: true }
}

function confirmDelete(eventId, eventName) {
  if (confirm(`Are you sure you want to delete the payment link for "${eventName}"? This cannot be undone.`)) {
    deleteEvent(eventId)
  }
}
</script>

<template>
  <section class="pg">
    <!-- Logged Out Guard -->
    <div v-if="!store.user" class="card auth-gate">
      <h2>🔒 Host Dashboard Access</h2>
      <p class="muted">Please sign in with Google to view your hosted events and track money received.</p>
      <div style="margin-top:1.2rem; display:flex; justify-content:center">
        <GoogleAuth />
      </div>
    </div>

    <!-- Logged In Host Dashboard -->
    <div v-else>
      <div class="header-row">
        <div>
          <h2>🎉 Host Dashboard (Received Funds)</h2>
          <span class="hl"></span>
          <p class="sub-lead">
            Manage your event payment links and view real-time progress towards your gifting goals.
          </p>
        </div>

        <RouterLink to="/create-event" class="btn sm" style="margin-left:auto">
          + Create New Event Link
        </RouterLink>
      </div>

      <!-- Stats Banner -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="st-label">💰 Total Received Funds</span>
          <div class="st-val text-green">{{ fmt(totalReceived) }}</div>
          <span class="st-sub">{{ fmtWords(totalReceived) }} · {{ hostLedger.length }} gifts</span>
        </div>

        <div class="stat-card">
          <span class="st-label">🎯 Overall Target Goal Progress</span>
          <div class="st-val text-gold" v-if="totalTargetGoals">{{ overallProgress }}%</div>
          <div class="st-val" v-else>No Goal Set</div>
          <span class="st-sub" v-if="totalTargetGoals">
            {{ fmt(totalReceived) }} raised of {{ fmt(totalTargetGoals) }} total goal
          </span>
          <span class="st-sub" v-else>Set target goals when creating event links</span>
        </div>
      </div>

      <!-- My Hosted Events Section -->
      <h3 class="serif" style="margin:2rem 0 1rem">My Event Payment Links &amp; Goal Progress</h3>

      <div v-if="hostEvents.length" class="events-grid">
        <div v-for="ev in hostEvents" :key="ev.id" class="card ev-card">
          <div class="ev-head">
            <span class="chip">{{ ev.category || 'Event' }}</span>
            <span class="ev-date">{{ fdate(ev.date) }}</span>
          </div>

          <h3 class="ev-title">{{ ev.name }}</h3>

          <!-- Target Goal Progress Bar -->
          <div class="goal-progress-box">
            <div class="g-header">
              <span>Collected: <b class="text-green">{{ fmt(getEventProgress(ev).collected) }}</b></span>
              <span v-if="ev.targetAmount">Target Goal: <b>{{ fmt(ev.targetAmount) }}</b></span>
            </div>

            <div v-if="ev.targetAmount" class="progress-bar-wrap">
              <div class="progress-fill" :style="{ width: getEventProgress(ev).percent + '%' }"></div>
            </div>

            <div class="g-footer">
              <span v-if="ev.targetAmount" class="percent-badge">
                🎯 {{ getEventProgress(ev).percent }}% Goal Achieved
              </span>
              <span v-else class="no-target-badge">
                💡 No target goal set
              </span>
              <span class="gift-count">{{ store.ledger.filter(r => String(r.eventId) === String(ev.id) && r.dir === 'received').length }} gifts</span>
            </div>
          </div>

          <div class="link-copy-row">
            <input readonly :value="getShareUrl(ev)" class="link-input" />
            <button class="btn sm" @click="copyLink(ev)">
              {{ copiedId === ev.id ? '✓ Copied' : '📋 Copy' }}
            </button>
            <button class="ghost sm-btn del-btn" title="Delete Payment Link" @click="confirmDelete(ev.id, ev.name)">
              🗑️
            </button>
          </div>
        </div>
      </div>

      <div v-else class="card empty-card">
        <p class="muted">You haven't generated any event payment links yet.</p>
        <RouterLink to="/create-event" class="btn sm" style="margin-top:0.8rem">
          ✨ Generate Your First Payment Link
        </RouterLink>
      </div>

      <!-- Received Gifts Ledger Table -->
      <h3 class="serif" style="margin:2.5rem 0 1rem">Gifts Received Ledger</h3>

      <div class="card tablewrap">
        <table>
          <thead>
            <tr>
              <th>Date &amp; Time</th>
              <th>Giver / Guest Name</th>
              <th>Event Title</th>
              <th>Amount Received</th>
              <th>Goodwill Message</th>
              <th>Reference Code</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in hostLedger" :key="r.id">
              <td>
                <div>{{ fdate(r.at) }}</div>
                <span class="muted" style="font-size:0.8rem">{{ ftime(r.at) }}</span>
              </td>
              <td><b>{{ r.person }}</b></td>
              <td>{{ r.event }}</td>
              <td>
                <b class="text-green">{{ fmt(r.amount) }}</b>
                <div class="amt-words">{{ fmtWords(r.amount) }}</div>
              </td>
              <td><span class="msg-text" v-if="r.message">"{{ r.message }}"</span><span v-else class="muted">-</span></td>
              <td><code>{{ r.ref }}</code></td>
              <td><span class="status-badge">✓ Paid</span></td>
            </tr>
            <tr v-if="!hostLedger.length">
              <td colspan="7" class="empty-td">
                No gifts received yet. Share your event payment link to start receiving gifts!
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<style scoped>
.auth-gate {
  text-align: center;
  padding: 3rem;
  max-width: 480px;
  margin: 2rem auto;
}
.header-row {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}
.sub-lead {
  color: var(--muted);
  max-width: 600px;
  margin-top: 0.2rem;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.2rem;
  margin-bottom: 1.5rem;
}
@media (max-width: 600px) {
  .stats-grid { grid-template-columns: 1fr; }
}
.stat-card {
  background: var(--card);
  border: 2px solid var(--ink);
  border-radius: 16px;
  padding: 1.2rem;
  box-shadow: 4px 4px 0 var(--ink);
}
.st-label {
  color: var(--muted);
  font-size: 0.9rem;
  font-weight: 700;
}
.st-val {
  font: 400 2.2rem 'Young Serif', serif;
  margin: 0.2rem 0;
}
.st-sub {
  font-size: 0.82rem;
  color: var(--muted);
}
.text-green { color: var(--green); }
.text-gold { color: #8A6800; }
.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1.2rem;
}
.ev-card {
  display: flex;
  flex-direction: column;
}
.ev-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.6rem;
}
.ev-date {
  font-size: 0.85rem;
  color: var(--muted);
  font-weight: 700;
}
.ev-title {
  font-size: 1.3rem;
  margin: 0 0 0.8rem;
}
.goal-progress-box {
  background: #FFFDF5;
  border: 1.5px solid var(--ink);
  border-radius: 12px;
  padding: 0.8rem;
  margin-bottom: 1rem;
}
.g-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.88rem;
  margin-bottom: 0.4rem;
}
.progress-bar-wrap {
  height: 12px;
  background: var(--bg);
  border: 1.5px solid var(--ink);
  border-radius: 6px;
  overflow: hidden;
  margin: 0.4rem 0;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--gold), var(--red));
  border-radius: 4px;
  transition: width 0.3s ease;
}
.g-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  margin-top: 0.4rem;
}
.percent-badge {
  color: var(--red);
  font-weight: 700;
}
.no-target-badge {
  color: var(--muted);
}
.gift-count {
  color: var(--muted);
}
.link-copy-row {
  display: flex;
  gap: 0.4rem;
  margin-top: auto;
}
.link-input {
  flex: 1;
  font-family: monospace;
  font-size: 0.85rem;
}
.del-btn {
  border-color: var(--red);
  color: var(--red);
  padding: 0.35rem 0.6rem;
}
.del-btn:hover {
  background: var(--red);
  color: #fff;
}
.amt-words {
  font-size: 0.75rem;
  color: var(--muted);
  font-weight: normal;
}
.empty-card {
  text-align: center;
  padding: 2.5rem;
}
.msg-text {
  font-style: italic;
}
.status-badge {
  color: var(--green);
  font-weight: 700;
  font-size: 0.85rem;
}
.empty-td {
  text-align: center;
  padding: 2.5rem;
  color: var(--muted);
}
</style>
