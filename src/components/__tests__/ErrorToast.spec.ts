import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import ErrorToast from '../ErrorToast.vue'
import { useErrorStore } from '@/stores/error'

describe('HelloWorld', () => {
  it('renders properly', () => {
    const wrapper = mount(ErrorToast)
    const errorStore = useErrorStore()
    errorStore.setError('Test Error')
    expect(wrapper.text()).toContain('Test Error')
  })
})
