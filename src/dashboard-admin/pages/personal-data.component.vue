<script>
import {mapActions, mapGetters} from "vuex";
import {AdministratorService} from "../../profiles/services/administrator.service.js";

export default {
  name: "admin-profile",
  data() {
    return {
      admin: {
        id: null,
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        dni: "",
        address: ""
      },
      originalData: {},
      loading: true,
      isSaving: false,
      isDeleting: false,
      showDeleteDialog: false
    };
  },
  computed: {
    ...mapGetters("user", ["userId"]),

    hasChanges() {
      return JSON.stringify(this.admin) !== JSON.stringify(this.originalData);
    },

    initials() {
      const f = this.admin.firstName ? this.admin.firstName[0] : "";
      const l = this.admin.lastName ? this.admin.lastName[0] : "";
      return (f + l).toUpperCase();
    }
  },
  async created() {
    await this.loadProfile();
  },
  methods: {
    ...mapActions("user", ["signOut"]),

    async loadProfile() {
      this.loading = true;
      try {
        const response = await AdministratorService.getById(this.userId);
        this.admin = response;
        this.originalData = JSON.parse(JSON.stringify(response));
      } catch (error) {
        console.error("Error loading profile:", error);
        this.$toast.add({ severity: 'error', summary: 'Error', detail: 'Could not load profile data' });
      } finally {
        this.loading = false;
      }
    },

    async updateProfile() {
      if (!this.hasChanges) return;

      this.isSaving = true;
      try {
        const payload = {
          firstName: this.admin.firstName,
          lastName: this.admin.lastName,
          email: this.admin.email,
          dni: this.admin.dni,
          address: this.admin.address,
          phone: this.admin.phone
        };

        await AdministratorService.update(this.userId, payload);

        this.originalData = JSON.parse(JSON.stringify(this.admin));
        this.$toast.add({ severity: 'success', summary: 'Success', detail: 'Profile updated successfully', life: 3000 });
      } catch (error) {
        console.error("Error updating profile:", error);
        this.$toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update profile' });
      } finally {
        this.isSaving = false;
      }
    },

    confirmDelete() {
      this.showDeleteDialog = true;
    },

    async deleteAccount() {
      this.isDeleting = true;
      try {
        await AdministratorService.delete(this.userId);

        this.$toast.add({ severity: 'info', summary: 'Account Deleted', detail: 'Your account has been deleted.', life: 2000 });
        this.showDeleteDialog = false;

        setTimeout(async () => {
          await this.signOut();
          this.$router.push({ name: 'login' });
        }, 1500);

      } catch (error) {
        console.error("Error deleting account:", error);
        this.$toast.add({ severity: 'error', summary: 'Error', detail: 'Could not delete account' });
        this.isDeleting = false;
      }
    }
  }
};
</script>

<template>
  <div class="profile-page">
    <pv-toast />

    <div class="page-header">
      <h1>My Profile</h1>
      <p>Manage your personal information and account settings</p>
    </div>

    <div v-if="loading" class="loading-container">
      <pv-progress-spinner />
    </div>

    <div v-else class="profile-content">
      <div class="profile-card user-card">
        <div class="avatar-section">
          <pv-avatar
            :label="initials"
            size="xlarge"
            class="profile-avatar"
            shape="circle"
          />
          <h2>{{ admin.firstName }} {{ admin.lastName }}</h2>
          <span class="role-badge">Administrator</span>
        </div>
      </div>

      <div class="profile-card form-card">
        <div class="form-header">
          <h3>Personal Information</h3>
          <pv-button
            label="Save Changes"
            icon="pi pi-check"
            @click="updateProfile"
            :loading="isSaving"
            :disabled="!hasChanges"
          />
        </div>

        <div class="form-grid">
          <div class="field">
            <label>First Name</label>
            <pv-input-text v-model="admin.firstName" />
          </div>
          <div class="field">
            <label>Last Name</label>
            <pv-input-text v-model="admin.lastName" />
          </div>
          <div class="field">
            <label>Email</label>
            <pv-input-text v-model="admin.email" />
          </div>
          <div class="field">
            <label>Phone</label>
            <pv-input-text v-model="admin.phone" />
          </div>
          <div class="field">
            <label>DNI</label>
            <pv-input-text v-model="admin.dni" disabled class="disabled-input" v-tooltip="'DNI cannot be changed'" />
          </div>
          <div class="field full-width">
            <label>Address</label>
            <pv-input-text v-model="admin.address" />
          </div>
        </div>

        <div class="danger-zone">
          <div class="danger-text">
            <h4>Delete Account</h4>
            <p>Once you delete your account, there is no going back. Please be certain.</p>
          </div>
          <pv-button
            label="Delete Account"
            severity="danger"
            outlined
            icon="pi pi-trash"
            @click="confirmDelete"
          />
        </div>
      </div>
    </div>

    <pv-dialog
      v-model:visible="showDeleteDialog"
      header="Delete Account"
      modal
      :style="{ width: '450px' }"
    >
      <div class="confirmation-content">
        <i class="pi pi-exclamation-triangle" style="font-size: 2rem; color: #ef4444; margin-bottom: 1rem;"></i>
        <p>Are you sure you want to delete your account? This action <strong>cannot</strong> be undone and you will lose access immediately.</p>
      </div>
      <template #footer>
        <pv-button label="Cancel" text severity="secondary" @click="showDeleteDialog = false" />
        <pv-button label="Yes, Delete my Account" severity="danger" @click="deleteAccount" :loading="isDeleting" />
      </template>
    </pv-dialog>

  </div>
</template>

<style scoped>
.profile-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Poppins', sans-serif;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.page-header p {
  color: #64748b;
  margin: 0.5rem 0 0 0;
}

.profile-content {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
  align-items: start;
}

.profile-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.04);
  border: 1px solid #f1f5f9;
  padding: 2rem;
}

.user-card {
  text-align: center;
}

.profile-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 2rem;
  margin-bottom: 1rem;
  width: 100px;
  height: 100px;
}

.avatar-section h2 {
  font-size: 1.25rem;
  margin: 0 0 0.5rem 0;
  color: #1e293b;
}

.role-badge {
  background: #e0f2fe;
  color: #0284c7;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f1f5f9;
}

.form-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #334155;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field.full-width {
  grid-column: 1 / -1;
}

.field label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #64748b;
}

.disabled-input {
  background-color: #f8fafc;
  color: #94a3b8;
}

.danger-zone {
  border: 1px solid #fee2e2;
  background: #fef2f2;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.danger-text h4 {
  margin: 0 0 0.25rem 0;
  color: #991b1b;
  font-size: 1rem;
}

.danger-text p {
  margin: 0;
  color: #b91c1c;
  font-size: 0.85rem;
}

.confirmation-content {
  text-align: center;
  padding: 1rem;
}

@media (max-width: 1024px) {
  .profile-content {
    grid-template-columns: 1fr;
  }

  .user-card {
    display: flex;
    justify-content: center;
  }
}

@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .danger-zone {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .danger-zone button {
    width: 100%;
  }
}
</style>
