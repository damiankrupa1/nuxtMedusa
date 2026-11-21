<script setup lang="ts">
// A saved product Medusa no longer returns (deleted or unpublished). Its title
// is gone with it, so the card says so in neutral words and offers to drop the
// id from the list.
const { productId } = defineProps<{
  productId: string
}>()

const wishlist = useWishlist()
</script>

<template>
  <article class="flex w-full min-w-0 flex-col gap-4">
    <div
      class="flex aspect-[4/5] w-full flex-col items-center justify-center gap-3 bg-color-sand px-6 text-center"
    >
      <UIcon
        name="i-lucide-package-x"
        class="size-7 text-color-muted"
        aria-hidden="true"
      />
      <p class="text-sm leading-normal text-color-ink">
        {{ $t('pages.wishlist.unavailable.title') }}
      </p>
      <p class="text-xs leading-normal text-color-muted">
        {{ $t('pages.wishlist.unavailable.text') }}
      </p>
    </div>

    <!-- Pushed to the bottom, so the button lines up with the other cards'. -->
    <div class="mt-auto">
      <button
        type="button"
        class="flex h-12 w-full cursor-pointer items-center justify-center border border-color-line px-6 text-xs font-medium text-color-ink outline-offset-2 hover:border-color-ink focus-visible:outline-2 focus-visible:outline-(--color-ink)"
        @click="wishlist.remove(productId)"
      >
        {{ $t('pages.wishlist.item.remove') }}
      </button>
    </div>
  </article>
</template>
