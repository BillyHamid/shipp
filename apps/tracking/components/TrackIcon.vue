<script setup lang="ts">
const props = withDefaults(defineProps<{ name: string; size?: string | number }>(), { size: 20 })
const paths: Record<string, string> = {
 'phone': 'M5 3h4l2 5-3 2a14 14 0 0 0 6 6l2-3 5 2v4c0 2-3 3-5 2C8 19 4 15 3 7c-1-2 0-4 2-4Z',
 'package': 'm12 3 9 5v9l-9 5-9-5V8l9-5Zm0 10v9M3 8l9 5 9-5M7 5l10 6',
 'magnifying-glass': 'M20 20l-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z',
 'lock-key': 'M6 10h12v11H6V10Zm3 0V6a3 3 0 0 1 6 0v4m-3 4v3',
 'arrow-up-right': 'M5 19 19 5M5 5h14v14',
 'arrow-left': 'm10 5-7 7 7 7M3 12h18',
 'arrow-right': 'm14 5 7 7-7 7M3 12h18',
 'airplane-tilt': 'm3 10 7 2 2 8 3-1 1-7 6-7-2-2-7 6-7-1-3 2Z',
 'check-circle': 'm8 12 3 3 5-6M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
 'shield-check': 'm12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6l9-4Zm-5 9 4 4 6-6',
 'broadcast': 'M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14M8 8a6 6 0 0 0 0 8M16 8a6 6 0 0 1 0 8M12 11v2',
 'chat-circle-dots': 'M21 11a9 9 0 0 1-9 9H3l2-4a9 9 0 1 1 16-5ZM8 11h.1m4 0h.1m4 0h.1',
 'globe-hemisphere-west': 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM2 12h20M12 2c-7 5-7 15 0 20 7-5 7-15 0-20Z',
 'map-pin': 'M19 9c0 6-7 13-7 13S5 15 5 9a7 7 0 0 1 14 0ZM14 9a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z',
 'truck': 'M2 5h12v12H2V5Zm12 5h5l3 4v3h-8M8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm12 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z',
 'handshake': 'm2 9 5-5 5 2 5-2 5 5-5 9-5 3-6-4-4-8Zm5-5 5 2-4 5 3 2 5-4 5 5',
}
const key = computed(() => props.name.replace('ph:', '').replace(/-(bold|fill)$/, ''))
</script>
<template><svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="shrink-0"><path :d="paths[key] ?? paths.package" /></svg></template>
