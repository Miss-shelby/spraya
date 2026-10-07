<script setup>
import GoogleAuth from './components/GoogleAuth.vue'

const colors = ['#A3123A', '#F5C842', '#2E7D4F', '#4A1414']
</script>

<template>
  <div class="bunting" aria-hidden="true">
    <span v-for="n in 60" :key="n" class="flag" :style="{ borderTopColor: colors[n % 4] }"></span>
  </div>

  <div class="sticky-nav-bar">
    <div class="wrap">
      <nav>
        <RouterLink to="/" class="brand">Spraya</RouterLink>
        <RouterLink class="tab" to="/host-dashboard">Host Ledger</RouterLink>
        <RouterLink class="tab" to="/my-sent-gifts">My Gifts</RouterLink>
        <RouterLink class="tab" to="/albums">Albums</RouterLink>
        <RouterLink class="btn sm" to="/create-event">+ Create Link</RouterLink>
        <GoogleAuth />
      </nav>
    </div>
  </div>

  <div class="wrap">
    <RouterView />
  </div>

  <footer>Spraya · Give well. Owe fair. · Test mode: no real money moves.</footer>
</template>

<style scoped>
.sticky-nav-bar {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: var(--bg);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
</style>
