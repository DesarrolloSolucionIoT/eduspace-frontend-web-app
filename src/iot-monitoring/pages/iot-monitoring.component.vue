<script>
import { IotMonitoringService } from '../services/iot-monitoring.service.js';
import { IotSpace } from '../model/iot-space.entity.js';
import SpaceSensorCard from '../components/space-sensor-card.component.vue';

// Display ranges for temperature / humidity bars. These are presentation hints
// only — the authoritative alert decision (alertLedState) is computed by the Edge
// API against per-zone thresholds that the platform does not expose.
const TEMP_RANGE = { min: 16, max: 30 };
const HUM_RANGE = { min: 20, max: 90 };

function buildSensorMeta(t) {
    return {
        occupancy: {
            label: t('iotMonitoring.sensors.occupancy'),
            icon: 'pi pi-users',
            getMarkerPct(s) { return s.value ? 100 : 0; },
            zones: [{ color: 'ok', from: 0, to: 100 }],
            minLabel: t('iotMonitoring.occupancy.free'),
            maxLabel: () => t('iotMonitoring.occupancy.occupied'),
            formatValue: (s) => s.value === null
                ? '—'
                : (s.value ? t('iotMonitoring.occupancy.occupied') : t('iotMonitoring.occupancy.free')),
            formatUnit: () => '',
        },
        temperature: {
            label: t('iotMonitoring.sensors.temperature'),
            icon: 'pi pi-sun',
            getMarkerPct(s) { return ((s.value - TEMP_RANGE.min) / (TEMP_RANGE.max - TEMP_RANGE.min)) * 100; },
            zones: [{ color: 'warn', from: 0, to: 10 }, { color: 'ok', from: 10, to: 80 }, { color: 'warn', from: 80, to: 100 }],
            minLabel: `${TEMP_RANGE.min} °C`,
            maxLabel: () => `${TEMP_RANGE.max} °C`,
            formatValue: (s) => s.value !== null ? s.value.toFixed(1) : '—',
            formatUnit: () => '°C',
        },
        humidity: {
            label: t('iotMonitoring.sensors.humidity'),
            icon: 'pi pi-cloud',
            getMarkerPct(s) { return ((s.value - HUM_RANGE.min) / (HUM_RANGE.max - HUM_RANGE.min)) * 100; },
            zones: [{ color: 'warn', from: 0, to: 10 }, { color: 'ok', from: 10, to: 85 }, { color: 'warn', from: 85, to: 100 }],
            minLabel: `${HUM_RANGE.min}%`,
            maxLabel: () => `${HUM_RANGE.max}%`,
            formatValue: (s) => s.value !== null ? `${Math.round(s.value)}` : '—',
            formatUnit: () => '%',
        },
    };
}

const SENSOR_ORDER = ['occupancy', 'temperature', 'humidity'];

function buildChartTabs(t) {
    return [
        { key: 'temperature', label: t('iotMonitoring.sensors.temperature'), color: '#38bdf8' },
        { key: 'humidity',    label: t('iotMonitoring.sensors.humidity'),    color: '#a78bfa' },
        { key: 'occupancy',   label: t('iotMonitoring.sensors.occupancy'),   color: '#6366f1' },
    ];
}

const RANGE_OPTIONS = [
    { label: '1h', value: 3600e3 },
    { label: '8h', value: 8 * 3600e3 },
    { label: '24h', value: 24 * 3600e3 },
    { label: '7d', value: 7 * 24 * 3600e3 },
];

function metricValue(tab, point) {
    if (tab === 'occupancy') return point.occupancyPresent ? 1 : 0;
    if (tab === 'temperature') return point.temperature;
    if (tab === 'humidity') return point.humidity;
    return 0;
}

// Cap the number of plotted points so wide windows (7d of readings every few
// seconds) stay responsive; readings are averaged into time buckets.
const MAX_CHART_POINTS = 300;
// A gap larger than this breaks the line, so separate sensing sessions are not
// bridged by a misleading straight segment.
const GAP_BREAK_MS = 15 * 60e3;

