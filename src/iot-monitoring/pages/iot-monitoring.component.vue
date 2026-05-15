<script>
import { IotMonitoringService } from '../services/iot-monitoring.service.js';

const SENSOR_META = {
    occupancy: {
        label: 'Ocupación',
        icon: 'pi pi-users',
        getMarkerPct(s) { return s.capacity ? (s.value / s.capacity) * 100 : 0; },
        zones: [{ color: 'ok', from: 0, to: 75 }, { color: 'warn', from: 75, to: 90 }, { color: 'danger', from: 90, to: 100 }],
        minLabel: '0',
        maxLabel: (s) => `aforo ${s.capacity}`,
        formatValue: (s) => s.value !== null ? `${s.value}` : '—',
        formatUnit: (s) => s.capacity ? `/ ${s.capacity}` : '',
    },
    temperature: {
        label: 'Temperatura',
        icon: 'pi pi-sun',
        getMarkerPct(s) { return ((s.value - 16) / (30 - 16)) * 100; },
        zones: [{ color: 'warn', from: 0, to: 14 }, { color: 'ok', from: 14, to: 64 }, { color: 'warn', from: 64, to: 86 }, { color: 'danger', from: 86, to: 100 }],
        minLabel: '16 °C',
        maxLabel: () => '30 °C',
        formatValue: (s) => s.value !== null ? `${s.value}` : '—',
        formatUnit: () => '°C',
    },
    humidity: {
        label: 'Humedad',
        icon: 'pi pi-cloud',
        getMarkerPct(s) { return ((s.value - 20) / (90 - 20)) * 100; },
        zones: [{ color: 'warn', from: 0, to: 5 }, { color: 'ok', from: 5, to: 82 }, { color: 'warn', from: 82, to: 95 }, { color: 'danger', from: 95, to: 100 }],
        minLabel: '20%',
        maxLabel: () => '90%',
        formatValue: (s) => s.value !== null ? `${s.value}` : '—',
        formatUnit: () => '%',
    },
    luminosity: {
        label: 'Luminosidad',
        icon: 'pi pi-eye',
        getMarkerPct(s) { return (s.value / 1500) * 100; },
        zones: [{ color: 'warn', from: 0, to: 13 }, { color: 'ok', from: 13, to: 87 }, { color: 'warn', from: 87, to: 100 }],
        minLabel: '0 lx',
        maxLabel: () => '1500 lx',
        formatValue: (s) => s.value !== null ? `${s.value}` : '—',
        formatUnit: () => 'lx',
    },
    co2: {
        label: 'CO₂',
        icon: 'pi pi-chart-line',
        getMarkerPct(s) { return ((s.value - 400) / (2000 - 400)) * 100; },
        zones: [{ color: 'ok', from: 0, to: 38 }, { color: 'warn', from: 38, to: 69 }, { color: 'danger', from: 69, to: 100 }],
        minLabel: '400',
        maxLabel: () => '2000 ppm',
        formatValue: (s) => s.value !== null ? s.value.toLocaleString('es-PE') : '—',
        formatUnit: () => 'ppm',
    },
    energy: {
        label: 'Consumo',
        icon: 'pi pi-bolt',
        getMarkerPct(s) { return (s.value / 4) * 100; },
        zones: [{ color: 'ok', from: 0, to: 60 }, { color: 'warn', from: 60, to: 80 }, { color: 'danger', from: 80, to: 100 }],
        minLabel: '0',
        maxLabel: () => '4 kWh/h',
        formatValue: (s) => s.value !== null ? s.value.toFixed(2) : '—',
        formatUnit: () => 'kWh / h',
    },
};

const SENSOR_ORDER = ['occupancy', 'temperature', 'humidity', 'luminosity', 'co2', 'energy'];

const CHART_TABS = [
    { key: 'occupancy',   label: 'Ocupación',   color: '#6366f1' },
    { key: 'temperature', label: 'Temperatura', color: '#38bdf8' },
    { key: 'co2',         label: 'CO₂',         color: '#f59e0b' },
    { key: 'humidity',    label: 'Humedad',     color: '#a78bfa' },
];

