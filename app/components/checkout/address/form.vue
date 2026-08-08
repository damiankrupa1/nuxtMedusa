<script lang="ts" setup>
import * as z from 'zod'
import type { StoreCartResponse } from '@medusajs/types'
import type { FormSubmitEvent } from '#ui/types'

const emit = defineEmits<{
  validate: [boolean]
}>()

const { country } = useCountry()

const { data: cartResponse } = useNuxtData<StoreCartResponse>('cart')
const cart = computed(() => cartResponse.value?.cart)
const { mutate: updateCart, loading } = useUpdateCart()

const { t } = useI18n()

const buildSchema = () =>
  z.object({
    shipping_address: z.object({
      first_name: z
        .string({ required_error: t('validation.firstNameRequired') })
        .min(1, t('validation.firstNameRequired')),
      last_name: z
        .string({ required_error: t('validation.lastNameRequired') })
        .min(1, t('validation.lastNameRequired')),
      address_1: z
        .string({ required_error: t('validation.addressRequired') })
        .min(1, t('validation.addressRequired')),
      address_2: z.string().optional(),
      company: z.string().optional(),
      postal_code: z
        .string({ required_error: t('validation.postalCodeRequired') })
        .min(1, t('validation.postalCodeRequired')),
      city: z
        .string({ required_error: t('validation.cityRequired') })
        .min(1, t('validation.cityRequired')),
      country_code: z
        .string({ required_error: t('validation.countryRequired') })
        .min(1, t('validation.countryRequired')),
      province: z.string().optional(),
      phone: z.string().optional(),
    }),
    email: z
      .string({ required_error: t('validation.emailRequired') })
      .email(t('validation.emailInvalid')),
    billing_address: z.object({
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      address_1: z.string().optional(),
      address_2: z.string().optional(),
      company: z.string().optional(),
      postal_code: z.string().optional(),
      city: z.string().optional(),
      country_code: z.string().optional(),
      province: z.string().optional(),
      phone: z.string().optional(),
    }),
  })

type Schema = z.infer<ReturnType<typeof buildSchema>>
const schema = computed(buildSchema)

interface PartialSchema {
  shipping_address: Partial<Schema['shipping_address']>
  email?: Schema['email']
  billing_address: Partial<Schema['billing_address']>
}

const state = reactive<PartialSchema>({
  shipping_address: {
    first_name: cart.value?.shipping_address?.first_name || undefined,
    last_name: cart.value?.shipping_address?.last_name || undefined,
    address_1: cart.value?.shipping_address?.address_1 || undefined,
    address_2: cart.value?.shipping_address?.address_2 || undefined,
    company: cart.value?.shipping_address?.company || undefined,
    postal_code: cart.value?.shipping_address?.postal_code || undefined,
    city: cart.value?.shipping_address?.city || undefined,
    country_code: cart.value?.shipping_address?.country_code || undefined,
    province: cart.value?.shipping_address?.province || undefined,
    phone: cart.value?.shipping_address?.phone || undefined,
  },
  email: cart.value?.email || undefined,
  billing_address: {
    first_name: cart.value?.billing_address?.first_name || undefined,
    last_name: cart.value?.billing_address?.last_name || undefined,
    address_1: cart.value?.billing_address?.address_1 || undefined,
    address_2: cart.value?.billing_address?.address_2 || undefined,
    company: cart.value?.billing_address?.company || undefined,
    postal_code: cart.value?.billing_address?.postal_code || undefined,
    city: cart.value?.billing_address?.city || undefined,
    country_code: cart.value?.billing_address?.country_code || undefined,
    province: cart.value?.billing_address?.province || undefined,
    phone: cart.value?.billing_address?.phone || undefined,
  },
})

const sameAsBilling = ref(
  compareAddresses(cart.value?.shipping_address, cart.value?.billing_address),
)

async function onSubmit(event: FormSubmitEvent<PartialSchema>) {
  if (sameAsBilling.value)
    event.data.billing_address = event.data.shipping_address

  await updateCart(event.data)

  emit('validate', true)
}

