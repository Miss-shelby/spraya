import { reactive, watch } from 'vue'

const KEY = 'spraya-clean-app-v1'

const seed = {
  user: null,
  events: [],
  ledger: [],
  albums: []
}

let saved = null
try {
  saved = JSON.parse(localStorage.getItem(KEY))
} catch (e) {
  saved = null
}

export const store = reactive(saved || seed)

watch(
  store,
  () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(store))
    } catch (e) {}
  },
  { deep: true }
)

export const fmt = n => '₦' + Math.round(n || 0).toLocaleString('en-NG')

export const fmtWords = n => {
  if (!n || isNaN(n)) return ''
  const num = Number(n)
  if (num >= 1_000_000_000) return `(${(num / 1_000_000_000).toFixed(2)} Billion Naira)`
  if (num >= 1_000_000) return `(${(num / 1_000_000).toFixed(2)} Million Naira)`
  if (num >= 1_000) return `(${(num / 1_000).toFixed(0)} Thousand Naira)`
  return ''
}

export const fdate = s => {
  if (!s) return ''
  const d = new Date(s)
  return isNaN(d) ? s : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const ftime = s => {
  if (!s) return ''
  const d = new Date(s)
  return isNaN(d) ? s : d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function setUser(userData) {
  store.user = userData
}

export function logoutUser() {
  store.user = null
}

export function createEvent(data) {
  const id = 'ev-' + Date.now()
  const hostEmail = (data.hostEmail || (store.user ? store.user.email : 'host@example.com')).trim().toLowerCase()
  const creatorEmail = (store.user ? store.user.email : hostEmail).trim().toLowerCase()
  const hostName = data.host || (store.user ? store.user.name : 'Event Host')

  const newEvent = {
    id,
    name: data.name || data.title,
    host: hostName,
    hostEmail: hostEmail,
    creatorEmail: creatorEmail,
    bankName: data.bankName || 'GTBank',
    accountNumber: data.accountNumber || '',
    accountName: data.accountName || hostName,
    date: data.date || new Date().toISOString(),
    category: data.category || 'Wedding',
    description: data.description || '',
    targetAmount: Number(data.targetAmount) || 0,
    createdAt: new Date().toISOString()
  }

  store.events.unshift(newEvent)
  return newEvent
}

export function deleteEvent(eventId) {
  if (!eventId) return
  const targetId = String(eventId).trim().toLowerCase()
  const idx = store.events.findIndex(e => String(e.id).trim().toLowerCase() === targetId)
  if (idx !== -1) {
    store.events.splice(idx, 1)
  }
  store.ledger = store.ledger.filter(l => String(l.eventId).trim().toLowerCase() !== targetId)
}

export function getEventById(id) {
  if (!id) return undefined
  const targetId = String(id).trim().toLowerCase()
  return store.events.find(e => e && String(e.id).trim().toLowerCase() === targetId)
}

export function getEventTotalReceived(eventId) {
  return store.ledger
    .filter(r => String(r.eventId) === String(eventId) && r.dir === 'received')
    .reduce((sum, r) => sum + (r.amount || 0), 0)
}

export function getHostEvents(email) {
  if (!email) return store.events
  const lower = email.trim().toLowerCase()
  return store.events.filter(e => 
    (e.hostEmail && e.hostEmail.trim().toLowerCase() === lower) ||
    (e.creatorEmail && e.creatorEmail.trim().toLowerCase() === lower)
  )
}

export function getHostLedger(email) {
  if (!email) return store.ledger.filter(r => r.dir === 'received')
  const lower = email.trim().toLowerCase()
  const hostEvents = getHostEvents(lower)
  const hostEventIds = new Set(hostEvents.map(e => String(e.id).toLowerCase()))

  return store.ledger.filter(r => 
    r.dir === 'received' && (
      (r.hostEmail && r.hostEmail.trim().toLowerCase() === lower) ||
      (r.eventId && hostEventIds.has(String(r.eventId).toLowerCase()))
    )
  )
}

export function getSentLedger(email) {
  if (!email) return store.ledger.filter(r => r.dir === 'sent')
  const lower = email.trim().toLowerCase()
  return store.ledger.filter(r => 
    r.dir === 'sent' && 
    r.personEmail && 
    r.personEmail.trim().toLowerCase() === lower
  )
}

export function recordGiftPayment({ event, amount, person, personEmail, ref, message = '' }) {
  const timestamp = new Date().toISOString()
  const baseId = 'led-' + Date.now()

  // 1. Host Received Entry
  const hostEntry = {
    id: baseId + '-rec',
    at: timestamp,
    dir: 'received',
    person: person || 'Guest Giver',
    personEmail: (personEmail || '').trim().toLowerCase(),
    event: event.name || event.title,
    eventId: event.id,
    amount: Number(amount),
    ref: ref || 'SPR-' + Math.floor(1000 + Math.random() * 9000),
    status: 'Paid',
    message: message || '',
    paymentMethod: 'Paystack Gateway',
    hostEmail: (event.hostEmail || '').trim().toLowerCase()
  }

  store.ledger.unshift(hostEntry)

  // 2. Giver Sent Entry
  const giverEntry = {
    id: baseId + '-sent',
    at: timestamp,
    dir: 'sent',
    person: event.host || 'Event Host',
    personEmail: (personEmail || '').trim().toLowerCase(),
    event: event.name || event.title,
    eventId: event.id,
    amount: Number(amount),
    ref: ref || 'SPR-' + Math.floor(1000 + Math.random() * 9000),
    status: 'Paid',
    message: message || '',
    paymentMethod: 'Paystack Gateway',
    hostEmail: (event.hostEmail || '').trim().toLowerCase()
  }

  store.ledger.unshift(giverEntry)

  return hostEntry
}
