<script setup lang="ts">
import type { OllamaModel } from '~/types/chat'

const props = defineProps<{
  modelValue: string
  models: OllamaModel[]
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const selected = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})
</script>

<template>
  <div class="form-control w-full">
    <label class="label py-1">
      <span class="label-text text-xs opacity-60 uppercase tracking-wide">Model</span>
    </label>

    <div v-if="loading" class="skeleton h-8 w-full rounded-lg" />

    <select
      v-else
      v-model="selected"
      class="select select-sm select-bordered w-full focus:outline-none"
    >
      <option v-if="!models.length" disabled value="">No models available</option>
      <option
        v-for="m in models"
        :key="m.name"
        :value="m.name"
      >
        {{ formatModelName(m.name) }}
      </option>
    </select>
  </div>
</template>
