// Medusa answers recorded from the e2e Medusa (medusaDemo's e2e seed, Medusa
// 2.19.0) on 2026-11-21, for the narrow response schemas (#84). Only the
// e-mail is replaced; ids and timestamps are as Medusa sent them, and every
// field the storefront doesn't read is kept on purpose, so the tests show
// that the schemas let them through.

// GET /store/customers/me (POST /store/customers and POST
// /store/customers/me answer the same shape). Not typed as
// StoreCustomerResponse: Medusa leaves out fields its type calls required
// (`default_billing_address_id`), and `metadata` is `null`.
export const medusaCustomerResponse = {
  customer: {
    id: 'cus_01M7ZA7KYX7XSJ3RQP7VF421XV',
    email: 'ada@example.com',
    company_name: null,
    first_name: 'Ada',
    last_name: 'Lovelace',
    phone: '+48 600 000 000',
    metadata: null,
    has_account: true,
    deleted_at: null,
    created_at: '2026-11-21T15:05:10.877Z',
    updated_at: '2026-11-21T15:05:10.877Z',
    addresses: [],
  },
}
