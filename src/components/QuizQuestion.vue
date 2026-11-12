<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Question } from '../types'

const props = defineProps<{
  question: Question
  index: number
  total: number
  score: number
  selected: string | null
  checked: boolean
  isCorrect: boolean
  isLast: boolean
  selectionMissing: boolean
}>()

const emit = defineEmits<{
  select: [answer: string]
  check: []
  next: []
  abort: []
}>()

const form = ref<HTMLFormElement | null>(null)
const nextButton = ref<HTMLButtonElement | null>(null)

const feedback = computed(() => {
  if (!props.checked) return ''
  return props.isCorrect
    ? '✅ Correct!'
    : `❌ Not quite. The correct answer is “${props.question.correctAnswer}”.`
})

function optionState(option: string) {
  if (!props.checked) return props.selected === option ? 'selected' : null
  if (option === props.question.correctAnswer) return 'correct'
  if (option === props.selected) return 'incorrect'
  return null
}

function stateLabel(option: string) {
  const state = optionState(option)
  if (state === 'correct') return '✅ Correct answer'
  if (state === 'incorrect') return '❌ Your answer'
  return ''
}

function focusFirstOption() {
  form.value?.querySelector<HTMLInputElement>('input[type="radio"]')?.focus()
}

// Keyboard shortcut: digits pick the matching option (Enter on the form checks the answer).
function onKeydown(event: KeyboardEvent) {
  if (props.checked || event.ctrlKey || event.metaKey || event.altKey) return
  const option = props.question.options[Number(event.key) - 1]
  if (option !== undefined) {
    emit('select', option)
    form.value?.querySelectorAll<HTMLInputElement>('input[type="radio"]')[Number(event.key) - 1]?.focus()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  focusFirstOption()
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

// Keep keyboard / screen-reader focus where the next action is.
watch(
  () => props.question,
  () => nextTick(focusFirstOption),
)
watch(
  () => props.checked,
  (checked) => {
    if (checked) nextTick(() => nextButton.value?.focus())
  },
)
</script>

<template>
  <section class="quiz" aria-label="Quiz">
    <div class="quiz__top">
      <button type="button" class="btn btn--link" @click="emit('abort')">← Back to settings</button>
      <p class="quiz__stats">
        <span class="badge" :aria-label="`Question ${index + 1} of ${total}`">Question {{ index + 1 }} / {{ total }}</span>
        <span class="badge" :aria-label="`Score ${score}`">Score {{ score }}</span>
      </p>
    </div>

    <progress class="quiz__progress" :value="index + (checked ? 1 : 0)" :max="total" aria-label="Quiz progress" />

    <form ref="form" class="quiz__form" novalidate @submit.prevent="checked ? emit('next') : emit('check')">
      <fieldset class="quiz__fieldset">
        <legend class="quiz__question">
          {{ question.text }}
          <span class="quiz__category">Category: {{ question.category }}</span>
        </legend>

        <label
          v-for="(option, i) in question.options"
          :key="option"
          class="option"
          :class="optionState(option) && `option--${optionState(option)}`"
        >
          <input
            class="sr-only"
            type="radio"
            name="answer"
            :value="option"
            :checked="selected === option"
            :disabled="checked"
            @change="emit('select', option)"
          />
          <span class="option__marker" aria-hidden="true" />
          <span class="option__text">{{ i + 1 }}. {{ option }}</span>
          <span v-if="stateLabel(option)" class="option__state">{{ stateLabel(option) }}</span>
        </label>
      </fieldset>

      <p class="quiz__feedback" :class="{ 'quiz__feedback--error': selectionMissing }" role="status" aria-live="polite">
        <template v-if="selectionMissing">Please select an option!</template>
        <template v-else>{{ feedback }}</template>
      </p>

      <button v-if="!checked" type="submit" class="btn btn--block">Check Answer</button>
      <button v-else ref="nextButton" type="submit" class="btn btn--success btn--block">
        {{ isLast ? 'Show result' : 'Next question' }}
      </button>

      <p v-if="!checked" class="quiz__hint">Tip: press 1–{{ question.options.length }} to choose an answer and Enter to check it.</p>
    </form>
  </section>
</template>

<style scoped>
.quiz {
  width: 90%;
  max-width: 600px;
  margin: var(--space-4) auto;
  padding: var(--space-3);
  border: 5px solid var(--blue-500);
  border-radius: var(--radius-lg);
  background: var(--blue-100);
}

.quiz__top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.quiz__stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: 0;
}

.badge {
  padding: 2px 10px;
  border-radius: var(--radius-md);
  background: var(--red-700);
  color: var(--white);
  font-size: 1.1rem;
  font-weight: 700;
}

.quiz__progress {
  display: block;
  width: 100%;
  height: 10px;
  margin: var(--space-2) 0 var(--space-3);
  accent-color: var(--blue-700);
}

.quiz__fieldset {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: none;
}

.quiz__question {
  float: left;
  width: 100%;
  margin: 0 0 var(--space-3);
  padding: 12px;
  border: 2px solid var(--blue-300);
  border-radius: var(--radius-md);
  background: var(--blue-200);
  font-size: 1.3rem;
  font-weight: 700;
  line-height: 1.35;
}

.quiz__question + * {
  clear: both;
}

.quiz__category {
  display: block;
  margin-top: var(--space-2);
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 400;
}

.option {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  min-height: var(--touch-target);
  margin: var(--space-2) 0;
  padding: 12px;
  border: 2px solid var(--blue-900);
  border-radius: var(--radius-md);
  background: var(--blue-700);
  color: var(--white);
  font-size: 1.05rem;
  cursor: pointer;
  transition: background-color 0.1s;
}

.option:hover {
  background: var(--blue-900);
}

.option:has(input:focus-visible) {
  outline: 3px solid var(--text);
  outline-offset: 2px;
}

.option__marker {
  flex: none;
  width: 1.1rem;
  height: 1.1rem;
  border: 2px solid currentColor;
  border-radius: 50%;
}

.option__text {
  flex: 1;
}

.option__state {
  font-size: 0.9rem;
  font-weight: 700;
}

/* "selected" must not rely on colour alone: dark text + filled marker. */
.option--selected {
  background: var(--blue-400);
  color: var(--text);
}

.option--selected:hover {
  background: var(--blue-400);
}

.option--selected .option__marker {
  background: radial-gradient(currentColor 45%, transparent 50%);
}

.option--correct,
.option--correct:hover {
  border-color: var(--green-800);
  background: var(--green-700);
}

.option--incorrect,
.option--incorrect:hover {
  border-color: var(--red-800);
  background: var(--red-700);
}

.option:has(input:disabled) {
  cursor: default;
}

.quiz__feedback {
  min-height: 1.5em;
  margin: var(--space-2) 0;
  font-size: 1.2rem;
  font-weight: 700;
  text-align: center;
}

.quiz__feedback--error {
  color: var(--red-700);
}

.quiz__hint {
  margin: var(--space-2) 0 0;
  color: var(--text-muted);
  font-size: 0.9rem;
  text-align: center;
}

@media (max-width: 480px) {
  .quiz {
    width: 100%;
    margin-block: 0;
    border-inline: none;
    border-radius: 0;
  }
}
</style>
