<script setup lang="ts">
import { computed, onMounted } from 'vue'
import AppHeader from './components/AppHeader.vue'
import QuizQuestion from './components/QuizQuestion.vue'
import QuizSetup from './components/QuizSetup.vue'
import ResultModal from './components/ResultModal.vue'
import { useQuiz } from './composables/useQuiz'

const quiz = useQuiz()

const showQuiz = computed(() => quiz.phase.value === 'playing' || quiz.phase.value === 'finished')

onMounted(quiz.loadCategories)

function abortQuiz() {
  if (window.confirm('Leave this quiz? Your current score will be lost.')) quiz.backToSetup()
}
</script>

<template>
  <div class="page">
    <AppHeader />

    <main class="page__main">
      <QuizSetup
        v-if="!showQuiz"
        :categories="quiz.categories.value"
        :categories-status="quiz.categoriesStatus.value"
        :initial="quiz.settings.value"
        :loading="quiz.phase.value === 'loading'"
        :error="quiz.error.value"
        @start="quiz.start"
        @retry-categories="quiz.loadCategories"
      />

      <QuizQuestion
        v-else-if="quiz.current.value"
        :question="quiz.current.value"
        :index="quiz.index.value"
        :total="quiz.total.value"
        :score="quiz.score.value"
        :selected="quiz.selected.value"
        :checked="quiz.checked.value"
        :is-correct="quiz.isCorrect.value"
        :is-last="quiz.isLastQuestion.value"
        :selection-missing="quiz.selectionMissing.value"
        @select="quiz.select"
        @check="quiz.check"
        @next="quiz.next"
        @abort="abortQuiz"
      />

      <ResultModal
        :open="quiz.phase.value === 'finished'"
        :score="quiz.score.value"
        :total="quiz.total.value"
        :missed="quiz.missed.value"
        @again="quiz.playAgain"
        @change="quiz.backToSetup"
      />
    </main>

    <footer class="page__footer">
      Questions provided by <a href="https://opentdb.com/">Open Trivia DB</a>
    </footer>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
}

.page__main {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page__footer {
  width: 100%;
  margin-top: auto;
  padding: var(--space-2);
  background: var(--blue-700);
  color: var(--white);
  text-align: center;
}

.page__footer a {
  color: var(--white);
  font-weight: 700;
}

.page__footer a:focus-visible {
  outline-color: var(--white);
}
</style>
