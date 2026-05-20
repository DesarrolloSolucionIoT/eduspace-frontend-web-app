<template>
  <pv-select-button
    :model-value="currentLocale"
    :options="options"
    option-label="label"
    option-value="value"
    :allow-empty="false"
    :aria-label="$t('common.language')"
    class="language-switcher"
    @update:model-value="onChange"
  />
</template>

<script>
import { setLocale, SUPPORTED_LOCALES } from '../i18n/index.js';

export default {
  name: 'language-switcher',
  data() {
    return {
      options: SUPPORTED_LOCALES.map((code) => ({
        label: code.toUpperCase(),
        value: code,
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
.language-switcher :deep(.p-togglebutton) {
  padding: 0.25rem 0.6rem;
  font-size: 0.8rem;
  font-weight: 600;
}
</style>
