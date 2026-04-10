<template>
  <div class="report-resource">
    <h2>Report Resource</h2>
    <form @submit.prevent="submitForm" class="report-form">
      <div class="form-group">
        <label class="fixed-label" for="kind_of_report">Type of Issue</label>
        <pv-select
            id="kind_of_report"
            v-model="form.kind_of_report"
            :options="reportTypes"
            class="w-full"
            placeholder="Select issue type"
        />
      </div>

      <div class="form-group">
        <pv-float-label>
          <pv-textarea
              id="description"
              v-model="form.description"
              autoResize
              rows="5"
              required
              placeholder=" "
          />
          <label for="description" class="float-label">Description</label>
        </pv-float-label>
      </div>

      <div class="form-group">
        <pv-date-picker
            id="created_at"
            v-model="form.createdAt"
            dateFormat="yy-mm-dd"
            showIcon
        />
        <label for="created_at" class="fixed-label">Created At</label>
      </div>

      <pv-button
          type="submit"
          label="Create report"
          icon="pi pi-check"
          class="submit-button"
      />
    </form>
  </div>
</template>

<script>
import {mapGetters} from 'vuex';
import {ReportService} from "../services/report.service.js";

export default {
  data() {
    return {
      form: {
        kind_of_report: '',
        description: '',
        resourceId: null,
        createdAt: new Date(),
        status: 'string'
      },
      reportTypes: [
        'Hardware Failure',
        'Software Issue',
        'Physical Damage',
        'Malfunction',
        'Maintenance Required',
        'Connectivity Problem',
        'Missing Equipment',
        'Electrical Issue',
        'Safety Concern',
        'Other'
      ],
      reportService: new ReportService(),
    };
  },
  created() {
    this.form.resourceId = parseInt(this.$route.params.resourceId);
  },
  computed: {
    ...mapGetters('user', ['userId']),
  },
  methods: {
    async submitForm() {
      const reportData = {
        kindOfReport: this.form.kind_of_report,
        description: this.form.description,
        resourceId: this.form.resourceId,
        createdAt: this.formatDate(this.form.createdAt),
        status: this.form.status
      };

      try {
        await this.reportService.create(reportData);
        this.$router.push('/dashboard-teacher/breakdown-reports/classrooms');
      } catch (error) {
        console.error("Error al crear el reporte:", error);
        this.$toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear el reporte. Inténtalo de nuevo.',
          life: 3000
        });
      }
    },
    formatDate(date) {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');

      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.229Z`;
    }
  },
};
</script>

<style scoped>
.report-resource {
  max-width: 700px;
  margin: 50px auto;
  padding: 40px;
  border-radius: 20px;
  background: linear-gradient(135deg, #f0f8ff, #ffffff);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  font-size: 2.8rem;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 30px;
  position: relative;
}

h2::after {
  content: '';
  display: block;
  width: 80px;
  height: 4px;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  margin: 15px auto;
  border-radius: 4px;
}

.report-form {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.form-group {
  position: relative;
}

:deep(.p-inputtext),
:deep(.p-textarea),
:deep(.p-datepicker),
:deep(.p-select) {
  width: 100%;
  padding: 14px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1.1rem;
  transition: all 0.2s ease;
  background-color: #fff;
}

:deep(.p-inputtext:focus),
:deep(.p-textarea:focus),
:deep(.p-datepicker:focus),
:deep(.p-select:focus) {
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

:deep(.p-select .p-select-label) {
  padding: 0;
}

.float-label {
  position: absolute;
  left: 14px;
  top: 14px;
  font-size: 1.1rem;
  color: #7f8c8d;
  transition: 0.2s ease all;
  pointer-events: none;
}

:deep(.p-inputtext:focus) + .float-label,
:deep(.p-inputtext:not(:placeholder-shown)) + .float-label,
:deep(.p-textarea:focus) + .float-label,
:deep(.p-textarea:not(:placeholder-shown)) + .float-label {
  top: -10px;
  font-size: 0.9rem;
  color: #3498db;
  background-color: #fff;
  padding: 0 5px;
}

.fixed-label {
  position: absolute;
  top: -25px;
  left: 14px;
  font-size: 1.1rem;
  color: #3498db;
}

:deep(.submit-button) {
  padding: 14px;
  font-size: 1.2rem;
  font-weight: bold;
  border-radius: 12px;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  border: none;
  color: #fff;
  transition: all 0.2s ease;
  cursor: pointer;
}

:deep(.submit-button:hover) {
  background: linear-gradient(90deg, #2980b9, #27ae60);
  transform: translateY(-2px);
  box-shadow: 0 7px 20px rgba(0, 0, 0, 0.2);
}

:deep(.p-datepicker) {
  border-radius: 12px;
  overflow: hidden;
}

:deep(.p-datepicker-trigger) {
  border-top-right-radius: 12px;
  border-bottom-right-radius: 12px;
}

@media (max-width: 768px) {
  .report-resource {
    padding: 30px;
    margin: 30px auto;
  }

  h2 {
    font-size: 2.2rem;
  }
}
</style>