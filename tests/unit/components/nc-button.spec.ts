import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import NcButton from '~/components/primitives/NcButton.vue'

const stubs = { NcIcon: true, NcSpinner: true }

describe('NcButton', () => {
  it('is a button by default and a link when given an href', () => {
    expect(mount(NcButton, { global: { stubs } }).element.tagName).toBe('BUTTON')
    const link = mount(NcButton, { props: { href: '/cv.pdf' }, global: { stubs } })
    expect(link.element.tagName).toBe('A')
    expect(link.attributes('href')).toBe('/cv.pdf')
  })

  it('marks external links safe', () => {
    const wrapper = mount(NcButton, {
      props: { href: 'https://gitlab.com', external: true },
      global: { stubs },
    })
    expect(wrapper.attributes('target')).toBe('_blank')
    expect(wrapper.attributes('rel')).toBe('noopener noreferrer')
  })

  it('disables itself while loading, and says so', () => {
    const wrapper = mount(NcButton, { props: { loading: true }, global: { stubs } })
    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.attributes('aria-busy')).toBe('true')
  })

  it('uses aria-disabled on links, which cannot be disabled', () => {
    const wrapper = mount(NcButton, {
      props: { href: '/x', disabled: true },
      global: { stubs },
    })
    expect(wrapper.attributes('aria-disabled')).toBe('true')
    expect(wrapper.attributes('disabled')).toBeUndefined()
  })

  it('keeps the label free of the code decoration', () => {
    const wrapper = mount(NcButton, {
      props: { variant: 'code' },
      slots: { default: 'En savoir plus' },
      global: { stubs },
    })
    // The @click.prevent="…" wrapper is pseudo-element only, so assistive tech
    // and tests see the label alone.
    expect(wrapper.text()).toBe('En savoir plus')
    expect(wrapper.classes()).toContain('nc-button--code')
  })
})
