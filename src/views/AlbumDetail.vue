<script setup>
import { ref, computed } from 'vue'
import { store } from '../store'

const props = defineProps({
  id: String,
  code: String
})

const album = computed(() => {
  const param = props.code || props.id
  if (!param) return store.albums[0]
  const target = String(param).trim().toLowerCase()
  
  let match = store.albums.find(a => 
    String(a.id).trim().toLowerCase() === target || 
    (a.code && String(a.code).trim().toLowerCase() === target)
  )

  if (!match && props.code) {
    match = { id: 'alb-' + props.code, name: 'Event Shared Album', code: props.code, photos: [] }
    store.albums.push(match)
  }

  return match
})

const copied = ref(false)

function add(e) {
  if (!album.value) return
  if (!album.value.photos) album.value.photos = []
  ;[...e.target.files].forEach(f => {
    album.value.photos.unshift({ id: Math.random(), src: URL.createObjectURL(f) })
  })
}

function makeLink() {
  if (!album.value) return
  if (!album.value.code) {
    album.value.code = Math.random().toString(36).slice(2, 8)
  }
  copied.value = false
}

const origin = computed(() => (typeof window !== 'undefined' ? window.location.origin : ''))
const url = computed(() => (album.value && album.value.code ? `${origin.value}/a/${album.value.code}` : ''))

async function copy() {
  try {
    await navigator.clipboard.writeText(url.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2500)
  } catch (e) {}
}
</script>

<template>
  <section class="pg" v-if="album">
    <RouterLink to="/albums" class="ghost">← Back to albums</RouterLink>
    <h2 style="margin-top:1rem">{{ album.name || 'Untitled album' }}</h2>
    <span class="hl"></span>
    <div class="card">
      <label for="t" style="margin-top:0">Album name</label>
      <input id="t" v-model="album.name" />

      <label for="up">Add photos</label>
      <input id="up" type="file" accept="image/*" multiple @change="add" />

      <div class="photos">
        <div
          class="ph"
          v-for="p in album.photos"
          :key="p.id"
          :style="{ backgroundImage: 'url(' + p.src + ')' }"
        ></div>
      </div>
      <p v-if="!album.photos || !album.photos.length">No photos yet. Choose pictures above to add them.</p>

      <button class="btn sm" style="margin-top:1rem" @click="makeLink">
        ✨ Create share link
      </button>

      <div class="link" v-if="album.code">
        <span style="flex:1"><code>{{ url }}</code></span>
        <button class="ghost" @click="copy">{{ copied ? '✓ Copied' : '📋 Copy link' }}</button>
      </div>
    </div>
  </section>

  <section class="pg" v-else>
    <h2>Album not found</h2>
    <RouterLink class="ghost" to="/albums">Back to albums</RouterLink>
  </section>
</template>
