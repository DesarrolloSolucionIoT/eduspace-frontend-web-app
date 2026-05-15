<script>
import {mapGetters} from "vuex";
import TeacherCardComponent from "../../personal-data/components/teacher-card.component.vue";
import {TeacherService} from "../../personal-data/services/teacher.service.js";
import http from "../../shared/services/http-common.js";
import MeetingCard from "../../meeting-management/components/meeting-card.vue";
import MeetCreateAndEditDialog from "../../meeting-management/components/meet-create-and-edit.component.vue";
import {Meet} from "../../meeting-management/model/meet.entity.js";
import {MeetService} from "../../meeting-management/services/meet.service.js";
import {ClassroomService} from "../../shared/services/classroom.service.js";
import {AdministratorsService} from "../../meeting-management/services/administrators.service.js";
import {IotMonitoringService} from "../../iot-monitoring/services/iot-monitoring.service.js";

const MOCK_BREAKDOWNS = [
  { id: '#1487', space: 'A-206',   type: 'Proyector',   tech: 'J. Vega (T-3)',  status: 'danger', statusLabel: 'abierto',       sla: '02:18' },
  { id: '#1486', space: 'LAB-22',  type: 'A/C',         tech: 'R. Salas (T-1)', status: 'warn',   statusLabel: 'en curso',       sla: '14:42' },
  { id: '#1485', space: 'A-117',   type: 'Sensor IoT',  tech: '—',              status: 'info',   statusLabel: 'diagnosticando', sla: '08:11' },
  { id: '#1484', space: 'Sala-J-2',type: 'Iluminación', tech: 'L. Pino (T-2)', status: 'ok',     statusLabel: 'resuelto',       sla: '06:54' },
  { id: '#1483', space: 'A-209',   type: 'Cerradura',   tech: 'J. Vega (T-3)', status: 'ok',     statusLabel: 'resuelto',       sla: '04:02' },
];

function makeSpark(n, lo, hi, phase) {
  return Array.from({ length: n }, (_, i) =>
    lo + (hi - lo) * (0.5 + 0.5 * Math.sin(i / (phase || 3)) + 0.15 * Math.sin(i / 1.7))
  );
}