function formatPointLabel(ms, windowMs) {
    const d = new Date(ms);
    if (windowMs >= 7 * 24 * 3600e3) {
        return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });
    }
    return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default {
    name: 'IotMonitoringPage',

    components: { SpaceSensorCard },

    data() {
        return {
            service: null,
            spaces: [],
            selectedSpace: null,
            filterText: '',
            activeTab: 'temperature',
            activeRange: RANGE_OPTIONS[1].value,
            rangeOptions: RANGE_OPTIONS,
            nowTick: Date.now(),
            loading: false,
            loadError: null,
        };
    },

    computed: {
        sensorMeta() {
            return buildSensorMeta(this.$t.bind(this));
        },

        chartTabs() {
            return buildChartTabs(this.$t.bind(this));
        },

        filteredSpaces() {
            if (!this.filterText.trim()) return this.spaces;
            const q = this.filterText.toLowerCase();
            return this.spaces.filter(s =>
                s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
            );
        },

        onlineCount() {
            return this.spaces.filter(s => s.status !== 'off').length;
        },

        alertCount() {
            return this.spaces.filter(s => s.status === 'warn').length;
        },

        sensorList() {
            if (!this.selectedSpace) return [];
            const s = this.selectedSpace;
            const meta = this.sensorMeta;
            // alertLedState is a combined temp/humidity breach flag; surface it on
            // both environmental sensors since the backend does not attribute it.
            const envStatus = s.status === 'warn' ? 'warn' : (s.status === 'off' ? 'neutral' : 'ok');
            const data = {
                occupancy: {
                    value: s.occupancyPresent === null ? null : (s.occupancyPresent ? 1 : 0),
                    delta: s.occupancyPresent === null
                        ? this.$t('iotMonitoring.delta.noData')
                        : (s.occupancyPresent ? this.$t('iotMonitoring.occupancy.occupied') : this.$t('iotMonitoring.occupancy.free')),
                    deltaStatus: 'neutral',
                },
                temperature: {
                    value: s.temperature,
                    delta: this.deltaLabel(s.temperature, envStatus),
                    deltaStatus: envStatus,
                },
                humidity: {
                    value: s.humidity,
                    delta: this.deltaLabel(s.humidity, envStatus),
                    deltaStatus: envStatus,
                },
            };
            return SENSOR_ORDER.map(key => ({ key, meta: meta[key], data: data[key] }));
        },

        // Window anchored to "now" (refreshed on each load), so the selected
        // range means real elapsed time: with little recent data most of the
        // window renders empty instead of stretching the points to full width.
        windowBounds() {
            const to = Math.max(this.nowTick, Date.now());
            return { from: to - this.activeRange, to };
        },

        windowedHistory() {
            if (!this.selectedSpace?.history?.length) return [];
            const { from, to } = this.windowBounds;
            return this.selectedSpace.history
                .filter(p => p.recordedAt)
                .map(p => ({ ...p, _t: new Date(p.recordedAt).getTime() }))
                .filter(p => p._t >= from && p._t <= to);
        },

        chartPoints() {
            const points = this.windowedHistory;
            if (!points.length) return [];
            const tab = this.activeTab;
            const bucketMs = Math.max(1000, Math.floor(this.activeRange / MAX_CHART_POINTS));
            const buckets = new Map();
            for (const p of points) {
                const v = metricValue(tab, p);
                if (v === null || v === undefined) continue;
                const key = Math.floor(p._t / bucketMs);
                const b = buckets.get(key);
                if (b) { b.sum += v; b.count += 1; b.max = Math.max(b.max, v); }
                else buckets.set(key, { t: key * bucketMs + bucketMs / 2, sum: v, count: 1, max: v });
            }
            const series = [...buckets.values()]
                .sort((a, b) => a.t - b.t)
                // Occupancy buckets report "was there presence", not an average.
                .map(b => ({ x: b.t, y: tab === 'occupancy' ? b.max : b.sum / b.count }));
            // Adjacent buckets sit bucketMs apart, so the break threshold must
            // scale with the bucket size on wide windows.
            const gapMs = Math.max(GAP_BREAK_MS, 2 * bucketMs);
            const out = [];
            for (let i = 0; i < series.length; i++) {
                if (i > 0 && series[i].x - series[i - 1].x > gapMs) {
                    out.push({ x: (series[i - 1].x + series[i].x) / 2, y: null });
                }
                out.push(series[i]);
            }
            return out;
        },

        chartData() {
            const tab = this.activeTab;
            const tabObj = this.chartTabs.find(t => t.key === tab) || this.chartTabs[0];
            return {
                datasets: [{
                    label: tabObj.label,
                    data: this.chartPoints,
                    borderColor: tabObj.color,
                    backgroundColor: tabObj.color + '22',
                    fill: true,
                    spanGaps: false,
                    tension: tab === 'occupancy' ? 0 : 0.4,
                    stepped: tab === 'occupancy',
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    borderWidth: 2,
                }],
            };
        },

        chartOptions() {
            const tabObj = this.chartTabs.find(t => t.key === this.activeTab) || this.chartTabs[0];
            const { from, to } = this.windowBounds;
            const windowMs = this.activeRange;
            const isOccupancy = this.activeTab === 'occupancy';
            return {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 300 },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'nearest',
                        axis: 'x',
                        intersect: false,
                        callbacks: {
                            title: (items) => items[0]
                                ? new Date(items[0].parsed.x).toLocaleString('es-PE', { hour12: false })
                                : '',
                            label: (item) => item.parsed.y === null
                                ? ''
                                : ` ${tabObj.label}: ${Math.round(item.parsed.y * 10) / 10}`,
                        },
                    },
                },
                scales: {
                    x: {
                        // Linear time axis pinned to the selected window, so
                        // switching 1h/8h/24h/7d visibly rescales the chart and
                        // stretches sparse data over the real elapsed time.
                        type: 'linear',
                        min: from,
                        max: to,
                        grid: { color: '#f3f4f6' },
                        ticks: {
                            font: { family: 'monospace', size: 10 },
                            color: '#9ca3af',
                            maxTicksLimit: 9,
                            maxRotation: 0,
                            autoSkip: true,
                            callback: (value) => formatPointLabel(value, windowMs),
                        },
                    },
                    y: {
                        grid: { color: '#f3f4f6' },
                        ticks: {
                            font: { family: 'monospace', size: 10 },
                            color: '#9ca3af',
                            ...(isOccupancy ? { stepSize: 1 } : {}),
                        },
                        ...(isOccupancy ? { min: 0, max: 1 } : {}),
                    },
                },
            };
        },

        occStrip() {
            const history = this.selectedSpace?.history || [];
            return history.slice(-48).map(p => !!p.occupancyPresent);
        },
    },

    methods: {
        async loadSpaces() {
            this.loading = true;
            this.loadError = null;
            this.nowTick = Date.now();
            try {
                const response = await this.service.getSpaces();
                this.spaces = (response.data || []).map(raw => new IotSpace(raw));
                if (this.spaces.length) {
                    const keepId = this.selectedSpace?.id;
                    this.selectedSpace = this.spaces.find(s => s.id === keepId) || this.spaces[0];
                } else {
                    this.selectedSpace = null;
                }
            } catch (err) {
                console.error('Error cargando espacios IoT', err);
                this.loadError = err.userMessage || this.$t('iotMonitoring.loadError');
            } finally {
                this.loading = false;
            }
        },

        selectSpace(space) {
            this.selectedSpace = space;
            this.activeTab = 'temperature';
        },

        deltaLabel(value, envStatus) {
            if (value === null || value === undefined) return this.$t('iotMonitoring.delta.noData');
            return envStatus === 'warn'
                ? this.$t('iotMonitoring.delta.alert')
                : this.$t('iotMonitoring.delta.inRange');
        },

        statusLabel(status) {
            const map = {
                ok: this.$t('iotMonitoring.status.ok'),
                warn: this.$t('iotMonitoring.status.warn'),
                off: this.$t('iotMonitoring.status.off'),
            };
            return map[status] || status;
        },
    },

    async mounted() {
        this.service = new IotMonitoringService();
        await this.loadSpaces();
    },
};
</script>

