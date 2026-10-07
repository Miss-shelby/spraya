<script setup>
import { computed } from 'vue'
import { store, fmt, fdate, ftime, getSentLedger } from '../store'
import GoogleAuth from '../components/GoogleAuth.vue'

const userEmail = computed(() => store.user ? store.user.email : '')
const sentLedger = computed(() => getSentLedger(userEmail.value))

const totalSent = computed(() => sentLedger.value.reduce((s, r) => s + r.amount, 0))
</script>

<template>
  <section class="pg">
    <!-- Logged Out Guard -->
    <div v-if="!store.user" class="card auth-gate">
      <h2>🔒 My Sent Gifts Access</h2>
      <p class="muted">Please sign in with Google to view your sent gifts and track money you have sprayed at events.</p>
      <GoogleAuth style="margin-top:1rem" />
    </div>

    <!-- Logged In Guest Sent Dashboard -->
    <div v-else>
      <div class="header-row">
        <div>
          <h2>🎁 My Sent Gifts (Gifting Ledger)</h2>
          <span class="hl"></span>
          <p class="sub-lead">
            A complete record of all cash gifts you have sent to hosts for their weddings, birthdays, and celebrations.
          </p>
        </div>

        <RouterLink to="/" class="btn sm" style="margin-left:auto">
          💸 Send New Gift
        </RouterLink>
      </div>

      <!-- Stats Summary -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="st-label">🎁 Total Gifts Sent Out</span>
          <div class="st-val text-gold">{{ fmt(totalSent) }}</div>
          <span class="st-sub">{{ sentLedger.length }} events supported</span>
        </div>

        <div class="stat-card">
          <span class="st-label">👤 Logged In Giver</span>
          <div class="st-val-name">{{ store.user.name }}</div>
          <span class="st-sub">{{ store.user.email }}</span>
        </div>
      </div>

      <!-- Sent Gifts Ledger Table -->
      <h3 class="serif" style="margin:2rem 0 1rem">Sent Gifts History</h3>

      <div class="card tablewrap">
        <table>
          <thead>
            <tr>
              <th>Date &amp; Time</th>
              <th>Host / Celebrant</th>
              <th>Event Title</th>
              <th>Amount Sent</th>
              <th>Spray Note / Message</th>
              <th>Paystack Reference</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in sentLedger" :key="r.id">
              <td>
                <div>{{ fdate(r.at) }}</div>
                <span class="muted" style="font-size:0.8rem">{{ ftime(r.at) }}</span>
              </td>
              <td><b>To: {{ r.person }}</b></td>
              <td>{{ r.event }}</td>
              <td><b class="text-gold-bold">{{ fmt(r.amount) }}</b></td>
              <td><span class="msg-text" v-if="r.message">"{{ r.message }}"</span><span v-else class="muted">-</span></td>
              <td><code>{{ r.ref }}</code></td>
              <td><span class="status-badge">✓ Paid</span></td>
            </tr>
            <tr v-if="!sentLedger.length">
              <td colspan="7" class="empty-td">
                You haven't sent any gifts yet. Open an event payment link to send your first gift!
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
.st-val-name {
  font: 400 1.6rem 'Young Serif', serif;
  margin: 0.2rem 0;
  color: var(--ink);
}
.st-sub {
  font-size: 0.82rem;
  color: var(--muted);
}
.text-gold { color: #8A6800; }
.text-gold-bold { color: #8A6800; font-weight: 700; }
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
