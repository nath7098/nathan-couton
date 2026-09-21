import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import NcTag from '~/components/primitives/NcTag.vue'

describe('NcTag', () => {
  it('renders as plain text when it has nothing to explain', () => {
    const wrapper = mount(NcTag, { props: { label: 'Flex', tech: 'flex' } })
    expect(wrapper.element.tagName).toBe('SPAN')
    expect(wrapper.attributes('type')).toBeUndefined()
  })

  it('becomes a button when details are supplied', () => {
    const wrapper = mount(NcTag, {
      props: { label: 'Vue 3', tech: 'vue', details: 'Composition API' },
    })
    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('type')).toBe('button')
  })

  it('treats blank details as no details', () => {
    const wrapper = mount(NcTag, { props: { label: 'Vue', tech: 'vue', details: '   ' } })
    expect(wrapper.element.tagName).toBe('SPAN')
  })

  it('emits open only when interactive', async () => {
    const plain = mount(NcTag, { props: { label: 'Flex', tech: 'flex' } })
    await plain.trigger('click')
    expect(plain.emitted('open')).toBeUndefined()

    const rich = mount(NcTag, { props: { label: 'Java', tech: 'java', details: 'Java 8' } })
    await rich.trigger('click')
    expect(rich.emitted('open')).toHaveLength(1)
  })

  it('wires the tech token pair so colour stays in tokens.css', () => {
    const wrapper = mount(NcTag, { props: { label: 'Java', tech: 'java' } })
    const style = wrapper.attributes('style') ?? ''
    expect(style).toContain('--tag-accent: var(--tech-java-accent)')
    expect(style).toContain('--tag-bg: var(--tech-java-bg)')
  })
})
