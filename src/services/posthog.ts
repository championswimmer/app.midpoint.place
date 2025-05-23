import posthog from 'posthog-js'

export function usePostHog() {
  posthog.init('phc_uzSxVkYMu5y4QJhtyqRltHSYQqHauNMSTA2sxExUvge', {
    api_host: 'https://us.i.posthog.com',
    capture_pageview: false,
    capture_pageleave: false,
  })

  return {
    posthog
  }
}