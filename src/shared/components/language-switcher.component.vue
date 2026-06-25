<template>
  <div class="language-switcher" role="group" :aria-label="$t('common.language')">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="lang-option"
      :class="{ 'lang-option--active': opt.value === currentLocale }"
      :aria-pressed="opt.value === currentLocale"
      :title="opt.title"
      @click="onChange(opt.value)"
    >
      <span class="lang-flag" v-html="opt.flag"></span>
      <span class="lang-code">{{ opt.label }}</span>
    </button>
  </div>
</template>

<script>
import { setLocale, SUPPORTED_LOCALES } from '../i18n/index.js';

// Inline SVG flags — emoji flags do not render on Windows, so these
// guarantee a consistent look across every platform without extra assets.
const FLAGS = {
  es: `<svg viewBox="0 0 3 2" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        <rect width="3" height="2" fill="#c60b1e"/>
        <rect y="0.5" width="3" height="1" fill="#ffc400"/>
      </svg>`,
  en: `<svg viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        <rect width="60" height="30" fill="#012169"/>
        <path d="M0,0 60,30 M60,0 0,30" stroke="#fff" stroke-width="6"/>
        <path d="M0,0 60,30 M60,0 0,30" stroke="#c8102e" stroke-width="4"/>
        <path d="M30,0 V30 M0,15 H60" stroke="#fff" stroke-width="10"/>
        <path d="M30,0 V30 M0,15 H60" stroke="#c8102e" stroke-width="6"/>
      </svg>`,
};

const TITLES = { es: 'Español', en: 'English' };

export default {
  name: 'language-switcher',
  data() {
    return {
      options: SUPPORTED_LOCALES.map((code) => ({
        label: code.toUpperCase(),
        value: code,
        flag: FLAGS[code] || '',
        title: TITLES[code] || code.toUpperCase(),
      })),
    };
  },
  computed: {
    currentLocale() {
      const loc = this.$i18n.locale;
      return loc && typeof loc === 'object' && 'value' in loc ? loc.value : loc;
    },
  },
  methods: {
    onChange(value) {
      if (!value) return;
      setLocale(value);
    },
  },
};
</script>

<style scoped>
.language-switcher {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(52, 167, 193, 0.18);
}

.lang-option {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 12px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: #4a5568;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: background 0.25s ease, color 0.25s ease, transform 0.15s ease;
}

.lang-option:hover {
  background: rgba(52, 167, 193, 0.1);
  transform: translateY(-1px);
}

.lang-option:focus-visible {
  outline: 2px solid #34a7c1;
  outline-offset: 2px;
}

.lang-option--active {
  background: linear-gradient(to right, #34a7c1, #4ad4d4);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(52, 167, 193, 0.4);
}

.lang-option--active:hover {
  background: linear-gradient(to right, #2fa1b4, #41b8b8);
}

/* Round flag chip — overflow clips the SVG into a neat circle */
.lang-flag {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
}

.lang-flag :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}

.lang-code {
  line-height: 1;
}
</style>
