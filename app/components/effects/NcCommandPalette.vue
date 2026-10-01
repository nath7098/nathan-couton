<script setup lang="ts">
import { CONTACT } from '~/data/contact'
import { SECTIONS, type SectionId } from '~/data/sections'
import type { IconName } from '~/utils/icon-names'

/**
 * ⌘K — everything a recruiter came to do, from the keyboard.
 *
 * Download the CV, copy the address, open LinkedIn, jump to a section, switch
 * the language or the theme. A native `<dialog>`: focus is trapped, Escape
 * closes it, the page behind is inert, for free.
 *
 * Its code is not in the first-load bundle: app.vue listens for the shortcut
 * and only then mounts this component, whose chunk is fetched on demand.
 */
const emit = defineEmits<{ close: [] }>()

const { t, locale } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const colorMode = useColorMode()
const toast = useToast()
const { goTo } = useSections()

interface Command {
  id: string
  label: string
  hint?: string
  icon?: IconName
  run: () => void | Promise<void>
}

const commands = computed<Command[]>(() => [
  {
    id: 'cv',
    label: t('palette.cv'),
    hint: 'PDF',
    icon: 'download',
    run: () => {
      const link = document.createElement('a')
      link.href = CONTACT.resume
      link.download = CONTACT.resumeName
      link.click()
    },
  },
  {
    id: 'copy-email',
    label: t('palette.copyEmail'),
    hint: CONTACT.email,
    icon: 'copy',
    run: async () => {
      try {
        await navigator.clipboard.writeText(CONTACT.email)
        toast.success(t('contact.copied'))
      }
      catch {
        toast.error(t('contact.copy_error'))
      }
    },
  },
  { id: 'mail', label: t('palette.mail'), icon: 'mail', run: () => { window.location.href = `mailto:${CONTACT.email}` } },
  ...CONTACT.social.map((item): Command => ({
    id: item.id,
    label: item.label,
    hint: t('palette.external'),
    icon: item.id as IconName,
    run: () => { window.open(item.href, '_blank', 'noopener,noreferrer') },
  })),
  ...SECTIONS.filter(section => section.nav).map((section): Command => ({
    id: `go-${section.id}`,
    label: t('palette.goTo', { name: t(`sections.${section.id}.nav`) }),
    hint: t(`sections.${section.id}.file`),
    icon: 'arrow-right',
    run: () => goTo(section.id as SectionId),
  })),
  {
    id: 'theme',
    label: t('palette.theme'),
    icon: (colorMode.value === 'dark' ? 'sun' : 'moon') as IconName,
    run: () => { colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark' },
  },
  {
    id: 'locale',
    label: t('palette.locale'),
    hint: locale.value === 'fr' ? 'EN' : 'FR',
    run: async () => {
      await navigateTo(switchLocalePath(locale.value === 'fr' ? 'en' : 'fr'))
    },
  },
])

const query = ref('')
const index = ref(0)

const normalise = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

const results = computed(() => {
  const q = normalise(query.value.trim())
  if (!q) return commands.value
  return commands.value.filter(command => normalise(`${command.label} ${command.hint ?? ''}`).includes(q))
})

watch(query, () => {
  index.value = 0
})

const dialog = ref<HTMLDialogElement>()

onMounted(() => {
  dialog.value?.showModal()
})

function close() {
  dialog.value?.close()
}

async function run(command: Command | undefined) {
  if (!command) return
  close()
  await command.run()
}

function onKeydown(event: KeyboardEvent) {
  const count = results.value.length
  if (!count) return
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    index.value = (index.value + 1) % count
  }
  else if (event.key === 'ArrowUp') {
    event.preventDefault()
    index.value = (index.value - 1 + count) % count
  }
  else if (event.key === 'Enter') {
    event.preventDefault()
    run(results.value[index.value])
  }
}
</script>

<template>
  <dialog
    ref="dialog"
    class="palette"
    :aria-label="t('palette.title')"
    @close="emit('close')"
    @click.self="close"
  >
    <div class="palette__box">
      <label class="palette__search">
        <span
          class="palette__prompt"
          aria-hidden="true"
        >›</span>
        <span class="nc-sr-only">{{ t('palette.search') }}</span>
        <input
          v-model="query"
          type="text"
          :placeholder="t('palette.placeholder')"
          autocomplete="off"
          spellcheck="false"
          role="combobox"
          aria-controls="palette-list"
          aria-expanded="true"
          :aria-activedescendant="results[index] ? `palette-${results[index]!.id}` : undefined"
          @keydown="onKeydown"
        >
        <kbd class="palette__kbd">Esc</kbd>
      </label>

      <ul
        id="palette-list"
        class="palette__list"
        role="listbox"
      >
        <li
          v-for="(command, i) in results"
          :id="`palette-${command.id}`"
          :key="command.id"
          role="option"
          class="palette__item"
          :class="{ 'is-active': i === index }"
          :aria-selected="i === index"
          @mousemove="index = i"
          @click="run(command)"
        >
          <NcIcon
            v-if="command.icon"
            :name="command.icon"
            class="palette__icon"
          />
          <span
            v-else
            class="palette__icon"
          />
          <span class="palette__label">{{ command.label }}</span>
          <span
            v-if="command.hint"
            class="palette__hint"
          >{{ command.hint }}</span>
        </li>
        <li
          v-if="!results.length"
          class="palette__empty"
        >
          {{ t('palette.empty') }}
        </li>
      </ul>
    </div>
  </dialog>
</template>

<style scoped>
.palette {
  inline-size: min(36rem, calc(100vw - 2rem));
  margin: 12vh auto auto;
  padding: 0;
  color: var(--text);
  background: var(--bg-raised);
  border: 1px solid var(--line);
  border-radius: var(--radius-l);
  box-shadow: var(--shadow-3);
}

.palette::backdrop {
  background: color-mix(in oklab, var(--bg) 60%, transparent);
  backdrop-filter: blur(4px);
}

.palette__search {
  display: flex;
  gap: var(--space-2xs);
  align-items: center;
  padding: var(--space-s) var(--space-m);
  border-block-end: 1px solid var(--line);
}

.palette__prompt {
  font-family: var(--font-mono);
  color: var(--brand-ink);
}

.palette__search input {
  flex: 1;
  min-inline-size: 0;
  font-size: var(--step-0);
  background: none;
  border: 0;
  outline: none;
}

.palette__kbd {
  padding: 0.1em 0.45em;
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-dim);
  border: 1px solid var(--line);
  border-radius: var(--radius-s);
}

.palette__list {
  max-block-size: min(60vh, 26rem);
  padding: var(--space-2xs);
  margin: 0;
  overflow: auto;
  list-style: none;
}

.palette__item {
  display: grid;
  grid-template-columns: 1.2rem 1fr auto;
  gap: var(--space-s);
  align-items: center;
  padding: var(--space-2xs) var(--space-s);
  border-radius: var(--radius-m);
  cursor: pointer;
}

.palette__item.is-active {
  background: var(--brand-soft);
}

.palette__icon {
  inline-size: 1.05rem;
  block-size: 1.05rem;
  color: var(--brand-ink);
}

.palette__hint {
  font-family: var(--font-mono);
  font-size: var(--step--2);
  color: var(--text-faint);
}

.palette__empty {
  padding: var(--space-s);
  color: var(--text-dim);
}
</style>
