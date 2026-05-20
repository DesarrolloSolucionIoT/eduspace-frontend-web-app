<script>
export default {
    name: 'SpaceSensorCard',
    props: {
        sensorKey: { type: String, required: true },
        sensorData: { type: Object, required: true },
        meta: { type: Object, required: true },
    },
    methods: {
        markerPct() {
            if (this.sensorData.value === null) return 0;
            return Math.min(100, Math.max(0, this.meta.getMarkerPct(this.sensorData)));
        },
        formattedValue() {
            return this.meta.formatValue(this.sensorData);
        },
        formattedUnit() {
            return this.meta.formatUnit(this.sensorData);
        },
        maxLabel() {
            return typeof this.meta.maxLabel === 'function'
                ? this.meta.maxLabel(this.sensorData)
                : this.meta.maxLabel;
        },
    },
};
</script>

<template>
  <div
    class="sensor-cell"
    :class="{
      'sensor-warn':   sensorData.deltaStatus === 'warn',
      'sensor-danger': sensorData.deltaStatus === 'danger',
    }"
  >
    <div class="sensor-label">
      <i :class="meta.icon" class="sensor-icon"></i>
      {{ meta.label }}
    </div>

    <div v-if="sensorData.value !== null" class="sensor-value">
      {{ formattedValue() }}
      <span class="sensor-unit">{{ formattedUnit() }}</span>
    </div>
    <div v-else class="sensor-value sensor-offline">—</div>

    <div
      class="sensor-delta"
      :class="{
        'delta-ok':     sensorData.deltaStatus === 'ok',
        'delta-warn':   sensorData.deltaStatus === 'warn',
        'delta-danger': sensorData.deltaStatus === 'danger',
      }"
    >{{ sensorData.delta }}</div>

    <div v-if="sensorData.value !== null" class="threshold-bar">
      <div class="bar-track">
        <div
          v-for="zone in meta.zones"
          :key="zone.color + zone.from"
          class="bar-zone"
          :class="`zone-${zone.color}`"
          :style="{ left: zone.from + '%', width: (zone.to - zone.from) + '%' }"
        ></div>
        <div class="bar-marker" :style="{ left: markerPct() + '%' }"></div>
      </div>
      <div class="bar-range">
        <span>{{ meta.minLabel }}</span>
        <span>{{ maxLabel() }}</span>
      </div>
    </div>
    <div v-else class="threshold-bar-empty">{{ $t('iotMonitoring.noDataOffline') }}</div>
  </div>
</template>

<style scoped>
.sensor-cell {
  padding: 16px 20px;
  border-right: 1px solid #f3f4f6;
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.1s;
}

.sensor-warn   { background: #fffdf5; }
.sensor-danger { background: #fff8f8; }

.sensor-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #9ca3af;
  margin-bottom: 6px;
}

.sensor-icon { font-size: 11px; }

.sensor-value {
  font-family: monospace;
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.02em;
  line-height: 1;
}

.sensor-offline { color: #d1d5db; }

.sensor-unit {
  font-size: 12px;
  font-weight: 400;
  color: #9ca3af;
  margin-left: 3px;
}

.sensor-delta {
  margin-top: 4px;
  font-size: 11px;
  font-family: monospace;
  color: #9ca3af;
}

.delta-ok     { color: #16a34a; }
.delta-warn   { color: #d97706; }
.delta-danger { color: #dc2626; font-weight: 600; }

.threshold-bar { margin-top: 10px; }

.bar-track {
  position: relative;
  height: 5px;
  background: #f3f4f6;
  border-radius: 3px;
  overflow: visible;
}

.bar-zone {
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 3px;
}

.zone-ok     { background: #86efac; }
.zone-warn   { background: #fcd34d; }
.zone-danger { background: #fca5a5; }

.bar-marker {
  position: absolute;
  width: 2px;
  top: -3px;
  bottom: -3px;
  background: #111827;
  border-radius: 1px;
  transform: translateX(-50%);
}

.bar-range {
  display: flex;
  justify-content: space-between;
  font-family: monospace;
  font-size: 10px;
  color: #d1d5db;
  margin-top: 5px;
}

.threshold-bar-empty {
  margin-top: 10px;
  font-size: 10px;
  font-family: monospace;
  color: #f59e0b;
}
</style>
