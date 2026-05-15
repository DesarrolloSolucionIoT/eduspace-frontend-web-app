import {createRouter, createWebHistory} from 'vue-router';
import store from "../store/index.js";

const HomeComponent = () => import('../public/pages/home.component.vue');
const LoginComponent = () => import('../iam/login/pages/login.component.vue');
const RegisterComponent = () => import('../iam/register/pages/register.component.vue');
const VerifyCodeComponent = () => import('../iam/login/components/verify-code.component.vue');

const MeetManagementComponent = () => import('../meeting-management/pages/meet-management.component.vue');

const HomeAdminComponent = () => import('../dashboard-admin/pages/home-admin.component.vue');
const PersonalDataComponent = () => import('../dashboard-admin/pages/personal-data.component.vue');
const TeachersManagementComponent = () => import('../dashboard-admin/pages/teachers-management.component.vue');
const ClassroomChangesMeetingsComponent = () => import('../dashboard-admin/pages/classroom-changes-meetings.component.vue');
const ClassroomsSharedSpacesComponent = () => import('../dashboard-admin/pages/classrooms-shared-spaces.component.vue');
const IotMonitoringComponent = () => import('../iot-monitoring/pages/iot-monitoring.component.vue');

const AddClassroomsComponent = () => import('../classroom-space-resource-management/pages/classrooms/add-classrooms.component.vue');
const ClassroomsComponent = () => import('../classroom-space-resource-management/pages/classrooms/classrooms.component.vue');
const EditClassroomComponent = () => import('../classroom-space-resource-management/pages/classrooms/edit-classroom.component.vue');
const AddSharedSpaceComponent = () => import('../classroom-space-resource-management/pages/shared-spaces/add-shared-space.component.vue');
const SharedSpaceComponent = () => import('../classroom-space-resource-management/pages/shared-spaces/shared-space.component.vue');
const EditSharedSpaceComponent = () => import('../classroom-space-resource-management/pages/shared-spaces/edit-shared-space.component.vue');
const ResourceComponent = () => import('../classroom-space-resource-management/pages/resources/resource.component.vue');
const AddResourceComponent = () => import('../classroom-space-resource-management/pages/resources/add-resource.component.vue');
const EditResourceComponent = () => import('../classroom-space-resource-management/pages/resources/edit-resource.component.vue');

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
            path: '/dashboard-admin/iot-monitoring',
            name: 'iot-monitoring',
            component: IotMonitoringComponent,
            meta: {title: 'IoT Monitoring', requiresAuth: true, role: 'RoleAdmin'}
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
    ]
});

router.beforeEach((to, from, next) => {
    document.title = `EduSpace | ${to.meta.title || 'Welcome'}`;

    const isAuthenticated = store.getters['user/isAuthenticated'];
    const userRole = store.getters['user/userRole'];

    if (isAuthenticated && (to.name === 'login' || to.name === 'register')) {
        if (userRole === 'RoleAdmin') {
            return next({ name: 'home-admin' });
        }
        return next({ name: 'login' });
    }

    const requiredAuth = to.matched.some(record => record.meta.requiresAuth);
    const requiredRole = to.matched.find(record => record.meta.role)?.meta.role;

    if (requiredAuth && !isAuthenticated) {
        return next({ name: 'login' });
    }

    if (isAuthenticated && requiredRole && userRole !== requiredRole) {
        if (userRole === 'RoleAdmin') {
            return next({ name: 'home-admin' });
        }
        return next({ name: 'login' });
    }

    next();
});

export default router;
