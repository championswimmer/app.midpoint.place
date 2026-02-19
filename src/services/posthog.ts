import posthog from 'posthog-js'

export function usePostHog() {
  posthog.init('phc_BrfRxNDklIQEZmAK27UZ2PAdnMHjCBPKRB3fWtOsF9c', {
    api_host: 'https://us.i.posthog.com',
    capture_pageview: false,
    capture_pageleave: false,
  })

  return {
    posthog
  }
}