<template>
  <div class="iot-page">

    <!-- Cabecera -->
    <div class="page-head">
      <div>
        <h1 class="page-title">{{ $t('iotMonitoring.title') }}</h1>
        <div class="page-sub">
          {{ $t('iotMonitoring.devicesOnline', { count: onlineCount }) }} ·
          <span :class="alertCount > 0 ? 'text-warn' : 'text-ok'">{{ $t('iotMonitoring.activeAlerts', { count: alertCount }) }}</span>
        </div>
      </div>
      <div class="head-actions">
        <pv-button
          :label="$t('iotMonitoring.refresh')"
          icon="pi pi-refresh"
          size="small"
          outlined
          :loading="loading"
          @click="loadSpaces"
        />
      </div>
    </div>

    <div v-if="loadError" class="load-error">
      <i class="pi pi-exclamation-triangle"></i> {{ loadError }}
    </div>

    <!-- Layout principal -->
    <div class="monitor-layout">

      <!-- Panel izquierdo: lista de espacios -->
      <pv-card class="rooms-card">
        <template #content>
          <div class="rooms-header">
            <span class="rooms-title">{{ $t('iotMonitoring.spaces') }}</span>
            <span class="rooms-count">{{ $t('iotMonitoring.totalCount', { count: spaces.length }) }}</span>
          </div>
          <div class="rooms-filter">
            <pv-input-text
              v-model="filterText"
              :placeholder="$t('iotMonitoring.filterPlaceholder')"
              class="filter-input"
              size="small"
            />
          </div>
          <div class="room-list">
            <div
              v-for="space in filteredSpaces"
              :key="space.id"
              class="room-row"
              :class="[`row-${space.status}`, { 'row-active': selectedSpace && selectedSpace.id === space.id }]"
              @click="selectSpace(space)"
            >
              <span class="led" :class="`led-${space.status}`"></span>
              <div class="room-info">
                <div class="room-id">{{ space.name }}</div>
                <div class="room-meta">{{ space.zoneId || space.deviceId }}</div>
              </div>
              <span class="room-temp">
                {{ space.temperature !== null && space.temperature !== undefined ? space.temperature.toFixed(1) + ' °C' : '—' }}
              </span>
            </div>
            <div v-if="filteredSpaces.length === 0" class="rooms-empty">
              {{ spaces.length === 0 ? $t('iotMonitoring.noSpaces') : $t('iotMonitoring.noResults', { query: filterText }) }}
            </div>
          </div>
        </template>
      </pv-card>

      <!-- Panel derecho: detalle del espacio -->
      <pv-card v-if="selectedSpace" class="detail-card">
        <template #content>

          <!-- Header del espacio -->
          <div class="detail-head">
            <div class="detail-tile">{{ selectedSpace.name.slice(0, 2).toUpperCase() }}</div>
            <div class="detail-info">
              <h2 class="detail-name">{{ selectedSpace.name }}</h2>
              <div class="detail-sub">
                {{ selectedSpace.zoneId || selectedSpace.deviceId }}
              </div>
            </div>
            <div class="detail-status">
              <span class="status-pill" :class="`pill-${selectedSpace.status}`">
                <span class="led" :class="`led-${selectedSpace.status}`"></span>
                {{ statusLabel(selectedSpace.status) }}
              </span>
            </div>
          </div>

          <!-- Grid de sensores -->
          <div class="sensor-grid">
            <space-sensor-card
              v-for="sensor in sensorList"
              :key="sensor.key"
              :sensor-key="sensor.key"
              :sensor-data="sensor.data"
              :meta="sensor.meta"
            />
          </div>

          <!-- Tabs de gráfico -->
          <div class="chart-tabs">
            <div
              v-for="tab in chartTabs"
              :key="tab.key"
              class="chart-tab"
              :class="{ 'tab-active': activeTab === tab.key }"
              @click="activeTab = tab.key"
            >
              <span class="tab-dot" :style="{ background: tab.color }"></span>
              {{ tab.label }}
            </div>
            <div class="range-selector">
              <button
                v-for="r in rangeOptions"
                :key="r.value"
                class="range-btn"
                :class="{ 'range-active': activeRange === r.value }"
                @click="activeRange = r.value"
              >{{ r.label }}</button>
            </div>
          </div>

          <!-- Gráfico interactivo (Chart.js via pv-chart) -->
          <div class="chart-area">
            <pv-chart
              v-if="selectedSpace.history && selectedSpace.history.length"
              type="line"
              :data="chartData"
              :options="chartOptions"
              style="width:100%; height:100%;"
            />
            <div v-else class="chart-empty">{{ $t('iotMonitoring.noHistory') }}</div>
          </div>

          <!-- Strip de ocupación (últimas lecturas binarias reales) -->
          <div v-if="occStrip.length" class="occ-strip">
            <span
              v-for="(on, i) in occStrip"
              :key="i"
              class="occ-bit"
              :class="{ 'occ-on': on }"
            ></span>
          </div>

          <!-- Info del dispositivo -->
          <div class="device-footer">
            <div class="device-item">
              <div class="device-key">{{ $t('iotMonitoring.device.device') }}</div>
              <div class="device-val">{{ selectedSpace.deviceId }}</div>
            </div>
            <div class="device-item">
              <div class="device-key">{{ $t('iotMonitoring.device.zone') }}</div>
              <div class="device-val">{{ selectedSpace.zoneId || '—' }}</div>
            </div>
            <div class="device-item">
              <div class="device-key">{{ $t('iotMonitoring.device.lastReading') }}</div>
              <div class="device-val" :class="{ 'val-ok': selectedSpace.status !== 'off' }">
                {{ selectedSpace.lastReadingTime }} · {{ $t('iotMonitoring.device.ago', { value: selectedSpace.lastReadingAgo }) }}
              </div>
            </div>
          </div>

        </template>
      </pv-card>

      <!-- Estado vacío -->
      <pv-card v-else class="detail-card detail-empty">
        <template #content>
          <div class="empty-state">
            <i class="pi pi-wifi" style="font-size: 3rem; color: #d1d5db;"></i>
            <p>{{ spaces.length === 0 ? $t('iotMonitoring.noSpaces') : $t('iotMonitoring.emptyState') }}</p>
          </div>
        </template>
      </pv-card>

    </div>
  </div>
