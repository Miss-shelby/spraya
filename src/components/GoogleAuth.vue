<script setup>
import { ref, onMounted } from 'vue'
import { store, setUser, logoutUser } from '../store'

const showModal = ref(false)
const manualName = ref('')
const manualEmail = ref('')

function handleGoogleCredentialResponse(response) {
  try {
    const base64Url = response.credential.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    const payload = JSON.parse(jsonPayload)

    setUser({
      name: payload.name || payload.given_name || 'Google User',
      email: payload.email,
      avatar: payload.picture || '',
      googleId: payload.sub
    })
    showModal.value = false
  } catch (e) {
    console.error('Google Sign-In Credential Error:', e)
  }
}

function initGoogle() {
  if (window.google && window.google.accounts && window.google.accounts.id) {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '912345678900-demoapps.apps.googleusercontent.com'
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredentialResponse,
        auto_select: false
      })

      const btnContainer = document.getElementById('google-auth-btn-slot')
      if (btnContainer) {
        btnContainer.innerHTML = ''
        window.google.accounts.id.renderButton(btnContainer, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'pill',
          text: 'signin_with',
          logo_alignment: 'left'
        })
      }
    } catch (e) {
      console.warn('Google Auth render fallback:', e)
    }
  }
}

onMounted(() => {
  initGoogle()
  // Retry if script is loading asynchronously
  setTimeout(initGoogle, 1000)
  setTimeout(initGoogle, 2500)
})

function submitManualGoogleSign() {
  if (!manualName.value || !manualEmail.value) return
  const initials = manualName.value
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
  const avatarSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="%23A3123A"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="%23F5C842" font-family="sans-serif" font-size="24" font-weight="bold">${initials}</text></svg>`

  setUser({
    name: manualName.value,
    email: manualEmail.value,
    avatar: avatarSvg,
    googleId: 'g-' + Date.now()
  })
  showModal.value = false
}

function handleLogout() {
  logoutUser()
  showModal.value = false
}
</script>

<template>
  <div class="auth-bar-container">
    <!-- Logged In User Pill -->
    <div v-if="store.user" class="user-pill" @click="showModal = !showModal">
      <img v-if="store.user.avatar" :src="store.user.avatar" class="u-img" alt="Google Profile" />
      <div v-else class="u-avatar-fallback">{{ store.user.name[0] }}</div>
      <span class="u-name">{{ store.user.name.split(' ')[0] }}</span>
      <span class="u-arrow">▾</span>
    </div>

    <!-- Logged Out Sign In Button -->
    <button v-else class="g-signin-trigger" @click="showModal = true">
      <svg class="g-svg" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
      </svg>
      <span>Sign in with Google</span>
    </button>

    <!-- Modal Popup for Google OAuth & Profile Menu -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="card auth-dialog">
        <button class="close-x" @click="showModal = false">×</button>

        <template v-if="store.user">
          <div class="user-info-hdr">
            <img v-if="store.user.avatar" :src="store.user.avatar" class="lg-avatar" />
            <div>
              <h3 style="margin:0">{{ store.user.name }}</h3>
              <p class="muted" style="margin:0.2rem 0 0; font-size:0.85rem">{{ store.user.email }}</p>
            </div>
          </div>

          <div class="quick-nav-list">
            <RouterLink to="/create-event" class="q-link" @click="showModal = false">
              ✨ Create Event Link
            </RouterLink>
            <RouterLink to="/host-dashboard" class="q-link" @click="showModal = false">
              🎉 Host Dashboard (Received Funds)
            </RouterLink>
            <RouterLink to="/my-sent-gifts" class="q-link" @click="showModal = false">
              🎁 My Sent Gifts (Giver Ledger)
            </RouterLink>
          </div>

          <button class="ghost full-btn" style="border-color:var(--red); color:var(--red); margin-top:1rem" @click="handleLogout">
            Sign Out
          </button>
        </template>

        <template v-else>
          <div class="auth-title-box">
            <h3>Google Sign-In Required</h3>
            <p class="muted" style="font-size:0.88rem; margin-top:0.4rem">
              Sign in with your Google Account to create event payment links and send gifts to hosts.
            </p>
          </div>

          <!-- Official Google Identity Services Button Slot -->
          <div id="google-auth-btn-slot" class="g-btn-slot" @click="initGoogle"></div>

          <div class="or-line"><span>OR SIGN IN WITH EMAIL</span></div>

          <form class="manual-form" @submit.prevent="submitManualGoogleSign">
            <label for="m-name">Your Full Name</label>
            <input id="m-name" v-model="manualName" required placeholder="e.g. Oluwaseun Adebayo" />

            <label for="m-email">Your Google Email Address</label>
            <input id="m-email" type="email" v-model="manualEmail" required placeholder="e.g. seun@gmail.com" />

            <button type="submit" class="btn full-btn" style="margin-top:0.8rem">
              Sign In to Spraya
            </button>
          </form>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-bar-container {
  display: flex;
  align-items: center;
}
.g-signin-trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #ffffff;
  border: 1.5px solid var(--ink);
  color: #3c4043;
  border-radius: 2rem;
  padding: 0.45rem 1rem;
  font: 700 0.9rem Quicksand, sans-serif;
  cursor: pointer;
  box-shadow: 2px 2px 0 var(--ink);
  transition: transform 0.15s ease;
}
.g-signin-trigger:hover {
  transform: translateY(-1px);
}
.g-svg {
  width: 18px;
  height: 18px;
}
.user-pill {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--card);
  border: 1.5px solid var(--ink);
  border-radius: 2rem;
  padding: 0.25rem 0.75rem 0.25rem 0.35rem;
  cursor: pointer;
  box-shadow: 2px 2px 0 var(--ink);
}
.u-img {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--ink);
}
.u-avatar-fallback {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--red);
  color: var(--gold);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
}
.u-name {
  font-weight: 700;
  font-size: 0.9rem;
}
.u-arrow {
  font-size: 0.75rem;
  color: var(--muted);
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(42, 18, 8, 0.6);
  backdrop-filter: blur(3px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.auth-dialog {
  width: 100%;
  max-width: 400px;
  background: #FFFDF5;
  position: relative;
}
.close-x {
  position: absolute;
  top: 0.6rem;
  right: 0.8rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--muted);
}
.user-info-hdr {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  margin-bottom: 1.2rem;
}
.lg-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid var(--ink);
}
.quick-nav-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.q-link {
  text-decoration: none;
  color: var(--ink);
  background: var(--card);
  border: 1px solid var(--ink);
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  font-weight: 700;
}
.q-link:hover {
  background: var(--gold);
}
.auth-title-box {
  text-align: center;
  margin-bottom: 1.2rem;
}
.g-btn-slot {
  display: flex;
  justify-content: center;
  margin: 1rem 0;
  min-height: 44px;
}
.or-line {
  text-align: center;
  margin: 1rem 0;
  position: relative;
}
.or-line::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--muted);
  opacity: 0.3;
}
.or-line span {
  position: relative;
  background: #FFFDF5;
  padding: 0 0.6rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--muted);
  letter-spacing: 0.05em;
}
.manual-form {
  display: flex;
  flex-direction: column;
}
.full-btn {
  width: 100%;
  text-align: center;
}
</style>
