import { ref, computed } from "vue";
import { defineStore } from "pinia";

export const useCounterStore = defineStore("counter", () => {
  const count = ref(0);

  const doubleCount = computed(() => count.value * 2);

  function increment(): void {
    count.value++;
  }

  function decrement(): void {
    count.value--;
  }

  return { count, doubleCount, increment, decrement };
});