export default {
  name: "AdminDashboard",
  components: {
    TeacherCardComponent,
    MeetingCard,
    MeetCreateAndEditDialog,
  },
  data() {
    return {
      admin: null,
      meetings: [],
      teachers: [],
      reports: [],
      meet: new Meet({}),
      meetService: null,
      classroomsService: null,
      administratorsService: null,
      createAndEditDialogIsVisible: false,
      isEdit: false,
      submitted: false,
      // IoT
      iotSpaces: [],
      iotService: null,
      floorTypeFilter: 'all',
      iotBreakdowns: MOCK_BREAKDOWNS,
    };
  },
  computed: {
    ...mapGetters("user", ["userId", "userRole", "userToken"]),
    initials() {
      if (!this.admin) return "NA";
      const { firstName = "", lastName = "" } = this.admin;
      return `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();
    },

    // ── IoT computed ──────────────────────────────────────────────────────────
    iotOnlineCount() {
      return this.iotSpaces.filter(s => s.status !== 'off').length;
    },
    iotAlertCount() {
      return this.iotSpaces.filter(s => s.status === 'warn' || s.status === 'danger').length;
    },
    iotAvgOccupancy() {
      const online = this.iotSpaces.filter(
        s => s.status !== 'off' && s.sensors?.occupancy?.capacity && s.sensors.occupancy.value !== null
      );
      if (!online.length) return '—';
      const sum = online.reduce((acc, s) => {
        const { value, capacity } = s.sensors.occupancy;
        return acc + (value / capacity) * 100;
      }, 0);
      return (sum / online.length).toFixed(1);
    },
    iotTotalEnergy() {
      return this.iotSpaces
        .filter(s => s.sensors?.energy?.value !== null)
        .reduce((acc, s) => acc + (s.sensors.energy.value || 0), 0)
        .toFixed(1);
    },
    iotAlertsFeed() {
      return this.iotSpaces
        .filter(s => s.status === 'warn' || s.status === 'danger')
        .map(s => ({
          id: s.id,
          name: s.name,
          status: s.status,
          meta: s.meta,
          event: s.events?.[0] || null,
        }));
    },
    filteredFloorSpaces() {
      if (this.floorTypeFilter === 'all') return this.iotSpaces;
      const prefixes = {
        classrooms: ['A-'],
        labs: ['LAB'],
        common: ['Bib', 'Sala', 'POL', 'AUD'],
      }[this.floorTypeFilter] || [];
      return this.iotSpaces.filter(s => prefixes.some(p => s.id.startsWith(p)));
    },
    buildingUtilization() {
      const groups = [
        { name: 'Edif. A',     prefixes: ['A-'] },
        { name: 'Laboratorios',prefixes: ['LAB'] },
        { name: 'Biblioteca',  prefixes: ['Bib'] },
        { name: 'Salas Junta', prefixes: ['Sala'] },
        { name: 'Polideport.', prefixes: ['POL'] },
        { name: 'Auditorio',   prefixes: ['AUD'] },
      ];
      return groups.map(({ name, prefixes }) => {
        const spaces = this.iotSpaces.filter(s => prefixes.some(p => s.id.startsWith(p)));
        const online = spaces.filter(
          s => s.status !== 'off' && s.sensors?.occupancy?.capacity && s.sensors.occupancy.value !== null
        );
        if (!online.length) return { name, pct: 0 };
        const sum = online.reduce((acc, s) => {
          const { value, capacity } = s.sensors.occupancy;
          return acc + (value / capacity) * 100;
        }, 0);
        return { name, pct: Math.round(sum / online.length) };
      });
    },
    iotSensorHealth() {
      return this.iotSpaces
        .filter(s => s.deviceCode)
        .slice(0, 8)
        .map(s => ({
          device: s.deviceCode,
          space: s.id,
          type: 'amb + occ',
          reading: s.status === 'off' ? '—' : `hace ${s.lastReadingAgo}`,
          uptime: s.status === 'off' ? '—' : (s.rssi >= -65 ? '99.6%' : s.rssi >= -70 ? '96.1%' : '93.2%'),
          status: s.status,
        }));
    },
    iotTelemetryData() {
      const N = 96;
      const labels = Array.from({ length: N }, (_, i) => {
        const h = Math.floor(i / 4);
        const m = (i % 4) * 15;
        return i % 16 === 0 ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}` : '';
      });
      const s1 = Array.from({ length: N }, (_, i) => {
        const t = i / N;
        let v = 0;
        if (t >= 0.29 && t < 0.46) v += 80 * Math.sin((t - 0.29) / 0.17 * Math.PI);
        if (t >= 0.54 && t < 0.71) v += 100 * Math.sin((t - 0.54) / 0.17 * Math.PI);
        if (t >= 0.75 && t < 0.875) v += 68 * Math.sin((t - 0.75) / 0.125 * Math.PI);
        v += 1.5 * Math.sin(i / 2.8);
        return Math.max(0, Math.round(v));
      });
      const s2 = Array.from({ length: N }, (_, i) =>
        +(19 + 6 * Math.sin(i / 10) + (i > 40 && i < 70 ? 4 : 0)).toFixed(1)
      );
      const s3 = Array.from({ length: N }, (_, i) =>
        Math.round(500 + 600 * Math.max(0, Math.sin((i - 22) / 14)))
      );
      return {
        labels,
        datasets: [
          { label: 'Ocupación (%)', data: s1, borderColor: '#6366f1', backgroundColor: '#6366f122', fill: true, tension: 0.4, pointRadius: 0, borderWidth: 1.8 },
          { label: 'Temperatura (°C)', data: s2, borderColor: '#38bdf8', backgroundColor: 'transparent', fill: false, tension: 0.4, pointRadius: 0, borderWidth: 1.8 },
          { label: 'CO₂ (ppm)', data: s3, borderColor: '#f59e0b', backgroundColor: 'transparent', fill: false, tension: 0.4, pointRadius: 0, borderWidth: 1.8 },
        ],
      };
    },
    iotTelemetryOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { font: { family: 'monospace', size: 11 }, color: '#6b7280', boxWidth: 12 },
          },
          tooltip: { mode: 'index', intersect: false },
        },
        scales: {
          x: {
            grid: { color: '#f3f4f6' },
            ticks: { font: { family: 'monospace', size: 10 }, color: '#9ca3af', maxTicksLimit: 7, maxRotation: 0 },
          },
          y: {
            grid: { color: '#f3f4f6' },
            ticks: { font: { family: 'monospace', size: 10 }, color: '#9ca3af' },
          },
        },
      };
    },
    kpiSparkOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false },
        },
        elements: { point: { radius: 0 } },
      };
    },
    kpiSparkData() {
      const makeDs = (values, color) => ({
        labels: values.map((_, i) => i),
        datasets: [{ data: values, borderColor: color, backgroundColor: 'transparent', tension: 0.4, borderWidth: 1.5 }],
      });
      return [
        makeDs(makeSpark(28, 50, 80, 4), '#6366f1'),
        makeDs(makeSpark(28, 280, 380, 5).map((v, i) => v - i * 1.4), '#38bdf8'),
        makeDs(makeSpark(28, 2, 9, 3), '#f59e0b'),
        makeDs(makeSpark(28, 8, 18, 4).map((v, i) => v - i * 0.05), '#22c55e'),
      ];
    },
  },
  async mounted() {
    try {
      if (!this.userId) return;

      const adminResponse = await http.get("/administrator-profiles");
      this.admin = adminResponse.data.find(
        (a) => Number(a.id) === Number(this.userId)
      );
      if (!this.admin) return;

      this.meetService = new MeetService();
      this.classroomsService = new ClassroomService();
      this.administratorsService = new AdministratorsService();

      await this.loadMeetings();
      this.teachers = await TeacherService.fetchTeachers();

      const reportsResponse = await http.get("/reports");
      this.reports = reportsResponse.data || [];
    } catch (error) {
      console.error("Error loading admin dashboard", error);
    }

    // IoT — always loads from mock, independent of auth
    this.iotService = new IotMonitoringService();
    const { data } = await this.iotService.getSpaces();
    this.iotSpaces = data;
  },

  methods: {
    notifySuccessfulAction(message) {
      if (this.$toast)
        this.$toast.add({ severity: "success", summary: "Success", detail: message, life: 3000 });
    },
    notifyErrorAction(message) {
      if (this.$toast)
        this.$toast.add({ severity: "error", summary: "Error", detail: message, life: 3000 });
    },
    async loadMeetings() {
      try {
        const [meetingsResponse, classroomsResponse, administratorsResponse] =
          await Promise.all([
            this.meetService.getAll(),
            this.classroomsService.getAll(),
            this.administratorsService.getAllAdministrators(),
          ]);

        const meetingsData = meetingsResponse.data;
        const allClassrooms = classroomsResponse.data;
        const allAdministrators = administratorsResponse.data;

        const mapped = meetingsData.map((meetData) => {
          const classroom =
            allClassrooms.find((c) => c.id === meetData.classroomId?.classroomIdentifier) || meetData.classroomId;
          const administrator =
            allAdministrators.find((a) => a.id === meetData.administratorId?.administratorIdentifier) || meetData.administratorId;
          return new Meet({
            meetingId: meetData.meetingId,
            title: meetData.title,
            description: meetData.description,
            date: meetData.date,
            start: meetData.start,
            end: meetData.end,
            classroom,
            administrator,
            teachers: meetData.teachers || [],
          });
        });

        const adminId = this.admin?.id ?? this.admin?.administratorIdentifier ?? null;
        const adminFullName = `${this.admin?.firstName || ""} ${this.admin?.lastName || ""}`.trim();
        const matchesAdmin = (mAdmin) => {
          if (!mAdmin) return false;
          if (typeof mAdmin === "object") {
            const mid = mAdmin.id ?? mAdmin.administratorIdentifier ?? mAdmin.administratorId ?? null;
            const mName = mAdmin.name ? mAdmin.name : `${mAdmin.firstName || ""} ${mAdmin.lastName || ""}`.trim();
            if (mid && adminId && String(mid) === String(adminId)) return true;
            return !!(mName && adminFullName && mName === adminFullName);
          }
          return String(mAdmin) === String(adminId) || String(mAdmin) === adminFullName;
        };

        this.meetings = mapped.filter((m) => matchesAdmin(m.administrator));
        if (!this.meetings.length && mapped.length) this.meetings = mapped;
      } catch (error) {
        console.error("Error loading meetings in admin home", error);
        this.notifyErrorAction("Could not load meetings");
      }
    },
    onSaveRequested(payload) {
      this.submitted = true;
      if (this.isEdit) this.updateMeet(payload);
      else this.createMeet(payload);
    },
    async createMeet(payload) {
      try {
        const createResponse = await this.meetService.create(payload.administratorId, payload.classroomId, payload.meetData);
        const newMeeting = createResponse.data;
        if (payload.teacherIds?.length) {
          await Promise.all(payload.teacherIds.map(tid => this.meetService.addTeacherToMeeting(newMeeting.meetingId, tid)));
        }
        await this.loadMeetings();
        this.notifySuccessfulAction("Meet Created Successfully");
      } catch (error) {
        console.error("Error creating meet from admin home", error);
        this.notifyErrorAction("An error occurred while creating the meet.");
      } finally {
        this.createAndEditDialogIsVisible = false;
      }
    },
    async updateMeet(payload) {
      try {
        payload.meetData.administratorId = this.meet.administrator?.id;
        payload.meetData.classroomId = this.meet.classroom?.id;
        await this.meetService.update(this.meet.id, payload.meetData);
        await this.loadMeetings();
        this.notifySuccessfulAction("Meet Updated Successfully");
      } catch (error) {
        console.error("Error updating meet from admin home", error);
        this.notifyErrorAction("An error occurred while updating the meet.");
      } finally {
        this.createAndEditDialogIsVisible = false;
      }
    },
    formatDate(dateString) {
      if (!dateString) return "N/A";
      return new Date(dateString).toLocaleDateString("es-ES", { year: "numeric", month: "2-digit", day: "2-digit" });
    },
    iotStatusLabel(status) {
      return { ok: 'óptimo', warn: 'atención', danger: 'crítico', off: 'offline' }[status] || status;
    },
    alertIcon(status) {
      return status === 'danger' ? 'pi pi-times-circle' : 'pi pi-exclamation-triangle';
    },
    utilBarClass(pct) {
      if (pct >= 85) return 'util-bar-fill util-fill-danger';
      if (pct >= 70) return 'util-bar-fill util-fill-warn';
      return 'util-bar-fill util-fill-ok';
    },
  },
};
</script>

