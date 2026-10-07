<script setup>
import { reactive, computed, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { store, getEventById, recordGiftPayment, fmt } from '../store'

const router = useRouter()

const selectedEventId = ref(store.events[0] ? store.events[0].id : '')
const event = computed(() => getEventById(selectedEventId.value) || store.events[0])

const rates = { NGN: 1, USD: 1550, GBP: 1950, CAD: 1130 }

const f = reactive({
  name: store.user ? store.user.name : '',
  email: store.user ? store.user.email : '',
  amount: 25000,
  cur: 'NGN',
  msg: 'Congratulations! Wishing you joy and blessings!'
})

watchEffect(() => {
  if (store.user) {
    if (!f.name) f.name = store.user.name
    if (!f.email) f.email = store.user.email
  }
})

const ngn = computed(() => (f.amount || 0) * rates[f.cur])
const done = ref(null)
const err = ref('')

function goToEventPaymentLink() {
  if (selectedEventId.value) {
    router.push('/pay/' + selectedEventId.value)
  }
}

function pay() {
  err.value = ''
  const key = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY

  if (!window.PaystackPop || !key || key.includes('xxxx')) {
    err.value = 'Paystack public key not ready. Using test simulation mode.'
    const entry = recordGiftPayment({
      event: event.value,
      amount: ngn.value,
      person: f.name,
      personEmail: f.email,
      ref: 'SPR-TEST-' + Math.floor(1000 + Math.random() * 9000),
      method: 'Paystack Card (Test)',
      message: f.msg
    })
    done.value = { amt: ngn.value, host: event.value.host, ref: entry.ref }
    return
  }

  const ref_ = 'SPR-' + Date.now()

  window.PaystackPop.setup({
    key,
    email: f.email,
    amount: Math.round(ngn.value * 100),
    currency: 'NGN',
    ref: ref_,
    metadata: { giver: f.name, event: event.value.name, message: f.msg, original: `${f.amount} ${f.cur}` },
    callback(res) {
      recordGiftPayment({
        event: event.value,
        amount: ngn.value,
        person: f.name,
        personEmail: f.email,
        ref: res.reference,
        method: 'Paystack Online',
        message: f.msg
      })
      done.value = { amt: ngn.value, host: event.value.host, ref: res.reference }
    },
    onClose() {
      err.value = 'Payment window closed. No money was taken.'
    }
  }).openIframe()
}
</script>

<template>
  <section class="pg">
    <div class="header-row">
      <div>
        <h2>Send a Gift / Spray Money</h2>
        <span class="hl"></span>
        <p class="sub-lead">
          Choose an event from the list below or open a host's custom payment link to send a gift.
        </p>
      </div>
      <RouterLink to="/create-event" class="btn sm" style="margin-left:auto">
        ✨ Create Your Own Event Link
      </RouterLink>
    </div>

    <div class="grid2">
      <form class="card" @submit.prevent="pay">
        <label for="ev">Select Event to Gifting</label>
        <select id="ev" v-model="selectedEventId">
          <option v-for="e in store.events" :key="e.id" :value="e.id">
            {{ e.name }} · Hosted by {{ e.host }}
          </option>
        </select>

        <div v-if="event" class="event-quick-info">
          <div class="qi-row"><span>Host:</span> <b>{{ event.host }}</b></div>
          <div class="qi-row"><span>Bank Transfer:</span> <b>{{ event.bankName }} · {{ event.accountNumber }}</b></div>
          <button type="button" class="ghost sm-btn" style="margin-top:0.4rem" @click="goToEventPaymentLink">
            🔗 Open Dedicated Payment Page for this Event →
          </button>
        </div>

        <label for="nm">Your Name (As host will see it)</label>
        <input id="nm" v-model="f.name" required placeholder="e.g. Tolu from London" />

        <label for="em">Email for your receipt</label>
        <input id="em" type="email" v-model="f.email" required placeholder="you@example.com" />

        <label for="am">Amount</label>
        <div class="row">
          <input id="am" type="number" min="100" v-model.number="f.amount" required />
          <select aria-label="Currency" v-model="f.cur">
            <option>NGN</option>
            <option>USD</option>
            <option>GBP</option>
            <option>CAD</option>
          </select>
        </div>

        <label for="ms">Message / Goodwill Note (optional)</label>
        <input id="ms" v-model="f.msg" placeholder="Congratulations!" />

        <p class="calc-note">
          Host receives <b>{{ fmt(ngn) }}</b>. Charged in naira at sample rates.
        </p>

        <button class="btn full-btn">🔒 Pay with Paystack Inline</button>
        <p class="err" v-if="err">{{ err }}</p>
      </form>

      <div class="card" v-if="!done">
        <h3>Paystack Test Mode</h3>
        <p>Use Paystack's test card credentials for testing:</p>
        <ul class="test-list">
          <li>Card Number: <b>4084 0840 8408 4081</b></li>
          <li>Expiry: <b>Any future date (e.g. 12/28)</b></li>
          <li>CVV: <b>408</b></li>
          <li>PIN: <b>0000</b> · OTP: <b>123456</b></li>
        </ul>
        <div class="transfer-notice">
          💡 Want to pay via Direct Bank Transfer instead?
          <RouterLink :to="'/pay/' + selectedEventId" class="text-link">Open Host Bank Details Page →</RouterLink>
        </div>
      </div>

      <div class="card success-card" v-else>
        <h3>🎉 Gift Sent Successfully!</h3>
        <p>{{ fmt(done.amt) }} sent to <b>{{ done.host }}</b>. Reference <code>{{ done.ref }}</code>.</p>
        <RouterLink class="btn" to="/ledger" style="margin-top:1rem">Open Reciprocal Ledger →</RouterLink>
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
.event-quick-info {
  background: var(--bg);
  border: 1.5px dashed var(--ink);
  border-radius: 12px;
  padding: 0.8rem;
  margin: 0.8rem 0;
  font-size: 0.9rem;
}
.qi-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.3rem;
}
.sm-btn {
  font-size: 0.8rem;
  padding: 0.3rem 0.6rem;
  width: 100%;
}
.calc-note {
  color: var(--muted);
  font-size: 0.9rem;
  margin: 0.6rem 0 1.2rem;
}
.full-btn {
  width: 100%;
  text-align: center;
}
.test-list {
  font-size: 0.9rem;
  padding-left: 1.2rem;
  line-height: 1.6;
}
.transfer-notice {
  background: var(--ok);
  border: 1px solid var(--green);
  padding: 0.8rem;
  border-radius: 10px;
  font-size: 0.9rem;
  margin-top: 1rem;
}
.text-link {
  color: var(--red);
  font-weight: 700;
}
.success-card {
  background: #FFFDF5;
}
</style>
