<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useToast } from './composables/useToast.js'
import Toast from './components/ui/Toast.vue'

const { toast } = useToast()
</script>

<template>
  <RouterView />
  <Toast v-if="toast" :type="toast.type" :message="toast.message" />
</template>
