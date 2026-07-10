<template>
  <pv-toast />
  <div class="app-container" :class="{ 'sidebar-open': isSidebarOpen }">
    <button
      v-if="userRole"
      type="button"
      class="sidenav-toggle"
      :aria-label="isSidebarOpen ? 'Cerrar menú' : 'Abrir menú'"
      :aria-expanded="isSidebarOpen"
      @click="toggleSidebar"
    >
      <i :class="['pi', isSidebarOpen ? 'pi-times' : 'pi-bars']"></i>
    </button>

    <div
      v-if="userRole && isMobile && isSidebarOpen"
      class="sidenav-backdrop"
      @click="closeSidebar"
    ></div>

    <header
      v-if="userRole"
      class="sidenav-wrapper"
      :class="{
        'is-open': isSidebarOpen,
        'is-mobile': isMobile,
        'is-collapsed': !isMobile && !isSidebarOpen,
      }"
    >
      <div class="sidenav admin-sidenav">
        <div class="user-info">
          <pv-avatar
            :image="DefaultAvatar"
            class="mr-2"
            size="xlarge"
            shape="circle"
          ></pv-avatar>
          <div class="info">
            <p class="info" style="color: #064C58">{{ $t('nav.administrator') }}</p>
            <p class="info">{{ currentUsername }}</p>
          </div>
        </div>

        <div class="drawer-content">
          <div v-for="item in items" :key="item.label" class="menu-item">
            <router-link
              v-if="item.to"
              :to="item.to"
              class="nav-link"
              active-class="router-link-active"
              exact-active-class="router-link-exact-active"
            >
              <pv-button class="p-button-text admin-hover-active">
                <img
                  v-if="item.svg"
                  :src="item.svg"
                  alt="icon"
                  style="width: 20px; height: 20px; margin-right: 8px"
                />
                {{ $t(item.labelKey) }}
              </pv-button>
            </router-link>
          </div>
        </div>

        <div class="footer-section">
          <div class="sidenav-lang-switcher">
            <language-switcher />
          </div>
          <div class="logout-container">
            <pv-button
              class="pv-button log-out logout-hover"
              @click="showLogoutConfirm($event)"
            >
              <img
                :src="LogoSidebar"
                alt="Logo"
                class="logout-icon"
              />
              <span>{{ $t('nav.logout') }}</span>
            </pv-button>
          </div>
          <div class="copyright-text">{{ $t('nav.copyright') }}</div>
        </div>
      </div>
    </header>

    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition mode="out-in" name="fade">
          <component :is="Component"/>
        </transition>
      </router-view>
    </main>

    <pv-confirmpopup group="logout-group">
      <template #message="slotProps">
        <div
          class="flex flex-col items-center w-full gap-4 border-b border-surface-200 dark:border-surface-700 p-4 mb-4 pb-0"
        >
          <i
            :class="slotProps.message.icon"
            class="text-6xl text-primary-500"
          ></i>
          <p>{{ slotProps.message.message }}</p>
        </div>
      </template>
    </pv-confirmpopup>
  </div>
</template>

<script>
import {mapActions, mapGetters} from "vuex";
import HomeIcon from "./assets/admin/Home.svg";
import ClassroomIcon from "./assets/admin/Clasroom.svg";
import EnvironmentIcon from "./assets/admin/Environment.svg";
import WifiIcon from "./assets/admin/Wifi.svg";
import PersonalDIcon from "./assets/admin/Personal_Data.svg";
import PersonalManagementIcon from "./assets/admin/Personal_Management.svg";
import DefaultAvatar from "./assets/default-avatar.png";
import LogoSidebar from "./assets/Logo sidebar.png";
import LanguageSwitcher from "./shared/components/language-switcher.component.vue";

