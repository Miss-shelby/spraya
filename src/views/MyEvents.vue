<script setup>
import { computed, ref } from 'vue'
import { store, fmt, getEventTotalReceived, fdate } from '../store'

const activeFilter = ref('all') // 'all' or 'my'

const filteredEvents = computed(() => {
  if (activeFilter.value === 'my' && store.user && store.user.email) {
    return store.events.filter(e => e.hostEmail === store.user.email || e.hostUserEmail === store.user.email)
  }
  return store.events
})

const copiedId = ref(null)

async function copyLink(eventId) {
  const url = `${window.location.origin}/pay/${eventId}`
  try {
    await navigator.clipboard.writeText(url)
    copiedId.value = eventId
    setTimeout(() => { copiedId.value = null }, 2500)
  } catch (e) {
    console.error(e)
  }
}

function getEventGuests(eventId) {
  return store.ledger.filter(r => String(r.eventId) === String(eventId) && r.dir === 'received')
}
</script>

<template>
  <section class="pg">
    <div class="header-row">
      <div>
        <h2>Event Payment Links &amp; Raised Funds</h2>
        <span class="hl"></span>
        <p class="sub-lead">
          Track all your event links, see gifts as they roll in live, and copy payment links to share on WhatsApp or social media.
        </p>
      </div>

      <RouterLink to="/create-event" class="btn sm" style="margin-left:auto">
        + Create New Event Link
      </RouterLink>
    </div>

    <!-- Filter Pills -->
    <div class="filter-pills" v-if="store.user">
      <button
        class="pill-btn"
        :class="{ active: activeFilter === 'all' }"
        @click="activeFilter = 'all'"
      >
        All Events ({{ store.events.length }})
      </button>
      <button
        class="pill-btn"
        :class="{ active: activeFilter === 'my' }"
        @click="activeFilter = 'my'"
      >
        My Created Events ({{ store.events.filter(e => e.hostEmail === store.user.email || e.hostUserEmail === store.user.email).length }})
      </button>
    </div>

    <!-- Events List -->
    <div class="events-grid">
      <div v-for="ev in filteredEvents" :key="ev.id" class="card event-card">
        <div class="card-head">
          <span class="chip">{{ ev.category || 'Event' }}</span>
          <span class="date-tag">{{ fdate(ev.date) }}</span>
        </div>

        <h3 class="ev-title">{{ ev.name }}</h3>
        <p class="ev-host">Host: <b>{{ ev.host }}</b></p>

        <!-- Bank Details Summary -->
        <div class="bank-mini">
          <div><span class="muted">Bank:</span> {{ ev.bankName }}</div>
          <div><span class="muted">Acc No:</span> <code>{{ ev.accountNumber }}</code></div>
          <div><span class="muted">Name:</span> {{ ev.accountName }}</div>
        </div>

        <!-- Money Raised Progress -->
        <div class="raised-box">
          <div class="r-row">
            <span>Total Funds Received:</span>
            <b class="r-amount">{{ fmt(getEventTotalReceived(ev.id)) }}</b>
          </div>
          <div v-if="ev.targetAmount" class="r-row muted" style="font-size:0.85rem">
            Target Goal: {{ fmt(ev.targetAmount) }} ({{ Math.min(100, Math.round((getEventTotalReceived(ev.id)/ev.targetAmount)*100)) }}%)
          </div>
        </div>

        <!-- Guest Donors List -->
        <details class="guests-details">
          <summary>
            👥 Guests Gifting List ({{ getEventGuests(ev.id).length }} gifts)
          </summary>
          <div v-if="getEventGuests(ev.id).length" class="guests-list">
            <div v-for="g in getEventGuests(ev.id)" :key="g.id" class="g-item">
              <div>
                <b>{{ g.person }}</b>
                <span v-if="g.message" class="g-msg"> — "{{ g.message }}"</span>
              </div>
              <div class="g-amt">{{ fmt(g.amount) }}</div>
            </div>
          </div>
          <p v-else class="no-gifts">No gifts received yet for this event.</p>
        </details>

        <!-- Actions -->
        <div class="card-actions">
          <button class="btn sm" @click="copyLink(ev.id)">
            {{ copiedId === ev.id ? '✓ Link Copied!' : '📋 Copy Payment Link' }}
          </button>
          <RouterLink :to="'/pay/' + ev.id" class="ghost sm-ghost">
            🔗 Open Payment Link
          </RouterLink>
        </div>
      </div>
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
  max-width: 600px;
  margin-top: 0.2rem;
}
.filter-pills {
  display: flex;
  gap: 0.6rem;
  margin-bottom: 1.5rem;
}
.pill-btn {
  background: var(--card);
  border: 2px solid var(--ink);
  padding: 0.4rem 1rem;
  border-radius: 2rem;
  font-weight: 700;
  cursor: pointer;
}
.pill-btn.active {
  background: var(--gold);
  color: #3A1F17;
}
.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1.5rem;
}
.event-card {
  display: flex;
  flex-direction: column;
}
.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}
.date-tag {
  font-size: 0.85rem;
  color: var(--muted);
  font-weight: 700;
}
.ev-title {
  font-size: 1.35rem;
  margin: 0 0 0.4rem;
}
.ev-host {
  margin: 0 0 0.8rem;
  color: var(--muted);
}
.bank-mini {
  background: var(--bg);
  border: 1px dashed var(--ink);
  border-radius: 8px;
  padding: 0.6rem;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}
.raised-box {
  background: var(--ok);
  border: 1.5px solid var(--green);
  border-radius: 12px;
  padding: 0.8rem;
  margin-bottom: 1rem;
}
.r-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.r-amount {
  font-family: 'Young Serif', serif;
  font-size: 1.3rem;
  color: var(--green);
}
.guests-details {
  background: #FFFDF5;
  border: 1px solid var(--ink);
  border-radius: 10px;
  padding: 0.6rem;
  margin-bottom: 1.2rem;
}
.guests-details summary {
  cursor: pointer;
  font-weight: 700;
  font-size: 0.9rem;
}
.guests-list {
  margin-top: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.g-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  padding: 0.3rem 0;
  border-bottom: 1px dashed var(--muted);
}
.g-msg {
  font-style: italic;
  color: var(--muted);
}
.g-amt {
  font-weight: 700;
  color: var(--green);
}
.no-gifts {
  font-size: 0.85rem;
  color: var(--muted);
  margin: 0.4rem 0 0;
}
.card-actions {
  margin-top: auto;
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.sm-ghost {
  padding: 0.4rem 0.8rem;
  font-size: 0.88rem;
}
</style>
