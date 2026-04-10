<template>
  <div v-if="compact" class="modern-card compact-mode">
    <div class="card-header">
      <pv-avatar
        :label="initials"
        size="large"
        shape="circle"
        class="custom-avatar"
      />
      <div class="header-info">
        <h3 class="teacher-name">{{ fullName }}</h3>
        <span class="teacher-role">{{ maskedEmail }}</span>
      </div>
    </div>
    <div class="compact-footer">
      <span class="compact-phone">{{ formattedPhone }}</span>
    </div>
  </div>

  <div v-else class="modern-card">
    <div class="card-header">
      <div class="avatar-container">
        <pv-avatar
          :label="initials"
          size="large"
          shape="circle"
          class="custom-avatar"
        />
      </div>
      <div class="header-info">
        <h3 class="teacher-name">{{ fullName }}</h3>
        <span class="teacher-role">Teacher</span>
      </div>
    </div>

    <div class="card-body">
      <div class="info-item">
        <div class="icon-box blue">
          <i class="pi pi-envelope"></i>
        </div>
        <div class="info-text">
          <span class="label">Email</span>
          <span class="value" :title="teacher.email">{{ maskedEmail }}</span>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <div class="icon-box purple">
            <i class="pi pi-id-card"></i>
          </div>
          <div class="info-text">
            <span class="label">DNI</span>
            <span class="value">{{ teacher.dni }}</span>
          </div>
        </div>

        <div class="info-item">
          <div class="icon-box green">
            <i class="pi pi-phone"></i>
          </div>
          <div class="info-text">
            <span class="label">Phone</span>
            <span class="value">{{ formattedPhone }}</span>
          </div>
        </div>
      </div>

      <div class="info-item" v-if="teacher.address">
        <div class="icon-box orange">
          <i class="pi pi-map-marker"></i>
        </div>
        <div class="info-text">
          <span class="label">Address</span>
          <span class="value">{{ teacher.address }}</span>
        </div>
      </div>
    </div>

    <div class="card-footer">
      <pv-button
        icon="pi pi-eye"
        text
        rounded
        severity="secondary"
        v-tooltip.top="'View Details'"
        @click="$emit('view', teacher.id)"
      />

      <div class="right-actions">
        <pv-button
          icon="pi pi-pencil"
          label="Edit"
          outlined
          size="small"
          severity="info"
          class="edit-btn"
          @click="$emit('edit', teacher)"
        />
        <pv-button
          icon="pi pi-trash"
          text
          rounded
          severity="danger"
          @click="$emit('delete', teacher.id)"
        />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "teacher-card",
  props: {
    teacher: {
      type: Object,
      required: true,
      validator(value) {
        return (
          value.firstName &&
          value.lastName &&
          value.email &&
          value.dni &&
          value.phone
        );
      },
    },
    compact: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    fullName() {
      return `${this.teacher.firstName} ${this.teacher.lastName}`;
    },
    maskedEmail() {
      const email = this.teacher.email;
      const [localPart, domain] = email.split("@");
      if (localPart.length <= 3) {
        return `${localPart}***@${domain}`;
      }
      return `${localPart.substring(0, 3)}****@${domain}`;
    },
    formattedPhone() {
      const phone = this.teacher.phone;
      return phone.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");
    },
    initials() {
      const fn = this.teacher.firstName || "";
      const ln = this.teacher.lastName || "";
      return (fn[0] || "") + (ln[0] || "");
    },
  },
};
</script>

<style scoped>
.modern-card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.modern-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
  border-color: #e2e8f0;
}

.card-header {
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border-bottom: 1px solid #f8fafc;
  background: linear-gradient(to right, #ffffff, #f8fafc);
}

.custom-avatar {
  background-color: #3b82f6;
  color: white;
  font-weight: 600;
  font-size: 1.1rem;
}

.header-info {
  flex: 1;
  overflow: hidden;
}

.teacher-name {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.teacher-role {
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.card-body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  flex: 1;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.icon-box {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1rem;
}

.icon-box.blue {
  background: #eff6ff;
  color: #3b82f6;
}
.icon-box.purple {
  background: #f3e8ff;
  color: #a855f7;
}
.icon-box.green {
  background: #f0fdf4;
  color: #22c55e;
}
.icon-box.orange {
  background: #fff7ed;
  color: #f97316;
}

.info-text {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.label {
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 2px;
}

.value {
  font-size: 0.9rem;
  color: #334155;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-footer {
  padding: 1rem 1.25rem;
  background-color: #ffffff;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.right-actions {
  display: flex;
  gap: 0.5rem;
}

.edit-btn {
  font-weight: 600;
}

.modern-card.compact-mode {
  height: auto;
}

.modern-card.compact-mode .card-header {
  padding: 0.875rem 1rem;
  border-bottom: none;
}

.modern-card.compact-mode .teacher-role {
  text-transform: none;
  font-size: 0.85rem;
}

.compact-footer {
  padding: 0.5rem 1rem;
  border-top: 1px solid #f1f5f9;
  background-color: #fafbfc;
}

.compact-phone {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .right-actions {
    flex-direction: column;
    gap: 0.25rem;
  }

  .card-footer {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }
}
</style>