const RANGE_OPTIONS = [
    { label: '1h', value: '1h' },
    { label: '8h', value: '8h' },
    { label: '24h', value: '24h' },
    { label: '7d', value: '7d' },
];

export default {
    name: 'IotMonitoringPage',

    data() {
        return {
            service: null,
            spaces: [],
            selectedSpace: null,
            filterText: '',
            activeTab: 'occupancy',
            activeRange: '8h',
            sensorMeta: SENSOR_META,
            sensorOrder: SENSOR_ORDER,
            chartTabs: CHART_TABS,
            rangeOptions: RANGE_OPTIONS,
        };
    },

    computed: {
        filteredSpaces() {
            if (!this.filterText.trim()) return this.spaces;
            const q = this.filterText.toLowerCase();
            return this.spaces.filter(s => s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
        },

        onlineCount() {
            return this.spaces.filter(s => s.status !== 'off').length;
        },

        alertCount() {
            return this.spaces.filter(s => s.status === 'warn' || s.status === 'danger').length;
        },

        sensorList() {
            if (!this.selectedSpace) return [];
            return SENSOR_ORDER.map(key => ({
                key,
                meta: SENSOR_META[key],
                data: this.selectedSpace.sensors[key],
            }));
        },

        chartSvg() {
            if (!this.selectedSpace) return '';
            const W = 780, H = 200, PX = 38, PY = 18;
            const N = this.activeRange === '1h' ? 12 : 96;
            const space = this.selectedSpace;
            const tab = this.activeTab;

            const cap = space.sensors.occupancy?.capacity || 32;

            const data = Array.from({ length: N }, (_, i) => {
                const t = i / (N - 1);
                if (tab === 'occupancy') {
                    let v = 0;
                    if (t >= 0.28 && t < 0.46) v += cap * 0.9  * Math.sin((t - 0.28) / 0.18 * Math.PI);
                    if (t >= 0.54 && t < 0.72) v += cap * 1.0  * Math.sin((t - 0.54) / 0.18 * Math.PI);
                    if (t >= 0.75 && t < 0.88) v += cap * 0.70 * Math.sin((t - 0.75) / 0.13 * Math.PI);
                    v += 0.8 * Math.sin(i / 2.5);
                    return Math.max(0, Math.min(cap, v));
                }
                if (tab === 'temperature') {
                    const base = space.sensors.temperature?.value || 22;
                    return base - 3 + 5 * Math.sin(t * Math.PI * 2.4 + 0.3) + 1.2 * Math.sin(i / 4);
                }
                if (tab === 'co2') {
                    const base = space.sensors.co2?.value || 700;
                    return 420 + (base - 420) * Math.max(0, Math.sin(t * Math.PI * 1.8 - 0.2)) + 40 * Math.sin(i / 6);
                }
                if (tab === 'humidity') {
                    const base = space.sensors.humidity?.value || 55;
                    return base - 8 + 12 * Math.sin(t * Math.PI * 1.5 + 0.8) + 2 * Math.sin(i / 5);
                }
                return 0;
            });

            const max = Math.max(...data) * 1.15 || 1;
            const toX = i => PX + (i / (N - 1)) * (W - PX - 8);
            const toY = v => H - PY - (Math.max(0, v) / max) * (H - 2 * PY);

            const activeTabObj = CHART_TABS.find(t => t.key === tab) || CHART_TABS[0];
            const color = activeTabObj.color;

            const pts = data.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' L ');
            const areaPath = `M ${toX(0)},${toY(0)} L ${pts} L ${toX(N - 1)},${H - PY} L ${toX(0)},${H - PY} Z`;
            const linePath = `M ${pts}`;

            const gridLines = [0, 0.25, 0.5, 0.75, 1].map(pct => {
                const y = PY + pct * (H - 2 * PY);
                const val = ((1 - pct) * max).toFixed(tab === 'energy' ? 1 : 0);
                return `<line x1="${PX}" y1="${y.toFixed(1)}" x2="${W - 8}" y2="${y.toFixed(1)}" stroke="#e5e7eb" stroke-dasharray="2 4"/>
                         <text x="${PX - 4}" y="${(y + 3).toFixed(1)}" text-anchor="end" font-size="9" fill="#9ca3af" font-family="monospace">${val}</text>`;
            }).join('');

            const labels = this.activeRange === '7d'
                ? ['L', 'M', 'X', 'J', 'V', 'S', 'D']
                : ['00h', '03h', '06h', '09h', '12h', '15h', '18h', '21h', '24h'];

            const ticks = labels.map((lbl, i, a) => {
                const x = PX + (i / (a.length - 1)) * (W - PX - 8);
                return `<text x="${x.toFixed(1)}" y="${H - 3}" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="monospace">${lbl}</text>`;
            }).join('');

            const markerI = Math.round(N * 0.605);
            const cx = toX(markerI).toFixed(1);
            const cy = toY(data[markerI]).toFixed(1);

            return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="${color}" stop-opacity="0.18"/>
                    <stop offset="100%" stop-color="${color}" stop-opacity="0.01"/>
                  </linearGradient>
                </defs>
                ${gridLines}
                ${ticks}
                <path d="${areaPath}" fill="url(#areaGrad)"/>
                <path d="${linePath}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round"/>
                <line x1="${cx}" y1="${PY}" x2="${cx}" y2="${H - PY}" stroke="#6b7280" stroke-dasharray="2 3" stroke-width="1"/>
                <circle cx="${cx}" cy="${cy}" r="3.5" fill="white" stroke="${color}" stroke-width="2"/>
            </svg>`;
        },

        occStrip() {
            if (!this.selectedSpace) return [];
            const cap = this.selectedSpace.sensors.occupancy?.capacity || 32;
            return Array.from({ length: 48 }, (_, i) => {
                const t = i / 47;
                const v = cap * 0.9 * Math.max(0, Math.sin((t - 0.3) / 0.4 * Math.PI));
                return v > cap * 0.1;
            });
        },
    },

    methods: {
        async loadSpaces() {
            try {
                const response = await this.service.getSpaces();
                this.spaces = response.data;
                if (this.spaces.length) {
                    this.selectedSpace = this.spaces.find(s => s.id === 'A-203') || this.spaces[0];
                }
            } catch (err) {
                console.error('Error cargando espacios IoT', err);
            }
        },

        selectSpace(space) {
            this.selectedSpace = space;
            this.activeTab = 'occupancy';
        },

        markerPct(key, sensorData) {
            const meta = SENSOR_META[key];
            if (!meta || sensorData.value === null) return 0;
            return Math.min(100, Math.max(0, meta.getMarkerPct(sensorData)));
        },

        maxLabel(key, sensorData) {
            const meta = SENSOR_META[key];
            if (!meta) return '';
            return typeof meta.maxLabel === 'function' ? meta.maxLabel(sensorData) : meta.maxLabel;
        },

        formatSensorValue(key, sensorData) {
            const meta = SENSOR_META[key];
            if (!meta) return '—';
            return meta.formatValue(sensorData);
        },

        formatSensorUnit(key, sensorData) {
            const meta = SENSOR_META[key];
            if (!meta) return '';
            return meta.formatUnit(sensorData);
        },

        statusLabel(status) {
            return { ok: 'óptimo', warn: 'atención', danger: 'crítico', off: 'offline' }[status] || status;
        },

        rssiQuality(rssi) {
            if (rssi === null) return 'sin señal';
            if (rssi >= -60) return 'excelente';
            if (rssi >= -70) return 'buena';
            return 'débil';
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
        <h1 class="page-title">Monitoreo IoT</h1>
        <div class="page-sub">
          {{ onlineCount }} dispositivos online ·
          <span :class="alertCount > 0 ? 'text-warn' : 'text-ok'">{{ alertCount }} alertas activas</span>
          · datos simulados (Sprint 1)
        </div>
      </div>
      <div class="head-actions">
        <span class="live-pill"><span class="live-dot"></span> live · mock</span>
        <pv-button label="Configurar umbrales" size="small" outlined />
        <pv-button label="+ Vincular dispositivo" size="small" />
      </div>
    </div>

    <!-- Layout principal -->
    <div class="monitor-layout">

      <!-- Panel izquierdo: lista de espacios -->
      <pv-card class="rooms-card">
        <template #content>
          <div class="rooms-header">
            <span class="rooms-title">Espacios</span>
            <span class="rooms-count">{{ spaces.length }} total</span>
          </div>
          <div class="rooms-filter">
            <pv-input-text
              v-model="filterText"
              placeholder="Filtrar A-203, LAB-22…"
              class="filter-input"
              size="small"
            />
          </div>
          <div class="room-list">
            <div
              v-for="space in filteredSpaces"
              :key="space.id"
              class="room-row"
              :class="[`row-${space.status}`, { 'row-active': selectedSpace?.id === space.id }]"
              @click="selectSpace(space)"
            >
              <span class="led" :class="`led-${space.status}`"></span>
              <div class="room-info">
                <div class="room-id">{{ space.id }}</div>
                <div class="room-meta">{{ space.meta }}</div>
              </div>
              <span class="room-temp">
                {{ space.temperature !== null ? space.temperature + ' °C' : '—' }}
              </span>
            </div>
            <div v-if="filteredSpaces.length === 0" class="rooms-empty">
              Sin resultados para "{{ filterText }}"
            </div>
          </div>
        </template>
      </pv-card>

      <!-- Panel derecho: detalle del espacio -->
      <pv-card v-if="selectedSpace" class="detail-card">
        <template #content>

          <!-- Header del espacio -->
          <div class="detail-head">
            <div class="detail-tile">{{ selectedSpace.id.slice(0, 2).toUpperCase() }}</div>
            <div class="detail-info">
              <h2 class="detail-name">{{ selectedSpace.name }}</h2>
              <div class="detail-sub">
                {{ selectedSpace.location }}
                <span v-if="selectedSpace.session"> · {{ selectedSpace.session }}</span>
              </div>
            </div>
            <div class="detail-status">
              <span class="status-pill" :class="`pill-${selectedSpace.status}`">
                <span class="led" :class="`led-${selectedSpace.status}`"></span>
                {{ statusLabel(selectedSpace.status) }}
                <span v-if="selectedSpace.status === 'warn'"> · {{ selectedSpace.meta }}</span>
              </span>
              <pv-button label="Histórico" size="small" outlined class="ml-2" />
            </div>
          </div>

          <!-- Grid de sensores (3x2) -->
          <div class="sensor-grid">
            <div
              v-for="sensor in sensorList"
              :key="sensor.key"
              class="sensor-cell"
              :class="{ 'sensor-warn': sensor.data.deltaStatus === 'warn', 'sensor-danger': sensor.data.deltaStatus === 'danger' }"
            >
              <div class="sensor-label">
                <i :class="sensor.meta.icon" class="sensor-icon"></i>
                {{ sensor.meta.label }}
              </div>

              <div v-if="sensor.data.value !== null" class="sensor-value">
                {{ formatSensorValue(sensor.key, sensor.data) }}
                <span class="sensor-unit">{{ formatSensorUnit(sensor.key, sensor.data) }}</span>
              </div>
              <div v-else class="sensor-value sensor-offline">—</div>

              <div
                class="sensor-delta"
                :class="{
                  'delta-warn':   sensor.data.deltaStatus === 'warn',
                  'delta-danger': sensor.data.deltaStatus === 'danger',
                  'delta-ok':     sensor.data.deltaStatus === 'ok',
                }"
              >{{ sensor.data.delta }}</div>

              <!-- Barra de umbral -->
              <div v-if="sensor.data.value !== null" class="threshold-bar">
                <div class="bar-track">
                  <div
                    v-for="zone in sensor.meta.zones"
                    :key="zone.color + zone.from"
                    class="bar-zone"
                    :class="`zone-${zone.color}`"
                    :style="{ left: zone.from + '%', width: (zone.to - zone.from) + '%' }"
                  ></div>
                  <div
                    class="bar-marker"
                    :style="{ left: markerPct(sensor.key, sensor.data) + '%' }"
                  ></div>
                </div>
                <div class="bar-range">
                  <span>{{ sensor.meta.minLabel }}</span>
                  <span>{{ maxLabel(sensor.key, sensor.data) }}</span>
                </div>
              </div>
              <div v-else class="threshold-bar-empty">sin datos · dispositivo offline</div>
            </div>
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

          <!-- Gráfico SVG -->
          <div class="chart-area" v-html="chartSvg"></div>

          <!-- Strip de ocupación (últimas lecturas binarias) -->
          <div class="occ-strip">
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
              <div class="device-key">Dispositivo</div>
              <div class="device-val">{{ selectedSpace.deviceCode }}</div>
            </div>
            <div class="device-item">
              <div class="device-key">Firmware</div>
              <div class="device-val">{{ selectedSpace.firmware }}</div>
            </div>
            <div class="device-item">
              <div class="device-key">RSSI</div>
              <div class="device-val" :class="{ 'val-ok': selectedSpace.rssi >= -65 }">
                {{ selectedSpace.rssi }} dBm · {{ rssiQuality(selectedSpace.rssi) }}
              </div>
            </div>
            <div class="device-item">
              <div class="device-key">Última lectura</div>
              <div class="device-val" :class="{ 'val-ok': selectedSpace.status !== 'off' }">
                {{ selectedSpace.lastReadingTime }} · hace {{ selectedSpace.lastReadingAgo }}
              </div>
            </div>
          </div>

          <!-- Log de eventos -->
          <div class="events-header">
            <span class="events-title">Eventos recientes</span>
            <span class="events-count">últimas 6 h</span>
          </div>
          <div class="events-list">
            <div v-for="(ev, i) in selectedSpace.events" :key="i" class="event-row">
              <span class="ev-time">{{ ev.time }}</span>
              <span class="ev-tag" :class="`tag-${ev.type}`">{{ ev.type }}</span>
              <span class="ev-msg">{{ ev.msg }}</span>
              <span class="ev-val">{{ ev.value }}</span>
            </div>
            <div v-if="!selectedSpace.events || selectedSpace.events.length === 0" class="events-empty">
              Sin eventos registrados
            </div>
          </div>

        </template>
      </pv-card>

      <!-- Estado vacío si no hay espacio seleccionado -->
      <pv-card v-else class="detail-card detail-empty">
        <template #content>
          <div class="empty-state">
            <i class="pi pi-wifi" style="font-size: 3rem; color: #d1d5db;"></i>
            <p>Selecciona un espacio para ver el detalle de sus sensores</p>
          </div>
        </template>
      </pv-card>

    </div>
  </div>
</template>

<style scoped>
/* Layout general */
.iot-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

/* Cabecera */
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

.live-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #16a34a;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-family: monospace;
  font-weight: 500;
}

.live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #22c55e;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}

/* Monitor layout */
.monitor-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 16px;
  align-items: start;
}

@media (max-width: 1000px) {
  .monitor-layout { grid-template-columns: 1fr; }
}

/* Panel de lista de espacios */
.rooms-card :deep(.p-card-body) { padding: 0; }
.rooms-card :deep(.p-card-content) { padding: 0; }

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
.row-danger.row-active { background: #fef2f2 !important; border-left-color: #ef4444; }

.room-info { min-width: 0; }
.room-id   { font-size: 13px; font-weight: 500; color: #111827; }
.room-meta { font-size: 11px; color: #9ca3af; font-family: monospace; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.room-temp { font-family: monospace; font-size: 12px; color: #6b7280; white-space: nowrap; }

.rooms-empty {
  padding: 24px;
  text-align: center;
  color: #9ca3af;
  font-size: 12px;
}

/* LED dots */
.led {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.led-ok     { background: #22c55e; }
.led-warn   { background: #f59e0b; }
.led-danger { background: #ef4444; }
.led-off    { background: #d1d5db; }

/* Panel de detalle */
.detail-card :deep(.p-card-body)   { padding: 0; }
.detail-card :deep(.p-card-content){ padding: 0; }

.detail-head {
  display: grid;
  grid-template-columns: 48px 1fr auto;
  gap: 14px;
  padding: 18px 20px;
  border-bottom: 1px solid #f3f4f6;
  align-items: center;
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
  flex-shrink: 0;
}

.detail-name { font-size: 20px; font-weight: 700; margin: 0 0 4px; color: #111827; }
.detail-sub  { font-size: 12px; color: #6b7280; }

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
.pill-danger { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; }
.pill-off    { background: #f9fafb; border: 1px solid #e5e7eb; color: #6b7280; }

/* Grid de sensores */
.sensor-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-bottom: 1px solid #f3f4f6;
}

.sensor-cell {
  padding: 16px 20px;
  border-right: 1px solid #f3f4f6;
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.1s;
}

.sensor-cell:nth-child(3n) { border-right: none; }
.sensor-cell:nth-last-child(-n+3) { border-bottom: none; }

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

/* Barra de umbral */
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

/* Tabs de gráfico */
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

.tab-active {
  color: #111827;
  font-weight: 500;
  border-bottom-color: #6366f1;
}

.tab-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

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

.range-active {
  background: #f3f4f6 !important;
  color: #111827 !important;
  font-weight: 600;
}

/* Gráfico */
.chart-area {
  height: 200px;
  padding: 12px 16px 4px;
  overflow: hidden;
}

/* Tira de ocupación */
.occ-strip {
  display: flex;
  gap: 2px;
  padding: 0 20px 10px;
  height: 20px;
}

.occ-bit {
  flex: 1;
  background: #f3f4f6;
  border-radius: 2px;
}

.occ-on { background: #818cf8; }

/* Footer del dispositivo */
.device-footer {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 12px 20px;
  background: #fafafa;
  border-top: 1px solid #f3f4f6;
  font-size: 12px;
}

.device-key {
  font-family: monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #9ca3af;
  margin-bottom: 3px;
}

.device-val {
  font-family: monospace;
  font-weight: 500;
  color: #374151;
  font-size: 11px;
}

.val-ok { color: #16a34a; }

/* Eventos */
.events-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px 8px;
  border-top: 1px solid #f3f4f6;
}

.events-title { font-size: 13px; font-weight: 600; color: #374151; }
.events-count { font-family: monospace; font-size: 11px; color: #9ca3af; }

.events-list { padding-bottom: 4px; }

.event-row {
  display: grid;
  grid-template-columns: 72px 52px 1fr auto;
  gap: 10px;
  padding: 8px 20px;
  border-top: 1px solid #f9fafb;
  align-items: center;
  font-family: monospace;
  font-size: 11px;
}

.ev-time { color: #9ca3af; }

.ev-tag {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-align: center;
}

.tag-ok     { background: #f0fdf4; color: #15803d; }
.tag-warn   { background: #fffbeb; color: #b45309; }
.tag-danger { background: #fef2f2; color: #b91c1c; }
.tag-info   { background: #eff6ff; color: #1d4ed8; }

.ev-msg  { font-family: inherit; font-size: 12px; color: #4b5563; font-family: system-ui, sans-serif; }
.ev-val  { color: #111827; font-weight: 500; white-space: nowrap; }

.events-empty {
  padding: 24px;
  text-align: center;
  color: #9ca3af;
  font-size: 12px;
}

/* Estado vacío */
.detail-empty :deep(.p-card-body) { padding: 0; }
.detail-empty :deep(.p-card-content) { padding: 0; }

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

.ml-2 { margin-left: 8px; }
</style>
