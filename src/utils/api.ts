import useSWR from 'swr'
import { Stripe } from 'stripe'

import { baseUrl } from '@/constants'
import { CustomerFields } from '@/api/models/Customer'
import { StatsFields } from '@/api/models/Stats'
import { CustomError } from '@/api/utils/createError'

export async function api<T>(
  url: string,
  data?: Record<string, unknown> | null,
  options?: Record<string, unknown>,
): Promise<T> {
  try {
    // Default options are marked with *
    const response = await fetch(`${baseUrl}/api${url}`, {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json',
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *client
      ...options,
      body: JSON.stringify(data || {}), // body data type must match "Content-Type" header
    })

    if (!response.ok) {
      const errorResponse = (await response.json()) as CustomError
      throw new Error(errorResponse.message ?? response.statusText)
    }

    return response.json() as Promise<T>
  } catch (err) {
    throw new Error(err.message)
  }
}

export const useCustomer = () => {
  const { data, error } = useSWR<CustomerFields>(`${baseUrl}/api/me`)

  return {
    customer: data,
    isLoading: !error && !data,
    error: error,
  }
}

export const useStats = () => {
  const { data, error } = useSWR<StatsFields>(`${baseUrl}/api/stats`)

  return {
    stats: data,
    isLoading: !error && !data,
    error: error,
  }
}

export const useCustomerStats = (userId?: string) => {
  const { data, error } = useSWR<StatsFields>(`${baseUrl}/api/stats/${userId}`)

  return {
    stats: data,
    isLoading: !error && !data,
    error: error,
  }
}

// Stripe
type Plan = {
  name: string
  id: string
  prices: { monthly: Stripe.Price; yearly: Stripe.Price }
}
export type Plans = Plan[]

export const usePlans = () => {
  const { data, error } = useSWR<Plans | undefined>(`${baseUrl}/api/plans`)

  return {
    plans: data,
    isLoading: !error && !data,
    error: error,
  }
}

export const useCheckoutSession = (checkoutSessionId?: string) => {
  const { data, error } = useSWR(
    checkoutSessionId ? `${baseUrl}/api/checkout/${checkoutSessionId}` : null,
  )

  return {
    checkoutSession: data,
    isLoading: !error && !data,
    error: error,
  }
}

export const useStripeCustomer = (customerId?: string) => {
  const { data, mutate, error } = useSWR<Stripe.Customer>(
    () => `${baseUrl}/api/customers/${customerId}`,
  )

  return {
    stripeCustomer: data,
    triggerFetchStripeCustomer: mutate,
    isLoading: !error && !data,
    error: error,
  }
}

export const useSubscription = (subscriptionId: string) => {
  const { data, error } = useSWR<Stripe.Subscription>(
    `${baseUrl}/api/subscriptions/${subscriptionId}`,
  )

  return {
    subscription: data,
    isLoading: !error && !data,
    error: error,
  }
}
