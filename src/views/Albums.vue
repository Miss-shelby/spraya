<script setup>
import {ref} from 'vue'
import {useRouter} from 'vue-router'
import {store} from '../store'
const name=ref(''),router=useRouter()
function create(){const n=name.value.trim();if(!n)return;const id=Date.now();store.albums.push({id,name:n,code:'',photos:[]});name.value='';router.push('/albums/'+id)}
</script>
<template>
<section class="pg">
 <h2>Albums</h2><span class="hl"></span>
 <form class="card" @submit.prevent="create" style="margin-bottom:2rem">
  <label for="an" style="margin-top:0">Name your new album</label>
  <div class="row"><input id="an" v-model="name" placeholder="e.g. Seun and Bimpe's Wedding"><button class="btn sm">Create album</button></div>
 </form>
 <div class="grid3">
  <RouterLink class="card" v-for="a in store.albums" :key="a.id" :to="'/albums/'+a.id" style="text-decoration:none"><h3>{{a.name}}</h3><p>{{a.photos.length}} photos this session</p></RouterLink>
 </div>
</section>
</template>
