<script lang="ts" setup>
// TODO: no about/studio/journal/careers pages exist in this codebase —
// fully mocked links, see missing-cms-content skill. "Journal" points at
// the home page's journal section anchor once that section ships.
</script>

<template>
  <div class="flex flex-col gap-y-5">
    <p class="text-[10px] text-color-paper">
      {{ $t('app.footer.world.heading') }}
    </p>
    <ul class="flex flex-col gap-y-5 text-xs text-color-sage">
      <li>
        <AppLink to="/store">{{ $t('app.footer.world.about') }}</AppLink>
      </li>
      <li>
        <AppLink to="/store">{{ $t('app.footer.world.studio') }}</AppLink>
      </li>
      <li>
        <AppLink to="/#journal">{{ $t('app.footer.world.journal') }}</AppLink>
      </li>
      <li>
        <AppLink to="/store">{{ $t('app.footer.world.materials') }}</AppLink>
      </li>
      <li>
        <AppLink to="/store">{{ $t('app.footer.world.careers') }}</AppLink>
      </li>
    </ul>
  </div>
</template>