// Use the current user country as the default shipping address country
watch(
  country,
  (newCountry) => {
    if (newCountry?.iso_2 && state.shipping_address) {
      state.shipping_address.country_code = newCountry?.iso_2
    }
  },
  { immediate: true },
)

// Redirect to the right store if shipping address changes - Not applicable for billing address
watch(state, (value) => {
  if (value.shipping_address?.country_code !== country.value?.iso_2) {
    navigateTo(`/${value.shipping_address?.country_code}/checkout?step=address`)
  }
})
</script>

<template>
  <div class="pb-8">
    <UForm :schema="schema" :state="state" @submit="onSubmit">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
        <UFormField
          required
          size="xl"
          class="w-full"
          name="shipping_address.first_name"
          :ui="{ error: 'text-xs' }"
        >
          <AppInput
            v-model="state.shipping_address.first_name"
            name="shipping_address.first_name"
            :label="$t('auth.fields.firstName')"
            required
            size="xl"
          />
        </UFormField>
        <UFormField
          required
          size="xl"
          class="w-full"
          name="shipping_address.last_name"
          :ui="{ error: 'text-xs' }"
        >
          <AppInput
            v-model="state.shipping_address.last_name"
            name="shipping_address.last_name"
            :label="$t('auth.fields.lastName')"
            required
            size="xl"
          />
        </UFormField>
        <UFormField
          required
          size="xl"
          class="w-full"
          name="shipping_address.address_1"
          :ui="{ error: 'text-xs' }"
        >
          <AppInput
            v-model="state.shipping_address.address_1"
            name="shipping_address.address_1"
            :label="$t('checkout.address.fields.address')"
            required
            size="xl"
          />
        </UFormField>
        <UFormField
          size="xl"
          class="w-full"
          name="shipping_address.company"
          :ui="{ error: 'text-xs' }"
        >
          <AppInput
            v-model="state.shipping_address.company"
            name="shipping_address.company"
            :label="$t('checkout.address.fields.company')"
            size="xl"
          />
        </UFormField>
        <UFormField
          required
          size="xl"
          class="w-full"
          name="shipping_address.postal_code"
          :ui="{ error: 'text-xs' }"
        >
          <AppInput
            v-model="state.shipping_address.postal_code"
            name="shipping_address.postal_code"
            :label="$t('checkout.address.fields.postalCode')"
            required
            size="xl"
          />
        </UFormField>
        <UFormField
          required
          size="xl"
          class="w-full"
          name="shipping_address.city"
          :ui="{ error: 'text-xs' }"
        >
          <AppInput
            v-model="state.shipping_address.city"
            name="shipping_address.city"
            :label="$t('checkout.address.fields.city')"
            required
            size="xl"
          />
        </UFormField>
        <UFormField
          required
          size="xl"
          class="w-full"
          name="shipping_address.country_code"
          :ui="{ error: 'text-xs' }"
        >
          <StoreSelectCountry v-model="state.shipping_address.country_code" />
        </UFormField>
        <UFormField size="xl" class="w-full" name="shipping_address.province">
          <AppInput
            v-model="state.shipping_address.province"
            name="shipping_address.province"
            :label="$t('checkout.address.fields.provinceState')"
            size="xl"
          />
        </UFormField>
        <UFormField
          size="xl"
          class="w-full"
          name="shipping_address.phone"
          :ui="{ error: 'text-xs' }"
        >
          <AppInput
            v-model="state.shipping_address.phone"
            name="shipping_address.phone"
            type="tel"
            :label="$t('auth.fields.phone')"
            size="xl"
          />
        </UFormField>
      </div>
      <div class="py-4">
        <UCheckbox
          v-model="sameAsBilling"
          color="neutral"
          :label="$t('checkout.address.billingSameAsShipping')"
        />
      </div>
      <div class="grid grid-cols-2 gap-4 pb-8">
        <UFormField
          required
          size="xl"
          class="w-full"
          name="email"
          :ui="{ error: 'text-xs' }"
        >
          <AppInput
            v-model="state.email"
            name="email"
            type="email"
            :label="$t('auth.fields.email')"
            required
            size="xl"
          />
        </UFormField>
        <UFormField
          required
          size="xl"
          class="w-full"
          name="shipping_address.phone"
          :ui="{ error: 'text-xs' }"
        >
          <AppInput
            v-model="state.shipping_address.phone"
            name="shipping_address.phone"
            type="tel"
            :label="$t('auth.fields.phone')"
            size="xl"
          />
        </UFormField>
      </div>
      <div v-if="!sameAsBilling">
        <AppHeading as="h2" class="mb-6">
          {{ $t('checkout.address.billingAddressHeading') }}
        </AppHeading>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
          <UFormField
            required
            size="xl"
            class="w-full"
            name="billing_address.first_name"
            :ui="{ error: 'text-xs' }"
          >
            <AppInput
              v-model="state.billing_address.first_name"
              name="billing_address.first_name"
              :label="$t('auth.fields.firstName')"
              required
              size="xl"
            />
          </UFormField>
          <UFormField
            required
            size="xl"
            class="w-full"
            name="billing_address.last_name"
            :ui="{ error: 'text-xs' }"
          >
            <AppInput
              v-model="state.billing_address.last_name"
              name="billing_address.last_name"
              :label="$t('auth.fields.lastName')"
              required
              size="xl"
            />
          </UFormField>
          <UFormField
            required
            size="xl"
            class="w-full"
            name="billing_address.address_1"
            :ui="{ error: 'text-xs' }"
          >
            <AppInput
              v-model="state.billing_address.address_1"
              name="billing_address.address_1"
              :label="$t('checkout.address.fields.address')"
              required
              size="xl"
            />
          </UFormField>
          <UFormField
            required
            size="xl"
            class="w-full"
            name="billing_address.company"
            :ui="{ error: 'text-xs' }"
          >
            <AppInput
              v-model="state.billing_address.company"
              name="billing_address.company"
              :label="$t('checkout.address.fields.company')"
              size="xl"
            />
          </UFormField>
          <UFormField
            required
            size="xl"
            class="w-full"
            name="billing_address.postal_code"
            :ui="{ error: 'text-xs' }"
          >
            <AppInput
              v-model="state.billing_address.postal_code"
              name="billing_address.postal_code"
              :label="$t('checkout.address.fields.postalCode')"
              required
              size="xl"
            />
          </UFormField>
          <UFormField
            required
            size="xl"
            class="w-full"
            name="billing_address.city"
            :ui="{ error: 'text-xs' }"
          >
            <AppInput
              v-model="state.billing_address.city"
              name="billing_address.city"
              :label="$t('checkout.address.fields.city')"
              required
              size="xl"
            />
          </UFormField>
          <UFormField
            required
            size="xl"
            class="w-full"
            name="billing_address.country_code"
            :ui="{ error: 'text-xs' }"
          >
            <StoreSelectCountry v-model="state.billing_address.country_code" />
          </UFormField>
          <UFormField
            required
            size="xl"
            class="w-full"
            name="billing_address.province"
          >
            <AppInput
              v-model="state.billing_address.province"
              name="billing_address.province"
              :label="$t('checkout.address.fields.provinceState')"
              size="xl"
            />
          </UFormField>
          <UFormField
            required
            size="xl"
            class="w-full"
            name="billing_address.phone"
            :ui="{ error: 'text-xs' }"
          >
            <AppInput
              v-model="state.billing_address.phone"
              name="billing_address.phone"
              type="tel"
              :label="$t('auth.fields.phone')"
              size="xl"
            />
          </UFormField>
        </div>
      </div>
      <UButton
        class="cursor-pointer"
        color="neutral"
        size="xl"
        type="submit"
        :loading="loading"
      >
        {{ $t('checkout.address.continue') }}
      </UButton>
    </UForm>
  </div>
</template>