</template>

<style scoped>
.iot-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 16px;
  flex-wrap: wrap;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 4px;
  color: #111827;
}

.page-sub {
  font-size: 12px;
  color: #6b7280;
  font-family: monospace;
}

.text-warn { color: #f59e0b; font-weight: 600; }
.text-ok   { color: #22c55e; }

.head-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.load-error {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 16px;
}

.monitor-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 16px;
  align-items: start;
}

@media (max-width: 1000px) {
  .monitor-layout { grid-template-columns: 1fr; }
}

/* Rooms card */
.rooms-card :deep(.p-card-body)   { padding: 0; }
.rooms-card :deep(.p-card-content){ padding: 0; }

.rooms-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px 10px;
  border-bottom: 1px solid #f3f4f6;
}

.rooms-title { font-weight: 600; font-size: 13px; color: #374151; }
.rooms-count { font-family: monospace; font-size: 11px; color: #9ca3af; }

.rooms-filter { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; }
.filter-input { width: 100%; font-size: 12px; }
.filter-input :deep(input) { height: 30px; font-size: 12px; }

.room-list { max-height: 680px; overflow-y: auto; }

.room-row {
  display: grid;
  grid-template-columns: 10px 1fr auto;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid #f9fafb;
  cursor: pointer;
  align-items: center;
  transition: background 0.1s;
}

.room-row:hover { background: #f9fafb; }

.row-active {
  background: #eef2ff !important;
  border-left: 3px solid #6366f1;
  padding-left: 11px;
}

.row-warn.row-active   { background: #fffbeb !important; border-left-color: #f59e0b; }

.room-info { min-width: 0; }
.room-id   { font-size: 13px; font-weight: 500; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.room-meta { font-size: 11px; color: #9ca3af; font-family: monospace; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.room-temp { font-family: monospace; font-size: 12px; color: #6b7280; white-space: nowrap; }

.rooms-empty { padding: 24px; text-align: center; color: #9ca3af; font-size: 12px; }

/* LEDs */
.led { display: inline-block; width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.led-ok     { background: #22c55e; }
.led-warn   { background: #f59e0b; }
.led-off    { background: #d1d5db; }

/* Detail card */
.detail-card :deep(.p-card-body)   { padding: 0; }
.detail-card :deep(.p-card-content){ padding: 0; }

.detail-head {
  display: grid;
  grid-template-columns: 48px 1fr auto;
  gap: 14px;
  padding: 18px 20px;
  border-bottom: 1px solid #f3f4f6;
  align-items: center;
  flex-wrap: wrap;
}

.detail-tile {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  display: grid;
  place-items: center;
  font-family: monospace;
  font-weight: 700;
  font-size: 13px;
  color: #6b7280;
}

.detail-name { font-size: 20px; font-weight: 700; margin: 0 0 4px; color: #111827; }
.detail-sub  { font-size: 12px; color: #6b7280; font-family: monospace; }
.detail-status { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

.pill-ok     { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; }
.pill-warn   { background: #fffbeb; border: 1px solid #fde68a; color: #b45309; }
.pill-off    { background: #f9fafb; border: 1px solid #e5e7eb; color: #6b7280; }

/* Sensor grid */
.sensor-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-bottom: 1px solid #f3f4f6;
}

.sensor-grid > *:nth-child(3n)        { border-right: none; }

/* Chart tabs */
.chart-tabs {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 20px;
  border-bottom: 1px solid #f3f4f6;
  border-top: 1px solid #f3f4f6;
  overflow-x: auto;
}

.chart-tab {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 11px 12px;
  font-size: 12px;
  color: #9ca3af;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  white-space: nowrap;
  transition: color 0.15s;
  user-select: none;
}

.chart-tab:hover { color: #374151; }
.tab-active { color: #111827; font-weight: 500; border-bottom-color: #6366f1; }

.tab-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

.range-selector {
  margin-left: auto;
  display: inline-flex;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}

.range-btn {
  padding: 5px 10px;
  border: none;
  border-right: 1px solid #e5e7eb;
  background: white;
  font-size: 11px;
  color: #9ca3af;
  cursor: pointer;
  font-family: monospace;
  transition: background 0.1s;
}

.range-btn:last-child { border-right: none; }
.range-btn:hover      { background: #f9fafb; }
.range-active { background: #f3f4f6 !important; color: #111827 !important; font-weight: 600; }

/* Chart area — altura fija para pv-chart */
.chart-area {
  height: 220px;
  padding: 12px 16px 8px;
}

.chart-empty {
  display: grid;
  place-items: center;
  height: 100%;
  color: #9ca3af;
  font-size: 12px;
  font-family: monospace;
}

/* Occupancy strip */
.occ-strip {
  display: flex;
  gap: 2px;
  padding: 0 20px 10px;
  height: 20px;
}

.occ-bit { flex: 1; background: #f3f4f6; border-radius: 2px; }
.occ-on  { background: #818cf8; }

/* Device footer */
.device-footer {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 12px 20px;
  background: #fafafa;
  border-top: 1px solid #f3f4f6;
}

.device-key {
  font-family: monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #9ca3af;
  margin-bottom: 3px;
}

.device-val { font-family: monospace; font-weight: 500; color: #374151; font-size: 11px; }
.val-ok { color: #16a34a; }

/* Empty state */
.detail-empty :deep(.p-card-body)   { padding: 0; }
.detail-empty :deep(.p-card-content){ padding: 0; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  gap: 16px;
  color: #9ca3af;
  font-size: 14px;
  text-align: center;
}
</style>