<template>
  <div>
  <div class="dashboard-layout">

    <!-- ── Perfil del administrador ──────────────────────────────────────── -->
    <div class="admin-info">
      <div class="admin-avatar">
        <pv-avatar
          :label="initials || 'NA'"
          size="xlarge"
          style="background-color: #2196f3; color: white; font-size: 30px"
        />
      </div>
      <div class="admin-details">
        <p><strong>Name:</strong> {{ admin?.firstName || "Not available" }}</p>
        <p><strong>Last Name:</strong> {{ admin?.lastName || "Not available" }}</p>
        <p><strong>Cell Phone:</strong> {{ admin?.phone || "Not available" }}</p>
        <p><strong>Status:</strong> Admin</p>
        <p><strong>Email:</strong> {{ admin?.email || "Not available" }}</p>
      </div>
    </div>

    <!-- ── Profesores, Reuniones, Reportes ──────────────────────────────── -->
    <pv-card class="teachers-card scrollable-card">
      <template #header>
        <div class="card-header-content">
          <i class="pi pi-users header-icon"></i>
          <h3 class="card-title">Teachers Created</h3>
        </div>
      </template>
      <template #content>
        <div v-if="teachers.length" class="teacher-list">
          <TeacherCardComponent v-for="teacher in teachers" :key="teacher.id" :teacher="teacher" :compact="true" />
        </div>
        <div v-else class="empty-state">
          <i class="pi pi-users empty-icon"></i>
          <p>No teachers have been created yet.</p>
        </div>
      </template>
    </pv-card>

    <pv-card class="meet-card scrollable-card">
      <template #header>
        <div class="card-header-content">
          <i class="pi pi-calendar header-icon"></i>
          <h3 class="card-title">Meetings in Charge</h3>
        </div>
      </template>
      <template #content>
        <div v-if="meetings.length">
          <div class="cards-grid">
            <MeetingCard v-for="meeting in meetings" :key="meeting.id" :meeting="meeting" :compact="true" />
          </div>
        </div>
        <div v-else class="empty-state">
          <i class="pi pi-calendar empty-icon"></i>
          <p>No meetings assigned to this administrator.</p>
        </div>
      </template>
    </pv-card>

    <pv-card class="reports-card scrollable-card">
      <template #header>
        <div class="card-header-content">
          <i class="pi pi-file header-icon"></i>
          <h3 class="card-title">Reports</h3>
        </div>
      </template>
      <template #content>
        <div v-if="reports.length">
          <ul class="reports-list">
            <li v-for="(report, index) in reports" :key="index" class="report-item">
              <div class="report-row">
                <span class="report-label">Type:</span>
                <span class="report-value">{{ report.kindOfReport }}</span>
              </div>
              <div class="report-row">
                <span class="report-label">Description:</span>
                <span class="report-value">{{ report.description }}</span>
              </div>
              <div class="report-row">
                <span class="report-label">Resource ID:</span>
                <span class="report-value">{{ report.resourceId }}</span>
              </div>
              <div class="report-row">
                <span class="report-label">Created At:</span>
                <span class="report-value">{{ formatDate(report.createdAt) }}</span>
              </div>
              <div class="report-row">
                <span class="report-label">Status:</span>
                <span class="report-value" :class="'status-' + report.status.toLowerCase()">{{ report.status }}</span>
              </div>
              <hr v-if="index < reports.length - 1" class="report-divider" />
            </li>
          </ul>
        </div>
        <div v-else class="empty-state">
          <i class="pi pi-file empty-icon"></i>
          <p>No reports have been created.</p>
        </div>
      </template>
    </pv-card>

    <!-- ════════════════════════════════════════════════════════════════════
         IoT SECTION
         ════════════════════════════════════════════════════════════════════ -->
    <div class="iot-section-header">
      <div class="iot-section-title">
        <i class="pi pi-wifi" style="font-size: 18px; color: #6366f1;"></i>
        <span>Monitoreo IoT — Campus</span>
        <span class="iot-sub">datos simulados · Sprint 1</span>
      </div>
      <router-link to="/dashboard-admin/iot-monitoring" class="iot-detail-link">
        Vista detallada →
      </router-link>
    </div>

    <!-- KPI strip -->
    <div class="kpi-strip">
      <div class="kpi-card">
        <div class="kpi-label">Ocupación promedio</div>
        <div class="kpi-value">{{ iotAvgOccupancy }}<span class="kpi-unit">%</span></div>
        <div class="kpi-delta kpi-up">▲ 4.2 pp <span class="kpi-muted">vs semana ant.</span></div>
        <div class="kpi-spark">
          <pv-chart type="line" :data="kpiSparkData[0]" :options="kpiSparkOptions" style="width:100%;height:32px;" />
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Consumo eléctrico</div>
        <div class="kpi-value">{{ iotTotalEnergy }}<span class="kpi-unit">kWh / h</span></div>
        <div class="kpi-delta kpi-down">▼ 24.1% <span class="kpi-muted">vs trim. ant.</span></div>
        <div class="kpi-spark">
          <pv-chart type="line" :data="kpiSparkData[1]" :options="kpiSparkOptions" style="width:100%;height:32px;" />
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Alertas abiertas</div>
        <div class="kpi-value kpi-warn">{{ iotAlertCount }}<span class="kpi-unit">activas</span></div>
        <div class="kpi-delta" style="color: #f59e0b;">▲ 2 <span class="kpi-muted">últimas 24 h</span></div>
        <div class="kpi-spark">
          <pv-chart type="line" :data="kpiSparkData[2]" :options="kpiSparkOptions" style="width:100%;height:32px;" />
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Sensores online</div>
        <div class="kpi-value">{{ iotOnlineCount }}<span class="kpi-unit">/ {{ iotSpaces.length }}</span></div>
        <div class="kpi-delta kpi-up">▼ 3.1 min <span class="kpi-muted">MTTR averías</span></div>
        <div class="kpi-spark">
          <pv-chart type="line" :data="kpiSparkData[3]" :options="kpiSparkOptions" style="width:100%;height:32px;" />
        </div>
      </div>
    </div>

    <!-- Mapa de espacios + Feed de alertas -->
    <div class="overview-row">

      <!-- Floor map -->
      <div class="iot-card floor-card">
        <div class="iot-card-head">
          <span class="iot-card-title">Estado de espacios en tiempo real</span>
          <span class="iot-tag">// IoT Monitoring</span>
        </div>
        <div class="floor-filter-bar">
          <div class="seg-control">
            <button :class="{ 'seg-active': floorTypeFilter === 'all' }"       @click="floorTypeFilter = 'all'">Todos</button>
            <button :class="{ 'seg-active': floorTypeFilter === 'classrooms' }" @click="floorTypeFilter = 'classrooms'">Aulas</button>
            <button :class="{ 'seg-active': floorTypeFilter === 'labs' }"       @click="floorTypeFilter = 'labs'">Laboratorios</button>
            <button :class="{ 'seg-active': floorTypeFilter === 'common' }"     @click="floorTypeFilter = 'common'">Áreas comunes</button>
          </div>
          <span class="floor-count-tag">{{ filteredFloorSpaces.length }} espacios / {{ iotOnlineCount }} sensores online</span>
        </div>

        <div class="floor-grid">
          <div
            v-for="space in filteredFloorSpaces"
            :key="space.id"
            class="room-tile"
            :class="`tile-${space.status}`"
            @click="$router.push('/dashboard-admin/iot-monitoring')"
          >
            <div class="tile-top">
              <span class="tile-id">{{ space.id }}</span>
              <span class="tile-led" :class="`led-${space.status}`"></span>
            </div>
            <span class="tile-temp">{{ space.temperature !== null && space.temperature !== undefined ? space.temperature + '°' : '—' }}</span>
          </div>
        </div>

        <div class="map-legend">
          <span><span class="ld ld-ok"></span>óptimo ({{ iotSpaces.filter(s => s.status === 'ok').length }})</span>
          <span><span class="ld ld-warn"></span>atención ({{ iotSpaces.filter(s => s.status === 'warn').length }})</span>
          <span><span class="ld ld-danger"></span>crítico ({{ iotSpaces.filter(s => s.status === 'danger').length }})</span>
          <span><span class="ld ld-off"></span>sin uso ({{ iotSpaces.filter(s => s.status === 'off').length }})</span>
        </div>
      </div>

      <!-- Alertas feed -->
      <div class="iot-card alerts-card">
        <div class="iot-card-head">
          <span class="iot-card-title">Alertas activas</span>
          <span class="alert-badge" :class="iotAlertCount > 0 ? 'badge-danger' : 'badge-ok'">
            <span class="led-sm" :class="iotAlertCount > 0 ? 'led-danger' : 'led-ok'"></span>
            {{ iotAlertCount }}
          </span>
        </div>
        <div class="alerts-list">
          <div
            v-for="alert in iotAlertsFeed"
            :key="alert.id"
            class="alert-row"
            :class="`alert-${alert.status}`"
          >
            <span class="alert-led" :class="`led-${alert.status}`"></span>
            <div class="alert-body">
              <div class="alert-who">{{ alert.name }} — {{ alert.id }}</div>
              <div class="alert-meta">{{ alert.meta }}</div>
            </div>
            <span class="alert-ts">{{ alert.event?.time || '—' }}</span>
          </div>
          <div v-if="iotAlertsFeed.length === 0" class="alerts-empty">
            <i class="pi pi-check-circle" style="color: #22c55e;"></i>
            Sin alertas activas
          </div>
        </div>
      </div>
    </div>

    <!-- Gráfica de telemetría agregada -->
    <div class="iot-card telemetry-card">
      <div class="iot-card-head">
        <span class="iot-card-title">Telemetría agregada — últimas 24 h</span>
        <span class="iot-tag">// IoT</span>
        <div class="telemetry-legend">
          <span class="tleg-item"><span class="tleg-dot" style="background:#6366f1"></span>Ocupación</span>
          <span class="tleg-item"><span class="tleg-dot" style="background:#38bdf8"></span>Temperatura</span>
          <span class="tleg-item"><span class="tleg-dot" style="background:#f59e0b"></span>CO₂</span>
        </div>
      </div>
      <div class="telemetry-chart">
        <pv-chart type="line" :data="iotTelemetryData" :options="iotTelemetryOptions" style="width:100%;height:100%;" />
      </div>
    </div>

    <!-- Uso por edificio + Salud de sensores -->
    <div class="bottom-row">

      <!-- Uso por edificio -->
      <div class="iot-card util-card">
        <div class="iot-card-head">
          <span class="iot-card-title">Uso por edificio · últimos 7 días</span>
          <span class="iot-tag">// Reporting</span>
        </div>
        <div class="util-list">
          <div v-for="b in buildingUtilization" :key="b.name" class="util-row">
            <span class="util-name">{{ b.name }}</span>
            <div class="util-bar-track">
              <div :class="utilBarClass(b.pct)" :style="{ width: b.pct + '%' }"></div>
            </div>
            <span class="util-pct">{{ b.pct }}%</span>
          </div>
        </div>
      </div>

      <!-- Salud de sensores -->
      <div class="iot-card sensor-health-card">
        <div class="iot-card-head">
          <span class="iot-card-title">Salud de sensores</span>
          <span class="iot-tag">// Devices</span>
          <span class="alert-badge badge-ok" style="margin-left: auto;">
            <span class="led-sm led-ok"></span>
            {{ iotOnlineCount }} online · {{ iotSpaces.length - iotOnlineCount }} offline
          </span>
        </div>
        <div class="iot-table-wrap">
          <table class="iot-table">
            <thead>
              <tr>
                <th>Device</th>
                <th>Espacio</th>
                <th>Tipo</th>
                <th>Lectura</th>
                <th class="num">Uptime</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in iotSensorHealth" :key="s.device">
                <td class="code">{{ s.device }}</td>
                <td>{{ s.space }}</td>
                <td class="muted">{{ s.type }}</td>
                <td>
                  <span v-if="s.status === 'off'" class="tpill tpill-off">{{ s.reading }}</span>
                  <span v-else-if="s.status === 'warn'" class="tpill tpill-warn">{{ s.reading }}</span>
                  <span v-else>{{ s.reading }}</span>
                </td>
                <td class="num code">{{ s.uptime }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Averías recientes -->
    <div class="iot-card breakdowns-card">
      <div class="iot-card-head">
        <span class="iot-card-title">Averías recientes</span>
        <span class="iot-tag">// Breakdown Mgmt</span>
      </div>
      <div class="iot-table-wrap">
        <table class="iot-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Espacio</th>
              <th>Tipo</th>
              <th>Técnico</th>
              <th>Estado</th>
              <th class="num">SLA</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in iotBreakdowns" :key="b.id">
              <td class="code muted">{{ b.id }}</td>
              <td>{{ b.space }}</td>
              <td>{{ b.type }}</td>
              <td>{{ b.tech }}</td>
              <td>
                <span class="tpill" :class="`tpill-${b.status}`">
                  <span class="led-sm" :class="`led-${b.status}`"></span>
                  {{ b.statusLabel }}
                </span>
              </td>
              <td class="num code">{{ b.sla }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>

  <meet-create-and-edit-dialog
    :item="meet"
    :visible="createAndEditDialogIsVisible"
    :edit="isEdit"
    @update:visible="(value) => (createAndEditDialogIsVisible = value)"
    @save-requested="onSaveRequested"
  />
  </div>
</template>

<style scoped>
/* ── Layout principal ───────────────────────────────────────────────────── */
.dashboard-layout {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  padding: 20px;
}

/* ── Admin info ─────────────────────────────────────────────────────────── */
.admin-info {
  grid-column: span 3;
  background: linear-gradient(135deg, rgba(255, 210, 0, 0.4) 0%, rgba(255, 223, 77, 0.3) 100%);
  padding: 25px;
  border-radius: 20px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 25px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.admin-avatar { grid-column: 1 / 2; }
.admin-details {
  grid-column: 2 / 3;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.admin-details p { margin: 0; font-size: 14px; color: #333; }

/* ── Tarjetas existentes ────────────────────────────────────────────────── */
.scrollable-card {
  height: 450px;
  overflow-y: auto;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.scrollable-card:hover { transform: translateY(-4px); box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15); }
.teachers-card { background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); }
.meet-card     { background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); }
.reports-card  { background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%); }
.card-header-content { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 16px; }
.header-icon { font-size: 24px; color: #2196f3; }
.teachers-card .header-icon { color: #1976d2; }
.meet-card .header-icon     { color: #388e3c; }
.reports-card .header-icon  { color: #7b1fa2; }
.card-title { margin: 0; font-size: 20px; font-weight: 600; color: #333; }
.teacher-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; padding: 16px; }
.cards-grid   { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; padding: 16px; }
.empty-state  { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; color: #666; }
.empty-icon   { font-size: 48px; color: #bbb; margin-bottom: 16px; }
.empty-state p { font-size: 16px; margin: 0; }
.reports-list { list-style: none; padding: 16px; margin: 0; }
.report-item  { padding: 16px; background: white; border-radius: 12px; margin-bottom: 12px; }
.report-row   { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; }
.report-label { font-weight: 600; color: #555; font-size: 14px; }
.report-value { color: #333; font-size: 14px; text-align: right; }
.report-divider { border: none; border-top: 1px solid #e0e0e0; margin: 12px 0; }
.scrollable-card::-webkit-scrollbar { width: 8px; }
.scrollable-card::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); border-radius: 10px; }
.scrollable-card::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 10px; }
.scrollable-card::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.3); }

/* ══════════════════════════════════════════════════════════════════════════
   IoT SECTION
   ══════════════════════════════════════════════════════════════════════════ */

/* Cabecera de sección */
.iot-section-header {
  grid-column: span 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0 4px;
  border-top: 2px solid #e5e7eb;
  margin-top: 8px;
}
.iot-section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}
.iot-sub {
  font-family: monospace;
  font-size: 11px;
  color: #9ca3af;
  font-weight: 400;
}
.iot-detail-link {
  font-size: 12px;
  font-family: monospace;
  color: #6366f1;
  text-decoration: none;
  padding: 5px 12px;
  border: 1px solid #c7d2fe;
  border-radius: 6px;
  background: #eef2ff;
  transition: background 0.15s;
}
.iot-detail-link:hover { background: #e0e7ff; }

/* KPI strip */
.kpi-strip {
  grid-column: span 3;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
.kpi-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 18px 20px 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.kpi-label  { font-size: 12px; color: #6b7280; margin-bottom: 6px; }
.kpi-value  { font-size: 28px; font-weight: 700; font-family: monospace; color: #111827; line-height: 1.1; }
.kpi-warn   { color: #f59e0b; }
.kpi-unit   { font-size: 13px; font-weight: 400; color: #9ca3af; margin-left: 4px; }
.kpi-delta  { font-size: 11px; font-family: monospace; margin-top: 6px; color: #6b7280; }
.kpi-up     { color: #16a34a; }
.kpi-down   { color: #2563eb; }
.kpi-muted  { color: #9ca3af; font-weight: 400; }
.kpi-spark  { margin-top: 8px; }

/* Overview row: floor map + alerts */
.overview-row {
  grid-column: span 3;
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
}

/* IoT card base */
.iot-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.iot-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border-bottom: 1px solid #f3f4f6;
  flex-wrap: wrap;
}
.iot-card-title { font-size: 14px; font-weight: 600; color: #111827; }
.iot-tag {
  font-family: monospace;
  font-size: 10px;
  color: #9ca3af;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 2px 6px;
}

/* Floor filter bar */
.floor-filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-bottom: 1px solid #f3f4f6;
  flex-wrap: wrap;
}
.seg-control {
  display: inline-flex;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}
.seg-control button {
  padding: 5px 12px;
  border: 0;
  border-right: 1px solid #e5e7eb;
  background: #fafafa;
  font-family: inherit;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  transition: background 0.1s;
}
.seg-control button:last-child { border-right: 0; }
.seg-control button:hover { background: #f3f4f6; }
.seg-active { background: white !important; color: #111827 !important; font-weight: 500; }
.floor-count-tag { margin-left: auto; font-family: monospace; font-size: 11px; color: #9ca3af; }

/* Floor grid */
.floor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 4px;
  padding: 12px 14px;
}
.room-tile {
  aspect-ratio: 1.2 / 1;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 7px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: #fafafa;
  cursor: pointer;
  transition: transform 0.1s, border-color 0.1s;
  text-decoration: none;
}
.room-tile:hover { transform: translateY(-1px); border-color: #d1d5db; }
.tile-top { display: flex; justify-content: space-between; align-items: center; }
.tile-id  { font-family: monospace; font-size: 10px; font-weight: 500; color: #374151; }
.tile-led { width: 6px; height: 6px; border-radius: 50%; }
.tile-temp { font-family: monospace; font-size: 10px; color: #6b7280; }
.tile-ok     { background: #f0fdf4; border-color: #bbf7d0; }
.tile-warn   { background: #fffbeb; border-color: #fde68a; }
.tile-danger { background: #fef2f2; border-color: #fecaca; }
.tile-off    { opacity: 0.5; }

/* LEDs */
.led-ok     { background: #22c55e; }
.led-warn   { background: #f59e0b; }
.led-danger { background: #ef4444; }
.led-off    { background: #d1d5db; }
.led-info   { background: #3b82f6; }
.led-sm {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Map legend */
.map-legend {
  display: flex;
  gap: 14px;
  padding: 8px 16px 12px;
  font-size: 11px;
  font-family: monospace;
  color: #9ca3af;
  flex-wrap: wrap;
}
.map-legend span { display: inline-flex; align-items: center; gap: 5px; }
.ld { width: 7px; height: 7px; border-radius: 50%; }
.ld-ok     { background: #22c55e; }
.ld-warn   { background: #f59e0b; }
.ld-danger { background: #ef4444; }
.ld-off    { background: #d1d5db; }

/* Alerts feed */
.alerts-card { display: flex; flex-direction: column; }
.alert-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  font-family: monospace;
}
.badge-danger { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; }
.badge-ok     { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; }
.alerts-list { flex: 1; overflow-y: auto; max-height: 340px; }
.alert-row {
  display: grid;
  grid-template-columns: 10px 1fr auto;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid #f9fafb;
  align-items: start;
}
.alert-row:last-child { border-bottom: 0; }
.alert-led { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
.alert-who  { font-size: 13px; font-weight: 500; color: #111827; }
.alert-meta { font-family: monospace; font-size: 11px; color: #9ca3af; margin-top: 2px; }
.alert-ts   { font-family: monospace; font-size: 11px; color: #9ca3af; white-space: nowrap; }
.alert-warn   .alert-led { background: #f59e0b; }
.alert-danger .alert-led { background: #ef4444; }
.alerts-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 10px;
  color: #9ca3af;
  font-size: 13px;
}

/* Telemetry chart */
.telemetry-card { grid-column: span 3; }
.telemetry-legend {
  margin-left: auto;
  display: flex;
  gap: 14px;
  font-family: monospace;
  font-size: 11px;
  color: #6b7280;
}
.tleg-item { display: inline-flex; align-items: center; gap: 6px; }
.tleg-dot  { width: 8px; height: 8px; border-radius: 50%; }
.telemetry-chart { height: 180px; padding: 12px 16px 4px; }

/* Bottom row */
.bottom-row {
  grid-column: span 3;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* Building utilization */
.util-list { padding: 8px 0; }
.util-row {
  display: grid;
  grid-template-columns: 110px 1fr 44px;
  gap: 12px;
  padding: 9px 16px;
  align-items: center;
  border-bottom: 1px solid #f9fafb;
}
.util-row:last-child { border-bottom: 0; }
.util-name  { font-size: 13px; font-weight: 500; color: #374151; }
.util-pct   { font-family: monospace; font-size: 12px; color: #6b7280; text-align: right; }
.util-bar-track {
  height: 8px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
}
.util-bar-fill  { height: 100%; border-radius: 4px; transition: width 0.4s ease; }
.util-fill-ok     { background: #86efac; }
.util-fill-warn   { background: #fcd34d; }
.util-fill-danger { background: #fca5a5; }

/* Sensor health */
.sensor-health-card { display: flex; flex-direction: column; }

/* Tables */
.iot-table-wrap { overflow-x: auto; }
.iot-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.iot-table thead tr { border-bottom: 1px solid #e5e7eb; }
.iot-table th {
  padding: 10px 16px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: #fafafa;
}
.iot-table td {
  padding: 10px 16px;
  border-bottom: 1px solid #f9fafb;
  color: #374151;
}
.iot-table tbody tr:last-child td { border-bottom: 0; }
.iot-table tbody tr:hover td { background: #fafafa; }
.code  { font-family: monospace; font-size: 11px; }
.muted { color: #9ca3af; }
.num   { text-align: right; }

/* Pills en tablas */
.tpill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}
.tpill-ok     { background: #f0fdf4; color: #15803d; }
.tpill-warn   { background: #fffbeb; color: #b45309; }
.tpill-danger { background: #fef2f2; color: #b91c1c; }
.tpill-info   { background: #eff6ff; color: #1d4ed8; }
.tpill-off    { background: #f9fafb; color: #6b7280; }

/* Breakdowns */
.breakdowns-card { grid-column: span 3; }

/* Responsive */
@media (max-width: 1100px) {
  .kpi-strip       { grid-template-columns: repeat(2, 1fr); }
  .overview-row    { grid-template-columns: 1fr; }
  .bottom-row      { grid-template-columns: 1fr; }
}
</style>
