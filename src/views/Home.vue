<script setup>
import { store } from '../store'

const steps = [
  ['1. Fill Event Details & Generate Link', 'Enter your event name, category, date, and description to generate your centralized payment link.'],
  ['2. Share Payment Link with Guests', 'Send your link on WhatsApp or social media. Guests sign in with Google and pay directly via Paystack gateway.'],
  ['3. Real-Time Tracking in Host Dashboard', 'All gifts are logged in your Host Dashboard instantly. Keep track of every giver and total funds raised.']
]

const features = [
  ['Centralized Payment Links', 'Generate one link for your wedding, birthday, funeral, or naming ceremony.'],
  ['Google Sign-In Authentication', 'Authenticated gifting ensures every donor is verified and tracked accurately.'],
  ['Host & Guest Dashboards', 'Separate dashboards for hosts (money received) and guests (gifts sent).'],
  ['Multi-Currency Gateway', 'Friends in the UK, US, or Canada pay in foreign currencies while you receive naira.'],
  ['No Dummy Transactions', 'Clean, real-time transaction tracking starting from your very first gift.']
]
</script>

<template>
  <main>
    <!-- Hero Section -->
    <div class="hero">
      <div>
        <h1>Spraya</h1>
        <span class="sub">Centralized Event Payment Links</span>
        <p class="lede">
          Generate an official payment link for your wedding, birthday, or funeral. Let guests sign in and pay securely via Paystack, while tracking all received funds in your Host Dashboard!
        </p>
        <div class="hero-btns">
          <RouterLink class="btn" to="/create-event">✨ Generate Payment Link</RouterLink>
          <RouterLink class="ghost" to="/host-dashboard">🎉 Host Dashboard</RouterLink>
        </div>
      </div>

      <div class="stage">
        <div class="note">All gifts tracked in one place!</div>
        <svg class="arrow" viewBox="0 0 70 60" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
          <path d="M4 6c30-6 55 8 55 40M59 46l-9-9M59 46l10-8"/>
        </svg>
        <div class="paper p1">
          <span class="chip">🎁 Centralized Gift Tracked</span>
          <div class="big">₦50,000</div>
          <div>From Aunty Funke to <b>Adaeze &amp; Chidi</b></div>
          <div class="muted">Paystack Gateway · SPR-8841</div>
        </div>
        <div class="paper p2">
          <span class="chip">🔒 Google Authenticated</span>
          <div class="big">Verified Giver</div>
          <div>funke@gmail.com</div>
          <div class="muted">Logged in Host Dashboard</div>
        </div>
      </div>
    </div>

    <!-- How It Works -->
    <section class="sec">
      <h2>How Spraya Works</h2>
      <span class="hl"></span>
      <div class="grid3">
        <div class="card" v-for="(s, i) in steps" :key="s[0]">
          <b class="serif num">{{ i + 1 }}</b>
          <h3>{{ s[0] }}</h3>
          <p>{{ s[1] }}</p>
        </div>
      </div>
    </section>

    <!-- Active Event Links -->
    <section class="sec" v-if="store.events.length">
      <h2>Featured Event Links</h2>
      <span class="hl"></span>
      <div class="grid3">
        <div v-for="ev in store.events" :key="ev.id" class="card ev-preview-card">
          <span class="chip" style="float:right">{{ ev.category }}</span>
          <h3>{{ ev.name }}</h3>
          <p class="muted">Hosted by <b>{{ ev.host }}</b></p>
          <RouterLink :to="'/pay/' + ev.id" class="btn sm full-btn" style="margin-top:0.8rem">
            💸 Send Gift / Pay Host →
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="sec">
      <h2>Why Choose Spraya?</h2>
      <span class="hl"></span>
      <div class="grid3">
        <div class="card" v-for="f in features" :key="f[0]">
          <h3>{{ f[0] }}</h3>
          <p>{{ f[1] }}</p>
        </div>
      </div>
    </section>

    <!-- Call to Action -->
    <section class="cta card">
      <h2>Hosting an Event Soon?</h2>
      <p>Generate your official payment link in under 1 minute and start receiving gifts.</p>
      <RouterLink class="btn" to="/create-event">✨ Generate Event Payment Link</RouterLink>
    </section>
  </main>
</template>

<style scoped>
.hero {
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  gap: 2rem;
  align-items: center;
  padding: 2rem 0 3rem;
}
.hero h1 {
  font-size: clamp(3.2rem, 9vw, 5.8rem);
}
.sub {
  display: inline-block;
  font: 400 1.7rem 'Young Serif', serif;
  margin: 0.6rem 0 1rem;
  position: relative;
}
.sub::after {
  content: "";
  position: absolute;
  left: 0;
  right: 8%;
  bottom: -6px;
  height: 9px;
  background: var(--gold);
  border-radius: 6px;
  transform: rotate(-1deg);
}
.lede {
  color: var(--muted);
  font-size: 1.12rem;
  max-width: 32rem;
  margin: 0 0 1.5rem;
}
.hero-btns {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
.stage {
  position: relative;
  height: 380px;
}
.paper {
  position: absolute;
  background: var(--card);
  border: 2px solid var(--ink);
  border-radius: 18px;
  padding: 1.2rem;
  box-shadow: 6px 6px 0 var(--ink);
}
.p1 {
  left: 0;
  top: 40px;
  width: 75%;
  transform: rotate(-4deg);
}
.p2 {
  right: 0;
  top: 170px;
  width: 68%;
  transform: rotate(3deg);
  background: var(--gold);
  color: #3A1F17;
}
.note {
  position: absolute;
  top: -6px;
  right: 6%;
  font: 600 1.35rem/1.1 Caveat, cursive;
  color: var(--red);
  transform: rotate(-6deg);
  width: 9rem;
}
.arrow {
  position: absolute;
  top: 50px;
  right: 30%;
  width: 70px;
  color: var(--red);
}
.big {
  font: 400 1.9rem 'Young Serif', serif;
  margin: 0.4rem 0;
}
.muted {
  color: var(--muted);
  font-size: 0.85rem;
}
.sec {
  padding: 2.2rem 0;
}
.num {
  font-size: 2rem;
  color: var(--red);
  display: block;
}
.ev-preview-card {
  display: flex;
  flex-direction: column;
}
.full-btn {
  width: 100%;
  text-align: center;
}
.cta {
  text-align: center;
  margin: 2rem 0 4rem;
  background: var(--gold);
  color: #3A1F17;
}
.cta p {
  margin: 0.6rem 0 1.2rem;
}
@media (max-width: 820px) {
  .hero {
    grid-template-columns: 1fr;
  }
}
</style>
