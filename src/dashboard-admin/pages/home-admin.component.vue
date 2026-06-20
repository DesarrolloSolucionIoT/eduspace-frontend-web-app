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

const TELEMETRY_BUCKETS = 48;

const avg = (arr) => (arr.length ? arr.reduce((a, c) => a + c, 0) / arr.length : null);

// Map a backend report status (free text) to one of our pill color buckets.
function reportStatusToPill(status) {
  const s = String(status || '').toLowerCase();
  if (/(resol|cerr|clos|done|complet)/.test(s)) return 'ok';
  if (/(proces|progres|curso|asign|atend)/.test(s)) return 'warn';
  if (/(pend|abier|open|nuev|new)/.test(s)) return 'danger';
  return 'info';
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
    // % of online spaces currently reporting presence (occupancyPresent === true).
    iotAvgOccupancy() {
      const online = this.iotSpaces.filter(
        s => s.status !== 'off' && s.occupancyPresent !== null && s.occupancyPresent !== undefined
      );
      if (!online.length) return '—';
      const occupied = online.filter(s => s.occupancyPresent).length;
      return ((occupied / online.length) * 100).toFixed(0);
    },
    // Average temperature (°C) across online spaces with a reading.
    iotAvgTemp() {
      const temps = this.iotSpaces
        .filter(s => s.status !== 'off' && s.temperature !== null && s.temperature !== undefined)
        .map(s => s.temperature);
      return temps.length ? avg(temps).toFixed(1) : '—';
    },
    // Average humidity (%) across online spaces — shown as the temp KPI sub-metric.
    iotAvgHumidity() {
      const hums = this.iotSpaces
        .filter(s => s.status !== 'off' && s.humidity !== null && s.humidity !== undefined)
        .map(s => s.humidity);
      return hums.length ? Math.round(avg(hums)) : null;
    },
    iotAlertsFeed() {
      return this.iotSpaces
        .filter(s => s.status === 'warn' || s.status === 'danger')
        .map(s => ({
          id: s.deviceId || s.id,
          name: s.name,
          status: s.status,
          meta: [
            s.temperature !== null && s.temperature !== undefined ? `${s.temperature}°C` : null,
            s.humidity !== null && s.humidity !== undefined ? `${Math.round(s.humidity)}%` : null,
          ].filter(Boolean).join(' · ') || (s.zoneId || s.deviceId || ''),
          time: s.recordedAt ? new Date(s.recordedAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false }) : '—',
        }));
    },
    filteredFloorSpaces() {
      if (this.floorTypeFilter === 'all') return this.iotSpaces;
      const needles = {
        classrooms: ['aula', 'a-', 'classroom'],
        labs: ['lab'],
        common: ['bib', 'sala', 'pol', 'aud', 'common', 'comun'],
      }[this.floorTypeFilter] || [];
      return this.iotSpaces.filter(s => {
        const hay = `${s.id} ${s.name}`.toLowerCase();
        return needles.some(n => hay.includes(n));
      });
    },
    buildingUtilization() {
      const groups = [
        { name: 'Aulas',        needles: ['aula', 'a-', 'classroom'] },
        { name: 'Laboratorios', needles: ['lab'] },
        { name: 'Biblioteca',   needles: ['bib'] },
        { name: 'Salas Junta',  needles: ['sala'] },
        { name: 'Polideport.',  needles: ['pol'] },
        { name: 'Auditorio',    needles: ['aud'] },
      ];
      return groups.map(({ name, needles }) => {
        const spaces = this.iotSpaces.filter(s => {
          const hay = `${s.id} ${s.name}`.toLowerCase();
          return needles.some(n => hay.includes(n));
        });
        const online = spaces.filter(
          s => s.status !== 'off' && s.occupancyPresent !== null && s.occupancyPresent !== undefined
        );
        if (!online.length) return { name, pct: 0 };
        const occupied = online.filter(s => s.occupancyPresent).length;
        return { name, pct: Math.round((occupied / online.length) * 100) };
      }).filter(g => this.iotSpaces.some(s => {
        const hay = `${s.id} ${s.name}`.toLowerCase();
        return groups.find(gr => gr.name === g.name).needles.some(n => hay.includes(n));
      }));
    },
    iotSensorHealth() {
      return this.iotSpaces
        .filter(s => s.deviceId)
        .slice(0, 8)
        .map(s => ({
          device: s.deviceId,
          space: s.name,
          type: 'amb + occ',
          reading: s.status === 'off' || !s.recordedAt
            ? '—'
            : new Date(s.recordedAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false }),
          uptime: this.iotStatusLabel(s.status),
          status: s.status,
        }));
    },
    // Real reports surfaced in the "recent reports" table (replaces the old mock).
    iotBreakdownRows() {
      return (this.reports || []).slice(0, 8).map((r, i) => ({
        id: r.id != null ? `#${r.id}` : `#${i + 1}`,
        resource: r.resourceId != null ? String(r.resourceId) : '—',
        type: r.kindOfReport || '—',
        status: reportStatusToPill(r.status),
        statusLabel: r.status || '—',
        date: r.createdAt ? this.formatDate(r.createdAt) : '—',
      }));
    },
    // Aggregate every space's real history into evenly spaced time buckets so the
    // campus-wide telemetry chart reflects actual readings, not synthetic curves.
    iotAggregatedHistory() {
      const pts = [];
      for (const s of this.iotSpaces) {
        for (const h of (s.history || [])) {
          if (!h.recordedAt) continue;
          const t = new Date(h.recordedAt).getTime();
          if (Number.isNaN(t)) continue;
          pts.push({
            t,
            temp: h.temperature ?? null,
            hum: h.humidity ?? null,
            occ: (h.occupancyPresent === null || h.occupancyPresent === undefined) ? null : (h.occupancyPresent ? 1 : 0),
          });
        }
      }
      if (!pts.length) return { labels: [], occ: [], temp: [], hum: [], hasData: false };

      pts.sort((a, b) => a.t - b.t);
      const min = pts[0].t;
      const max = pts[pts.length - 1].t;
      const span = Math.max(1, max - min);
      const step = span / TELEMETRY_BUCKETS;
      const buckets = Array.from({ length: TELEMETRY_BUCKETS }, () => ({ temp: [], hum: [], occ: [] }));

      for (const p of pts) {
        let idx = Math.floor((p.t - min) / step);
        if (idx >= TELEMETRY_BUCKETS) idx = TELEMETRY_BUCKETS - 1;
        if (p.temp !== null) buckets[idx].temp.push(p.temp);
        if (p.hum !== null) buckets[idx].hum.push(p.hum);
        if (p.occ !== null) buckets[idx].occ.push(p.occ);
      }

      const multiDay = span > 2 * 24 * 3600e3;
      const labels = [], occ = [], temp = [], hum = [];
      for (let i = 0; i < TELEMETRY_BUCKETS; i++) {
        const mid = new Date(min + step * (i + 0.5));
        labels.push(i % 8 === 0
          ? (multiDay
            ? mid.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' })
            : mid.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false }))
          : '');
        const b = buckets[i];
        const tAvg = avg(b.temp);
        const hAvg = avg(b.hum);
        const oAvg = avg(b.occ);
        temp.push(tAvg === null ? null : +tAvg.toFixed(1));
        hum.push(hAvg === null ? null : Math.round(hAvg));
        occ.push(oAvg === null ? null : Math.round(oAvg * 100));
      }
      return { labels, occ, temp, hum, hasData: true };
    },
    iotHasTelemetry() {
      return this.iotAggregatedHistory.hasData;
    },
    iotTelemetryData() {
      const { labels, occ, temp, hum } = this.iotAggregatedHistory;
      return {
        labels,
        datasets: [
          { label: 'Ocupación (%)', data: occ, borderColor: '#6366f1', backgroundColor: '#6366f122', fill: true, tension: 0.4, pointRadius: 0, borderWidth: 1.8, spanGaps: true },
          { label: 'Temperatura (°C)', data: temp, borderColor: '#38bdf8', backgroundColor: 'transparent', fill: false, tension: 0.4, pointRadius: 0, borderWidth: 1.8, spanGaps: true },
          { label: 'Humedad (%)', data: hum, borderColor: '#a78bfa', backgroundColor: 'transparent', fill: false, tension: 0.4, pointRadius: 0, borderWidth: 1.8, spanGaps: true },
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
      const makeDs = (values, color) => {
        const clean = values.filter(v => v !== null && v !== undefined);
        return {
          labels: clean.map((_, i) => i),
          datasets: [{ data: clean, borderColor: color, backgroundColor: 'transparent', tension: 0.4, borderWidth: 1.5, spanGaps: true }],
        };
      };
      const { occ, temp, hum } = this.iotAggregatedHistory;
      return [
        makeDs(occ, '#6366f1'),
        makeDs(temp, '#38bdf8'),
        makeDs(hum, '#f59e0b'),
        makeDs(temp, '#22c55e'),
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
        this.$toast.add({ severity: "success", summary: this.$t('common.success'), detail: message, life: 3000 });
    },
    notifyErrorAction(message) {
      if (this.$toast)
        this.$toast.add({ severity: "error", summary: this.$t('common.error'), detail: message, life: 3000 });
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
        this.notifyErrorAction(this.$t('dashboardAdmin.home.toastLoadMeetingsError'));
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
        this.notifySuccessfulAction(this.$t('dashboardAdmin.home.toastMeetCreated'));
      } catch (error) {
        console.error("Error creating meet from admin home", error);
        this.notifyErrorAction(this.$t('dashboardAdmin.home.toastMeetCreateError'));
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
        this.notifySuccessfulAction(this.$t('dashboardAdmin.home.toastMeetUpdated'));
      } catch (error) {
        console.error("Error updating meet from admin home", error);
        this.notifyErrorAction(this.$t('dashboardAdmin.home.toastMeetUpdateError'));
      } finally {
        this.createAndEditDialogIsVisible = false;
      }
    },
    formatDate(dateString) {
      if (!dateString) return this.$t('dashboardAdmin.home.notAvailable');
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
        <p><strong>{{ $t('dashboardAdmin.home.name') }}:</strong> {{ admin?.firstName || $t('dashboardAdmin.home.notAvailable') }}</p>
        <p><strong>{{ $t('dashboardAdmin.home.lastName') }}:</strong> {{ admin?.lastName || $t('dashboardAdmin.home.notAvailable') }}</p>
        <p><strong>{{ $t('dashboardAdmin.home.cellPhone') }}:</strong> {{ admin?.phone || $t('dashboardAdmin.home.notAvailable') }}</p>
        <p><strong>{{ $t('dashboardAdmin.home.status') }}:</strong> {{ $t('dashboardAdmin.home.statusAdmin') }}</p>
        <p><strong>{{ $t('dashboardAdmin.home.email') }}:</strong> {{ admin?.email || $t('dashboardAdmin.home.notAvailable') }}</p>
      </div>
    </div>

    <!-- ── Profesores, Reuniones, Reportes ──────────────────────────────── -->
    <pv-card class="teachers-card scrollable-card">
      <template #header>
        <div class="card-header-content">
          <i class="pi pi-users header-icon"></i>
          <h3 class="card-title">{{ $t('dashboardAdmin.home.teachersCreated') }}</h3>
        </div>
      </template>
      <template #content>
        <div v-if="teachers.length" class="teacher-list">
          <TeacherCardComponent v-for="teacher in teachers" :key="teacher.id" :teacher="teacher" :compact="true" />
        </div>
        <div v-else class="empty-state">
          <i class="pi pi-users empty-icon"></i>
          <p>{{ $t('dashboardAdmin.home.noTeachers') }}</p>
        </div>
      </template>
    </pv-card>

    <pv-card class="meet-card scrollable-card">
      <template #header>
        <div class="card-header-content">
          <i class="pi pi-calendar header-icon"></i>
          <h3 class="card-title">{{ $t('dashboardAdmin.home.meetingsInCharge') }}</h3>
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
          <p>{{ $t('dashboardAdmin.home.noMeetings') }}</p>
        </div>
      </template>
    </pv-card>

    <pv-card class="reports-card scrollable-card">
      <template #header>
        <div class="card-header-content">
          <i class="pi pi-file header-icon"></i>
          <h3 class="card-title">{{ $t('dashboardAdmin.home.reports') }}</h3>
        </div>
      </template>
      <template #content>
        <div v-if="reports.length">
          <ul class="reports-list">
            <li v-for="(report, index) in reports" :key="index" class="report-item">
              <div class="report-row">
                <span class="report-label">{{ $t('dashboardAdmin.home.reportType') }}:</span>
                <span class="report-value">{{ report.kindOfReport }}</span>
              </div>
              <div class="report-row">
                <span class="report-label">{{ $t('dashboardAdmin.home.reportDescription') }}:</span>
                <span class="report-value">{{ report.description }}</span>
              </div>
              <div class="report-row">
                <span class="report-label">{{ $t('dashboardAdmin.home.reportResourceId') }}:</span>
                <span class="report-value">{{ report.resourceId }}</span>
              </div>
              <div class="report-row">
                <span class="report-label">{{ $t('dashboardAdmin.home.reportCreatedAt') }}:</span>
                <span class="report-value">{{ formatDate(report.createdAt) }}</span>
              </div>
              <div class="report-row">
                <span class="report-label">{{ $t('dashboardAdmin.home.reportStatus') }}:</span>
                <span class="report-value" :class="'status-' + report.status.toLowerCase()">{{ report.status }}</span>
              </div>
              <hr v-if="index < reports.length - 1" class="report-divider" />
            </li>
          </ul>
        </div>
        <div v-else class="empty-state">
          <i class="pi pi-file empty-icon"></i>
          <p>{{ $t('dashboardAdmin.home.noReports') }}</p>
        </div>
      </template>
    </pv-card>

    <!-- ════════════════════════════════════════════════════════════════════
         IoT SECTION
         ════════════════════════════════════════════════════════════════════ -->
    <div class="iot-section-header">
      <div class="iot-section-title">
        <i class="pi pi-wifi" style="font-size: 18px; color: #6366f1;"></i>
        <span>{{ $t('dashboardAdmin.iot.sectionTitle') }}</span>
        <span class="iot-sub">{{ $t('dashboardAdmin.iot.sectionSub') }}</span>
      </div>
      <router-link to="/dashboard-admin/iot-monitoring" class="iot-detail-link">
        {{ $t('dashboardAdmin.iot.detailedView') }}
      </router-link>
    </div>

    <!-- KPI strip -->
    <div class="kpi-strip">
      <div class="kpi-card">
        <div class="kpi-label">{{ $t('dashboardAdmin.iot.kpiAvgOccupancy') }}</div>
        <div class="kpi-value">{{ iotAvgOccupancy }}<span class="kpi-unit">%</span></div>
        <div class="kpi-delta kpi-muted">{{ $t('dashboardAdmin.iot.acrossOnline', { count: iotOnlineCount }) }}</div>
        <div class="kpi-spark">
          <pv-chart type="line" :data="kpiSparkData[0]" :options="kpiSparkOptions" style="width:100%;height:32px;" />
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">{{ $t('dashboardAdmin.iot.kpiAvgTemp') }}</div>
        <div class="kpi-value">{{ iotAvgTemp }}<span class="kpi-unit">°C</span></div>
        <div class="kpi-delta kpi-muted">
          <template v-if="iotAvgHumidity !== null">{{ $t('dashboardAdmin.iot.avgHumidity', { value: iotAvgHumidity }) }}</template>
          <template v-else>—</template>
        </div>
        <div class="kpi-spark">
          <pv-chart type="line" :data="kpiSparkData[1]" :options="kpiSparkOptions" style="width:100%;height:32px;" />
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">{{ $t('dashboardAdmin.iot.kpiOpenAlerts') }}</div>
        <div class="kpi-value kpi-warn">{{ iotAlertCount }}<span class="kpi-unit">{{ $t('dashboardAdmin.iot.active') }}</span></div>
        <div class="kpi-delta kpi-muted">{{ $t('dashboardAdmin.iot.alertSpaces', { count: iotAlertCount }) }}</div>
        <div class="kpi-spark">
          <pv-chart type="line" :data="kpiSparkData[2]" :options="kpiSparkOptions" style="width:100%;height:32px;" />
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">{{ $t('dashboardAdmin.iot.kpiOnlineSensors') }}</div>
        <div class="kpi-value">{{ iotOnlineCount }}<span class="kpi-unit">/ {{ iotSpaces.length }}</span></div>
        <div class="kpi-delta kpi-muted">{{ $t('dashboardAdmin.iot.totalSpaces', { count: iotSpaces.length }) }}</div>
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
          <span class="iot-card-title">{{ $t('dashboardAdmin.iot.spacesStatusTitle') }}</span>
          <span class="iot-tag">// IoT Monitoring</span>
        </div>
        <div class="floor-filter-bar">
          <div class="seg-control">
            <button :class="{ 'seg-active': floorTypeFilter === 'all' }"       @click="floorTypeFilter = 'all'">{{ $t('dashboardAdmin.iot.filterAll') }}</button>
            <button :class="{ 'seg-active': floorTypeFilter === 'classrooms' }" @click="floorTypeFilter = 'classrooms'">{{ $t('dashboardAdmin.iot.filterClassrooms') }}</button>
            <button :class="{ 'seg-active': floorTypeFilter === 'labs' }"       @click="floorTypeFilter = 'labs'">{{ $t('dashboardAdmin.iot.filterLabs') }}</button>
            <button :class="{ 'seg-active': floorTypeFilter === 'common' }"     @click="floorTypeFilter = 'common'">{{ $t('dashboardAdmin.iot.filterCommon') }}</button>
          </div>
          <span class="floor-count-tag">{{ $t('dashboardAdmin.iot.floorCount', { spaces: filteredFloorSpaces.length, online: iotOnlineCount }) }}</span>
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
          <span><span class="ld ld-ok"></span>{{ $t('dashboardAdmin.iot.legendOk') }} ({{ iotSpaces.filter(s => s.status === 'ok').length }})</span>
          <span><span class="ld ld-warn"></span>{{ $t('dashboardAdmin.iot.legendWarn') }} ({{ iotSpaces.filter(s => s.status === 'warn').length }})</span>
          <span><span class="ld ld-danger"></span>{{ $t('dashboardAdmin.iot.legendDanger') }} ({{ iotSpaces.filter(s => s.status === 'danger').length }})</span>
          <span><span class="ld ld-off"></span>{{ $t('dashboardAdmin.iot.legendOff') }} ({{ iotSpaces.filter(s => s.status === 'off').length }})</span>
        </div>
      </div>

      <!-- Alertas feed -->
      <div class="iot-card alerts-card">
        <div class="iot-card-head">
          <span class="iot-card-title">{{ $t('dashboardAdmin.iot.activeAlerts') }}</span>
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
            <span class="alert-ts">{{ alert.time || '—' }}</span>
          </div>
          <div v-if="iotAlertsFeed.length === 0" class="alerts-empty">
            <i class="pi pi-check-circle" style="color: #22c55e;"></i>
            {{ $t('dashboardAdmin.iot.noAlerts') }}
          </div>
        </div>
      </div>
    </div>

    <!-- Gráfica de telemetría agregada -->
    <div class="iot-card telemetry-card">
      <div class="iot-card-head">
        <span class="iot-card-title">{{ $t('dashboardAdmin.iot.telemetryTitle') }}</span>
        <span class="iot-tag">// IoT</span>
        <div class="telemetry-legend">
          <span class="tleg-item"><span class="tleg-dot" style="background:#6366f1"></span>{{ $t('dashboardAdmin.iot.occupancy') }}</span>
          <span class="tleg-item"><span class="tleg-dot" style="background:#38bdf8"></span>{{ $t('dashboardAdmin.iot.temperature') }}</span>
          <span class="tleg-item"><span class="tleg-dot" style="background:#a78bfa"></span>{{ $t('dashboardAdmin.iot.humidity') }}</span>
        </div>
      </div>
      <div class="telemetry-chart">
        <pv-chart v-if="iotHasTelemetry" type="line" :data="iotTelemetryData" :options="iotTelemetryOptions" style="width:100%;height:100%;" />
        <div v-else class="telemetry-empty">{{ $t('dashboardAdmin.iot.noTelemetry') }}</div>
      </div>
    </div>

    <!-- Uso por edificio + Salud de sensores -->
    <div class="bottom-row">

      <!-- Uso por edificio -->
      <div class="iot-card util-card">
        <div class="iot-card-head">
          <span class="iot-card-title">{{ $t('dashboardAdmin.iot.buildingUsageTitle') }}</span>
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
          <span class="iot-card-title">{{ $t('dashboardAdmin.iot.sensorHealthTitle') }}</span>
          <span class="iot-tag">// Devices</span>
          <span class="alert-badge badge-ok" style="margin-left: auto;">
            <span class="led-sm led-ok"></span>
            {{ $t('dashboardAdmin.iot.onlineOffline', { online: iotOnlineCount, offline: iotSpaces.length - iotOnlineCount }) }}
          </span>
        </div>
        <div class="iot-table-wrap">
          <table class="iot-table">
            <thead>
              <tr>
                <th>{{ $t('dashboardAdmin.iot.colDevice') }}</th>
                <th>{{ $t('dashboardAdmin.iot.colSpace') }}</th>
                <th>{{ $t('dashboardAdmin.iot.colType') }}</th>
                <th>{{ $t('dashboardAdmin.iot.colReading') }}</th>
                <th class="num">{{ $t('dashboardAdmin.iot.colUptime') }}</th>
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

    <!-- Reportes recientes (datos reales de /reports) -->
    <div class="iot-card breakdowns-card">
      <div class="iot-card-head">
        <span class="iot-card-title">{{ $t('dashboardAdmin.iot.recentReports') }}</span>
        <span class="iot-tag">// Reports</span>
      </div>
      <div class="iot-table-wrap">
        <table class="iot-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{{ $t('dashboardAdmin.iot.colResource') }}</th>
              <th>{{ $t('dashboardAdmin.iot.colType') }}</th>
              <th>{{ $t('dashboardAdmin.iot.colStatus') }}</th>
              <th class="num">{{ $t('dashboardAdmin.iot.colDate') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in iotBreakdownRows" :key="b.id">
              <td class="code muted">{{ b.id }}</td>
              <td>{{ b.resource }}</td>
              <td>{{ b.type }}</td>
              <td>
                <span class="tpill" :class="`tpill-${b.status}`">
                  <span class="led-sm" :class="`led-${b.status}`"></span>
                  {{ b.statusLabel }}
                </span>
              </td>
              <td class="num code">{{ b.date }}</td>
            </tr>
            <tr v-if="iotBreakdownRows.length === 0">
              <td colspan="5" class="muted" style="text-align:center; padding:24px;">{{ $t('dashboardAdmin.iot.noReports') }}</td>
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
.telemetry-empty {
  display: grid;
  place-items: center;
  height: 100%;
  color: #9ca3af;
  font-size: 12px;
  font-family: monospace;
}

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
