<script setup lang="ts">
import type { Fact } from '~/types'

// The pen circles the amount
withDefaults(
  defineProps<{
    price?: string | null
    period?: string
    lede?: string
    facts?: Fact[]
  }>(),
  { price: null, period: undefined, lede: undefined, facts: () => [] },
)
</script>

<template>
  <div class="l-price">
    <p class="l-amount">
      <span data-anchor="price"
        ><Fill
          :value="price"
          name="price.price"
          :size="2" /></span
      ><small v-if="period != null"
        >/<Fill
          :value="period"
          name="price.period"
          :size="6"
      /></small>
    </p>
    <div>
      <p
        v-if="lede != null"
        class="l-copy"
      >
        <Fill
          v-if="!isFilled(lede)"
          name="price.lede"
          :size="24"
        />
        <RichText
          v-else
          :text="lede"
        />
      </p>
      <dl
        v-if="facts.length"
        class="l-facts"
      >
        <div
          v-for="(fact, index) in facts"
          :key="index"
        >
          <dt>
            <Fill
              :value="fact.label"
              :name="`price.facts.${index}.label`"
              :size="6"
            />
          </dt>
          <dd>
            <Fill
              :value="fact.value"
              :name="`price.facts.${index}.value`"
              :size="8"
            />
          </dd>
        </div>
      </dl>
    </div>
  </div>
</template>
