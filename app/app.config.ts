export default defineAppConfig({
  title: 'Fashion',
  defaultCountry: 'pl',
  defaultProductsPerPage: 12,
  ui: {
    colors: {
      primary: 'blue',
      neutral: 'zinc',
    },
    // The theme's text-(--ui-error) is the 500 shade, ~3.6:1 on --color-paper;
    // 600 reaches WCAG AA (4.5:1) for small error text.
    formField: {
      slots: {
        error: 'text-error-600',
      },
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