export default {
  name: "app",
  components: { LanguageSwitcher },
  data() {
    return {
      drawer: false,
      items: [],
      DefaultAvatar,
      LogoSidebar,
      isSidebarOpen: window.innerWidth >= 1024,
      isMobile: window.innerWidth < 1024,
    };
  },
  computed: {
    ...mapGetters("user", ["isAuthenticated", "currentUsername", "userRole"]),
  },
  methods: {
    ...mapActions("user", ["signOut"]),
    toggleSidebar() {
      this.isSidebarOpen = !this.isSidebarOpen;
    },
    closeSidebar() {
      this.isSidebarOpen = false;
    },
    handleResize() {
      const mobile = window.innerWidth < 1024;
      this.isMobile = mobile;
      this.isSidebarOpen = !mobile;
    },
    async handleLogOut() {
      await this.signOut();
      this.$router.push({ name: "login" });
    },
    changeToolbar() {
      if (this.userRole === "RoleAdmin") {
        this.items = [
          { labelKey: "nav.home", to: "/dashboard-admin/home-admin", svg: HomeIcon },
          {
            labelKey: "nav.classroomsAndSharedSpaces",
            to: "/dashboard-admin/classrooms-shared-spaces",
            svg: EnvironmentIcon,
          },
          {
            labelKey: "nav.meetingManagement",
            to: "/dashboard-admin/classroom-changes-meetings",
            svg: ClassroomIcon,
          },
          {
            labelKey: "nav.iotMonitoring",
            to: "/dashboard-admin/iot-monitoring",
            svg: WifiIcon,
          },
          {
            labelKey: "nav.teachersManagement",
            to: "/dashboard-admin/teachers",
            svg: PersonalManagementIcon,
          },
          {
            labelKey: "nav.myProfile",
            to: "/dashboard-admin/personal-data",
            svg: PersonalDIcon,
          },
        ];
      } else {
        this.items = [
          { labelKey: "nav.home", to: "/home" },
          { labelKey: "nav.login", to: "/login" },
        ];
      }
    },
    showLogoutConfirm(event) {
      this.$confirm.require({
        target: event.currentTarget,
        group: "logout-group",
        message: this.$t("nav.logoutConfirm"),
        icon: "pi pi-exclamation-circle",
        rejectProps: {
          icon: "pi pi-times",
          label: this.$t("common.cancel"),
          outlined: true,
        },
        acceptProps: {
          icon: "pi pi-check",
          label: this.$t("common.confirm"),
        },
        accept: () => {
          this.handleLogOut();
        },
        reject: () => {
          this.$toast.add({
            severity: "info",
            summary: this.$t("common.cancel"),
            detail: this.$t("nav.logoutCancelled"),
            life: 3000,
          });
        },
      });
    },
  },
  mounted() {
    window.addEventListener("resize", this.handleResize);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.handleResize);
  },
  created() {
    if (this.isAuthenticated) {
      this.changeToolbar();
    }
    // No redirect for unauthenticated users — the router guard handles
    // protected routes via requiresAuth meta. A blanket push to /login here
    // breaks public routes like /activate (which is reached from an email
    // link by users who are, by definition, not logged in yet).
  },
  watch: {
    userRole() {
      this.changeToolbar();
    },
    $route() {
      if (this.isMobile) {
        this.isSidebarOpen = false;
      }
    },
  },
};
</script>

<style scoped>
.admin-sidenav {
  background: linear-gradient(
    160deg,
    rgba(255, 231, 120, 1) 0%,
    rgba(255, 255, 255, 1) 24%,
    rgba(246, 246, 246, 1) 34%,
    rgba(255, 255, 255, 1) 52%,
    rgba(255, 255, 255, 1) 71%,
    rgba(255, 255, 255, 1) 85%,
    rgba(147, 227, 241, 1) 100%
  );
}

.sidenav-lang-switcher {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 12px;
  transform: scale(0.8);
  transform-origin: left center;
}

.user-info {
  padding: 15px 0;
  font-size: 1rem;
  color: #333;
  text-align: left;
  display: flex;
}

.user-info p {
  margin: 0;
  font-weight: 550;
}

.info {
  margin: auto 0;
}

.app-container {
  display: flex;
  height: 100vh;
}

.sidenav-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 350px;
  flex-shrink: 0;
}

.sidenav {
  width: 350px;
  height: 100%;
  box-shadow: 2px 0 25px rgba(0, 0, 0, 0.13);
  text-align: left;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px;
  padding-top: 76px;
}

.drawer-content {
  display: flex;
  flex-direction: column;
  align-items: start;
}

.menu-item {
  margin-bottom: 10px;
}

.footer-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-top: auto;
  padding-top: 20px;
  width: 100%;
}

.logout-container {
  width: 100%;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  padding-left: 0;
}

.log-out {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  background-color: transparent;
  color: #000;
  font-weight: 300;
  text-align: left;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
}

.logout-icon {
  width: 30px;
  height: 30px;
  margin-right: 8px;
}

.copyright-text {
  margin-top: 10px;
  font-size: 0.8rem;
  color: #777;
  text-align: left;
  padding-left: 20px;
}

.p-button-text {
  color: #000 !important;
  text-align: left;
}

.pv-button {
  display: flex;
  color: #000;
  font-size: 1rem;
  font-weight: 500;
  border: none;
  padding: 0.5rem 0.7rem;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
}

.sidenav .pv-button:hover {
  border: none;
}

.main-content {
  flex: 1;
  height: 100vh;
  padding: 20px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sidenav-toggle {
  display: inline-flex;
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 1100;
  width: 44px;
  height: 44px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  align-items: center;
  justify-content: center;
  color: #064C58;
  font-size: 1.25rem;
  transition: background-color 0.2s ease;
}

.sidenav-toggle:hover {
  background: #f4f4f4;
}

.sidenav-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  animation: backdropFadeIn 0.2s ease;
}

@keyframes backdropFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.sidenav-wrapper {
  overflow: hidden;
  transition: width 0.25s ease;
}

.sidenav-wrapper.is-collapsed {
  width: 0;
}

@media (max-width: 1023px) {
  .sidenav-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1050;
    height: 100vh;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
    will-change: transform;
  }

  .sidenav-wrapper.is-open {
    transform: translateX(0);
  }

  .sidenav {
    width: min(320px, 85vw);
  }

  .main-content {
    width: 100%;
    padding-top: 70px;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

</style>
