import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import NcField from '~/components/primitives/NcField.vue'

describe('NcField', () => {
  it('ties the label to the control', () => {
    const wrapper = mount(NcField, {
      props: { label: 'Votre nom', modelValue: '', name: 'name' },
    })
    const id = wrapper.find('input').attributes('id')
    expect(id).toBeTruthy()
    expect(wrapper.find('label').attributes('for')).toBe(id)
  })

  it('keeps an empty placeholder so :placeholder-shown drives the float', () => {
    // v1 mirrored the value into a data attribute, which broke on autofill.
    const wrapper = mount(NcField, { props: { label: 'Nom', modelValue: '' } })
    expect(wrapper.find('input').attributes('placeholder')).toBe(' ')
  })

  it('announces an error and points the control at it', () => {
    const wrapper = mount(NcField, {
      props: { label: 'E-mail', modelValue: 'x', error: 'Invalide', name: 'email' },
    })
    const input = wrapper.find('input')
    const error = wrapper.find('[role="alert"]')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-describedby')).toBe(error.attributes('id'))
    expect(error.text()).toBe('Invalide')
  })

  it('has no error wiring when valid', () => {
    const wrapper = mount(NcField, { props: { label: 'Nom', modelValue: '' } })
    expect(wrapper.find('input').attributes('aria-invalid')).toBeUndefined()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('renders a textarea when asked', () => {
    const wrapper = mount(NcField, {
      props: { label: 'Message', modelValue: '', type: 'textarea' },
    })
    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('emits the new value', async () => {
    const wrapper = mount(NcField, { props: { label: 'Nom', modelValue: '' } })
    await wrapper.find('input').setValue('Nathan')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['Nathan'])
  })
})
