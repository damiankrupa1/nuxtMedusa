export default defineAppConfig({
  title: 'Fashion',
  defaultCountry: 'pl',
  defaultProductsPerPage: 12,
  // Hand-picked for the "Shop the look" home section — no Medusa concept
  // for an editorial product grouping exists, see missing-cms-content skill.
  shopTheLookProductHandles: [
    'ema-coat-pink',
    'luiza-knit-sweater-white',
    'sabina-skinny-jeans-light-wash',
  ],
  ui: {
    colors: {
      primary: 'blue',
      neutral: 'zinc',
    },
    // Square 1px box from the design; the default --ui-border-accented ring
    // disappears on the newsletter's stone background.
    checkbox: {
      slots: {
        base: 'rounded-none ring-(--ui-text-muted) text-(--color-paper)',
      },
      compoundVariants: [
        {
          color: 'neutral',
          checked: true,
          class: 'ring-1 ring-(--color-ink) bg-(--color-ink)',
        },
      ],
      defaultVariants: {
        color: 'neutral',
      },
    },
  },
})
