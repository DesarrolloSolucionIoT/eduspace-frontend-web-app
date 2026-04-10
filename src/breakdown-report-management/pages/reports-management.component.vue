<template>
  <div class="report-table-container">
    <pv-confirm-popup />
    <pv-toast />

    <div class="header-section">
      <h2 class="table-title">My Reports</h2>
      <p class="subtitle">Manage reported issues and breakdown status</p>
    </div>

    <div v-if="loading" class="loading-state">
      <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
    </div>

    <div v-else-if="reports.length === 0" class="empty-state">
      <i class="pi pi-file" style="font-size: 3rem; color: #ccc;"></i>
      <p>No reports found.</p>
    </div>

    <div v-else class="table-wrapper">
      <table>
        <thead>
        <tr>
          <th>Resource ID</th>
          <th>Type</th>
          <th>Description</th>
          <th>Date</th>
          <th>Status</th>
          <th class="text-center">Actions</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="report in reports" :key="report.id">
          <td class="resource-id">#{{ report.resourceId }}</td>
          <td class="font-medium">{{ report.kindOfReport }}</td>
          <td class="description-cell" :title="report.description">{{ report.description }}</td>
          <td>{{ formatDate(report.createdAt) }}</td>
          <td>
            <span :class="['status-badge', getStatusClass(report.status)]">
              {{ report.status }}
            </span>
          </td>
          <td>
            <div class="actions-cell">
              <pv-button
                icon="pi pi-refresh"
                text
                rounded
                severity="info"
                v-tooltip="'Toggle Status'"
                @click="toggleStatus(report)"
                :class="getStatusIconClass(report.status)"
              />

              <pv-button
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                v-tooltip="'Delete Report'"
                @click="confirmDelete($event, report)"
              />
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import {ReportService} from "../services/report.service.js";

export default {
  name: "reports-management",
  data() {
    return {
      reports: [],
      loading: true,
      reportService: new ReportService(),
    };
  },
  created() {
    this.fetchReports();
  },
  methods: {
    async fetchReports() {
      this.loading = true;
      try {
        const response = await this.reportService.getAll();
        this.reports = (response.data || []).map(report => ({
          ...report,
          resourceId: report.resourceId?.value || report.resourceId
        }));
      } catch (error) {
        console.error("Error fetching reports:", error);
        this.$toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load reports', life: 3000 });
      } finally {
        this.loading = false;
      }
    },

    confirmDelete(event, report) {
      this.$confirm.require({
        target: event.currentTarget,
        message: 'Do you want to delete this report?',
        icon: 'pi pi-info-circle',
        rejectClass: 'p-button-secondary p-button-outlined p-button-sm',
        acceptClass: 'p-button-danger p-button-sm',
        rejectLabel: 'Cancel',
        acceptLabel: 'Delete',
        accept: () => this.deleteReport(report),
      });
    },

    async deleteReport(report) {
      try {
        await this.reportService.delete(report.id);

        this.reports = this.reports.filter(r => r.id !== report.id);
        this.$toast.add({ severity: 'success', summary: 'Confirmed', detail: 'Report deleted', life: 3000 });
      } catch (error) {
        console.error("Error deleting report:", error);
        this.$toast.add({ severity: 'error', summary: 'Error', detail: 'Could not delete report', life: 3000 });
      }
    },

    async toggleStatus(report) {
      const newStatus = report.status === "in progress" ? "completed" : "in progress";

      const reportToUpdate = {
        kindOfReport: report.kindOfReport,
        description: report.description,
        resourceId: report.resourceId,
        createdAt: report.createdAt,
        status: newStatus
      };

      try {
        await this.reportService.update(report.id, reportToUpdate);
        report.status = newStatus;
        this.$toast.add({ severity: 'success', summary: 'Updated', detail: `Status changed to ${newStatus}`, life: 2000 });
      } catch (error) {
        console.error("Error updating report status:", error);
        this.$toast.add({ severity: 'error', summary: 'Error', detail: 'Could not update status', life: 3000 });
      }
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },
    getStatusClass(status) {
      return status === 'in progress' ? 'status-progress' : 'status-completed';
    },
    getStatusIconClass(status) {
      return status === 'in progress' ? 'text-blue-500' : 'text-green-500';
    }
  },
};
</script>

<style scoped>
.report-table-container {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: #ffffff;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
}

.header-section {
  text-align: center;
  margin-bottom: 2rem;
}

.table-title {
  font-size: 2rem;
  margin: 0;
  color: #2c3e50;
  font-weight: 700;
}

.subtitle {
  color: #7f8c8d;
  margin-top: 0.5rem;
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

thead tr {
  background-color: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
}

th {
  padding: 1.2rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #64748b;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

td {
  padding: 1rem;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  vertical-align: middle;
}

tr:last-child td {
  border-bottom: none;
}

tr:hover {
  background-color: #f8fafc;
}

.resource-id {
  font-family: monospace;
  font-weight: 600;
  color: #0CC0DF;
}

.description-cell {
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.status-badge {
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: capitalize;
}

.status-progress {
  background-color: #fff3cd;
  color: #856404;
}

.status-completed {
  background-color: #d4edda;
  color: #155724;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 4rem 0;
  color: #94a3b8;
}

.text-center {
  text-align: center;
}

@media (max-width: 768px) {
  .report-table-container {
    padding: 1rem;
    margin: 1rem;
  }

  .table-title {
    font-size: 1.5rem;
  }
}
</style>
