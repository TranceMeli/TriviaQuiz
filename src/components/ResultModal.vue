<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { MissedQuestion } from '../types'

const PREVIEW_COUNT = 2

const props = defineProps<{
  open: boolean
  score: number
  total: number
  missed: MissedQuestion[]
}>()

const emit = defineEmits<{
  /** New quiz with the same settings. */
  again: []
  /** Back to the settings form. */
  change: []
}>()

const dialog = ref<HTMLDialogElement | null>(null)
const expanded = ref(false)

const percent = computed(() => (props.total === 0 ? 0 : Math.round((props.score / props.total) * 100)))
const visibleMissed = computed(() => (expanded.value ? props.missed : props.missed.slice(0, PREVIEW_COUNT)))
const hiddenCount = computed(() => props.missed.length - PREVIEW_COUNT)

function sync() {
  const element = dialog.value
  if (!element) return
  if (props.open && !element.open) {
    expanded.value = false
    element.showModal()
  } else if (!props.open && element.open) {
    element.close()
  }
}

// Esc closes the dialog natively while `open` is still true – treat that as "change settings".
// Closing because `open` turned false (e.g. "play again") must not emit anything.
function onClose() {
  if (props.open) emit('change')
}

onMounted(sync)
watch(() => props.open, sync)
</script>

<template>
  <!-- Native <dialog>: focus trap, Esc to close and focus restore come for free. -->
  <dialog ref="dialog" class="modal" aria-labelledby="result-title" @close="onClose">
    <h2 id="result-title" class="modal__title">🎉 Quiz finished!</h2>

    <p class="modal__score">
      <span class="modal__points">{{ score }}</span> / {{ total }}
      <span class="modal__percent">{{ percent }}% correct</span>
    </p>

    <p v-if="missed.length === 0" class="modal__perfect">Perfect score – you didn't miss a single question.</p>

    <section v-else class="review" aria-labelledby="review-title">
      <h3 id="review-title" class="review__title">Review {{ missed.length }} missed {{ missed.length === 1 ? 'question' : 'questions' }}</h3>
      <ul class="review__list">
        <li v-for="item in visibleMissed" :key="item.question.text" class="review__item">
          <p class="review__question">{{ item.question.text }}</p>
          <p class="review__answer review__answer--correct"><span>✔ Correct:</span> {{ item.question.correctAnswer }}</p>
          <p class="review__answer review__answer--wrong"><span>✘ Your answer:</span> {{ item.givenAnswer }}</p>
        </li>
      </ul>
      <button v-if="hiddenCount > 0" type="button" class="btn btn--link" :aria-expanded="expanded" @click="expanded = !expanded">
        {{ expanded ? 'Show fewer' : `Show all ${missed.length}` }}
      </button>
    </section>

    <div class="modal__actions">
      <button type="button" class="btn btn--success btn--block" @click="emit('again')">Play again with same settings</button>
      <button type="button" class="btn btn--link" @click="emit('change')">Change settings</button>
    </div>
  </dialog>
</template>

<style scoped>
.modal {
  width: 90%;
  max-width: 440px;
  max-height: 90vh;
  padding: 20px;
  border: 5px solid var(--blue-500);
  border-radius: var(--radius-lg);
  background: var(--blue-100);
  color: var(--text);
  text-align: center;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal::backdrop {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(3px);
}

.modal__title {
  margin: 0;
  font-size: 1.8rem;
}

.modal__score {
  margin: var(--space-2) 0 var(--space-3);
  font-size: 1.4rem;
  font-weight: 700;
}

.modal__points {
  color: var(--red-700);
  font-size: 3rem;
  line-height: 1.2;
}

.modal__percent {
  margin-left: var(--space-2);
  color: var(--text-muted);
  font-size: 1rem;
  font-weight: 400;
}

.modal__perfect {
  margin: 0 0 var(--space-3);
  font-size: 1.1rem;
}

.review {
  margin-bottom: var(--space-3);
  text-align: left;
}

.review__title {
  margin: 0 0 var(--space-2);
  font-size: 1.1rem;
}

.review__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.review__item {
  margin-bottom: var(--space-2);
  padding: 10px 12px;
  border: 1px solid var(--blue-300);
  border-radius: var(--radius-md);
  background: var(--white);
}

.review__question {
  margin: 0 0 var(--space-1);
  font-weight: 700;
}

.review__answer {
  margin: 0;
}

.review__answer span {
  font-weight: 700;
}

.review__answer--correct span {
  color: var(--green-700);
}

.review__answer--wrong span {
  color: var(--red-700);
}

.modal__actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
}
</style>
