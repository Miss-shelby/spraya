<script setup>
import { reactive, ref, computed, watchEffect } from 'vue'
import { store, createEvent, fmt, fmtWords } from '../store'

const origin = ref(typeof window !== 'undefined' ? window.location.origin : '')

const form = reactive({
  host: store.user ? store.user.name : '',
  hostEmail: store.user ? store.user.email : '',
  name: '',
  date: '',
  category: 'Wedding',
  description: '',
  targetAmount: ''
})

watchEffect(() => {
  if (store.user) {
    if (!form.host) form.host = store.user.name
    if (!form.hostEmail) form.hostEmail = store.user.email
  }
})

const createdEvent = ref(null)
const copied = ref(false)

function submitCreate() {
  if (!form.host || !form.name) return

  const newEv = createEvent({
    name: form.name,
    host: form.host,
    hostEmail: form.hostEmail,
    date: form.date ? new Date(form.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Upcoming Event',
    category: form.category,
    description: form.description,
    targetAmount: form.targetAmount ? Number(form.targetAmount) : 0
  })

  createdEvent.value = newEv
}

const paymentUrl = computed(() => {
  if (!createdEvent.value) return ''
  return `${origin.value}/pay/${createdEvent.value.id}`
})

async function copyLink() {
  try {
    await navigator.clipboard.writeText(paymentUrl.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 3000)
  } catch (e) {
    console.error(e)
  }
}

const whatsappUrl = computed(() => {
  if (!createdEvent.value) return '#'
  const msg = `🎉 You are warmly invited to ${createdEvent.value.name}!\n\nIf you would like to send a gift or spray money for our event, please use my official Spraya payment link:\n${paymentUrl.value}\n\nThank you for celebrating with us!`
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`
})

function resetForm() {
  createdEvent.value = null
  form.name = ''
  form.description = ''
  form.targetAmount = ''
}
</script>

<template>
  <section class="pg">
    <div class="header-row">
      <div>
        <h2>Generate Event Payment Link</h2>
        <span class="hl"></span>
        <p class="sub-lead">
          Create a centralized payment link for your event. All gifts are processed securely via Paystack so your funds can be tracked in real-time.
        </p>
      </div>
      <RouterLink to="/host-dashboard" class="ghost" style="margin-left:auto">
        🎉 Host Dashboard →
      </RouterLink>
    </div>

    <!-- Generated Payment Link Result Card -->
    <div v-if="createdEvent" class="card success-card">
      <div class="badge-tag">✨ Payment Link Generated!</div>
      <h2 style="margin:0.6rem 0 0.2rem">{{ createdEvent.name }}</h2>
      <p class="muted">Hosted by <b>{{ createdEvent.host }}</b> · {{ createdEvent.date }}</p>

      <div class="link-display-box">
        <label style="margin-top:0; font-weight:700; color:var(--red)">Your Centralized Payment Link</label>
        <div class="link-input-group">
          <input type="text" :value="paymentUrl" readonly class="url-input" />
          <button class="btn sm" @click="copyLink">
            {{ copied ? '✓ Copied Link!' : '📋 Copy Payment Link' }}
          </button>
        </div>
        <p class="link-tip">
          🔒 Share this clean link with guests. All payments are tracked and recorded automatically in your Host Dashboard!
        </p>
      </div>

      <div class="action-buttons">
        <a :href="whatsappUrl" target="_blank" rel="noopener" class="btn wa-btn">
          💬 Share on WhatsApp
        </a>
        <RouterLink :to="'/pay/' + createdEvent.id" class="ghost">
          👁️ Open Payment Page
        </RouterLink>
        <button class="ghost" @click="resetForm">
          + Create Another Link
        </button>
      </div>
    </div>

    <!-- Event Creation Form -->
    <div v-else class="grid2">
      <form class="card" @submit.prevent="submitCreate">
        <div v-if="!store.user" class="login-prompt">
          🔒 <span>Please sign in with Google to create and track your event payment links.</span>
        </div>

        <label for="host-name">Host / Celebrant Name</label>
        <input id="host-name" v-model="form.host" required placeholder="e.g. Adaeze & Chidi / Chief Ogunlesi" />

        <label for="host-email">Host Email Address</label>
        <input id="host-email" type="email" v-model="form.hostEmail" required placeholder="host@example.com" />

        <label for="ev-title">Event Title</label>
        <input id="ev-title" v-model="form.name" required placeholder="e.g. Seun & Bimpe's Wedding / Mama Bisi's 70th" />

        <div class="form-row">
          <div>
            <label for="ev-cat">Event Category</label>
            <select id="ev-cat" v-model="form.category">
              <option>Wedding</option>
              <option>Burial / Funeral</option>
              <option>Birthday</option>
              <option>Naming Ceremony</option>
              <option>Chieftaincy / Title</option>
              <option>Housewarming</option>
              <option>Anniversary</option>
              <option>Other Event</option>
            </select>
          </div>
          <div>
            <label for="ev-date">Event Date</label>
            <input id="ev-date" type="date" v-model="form.date" />
          </div>
        </div>

        <label for="ev-target">Target Goal Amount (NGN)</label>
        <input id="ev-target" type="number" min="0" step="50000" v-model="form.targetAmount" placeholder="e.g. 2000000" />
        <div v-if="form.targetAmount" class="fmt-preview">
          Formatted Target Goal: <b>{{ fmt(form.targetAmount) }}</b> <span class="muted">{{ fmtWords(form.targetAmount) }}</span>
        </div>

        <label for="ev-desc">Event Description / Message to Guests</label>
        <textarea id="ev-desc" v-model="form.description" rows="3" class="text-area" placeholder="Welcome message for your guests..."></textarea>

        <button type="submit" class="btn full-width" style="margin-top:1.5rem">
          ✨ Generate Centralized Payment Link
        </button>
      </form>

      <!-- Live Preview -->
      <div class="card preview-card">
        <span class="preview-tag">PAYMENT LINK PREVIEW</span>
        <h3 style="margin:0.4rem 0">{{ form.name || "Your Event Title" }}</h3>
        <p class="muted">Hosted by <b>{{ form.host || "Host Name" }}</b></p>
        <div v-if="form.targetAmount" class="preview-target-badge">
          🎯 Target Goal: <b>{{ fmt(form.targetAmount) }}</b>
        </div>
        <div class="link-preview-box">
          <code>{{ origin }}/pay/{{ form.name ? 'ev-1791410' : '...' }}</code>
        </div>
        <p class="preview-note">
          Guests visit this link, sign in, and send gifts directly through Paystack. You see all funds in your Host Dashboard.
        </p>
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
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.text-area {
  width: 100%;
  padding: 0.7rem 0.9rem;
  border-radius: 12px;
  border: 2px solid var(--ink);
  background: var(--bg);
  color: var(--ink);
  font: 600 1rem Quicksand;
}
.fmt-preview {
  font-size: 0.88rem;
  color: var(--green);
  margin-top: 0.3rem;
  background: var(--ok);
  padding: 0.35rem 0.7rem;
  border-radius: 6px;
  border: 1px solid var(--green);
}
.preview-target-badge {
  background: var(--gold);
  color: #3A1F17;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  font-size: 0.9rem;
  margin: 0.6rem 0;
  border: 1px solid var(--ink);
}
.login-prompt {
  background: var(--gold);
  color: #3A1F17;
  padding: 0.7rem;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 1rem;
  border: 1.5px solid var(--ink);
}
.full-width {
  width: 100%;
  text-align: center;
}
.success-card {
  max-width: 680px;
  margin: 0 auto;
  background: #FFFDF5;
}
.badge-tag {
  display: inline-block;
  background: var(--green);
  color: #fff;
  font-weight: 700;
  font-size: 0.85rem;
  padding: 0.3rem 0.8rem;
  border-radius: 2rem;
}
.link-display-box {
  background: var(--card);
  border: 2px solid var(--ink);
  border-radius: 14px;
  padding: 1.2rem;
  margin: 1.2rem 0;
}
.link-input-group {
  display: flex;
  gap: 0.6rem;
  margin-top: 0.4rem;
}
.url-input {
  flex: 1;
  font-family: monospace;
  background: #fff;
  border: 2px solid var(--ink);
}
.link-tip {
  font-size: 0.85rem;
  color: var(--muted);
  margin: 0.6rem 0 0;
}
.action-buttons {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
}
.wa-btn {
  background: #25D366;
  color: #fff;
  font-family: Quicksand, sans-serif;
  font-weight: 700;
}
.preview-card {
  background: #FFFDF5;
  height: fit-content;
}
.preview-tag {
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--red);
  letter-spacing: 0.05em;
}
.link-preview-box {
  background: var(--bg);
  border: 1.5px dashed var(--ink);
  padding: 0.6rem;
  border-radius: 8px;
  margin: 0.8rem 0;
  word-break: break-all;
}
.preview-note {
  font-size: 0.88rem;
  color: var(--muted);
}
</style>
