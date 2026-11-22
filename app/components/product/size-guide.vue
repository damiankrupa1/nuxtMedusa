<template>
  <UModal
    :title="$t('product.sizeGuide.title')"
    :description="$t('product.sizeGuide.description')"
  >
    <button
      type="button"
      class="cursor-pointer text-[11px] leading-[1.5] text-color-muted underline underline-offset-2 outline-offset-2 hover:text-color-ink focus-visible:outline-2 focus-visible:outline-(--color-ink)"
    >
      {{ $t('product.sizeGuide.link') }}
    </button>

    <!-- The table (a #58 mock) is shared with the size guide page -->
    <template #body>
      <AppSizeTable />
    </template>
  </UModal>
</template>
