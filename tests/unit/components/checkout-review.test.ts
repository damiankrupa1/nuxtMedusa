import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { flushPromises, mount } from '@vue/test-utils'
import { loadStripe } from '@stripe/stripe-js'
import type { Stripe } from '@stripe/stripe-js'
import { nextTick, ref } from 'vue'

import CheckoutReview from '../../../app/components/checkout/review/index.vue'
import { useCartPayment } from '../../../app/composables/payment'

jest.mock('@stripe/stripe-js', () => ({ loadStripe: jest.fn() }))

// Runs the real payment composable, service and repositories; only Stripe.js
// and Nuxt's auto-imports are mocked.
describe('checkout review component', () => {
  const asyncMock = () => jest.fn<(...args: unknown[]) => Promise<unknown>>()

  const card = { mount: jest.fn(), on: jest.fn(), destroy: jest.fn() }
  const stripe = {
    elements: jest.fn(() => ({ create: jest.fn(() => card) })),
    confirmCardPayment: asyncMock(),
    confirmBlikPayment: asyncMock(),
    confirmP24Payment: asyncMock(),
    retrievePaymentIntent: asyncMock(),
  }

  const cartResponse = ref<{ cart: unknown }>()
  const route = { query: {} as Record<string, string> }
  const replace = asyncMock()
  const placeOrder = jest.fn(async () => {})

  Object.assign(globalThis, {
    useCartPayment,
    useMedusaClient: () => ({}),
    useNuxtData: () => ({ data: cartResponse }),
    useRuntimeConfig: () => ({ public: { stripeKey: 'pk_test' } }),
    useI18n: () => ({ t: (key: string) => key }),
    useRoute: () => route,
    useRouter: () => ({ replace }),
    usePlaceOrder: () => ({ mutate: placeOrder, loading: ref(false) }),
  })

  const stubs = {
    UButton: {
      props: ['disabled', 'loading'],
      emits: ['click'],
      template:
        '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
    },
    UAlert: {
      props: ['title', 'description'],
      template: '<div class="alert">{{ description }}</div>',
    },
    AppInput: {
      props: ['modelValue'],
      emits: ['update:modelValue'],
      template:
        '<input class="blik-code" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    },
  }
  const mocks = { $t: (key: string) => key }

  const stripeData = { id: 'pi_1', client_secret: 'pi_1_secret' }
  const p24Return = {
    step: 'review',
    payment_intent: 'pi_1',
    payment_intent_client_secret: 'pi_1_secret',
    redirect_status: 'succeeded',
  }

  // Mounts the step for a cart ready to be paid with the given provider and
  // waits for Stripe to load.
  const mountReview = async (
    providerId: string,
    {
      query = { step: 'review' },
      data = stripeData,
    }: { query?: Record<string, string>; data?: Record<string, unknown> } = {},
  ) => {
    cartResponse.value = {
      cart: {
        email: 'jan@example.com',
        shipping_address: { first_name: 'Jan' },
        billing_address: { first_name: 'Jan', city: 'Kraków' },
        shipping_methods: [{ id: 'sm_1' }],
        payment_collection: {
          payment_sessions: [
            { status: 'pending', provider_id: providerId, data },
          ],
        },
      },
    }
    route.query = query

    const wrapper = mount(CheckoutReview, { global: { stubs, mocks } })
    await flushPromises()
    return wrapper
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(loadStripe).mockResolvedValue(stripe as unknown as Stripe)
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('pays by card before placing the order', async () => {
    stripe.confirmCardPayment.mockResolvedValue({
      paymentIntent: { status: 'requires_capture' },
    })
    const wrapper = await mountReview('pp_stripe_stripe')

    expect(card.mount).toHaveBeenCalledWith(expect.any(HTMLElement))
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()

    const onCardChange = card.on.mock.calls[0]?.[1] as (event: {
      complete: boolean
    }) => void
    onCardChange({ complete: true })
    await nextTick()
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(stripe.confirmCardPayment).toHaveBeenCalledWith('pi_1_secret', {
      payment_method: {
        card,
        billing_details: expect.objectContaining({ email: 'jan@example.com' }),
      },
    })
    expect(placeOrder).toHaveBeenCalledTimes(1)
  })

  it('blocks paying while the card details are invalid', async () => {
    const wrapper = await mountReview('pp_stripe_stripe')
    const onCardChange = card.on.mock.calls[0]?.[1] as (event: {
      complete: boolean
      error?: { message: string }
    }) => void

    onCardChange({
      complete: false,
      error: { message: 'Numer karty jest nieprawidłowy' },
    })
    await nextTick()
    expect(wrapper.find('p.text-red-600').text()).toBe(
      'Numer karty jest nieprawidłowy',
    )
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()

    onCardChange({ complete: true })
    await nextTick()
    expect(wrapper.find('p.text-red-600').exists()).toBe(false)
    expect(wrapper.text()).toContain('checkout.review.cardComplete')
    expect(wrapper.find('button').attributes('disabled')).toBeUndefined()
  })

  it('asks for a 6-digit BLIK code instead of a card', async () => {
    const wrapper = await mountReview('pp_stripe-blik_stripe')

    expect(wrapper.text()).not.toContain('checkout.review.creditCardInfo')
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()

    await wrapper.find('input.blik-code').setValue('12345')
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()

    await wrapper.find('input.blik-code').setValue('123456')
    expect(wrapper.find('button').attributes('disabled')).toBeUndefined()
  })

  it('places the order once the BLIK payment is approved', async () => {
    stripe.confirmBlikPayment.mockResolvedValue({
      paymentIntent: { status: 'succeeded' },
    })
    const wrapper = await mountReview('pp_stripe-blik_stripe')

    await wrapper.find('input.blik-code').setValue('123456')
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(stripe.confirmBlikPayment).toHaveBeenCalledWith('pi_1_secret', {
      payment_method: {
        blik: {},
        billing_details: expect.objectContaining({ email: 'jan@example.com' }),
      },
      payment_method_options: { blik: { code: '123456' } },
    })
    expect(placeOrder).toHaveBeenCalledTimes(1)
  })

  it('shows the BLIK error and clears the used code', async () => {
    stripe.confirmBlikPayment.mockResolvedValue({
      error: { message: 'Kod BLIK wygasł' },
    })
    const wrapper = await mountReview('pp_stripe-blik_stripe')

    await wrapper.find('input.blik-code').setValue('123456')
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(placeOrder).not.toHaveBeenCalled()
    expect(wrapper.find('.alert').text()).toBe('Kod BLIK wygasł')
    expect(
      (wrapper.find('input.blik-code').element as HTMLInputElement).value,
    ).toBe('')
  })

  it('places a failed order again without charging BLIK twice', async () => {
    stripe.confirmBlikPayment.mockResolvedValue({
      paymentIntent: { status: 'succeeded' },
    })
    placeOrder.mockRejectedValueOnce(new Error('Payment authorization failed'))
    const wrapper = await mountReview('pp_stripe-blik_stripe')

    await wrapper.find('input.blik-code').setValue('123456')
    await wrapper.find('button').trigger('click')
    await flushPromises()
    expect(wrapper.find('.alert').text()).toBe('Payment authorization failed')

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(stripe.confirmBlikPayment).toHaveBeenCalledTimes(1)
    expect(placeOrder).toHaveBeenCalledTimes(2)
  })

  it('redirects to Przelewy24 instead of placing the order', async () => {
    stripe.confirmP24Payment.mockResolvedValue({})
    const wrapper = await mountReview('pp_stripe-przelewy24_stripe')

    expect(wrapper.text()).not.toContain('checkout.review.creditCardInfo')
    expect(wrapper.text()).toContain('checkout.review.p24Redirect')

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(stripe.confirmP24Payment).toHaveBeenCalledWith('pi_1_secret', {
      payment_method: {
        billing_details: expect.objectContaining({ email: 'jan@example.com' }),
      },
      return_url: window.location.href,
    })
    expect(placeOrder).not.toHaveBeenCalled()
  })

  it('places the order when the customer is back from a paid Przelewy24 payment', async () => {
    stripe.retrievePaymentIntent.mockResolvedValue({
      paymentIntent: { id: 'pi_1', status: 'succeeded' },
    })
    await mountReview('pp_stripe-przelewy24_stripe', { query: p24Return })

    expect(replace).toHaveBeenCalledWith({ query: { step: 'review' } })
    expect(stripe.retrievePaymentIntent).toHaveBeenCalledWith('pi_1_secret')
    expect(placeOrder).toHaveBeenCalledTimes(1)
  })

  it('does not place the order when the Przelewy24 payment failed', async () => {
    stripe.retrievePaymentIntent.mockResolvedValue({
      paymentIntent: { id: 'pi_1', status: 'requires_payment_method' },
    })
    const wrapper = await mountReview('pp_stripe-przelewy24_stripe', {
      query: { ...p24Return, redirect_status: 'failed' },
    })

    expect(placeOrder).not.toHaveBeenCalled()
    expect(wrapper.find('.alert').text()).toBe(
      'checkout.review.paymentNotCompleted',
    )
  })

  it('ignores a Przelewy24 return for another payment', async () => {
    await mountReview('pp_stripe-przelewy24_stripe', {
      query: { ...p24Return, payment_intent: 'pi_old' },
    })

    expect(replace).toHaveBeenCalledWith({ query: { step: 'review' } })
    expect(stripe.retrievePaymentIntent).not.toHaveBeenCalled()
    expect(placeOrder).not.toHaveBeenCalled()
  })

  it('places the order straight away without Stripe', async () => {
    const wrapper = await mountReview('pp_system_default', { data: {} })

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(loadStripe).not.toHaveBeenCalled()
    expect(placeOrder).toHaveBeenCalledTimes(1)
  })
})
