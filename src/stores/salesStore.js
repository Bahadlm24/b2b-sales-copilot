import { computed } from "vue";
import { savePersistedState } from "./persistence.js";
import { createInitialState } from "./createState.js";
import { createStoreContext } from "./createStoreContext.js";
import { createLookupsSlice } from "./slices/lookups.js";
import { createAuthSlice } from "./slices/auth.js";
import { createDirectorySlice } from "./slices/directory.js";
import { createLeadsSlice } from "./slices/leads.js";
import { createCustomersSlice } from "./slices/customers.js";
import { createOffersSlice } from "./slices/offers.js";
import { createTasksSlice } from "./slices/tasks.js";
import { createMeetingsSlice } from "./slices/meetings.js";
import { createIntegrationsSlice } from "./slices/integrations.js";
import { createOrganizationSlice } from "./slices/organization.js";
import { createActivitiesSlice } from "./slices/activities.js";

function isOpenOffer(offer) {
  return !offer.archived && !offer.cancelled && !["Kazanıldı", "Kaybedildi"].includes(offer.status);
}

const state = createInitialState();
const persist = () => savePersistedState(state);
const ctx = createStoreContext(state, persist);

export const salesStore = {
  state,
  customers: state.customers,
  offers: state.offers,
  openTasks: computed(() => state.tasks.filter((task) => !task.completed)),
  completedTasks: computed(() => state.tasks.filter((task) => task.completed)),
  activeOffers: computed(() => state.offers.filter(isOpenOffer)),
  pipelineValue: computed(() => state.offers.filter(isOpenOffer).reduce((sum, offer) => sum + offer.numericAmount, 0)),
  weightedPipeline: computed(() => state.offers.filter(isOpenOffer).reduce((sum, offer) => sum + offer.numericAmount * offer.probability / 100, 0)),
  wonRevenue: computed(() => state.offers.filter((offer) => !offer.archived && offer.status === "Kazanıldı").reduce((sum, offer) => sum + offer.numericAmount, 0)),
  currentUser: computed(() => state.users.find((user) => user.id === state.currentUserId) || state.users[0]),
  activeUsers: computed(() => state.users.filter((user) => user.active)),
  isAuthenticated: computed(() => state.isAuthenticated && Boolean(state.tokenSession?.accessToken)),
};

Object.assign(
  salesStore,
  createLookupsSlice(ctx, salesStore),
  createAuthSlice(ctx, salesStore),
  createDirectorySlice(ctx, salesStore),
  createCustomersSlice(ctx, salesStore),
  createLeadsSlice(ctx, salesStore),
  createOffersSlice(ctx, salesStore),
  createTasksSlice(ctx, salesStore),
  createMeetingsSlice(ctx, salesStore),
  createIntegrationsSlice(ctx, salesStore),
  createOrganizationSlice(ctx, salesStore),
  createActivitiesSlice(ctx, salesStore),
);
