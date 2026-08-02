import { createRouter, createWebHistory } from "vue-router";
import AppLayout from "../layouts/AppLayout.vue";
import MeetingView from "../views/MeetingView.vue";
import CustomersView from "../views/CustomersView.vue";
import CustomerDetailView from "../views/CustomerDetailView.vue";
import OffersView from "../views/OffersView.vue";
import AnalyticsView from "../views/AnalyticsView.vue";
import DashboardView from "../views/DashboardView.vue";
import TasksView from "../views/TasksView.vue";
import MeetingHistoryView from "../views/MeetingHistoryView.vue";
import NotFoundView from "../views/NotFoundView.vue";
import UsersView from "../views/UsersView.vue";
import AccessDeniedView from "../views/AccessDeniedView.vue";
import LoginView from "../views/LoginView.vue";
import LeadsView from "../views/LeadsView.vue";
import SettingsView from "../views/SettingsView.vue";
import AuditView from "../views/AuditView.vue";
import LeadDetailView from "../views/LeadDetailView.vue";
import OfferDetailView from "../views/OfferDetailView.vue";
import { salesStore } from "../stores/salesStore";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/login", name: "login", component: LoginView },
    {
      path: "/",
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        { path: "", name: "dashboard", component: DashboardView, meta: { permission: "dashboard" } },
        { path: "leads", name: "leads", component: LeadsView, meta: { permission: "leads" } },
        { path: "leads/:id", name: "lead-detail", component: LeadDetailView, meta: { permission: "leads" } },
        { path: "meeting", name: "meeting", component: MeetingView, meta: { permission: "meeting" } },
        { path: "meetings", name: "meeting-history", component: MeetingHistoryView, meta: { permission: "meetings" } },
        { path: "tasks", name: "tasks", component: TasksView, meta: { permission: "tasks" } },
        { path: "customers", name: "customers", component: CustomersView, meta: { permission: "customers" } },
        { path: "customers/:id", name: "customer-detail", component: CustomerDetailView, meta: { permission: "customers" } },
        { path: "offers", name: "offers", component: OffersView, meta: { permission: "offers" } },
        { path: "offers/:id", name: "offer-detail", component: OfferDetailView, meta: { permission: "offers" } },
        { path: "analytics", name: "analytics", component: AnalyticsView, meta: { permission: "analytics" } },
        { path: "users", name: "users", component: UsersView, meta: { permission: "users" } },
        { path: "settings", name: "settings", component: SettingsView, meta: { permission: "settings" } },
        { path: "audit", name: "audit", component: AuditView, meta: { permission: "audit" } },
        { path: "access-denied", name: "access-denied", component: AccessDeniedView },
      ],
    },
    { path: "/:pathMatch(.*)*", name: "not-found", component: NotFoundView, meta: { requiresAuth: true } },
  ],
});

router.beforeEach((to) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  if (requiresAuth && (!salesStore.isAuthenticated.value || !salesStore.ensureToken())) {
    return { name: "login", query: { redirect: to.fullPath } };
  }
  if (to.name === "login" && salesStore.isAuthenticated.value) return { name: "dashboard" };
  const permission = to.meta.permission;
  if (permission && !salesStore.can(permission)) return { name: "access-denied" };
  return true;
});

router.afterEach((to, from, failure) => {
  if (salesStore.isAuthenticated.value) {
    salesStore.recordRequest("GET", to.fullPath, failure ? "failed" : "success");
  }
});

export default router;
