<script setup lang="ts">
import questionMark from '../assets/question_mark.webp'
</script>

<template>
  <header class="header">
    <img class="header__img header__img--left" :src="questionMark" alt="" height="100" />
    <div>
      <h1 class="header__title">QuizMaster2000</h1>
      <p class="header__tagline">Be a master!<br />Don't make a disaster!</p>
    </div>
    <img class="header__img header__img--right" :src="questionMark" alt="" height="100" />
  </header>
</template>

<style scoped>
.header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 130px;
  padding: var(--space-3) 0;
  background: var(--blue-500);
  color: var(--white);
  text-align: center;
}

.header__title {
  margin: 0;
  font-size: 2.2rem;
  line-height: 1.2;
}

/* ≥ 19px bold counts as "large text" (3:1 contrast needed); white on this blue is 3.4:1. */
.header__tagline {
  margin: var(--space-1) 0 0;
  font-size: 1.2rem;
  font-weight: 700;
}

.header__img {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}

.header__img--left {
  left: 20px;
}

.header__img--right {
  right: 20px;
}

@media (max-width: 768px) {
  .header__img {
    display: none;
  }
}
</style>
