import {createRouter, createWebHistory} from 'vue-router';
import store from "../store/index.js";

// Componentes de Autenticación y Públicos
import HomeComponent from '../public/pages/home.component.vue';
import LoginComponent from '../iam/login/pages/login.component.vue';
import RegisterComponent from '../iam/register/pages/register.component.vue';
import VerifyCodeComponent from "../iam/login/components/verify-code.component.vue";

// Componentes de Contextos de Dominio
import MeetManagementComponent from "../meeting-management/pages/meet-management.component.vue";
import ReservationManagementComponent from "../reservation-management/pages/reservation-management.component.vue";
import ClassroomManagementComponent from "../breakdown-report-management/pages/classroom-management.component.vue";
import ResourceManagementComponent from "../breakdown-report-management/pages/resource-management.component.vue";
import ReportResourceComponent from "../breakdown-report-management/pages/report-resource.component.vue";
import ReportsManagementComponent from "../breakdown-report-management/pages/reports-management.component.vue";

// Componentes del Dashboard de Administrador
import HomeAdminComponent from "../dashboard-admin/pages/home-admin.component.vue";
import PersonalDataComponent from "../dashboard-admin/pages/personal-data.component.vue";
import TeachersManagementComponent from "../dashboard-admin/pages/teachers-management.component.vue";
import ClassroomChangesMeetingsComponent from "../dashboard-admin/pages/classroom-changes-meetings.component.vue";
import ClassroomsSharedSpacesComponent from "../dashboard-admin/pages/classrooms-shared-spaces.component.vue";
import AddClassroomsComponent
    from "../classroom-space-resource-management/pages/classrooms/add-classrooms.component.vue";
import ClassroomsComponent from "../classroom-space-resource-management/pages/classrooms/classrooms.component.vue";
import EditClassroomComponent
    from "../classroom-space-resource-management/pages/classrooms/edit-classroom.component.vue";
import AddSharedSpaceComponent
    from "../classroom-space-resource-management/pages/shared-spaces/add-shared-space.component.vue";
import SharedSpaceComponent
    from "../classroom-space-resource-management/pages/shared-spaces/shared-space.component.vue";
import EditSharedSpaceComponent
    from "../classroom-space-resource-management/pages/shared-spaces/edit-shared-space.component.vue";
import ResourceComponent from "../classroom-space-resource-management/pages/resources/resource.component.vue";
import AddResourceComponent from "../classroom-space-resource-management/pages/resources/add-resource.component.vue";
import EditResourceComponent from "../classroom-space-resource-management/pages/resources/edit-resource.component.vue";

// Componentes del Dashboard de Profesor
import HomeTeacherComponent from "../dashboard-teacher/pages/home-teacher.component.vue";
import ReservationsComponent from "../dashboard-teacher/pages/reservations.component.vue";
import BreakdownReportsComponent from "../dashboard-teacher/pages/breakdown-reports.component.vue";
import SpaceAvailabilityComponent from "../dashboard-teacher/pages/space-availability.component.vue";

