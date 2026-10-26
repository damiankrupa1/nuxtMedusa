import type { StoreProduct } from '@medusajs/types'
import { getVariantAvailability } from '~/utils/product'
import type { ProductJsonLd, ProductOfferJsonLd } from '~/types/seo'

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

// JSON-LD goes into a <script> as text, so "</script>" inside a product
// description must not end it early
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
