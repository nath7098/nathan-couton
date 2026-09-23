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

  it('becomes a toggle button when pressed is supplied, with its state exposed', () => {
    const off = mount(NcTag, { props: { label: 'Java', tech: 'java', pressed: false } })
    expect(off.element.tagName).toBe('BUTTON')
    expect(off.attributes('aria-pressed')).toBe('false')

    const on = mount(NcTag, { props: { label: 'Java', tech: 'java', pressed: true } })
    expect(on.attributes('aria-pressed')).toBe('true')
  })

  it('emits toggle rather than open when it is a toggle', async () => {
    const wrapper = mount(NcTag, { props: { label: 'Java', tech: 'java', pressed: false } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('toggle')).toHaveLength(1)
    expect(wrapper.emitted('open')).toBeUndefined()
  })

  // The projects filter used to fake a toggle by passing a single space as
  // `details`. It trimmed to nothing, so every filter pill rendered as an inert
  // span: not focusable, not clickable, and silently doing nothing.
  it('does not become interactive from blank details alone', async () => {
    const wrapper = mount(NcTag, { props: { label: 'Java', tech: 'java', details: ' ' } })
    expect(wrapper.element.tagName).toBe('SPAN')
    await wrapper.trigger('click')
    expect(wrapper.emitted('toggle')).toBeUndefined()
    expect(wrapper.emitted('open')).toBeUndefined()
  })

  it('wires the tech token pair so colour stays in tokens.css', () => {
    const wrapper = mount(NcTag, { props: { label: 'Java', tech: 'java' } })
    const style = wrapper.attributes('style') ?? ''
    expect(style).toContain('--tag-accent: var(--tech-java-accent)')
    expect(style).toContain('--tag-bg: var(--tech-java-bg)')
  })
})