const router = createRouter({
    history: createWebHistory(),
    routes: [
        // Rutas Públicas y de Autenticación
        { path: '/', redirect: '/login' },
        { path: '/login', name: 'login', component: LoginComponent, meta: { title: 'Login' } },
        { path: '/verify-code', name: 'verify-code', component: VerifyCodeComponent, meta: { title: 'Verify Code' } },
        { path: '/register', name: 'register', component: RegisterComponent, meta: { title: 'Register' } },
        { path: '/home', name: 'home', component: HomeComponent, meta: { title: 'Home' } },

        // --- Rutas del Administrador ---
        { path: '/dashboard-admin', redirect: '/dashboard-admin/home-admin' },
        {
            path: '/dashboard-admin/home-admin',
            name: 'home-admin',
            component: HomeAdminComponent,
            meta: {title: 'Home Admin', requiresAuth: true, role: 'RoleAdmin'}
        },
        {
            path: '/dashboard-admin/personal-data',
            name: 'personal-data',
            component: PersonalDataComponent,
            meta: {title: 'My Profile', requiresAuth: true, role: 'RoleAdmin'}
        },
        {
            path: '/dashboard-admin/teachers',
            name: 'teachers-management',
            component: TeachersManagementComponent,
            meta: {title: 'Teachers Management', requiresAuth: true, role: 'RoleAdmin'}
        },
        {
            path: '/dashboard-admin/classroom-changes-meetings',
            name: 'classroom-changes-meetings',
            component: ClassroomChangesMeetingsComponent,
            meta: {title: 'Meeting Management', requiresAuth: true, role: 'RoleAdmin'}
        },
        {
            path: '/dashboard-admin/classroom-changes-meetings/meeting-management',
            name: 'meet-management',
            component: MeetManagementComponent,
            meta: {title: 'Meeting Management', requiresAuth: true, role: 'RoleAdmin'}
        },
        {
            path: '/dashboard-admin/classrooms-shared-spaces',
            name: 'classrooms-shared-spaces',
            component: ClassroomsSharedSpacesComponent,
            meta: {title: 'Classrooms & Shared Spaces', requiresAuth: true, role: 'RoleAdmin'}
        },
        {
            path: '/dashboard-admin/classrooms-shared-spaces/classrooms',
            name: 'admin-classrooms',
            component: ClassroomsComponent,
            meta: {title: 'Manage Classrooms', requiresAuth: true, role: 'RoleAdmin'}
        },
        {
            path: '/dashboard-admin/classrooms-shared-spaces/classrooms/add',
            name: 'add-classrooms',
            component: AddClassroomsComponent,
            meta: {title: 'Add Classroom', requiresAuth: true, role: 'RoleAdmin'}
        },
        {
            path: '/dashboard-admin/classrooms-shared-spaces/classrooms/edit/:id',
            name: 'edit-classroom',
            component: EditClassroomComponent,
            meta: {title: 'Edit Classroom', requiresAuth: true, role: 'RoleAdmin'}
        },
        {
            path: '/dashboard-admin/classrooms-shared-spaces/shared-spaces',
            name: 'shared-spaces',
            component: SharedSpaceComponent,
            meta: {title: 'Manage Shared Spaces', requiresAuth: true, role: 'RoleAdmin'}
        },
        {
            path: '/dashboard-admin/classrooms-shared-spaces/shared-spaces/add',
            name: 'add-shared-space',
            component: AddSharedSpaceComponent,
            meta: {title: 'Add Shared Space', requiresAuth: true, role: 'RoleAdmin'}
        },
        {
            path: '/dashboard-admin/classrooms-shared-spaces/shared-spaces/edit/:id',
            name: 'edit-shared-space',
            component: EditSharedSpaceComponent,
            meta: {title: 'Edit Shared Space', requiresAuth: true, role: 'RoleAdmin'}
        },
        {
            path: '/dashboard-admin/classrooms-shared-spaces/resources',
            name: 'resource-list',
            component: ResourceComponent,
            meta: {title: 'Resource List', requiresAuth: true, role: 'RoleAdmin'}
        },
        {
            path: '/dashboard-admin/classrooms-shared-spaces/resources/add',
            name: 'add-resource',
            component: AddResourceComponent,
            meta: {title: 'Add Resource', requiresAuth: true, role: 'RoleAdmin'}
        },
        {
            path: '/dashboard-admin/classrooms-shared-spaces/classrooms/:classroomId/resources/edit/:resourceId',
            name: 'edit-resource',
            component: EditResourceComponent,
            meta: {title: 'Edit Resource', requiresAuth: true, role: 'RoleAdmin'}
        },

        // --- Rutas del Profesor ---
        { path: '/dashboard-teacher', redirect: '/dashboard-teacher/home-teacher' },
        {
            path: '/dashboard-teacher/home-teacher',
            name: 'home-teacher',
            component: HomeTeacherComponent,
            meta: {title: 'Home Teacher', requiresAuth: true, role: 'RoleTeacher'}
        },
        {
            path: '/dashboard-teacher/reservations',
            name: 'reservations',
            component: ReservationsComponent,
            meta: {title: 'Reservations', requiresAuth: true, role: 'RoleTeacher'}
        },
        {
            path: '/dashboard-teacher/reservations/reservation-management',
            name: 'reservation-management',
            component: ReservationManagementComponent,
            meta: {title: 'Reservation of spaces', requiresAuth: true, role: 'RoleTeacher'}
        },
        {
            path: '/dashboard-teacher/reservations/space-availability',
            name: 'space-availability',
            component: SpaceAvailabilityComponent,
            meta: {title: 'My Reservations', requiresAuth: true, role: 'RoleTeacher'}
        },
        {
            path: '/dashboard-teacher/breakdown-reports',
            name: 'breakdown-reports',
            component: BreakdownReportsComponent,
            meta: {title: 'Breakdown Reports', requiresAuth: true, role: 'RoleTeacher'}
        },
        {
            path: '/dashboard-teacher/breakdown-reports/classrooms',
            name: 'teacher-classrooms',
            component: ClassroomManagementComponent,
            meta: {title: 'My Classrooms', requiresAuth: true, role: 'RoleTeacher'}
        },
        {
            path: '/dashboard-teacher/breakdown-reports/classrooms/:classroomId/resources',
            name: 'teacher-resource-management',
            component: ResourceManagementComponent,
            meta: {title: 'Classroom Resources', requiresAuth: true, role: 'RoleTeacher'},
            props: true
        },
        {
            path: '/dashboard-teacher/breakdown-reports/classrooms/:classroomId/resources/:resourceId/report',
            name: 'report-resource',
            component: ReportResourceComponent,
            meta: {title: 'Report Resource', requiresAuth: true, role: 'RoleTeacher'},
            props: true
        },
        {
            path: '/dashboard-teacher/breakdown-reports/reports',
            name: 'teacher-reports',
            component: ReportsManagementComponent,
            meta: {title: 'My Reports', requiresAuth: true, role: 'RoleTeacher'}
        },
    ]
});

router.beforeEach((to, from, next) => {
    document.title = `EduSpace | ${to.meta.title || 'Welcome'}`;

    const isAuthenticated = store.getters['user/isAuthenticated'];
    const userRole = store.getters['user/userRole'];

    if (isAuthenticated && (to.name === 'login' || to.name === 'register')) {
        if (userRole === 'RoleAdmin') {
            return next({ name: 'home-admin' });
        } else if (userRole === 'RoleTeacher') {
            return next({ name: 'home-teacher' });
        }
    }

    const requiredAuth = to.matched.some(record => record.meta.requiresAuth);
    const requiredRole = to.matched.find(record => record.meta.role)?.meta.role;

    if (requiredAuth && !isAuthenticated) {
        return next({ name: 'login' });
    }

    if (isAuthenticated && requiredRole && userRole !== requiredRole) {
        if (userRole === 'RoleAdmin') {
            return next({ name: 'home-admin' });
        } else if (userRole === 'RoleTeacher') {
            return next({ name: 'home-teacher' });
        }
        return next({ name: 'login' });
    }

    next();
});

export default router;