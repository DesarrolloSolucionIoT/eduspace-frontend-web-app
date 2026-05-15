<script>
import { IotMonitoringService } from '../services/iot-monitoring.service.js';
import { IotSpace } from '../model/iot-space.entity.js';
import SpaceSensorCard from '../components/space-sensor-card.component.vue';

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

function generateSeries(tab, space, N) {
    const cap = space.sensors?.occupancy?.capacity || 32;
    return Array.from({ length: N }, (_, i) => {
        const t = i / (N - 1);
        if (tab === 'occupancy') {
            let v = 0;
            if (t >= 0.28 && t < 0.46) v += cap * 0.9 * Math.sin((t - 0.28) / 0.18 * Math.PI);
            if (t >= 0.54 && t < 0.72) v += cap * 1.0 * Math.sin((t - 0.54) / 0.18 * Math.PI);
            if (t >= 0.75 && t < 0.88) v += cap * 0.70 * Math.sin((t - 0.75) / 0.13 * Math.PI);
            v += 0.8 * Math.sin(i / 2.5);
            return Math.max(0, Math.min(cap, Math.round(v)));
        }
        if (tab === 'temperature') {
            const base = space.sensors?.temperature?.value || 22;
            return +(base - 3 + 5 * Math.sin(t * Math.PI * 2.4 + 0.3) + 1.2 * Math.sin(i / 4)).toFixed(1);
        }
        if (tab === 'co2') {
            const base = space.sensors?.co2?.value || 700;
            return Math.round(420 + (base - 420) * Math.max(0, Math.sin(t * Math.PI * 1.8 - 0.2)) + 40 * Math.sin(i / 6));
        }
        if (tab === 'humidity') {
            const base = space.sensors?.humidity?.value || 55;
            return +(base - 8 + 12 * Math.sin(t * Math.PI * 1.5 + 0.8) + 2 * Math.sin(i / 5)).toFixed(1);
        }
        return 0;
    });
}

function makeTimeLabels(range) {
    if (range === '7d') return ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    if (range === '1h') return Array.from({ length: 12 }, (_, i) => `${i * 5}m`);
    const hours = range === '24h'
        ? ['00h', '03h', '06h', '09h', '12h', '15h', '18h', '21h', '24h']
        : ['00h', '01h', '02h', '03h', '04h', '05h', '06h', '07h', '08h'];
    return hours;
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
            activeTab: 'occupancy',
            activeRange: '8h',
            chartTabs: CHART_TABS,
            rangeOptions: RANGE_OPTIONS,
        };
    },

    computed: {
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
            return this.spaces.filter(s => s.status === 'warn' || s.status === 'danger').length;
        },

        sensorList() {
            if (!this.selectedSpace) return [];
            return SENSOR_ORDER.map(key => {
                const raw = this.selectedSpace.sensors?.[key];
                const data = raw || { value: null, capacity: null, delta: '—', deltaStatus: 'neutral' };
                return { key, meta: SENSOR_META[key], data };
            });
        },

        chartData() {
            if (!this.selectedSpace) return { labels: [], datasets: [] };
            const N = this.activeRange === '1h' ? 12 : this.activeRange === '7d' ? 7 : 96;
            const tab = this.activeTab;
            const tabObj = CHART_TABS.find(t => t.key === tab) || CHART_TABS[0];
            const values = generateSeries(tab, this.selectedSpace, N);
            const labels = makeTimeLabels(this.activeRange);

            const labelStep = Math.max(1, Math.floor(N / (labels.length - 1)));
            const fullLabels = Array.from({ length: N }, (_, i) => {
                const idx = Math.round(i / labelStep);
                return idx < labels.length ? labels[idx] : '';
            });

            return {
                labels: fullLabels,
                datasets: [{
                    label: tabObj.label,
                    data: values,
                    borderColor: tabObj.color,
                    backgroundColor: tabObj.color + '22',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    borderWidth: 2,
                }],
            };
        },

        chartOptions() {
            const tab = this.activeTab;
            const tabObj = CHART_TABS.find(t => t.key === tab) || CHART_TABS[0];
            return {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 300 },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            title: (items) => items[0]?.label || '',
                            label: (item) => ` ${tabObj.label}: ${item.raw}`,
                        },
                    },
                },
                scales: {
                    x: {
                        grid: { color: '#f3f4f6' },
                        ticks: {
                            font: { family: 'monospace', size: 10 },
                            color: '#9ca3af',
                            maxTicksLimit: 9,
                            maxRotation: 0,
                        },
                    },
                    y: {
                        grid: { color: '#f3f4f6' },
                        ticks: {
                            font: { family: 'monospace', size: 10 },
                            color: '#9ca3af',
                        },
                    },
                },
            };
        },

        occStrip() {
            if (!this.selectedSpace) return [];
            const cap = this.selectedSpace.sensors?.occupancy?.capacity || 32;
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
                this.spaces = (response.data || []).map(raw => new IotSpace(raw));
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

        statusLabel(status) {
            return { ok: 'óptimo', warn: 'atención', danger: 'crítico', off: 'offline' }[status] || status;
        },

        rssiQuality(rssi) {
            if (rssi === null || rssi === undefined) return 'sin señal';
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
              :class="[`row-${space.status}`, { 'row-active': selectedSpace && selectedSpace.id === space.id }]"
              @click="selectSpace(space)"
            >
              <span class="led" :class="`led-${space.status}`"></span>
              <div class="room-info">
                <div class="room-id">{{ space.id }}</div>
                <div class="room-meta">{{ space.meta }}</div>
              </div>
              <span class="room-temp">
                {{ space.temperature !== null && space.temperature !== undefined ? space.temperature + ' °C' : '—' }}
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
              type="line"
              :data="chartData"
              :options="chartOptions"
              style="width:100%; height:100%;"
            />
          </div>

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

      <!-- Estado vacío -->
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
.row-danger.row-active { background: #fef2f2 !important; border-left-color: #ef4444; }

.room-info { min-width: 0; }
.room-id   { font-size: 13px; font-weight: 500; color: #111827; }
.room-meta { font-size: 11px; color: #9ca3af; font-family: monospace; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.room-temp { font-family: monospace; font-size: 12px; color: #6b7280; white-space: nowrap; }

.rooms-empty { padding: 24px; text-align: center; color: #9ca3af; font-size: 12px; }

/* LEDs */
.led { display: inline-block; width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.led-ok     { background: #22c55e; }
.led-warn   { background: #f59e0b; }
.led-danger { background: #ef4444; }
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

/* Sensor grid */
.sensor-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-bottom: 1px solid #f3f4f6;
}

.sensor-grid > *:nth-child(3n)        { border-right: none; }
.sensor-grid > *:nth-last-child(-n+3) { border-bottom: none; }

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
  grid-template-columns: repeat(4, 1fr);
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

/* Events */
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

.ev-msg { font-size: 12px; color: #4b5563; font-family: system-ui, sans-serif; }
.ev-val { color: #111827; font-weight: 500; white-space: nowrap; }

.events-empty { padding: 24px; text-align: center; color: #9ca3af; font-size: 12px; }

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

.ml-2 { margin-left: 8px; }
</style>
