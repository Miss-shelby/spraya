<script setup>
import { reactive, computed, ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { store, getEventById, getEventTotalReceived, recordGiftPayment, fmt, fmtWords, fdate } from '../store'
import GoogleAuth from '../components/GoogleAuth.vue'

const route = useRoute()
const eventId = computed(() => route.params.id)
const payload = computed(() => route.query.d || '')
const event = computed(() => getEventById(eventId.value, payload.value))

const totalCollected = computed(() => (event.value ? getEventTotalReceived(event.value.id) : 0))
const goalProgress = computed(() => {
  if (!event.value || !event.value.targetAmount) return 0
  return Math.min(100, Math.round((totalCollected.value / event.value.targetAmount) * 100))
})

const rates = { NGN: 1, USD: 1550, GBP: 1950, CAD: 1130 }

const form = reactive({
  name: store.user ? store.user.name : '',
  email: store.user ? store.user.email : '',
  amount: 20000,
  cur: 'NGN',
  msg: 'Congratulations! Wishing you joy and blessings!'
})

watchEffect(() => {
  if (store.user) {
    if (!form.name) form.name = store.user.name
    if (!form.email) form.email = store.user.email
  }
})

const ngnAmount = computed(() => (form.amount || 0) * rates[form.cur])

const paymentSuccess = ref(null)
const errorMsg = ref('')

function handlePaystackPayment() {
  errorMsg.value = ''
  if (!store.user) {
    errorMsg.value = 'Please sign in with Google to send money.'
    return
  }

  const key = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY
  const refCode = 'SPR-' + Date.now()

  if (!window.PaystackPop || !key || key.includes('xxxx')) {
    // Test mode fallback
    const entry = recordGiftPayment({
      event: event.value,
      amount: ngnAmount.value,
      person: store.user.name || form.name,
      personEmail: store.user.email || form.email,
      ref: refCode,
      message: form.msg
    })
    paymentSuccess.value = entry
    return
  }

  window.PaystackPop.setup({
    key,
    email: store.user.email || form.email,
    amount: Math.round(ngnAmount.value * 100),
    currency: 'NGN',
    ref: refCode,
    metadata: {
      giver: store.user.name || form.name,
      event: event.value.name,
      message: form.msg
    },
    callback(res) {
      const entry = recordGiftPayment({
        event: event.value,
        amount: ngnAmount.value,
        person: store.user.name || form.name,
        personEmail: store.user.email || form.email,
        ref: res.reference || refCode,
        message: form.msg
      })
      paymentSuccess.value = entry
    },
    onClose() {
      errorMsg.value = 'Payment window was closed.'
    }
  }).openIframe()
}
</script>

<template>
  <section class="pg">
    <div v-if="event" class="pay-wrap">
      <!-- Event Header Banner -->
      <div class="card event-banner">
        <div class="banner-top">
          <span class="chip text-gold">{{ event.category || 'Event' }}</span>
          <span class="muted-date">🗓️ {{ fdate(event.date) }}</span>
        </div>

        <h1 class="event-title">{{ event.name }}</h1>
        <p class="host-line">Hosted by <b class="host-name">{{ event.host }}</b></p>

        <p v-if="event.description" class="event-desc">
          "{{ event.description }}"
        </p>

        <!-- Goal Progress Bar -->
        <div v-if="event.targetAmount" class="goal-box">
          <div class="goal-labels">
            <span>Total Raised: <b class="text-green">{{ fmt(totalCollected) }}</b></span>
            <span>Target Goal: <b>{{ fmt(event.targetAmount) }}</b> ({{ goalProgress }}%)</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: goalProgress + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- Payment Success Screen -->
      <div v-if="paymentSuccess" class="card success-box" style="margin-top:1.5rem">
        <div class="celebrate-icon">🎉 💸</div>
        <h2 style="margin: 0.4rem 0">Gift Sent Successfully!</h2>
        <p class="success-lead">
          Thank you <b>{{ paymentSuccess.person }}</b>! Your gift of <b>{{ fmt(paymentSuccess.amount) }}</b> has been processed for <b>{{ event.host }}</b>.
        </p>

        <div class="receipt-card">
          <div class="receipt-row"><span>Event:</span> <b>{{ paymentSuccess.event }}</b></div>
          <div class="receipt-row"><span>Amount Paid:</span> <b class="text-green">{{ fmt(paymentSuccess.amount) }}</b></div>
          <div class="receipt-row"><span>Reference Code:</span> <code>{{ paymentSuccess.ref }}</code></div>
          <div v-if="paymentSuccess.message" class="receipt-row"><span>Message:</span> <i>"{{ paymentSuccess.message }}"</i></div>
        </div>

        <div class="success-actions">
          <RouterLink to="/my-sent-gifts" class="btn">View My Sent Gifts →</RouterLink>
          <button class="ghost" @click="paymentSuccess = null">Send Another Gift</button>
        </div>
      </div>

      <!-- Gifting Payment Form -->
      <div v-else class="card pay-card" style="margin-top: 1.5rem">
        <!-- Require Google Auth Banner if Logged Out -->
        <div v-if="!store.user" class="auth-gate-banner">
          <div class="auth-gate-text">
            <h3>🔒 Google Sign-In Required to Send Money</h3>
            <p>Please sign in with Google so your payment can be authenticated and tracked in your Gifting Dashboard.</p>
          </div>
          <GoogleAuth />
        </div>

        <form v-else @submit.prevent="handlePaystackPayment">
          <div class="logged-as">
            <span>Signed in as: <b>{{ store.user.name }}</b> ({{ store.user.email }})</span>
          </div>

          <label for="g-amount">Gift Amount</label>
          <div class="row">
            <input id="g-amount" type="number" min="100" v-model.number="form.amount" required />
            <select v-model="form.cur" aria-label="Currency">
              <option value="NGN">NGN (₦)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD (C$)</option>
            </select>
          </div>

          <div class="naira-calc">
            <span>Host receives: <b class="text-green-lg">{{ fmt(ngnAmount) }}</b></span>
            <span class="muted" style="margin-left:0.4rem">{{ fmtWords(ngnAmount) }}</span>
          </div>

          <label for="g-msg">Goodwill Message / Spray Note</label>
          <input id="g-msg" v-model="form.msg" placeholder="e.g. Congratulations! Wishing you joy and blessings!" />

          <button type="submit" class="btn full-width" style="margin-top: 1.2rem">
            🔒 Pay {{ fmt(ngnAmount) }} via Paystack Gateway
          </button>

          <p v-if="errorMsg" class="err">{{ errorMsg }}</p>

          <div class="secure-footer">
            🔒 Secure SSL Gateway · Tracked in your Gifting Dashboard
          </div>
        </form>
      </div>
    </div>

    <div v-else class="card" style="text-align: center; padding: 3rem">
      <h2>Event Payment Link Not Found</h2>
      <p>The link may be invalid or expired.</p>
      <RouterLink to="/" class="btn" style="margin-top: 1rem">Return Home</RouterLink>
    </div>
  </section>
</template>

<style scoped>
.pay-wrap {
  max-width: 720px;
  margin: 0 auto;
}
.event-banner {
  background: #FFFDF5;
  border: 2px solid var(--ink);
  box-shadow: 6px 6px 0 var(--ink);
  padding: 1.8rem;
}
.banner-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.6rem;
}
.text-gold {
  background: var(--gold);
  color: #3A1F17;
  font-weight: 700;
}
.text-green { color: var(--green); }
.text-green-lg { color: var(--green); font-size: 1.15rem; font-weight: 800; }
.muted-date {
  color: var(--muted);
  font-weight: 700;
  font-size: 0.95rem;
}
.event-title {
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  margin: 0.2rem 0;
}
.host-line {
  font-size: 1.1rem;
  color: var(--muted);
  margin: 0 0 1rem;
}
.host-name {
  color: var(--red);
  font-family: 'Young Serif', serif;
}
.event-desc {
  background: rgba(245, 200, 66, 0.25);
  border-left: 4px solid var(--gold);
  padding: 0.8rem 1rem;
  border-radius: 0 12px 12px 0;
  font-style: italic;
  font-size: 1rem;
  margin: 1rem 0;
}
.goal-box {
  background: var(--card);
  border: 1.5px solid var(--ink);
  border-radius: 12px;
  padding: 0.8rem 1rem;
  margin-top: 1.2rem;
}
.goal-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  margin-bottom: 0.4rem;
  flex-wrap: wrap;
}
.progress-track {
  height: 12px;
  background: var(--bg);
  border: 1.5px solid var(--ink);
  border-radius: 6px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--gold), var(--red));
  border-radius: 4px;
}
.auth-gate-banner {
  background: var(--gold);
  color: #3A1F17;
  border: 2px solid var(--ink);
  border-radius: 14px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
}
.auth-gate-text h3 {
  margin: 0 0 0.4rem;
}
.auth-gate-text p {
  margin: 0;
  font-size: 0.95rem;
}
.logged-as {
  background: var(--ok);
  border: 1px solid var(--green);
  padding: 0.6rem 0.9rem;
  border-radius: 10px;
  font-size: 0.9rem;
  margin-bottom: 1.2rem;
}
.naira-calc {
  font-size: 0.95rem;
  margin: 0.5rem 0 1rem;
  background: var(--card);
  padding: 0.5rem 0.8rem;
  border-radius: 8px;
  border: 1px solid var(--ink);
}
.full-width {
  width: 100%;
  text-align: center;
}
.secure-footer {
  text-align: center;
  font-size: 0.78rem;
  color: var(--muted);
  margin-top: 1rem;
}
.success-box {
  text-align: center;
  background: #FFFDF5;
  padding: 2rem;
}
.celebrate-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}
.success-lead {
  font-size: 1.05rem;
  color: var(--muted);
  max-width: 500px;
  margin: 0.5rem auto 1.5rem;
}
.receipt-card {
  max-width: 480px;
  margin: 0 auto 1.5rem;
  background: var(--card);
  border: 2px solid var(--ink);
  border-radius: 14px;
  padding: 1.2rem;
  text-align: left;
}
.receipt-row {
  display: flex;
  justify-content: space-between;
  padding: 0.4rem 0;
  border-bottom: 1px dashed var(--muted);
}
.receipt-row:last-child {
  border-bottom: none;
}
.success-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}
</style>
