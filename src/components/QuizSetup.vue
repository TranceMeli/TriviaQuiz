<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { AMOUNT_PRESETS, DIFFICULTIES, MAX_QUESTIONS, MIN_QUESTIONS } from '../constants'
import type { CategoriesStatus, Category, Difficulty, QuizSettings } from '../types'
import { DEFAULT_SETTINGS } from '../utils/storage'

const props = defineProps<{
  categories: Category[]
  categoriesStatus: CategoriesStatus
  /** Pre-fills the form (the settings of the last quiz). */
  initial: QuizSettings
  loading: boolean
  error: string | null
}>()

const emit = defineEmits<{
  start: [settings: QuizSettings]
  retryCategories: []
}>()

const amount = ref<number | ''>(props.initial.amount)
const category = ref(props.initial.category === null ? '' : String(props.initial.category))
const difficulty = ref<Difficulty | ''>(props.initial.difficulty ?? '')
const touched = ref(false)

const remembered = computed(
  () =>
    props.initial.amount !== DEFAULT_SETTINGS.amount ||
    props.initial.category !== DEFAULT_SETTINGS.category ||
    props.initial.difficulty !== DEFAULT_SETTINGS.difficulty,
)

const amountValid = computed(
  () => typeof amount.value === 'number' && Number.isInteger(amount.value) && amount.value >= MIN_QUESTIONS && amount.value <= MAX_QUESTIONS,
)
const showAmountError = computed(() => touched.value && !amountValid.value)

// A remembered category may no longer exist once the list has loaded.
watch(
  () => props.categories,
  (list) => {
    if (category.value !== '' && !list.some((item) => String(item.id) === category.value)) category.value = ''
  },
)

function label(level: string) {
  return level.charAt(0).toUpperCase() + level.slice(1)
}

function submit() {
  touched.value = true
  if (!amountValid.value || props.loading) return
  emit('start', {
    amount: amount.value as number,
    category: category.value === '' ? null : Number(category.value),
    difficulty: difficulty.value === '' ? null : difficulty.value,
  })
}
</script>

<template>
  <form class="setup" novalidate :aria-busy="loading" aria-labelledby="setup-title" @submit.prevent="submit">
    <h2 id="setup-title" class="setup__title">Choose your quiz</h2>

    <div class="field">
      <label for="select-number">Questions</label>
      <div class="setup__amount">
        <input
          id="select-number"
          v-model.number="amount"
          class="control control--number"
          type="number"
          inputmode="numeric"
          step="1"
          :min="MIN_QUESTIONS"
          :max="MAX_QUESTIONS"
          :disabled="loading"
          :aria-invalid="showAmountError"
          :aria-describedby="showAmountError ? 'amount-error' : undefined"
          @blur="touched = true"
        />
        <div class="chips" role="group" aria-label="Quick picks">
          <button
            v-for="preset in AMOUNT_PRESETS"
            :key="preset.amount"
            type="button"
            class="chip"
            :aria-pressed="amount === preset.amount"
            :disabled="loading"
            @click="amount = preset.amount"
          >
            {{ preset.label }} · {{ preset.amount }}
          </button>
        </div>
      </div>
    </div>

    <div class="setup__row">
      <div class="field">
        <label for="select-category">Category</label>
        <select id="select-category" v-model="category" class="control" :disabled="loading || categoriesStatus === 'loading'">
          <option value="">{{ categoriesStatus === 'loading' ? 'Loading categories…' : 'Any' }}</option>
          <option v-for="item in categories" :key="item.id" :value="String(item.id)">{{ item.name }}</option>
        </select>
      </div>

      <div class="field">
        <label for="select-difficulty">Difficulty</label>
        <select id="select-difficulty" v-model="difficulty" class="control" :disabled="loading">
          <option value="">Any</option>
          <option v-for="level in DIFFICULTIES" :key="level" :value="level">{{ label(level) }}</option>
        </select>
      </div>
    </div>

    <p v-if="remembered" class="hint">Pre-filled with your last settings.</p>

    <p v-if="showAmountError" id="amount-error" class="message message--error" role="alert">
      Please enter a whole number between {{ MIN_QUESTIONS }} and {{ MAX_QUESTIONS }}.
    </p>

    <p v-if="error" class="message message--error" role="alert">{{ error }}</p>

    <p v-if="categoriesStatus === 'error'" class="message" role="status">
      The categories could not be loaded – you can still play with any category.
      <button type="button" class="btn btn--link" @click="emit('retryCategories')">Try again</button>
    </p>

    <button type="submit" class="btn btn--danger btn--block setup__start" :disabled="loading">
      {{ loading ? 'Loading questions…' : 'Start quiz' }}
    </button>
  </form>
</template>

<style scoped>
.setup {
  width: 90%;
  max-width: 460px;
  margin: var(--space-4) auto;
  padding: var(--space-3) var(--space-4) var(--space-4);
  border: 5px solid var(--blue-500);
  border-radius: var(--radius-lg);
  background: var(--blue-100);
}

.setup__title {
  margin: 0 0 var(--space-3);
  font-size: 1.4rem;
}

.field {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: var(--space-3);
}

.setup__row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.setup__row .field,
.setup__row .control {
  width: 100%;
  min-width: 0;
}

.setup__amount {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

label {
  margin-bottom: var(--space-1);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  background: var(--blue-700);
  color: var(--white);
  font-size: 1rem;
  font-weight: 700;
}

.control {
  min-height: var(--touch-target);
  padding: 0 var(--space-2);
  border: 1px solid rgb(97, 97, 97);
  border-radius: var(--radius-sm);
  background: var(--white);
  color: var(--text);
  font-size: 1.1rem;
}

.control--number {
  width: 84px;
}

.control[aria-invalid='true'] {
  border: 2px solid var(--red-700);
}

.control:disabled {
  background: rgb(235, 235, 235);
  color: var(--text-muted);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.chip {
  min-height: var(--touch-target);
  padding: 0 14px;
  border: 1px solid var(--blue-700);
  border-radius: 999px;
  background: var(--white);
  color: var(--blue-900);
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.15s;
}

.chip:hover:not(:disabled) {
  background: var(--blue-200);
}

/* Selected = filled + bold, so it does not rely on colour alone. */
.chip[aria-pressed='true'] {
  background: var(--blue-700);
  color: var(--white);
  font-weight: 700;
}

.chip:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.hint {
  margin: 0 0 var(--space-3);
  color: var(--text-muted);
  font-size: 1rem;
}

.message {
  margin: 0 0 var(--space-3);
  color: var(--text-muted);
}

.message--error {
  color: var(--red-700);
  font-size: 1.1rem;
  font-weight: 700;
}

.setup__start {
  font-size: 1.2rem;
}

@media (max-width: 480px) {
  .setup {
    width: 100%;
    margin-block: 0;
    border-inline: none;
    border-radius: 0;
  }

  .setup__row {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
