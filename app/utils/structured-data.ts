import type { StoreProduct } from '@medusajs/types'
import { getVariantAvailability } from '~/utils/product'
import type { ProductJsonLd, ProductOfferJsonLd } from '~/types/seo'
import type { FaqEntry, FaqPageJsonLd } from '~/types/info-page'

// schema.org Product for a product page, built only from what Medusa returns
// for the page's region: one Offer per variant that has a price there, with
// the same price (calculated_amount) and availability the page shows. Nothing
// Medusa doesn't know is added (no brand, rating or condition). Returns null
// when no variant has a price, since a Product without offers isn't eligible
// for rich results anyway.
export function buildProductJsonLd(
  product: StoreProduct,
  url: string,
): ProductJsonLd | null {
  const offers = (product.variants ?? []).flatMap<ProductOfferJsonLd>(
    (variant) => {
      const price = variant.calculated_price
      if (
        typeof price?.calculated_amount !== 'number' ||
        !price.currency_code
      ) {
        return []
      }

      return [
        {
          '@type': 'Offer',
          url,
          price: price.calculated_amount,
          priceCurrency: price.currency_code.toUpperCase(),
          availability: `https://schema.org/${getVariantAvailability(variant)}`,
          ...(variant.sku ? { sku: variant.sku } : {}),
          ...(variant.title ? { name: variant.title } : {}),
        },
      ]
    },
  )

  if (!product.title || !offers.length) return null

  const images = [
    product.thumbnail,
    ...(product.images ?? []).map((image) => image.url),
  ].filter((image): image is string => Boolean(image))

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    url,
    ...(product.description ? { description: product.description } : {}),
    ...(images.length ? { image: [...new Set(images)] } : {}),
    offers,
  }
}

// schema.org FAQPage for the FAQ page, from the questions it shows. Only a
// published page may render it (useInfoPage): a draft's answers are not
// reviewed yet. Null without questions.
export function buildFaqPageJsonLd(entries: FaqEntry[]): FaqPageJsonLd | null {
  const questions = entries.filter((entry) => entry.question && entry.answer)
  if (!questions.length) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: { '@type': 'Answer', text: entry.answer },
    })),
  }
}

// JSON-LD goes into a <script> as text, so "</script>" inside a product
// description must not end it early
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
