---
name: frontend-performance-seo
description: Improve Nuxt storefront performance, Core Web Vitals, rendering behavior, and technical SEO. Use when changing images, data fetching, rendering, metadata, routing, or page performance.
---

# Frontend Performance and SEO

## Measure before optimizing

- Identify the user-visible problem and available measurements first.
- Inspect the current rendering/data-fetching path and existing Nuxt configuration.
- Avoid speculative optimization or adding dependencies without evidence.
- Run Lighthouse/PageSpeed or browser profiling only when available and relevant; do not claim a score without a real measurement.

## Performance

- Preserve SSR and avoid hydration mismatches.
- Prevent duplicate API calls and unnecessary reactive work.
- Use responsive image sizing, appropriate formats, and lazy loading for below-the-fold images; avoid lazy-loading the main LCP image when that harms loading.
- Reserve image/media dimensions to reduce layout shift.
- Keep client JavaScript lean; avoid shipping large libraries for small tasks.
- Use caching/revalidation only when data freshness and personalization requirements are understood.
- Consider loading, error, and empty states without causing layout instability.

## Technical SEO

- Use unique, accurate page titles and descriptions.
- Follow the project's canonical URL, localized route, and hreflang conventions.
- Ensure indexable product/category pages have meaningful server-rendered content where appropriate.
- Verify robots, sitemap, canonical, and structured data against the actual route model before changing them.
- Do not generate duplicate metadata or invent product facts, prices, ratings, or availability.

## Verification

- Focus on the changed route and metric.
- Distinguish source-level reasoning from measured results.
- Avoid running a full Lighthouse audit for every small styling or copy edit.
