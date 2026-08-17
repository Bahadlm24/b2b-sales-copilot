<script setup>
import { computed, reactive, ref } from "vue";
import { formatDate, t } from "../i18n/localeStore.js";
import { permissionCatalog } from "../services/authorization";
import { TOKEN_LIFETIME_MS } from "../services/tokenService";
import { salesStore } from "../stores/salesStore";

const selectedUserId = ref(salesStore.state.users[0]?.id);
const departmentName = ref("");
const roleName = ref("");
const selectedRoleKey = ref(salesStore.state.roleDefinitions[0]?.key);
const teamForm = reactive({ name: "", departmentId: salesStore.state.departments[0]?.id || "" });
const organizationFeedback = ref("");
const brandingForm = reactive({
  name: salesStore.state.organization.name,
  productName: salesStore.state.organization.productName,
  brandMark: salesStore.state.organization.brandMark,
});
const selectedUser = computed(() => salesStore.state.users.find((user) => user.id === Number(selectedUserId.value)));
const selectedRole = computed(() => salesStore.state.roleDefinitions.find((role) => role.key === selectedRoleKey.value));
const tokenExpiresAt = computed(() => salesStore.state.tokenSession?.expiresAt
  ? formatDate(salesStore.state.tokenSession.expiresAt)
  : t("settings.noToken"));
const syncLastRun = computed(() => salesStore.state.syncSettings.lastSyncAt
  ? formatDate(salesStore.state.syncSettings.lastSyncAt)
  : t("settings.neverRan"));
const syncNextRun = computed(() => formatDate(salesStore.state.syncSettings.nextSyncAt));
function permissionLabel(permission) {
  const translated = t(`permissions.${permission.key}`);
  return translated === `permissions.${permission.key}` ? permission.label : translated;
}
function displayRole(role) {
  return salesStore.roleLabel(role.key) || role.label;
}

function addDepartment() {
  const ok = salesStore.addDepartment(departmentName.value);
  organizationFeedback.value = ok ? t("settings.deptAdded") : t("settings.deptFailed");
  if (ok) departmentName.value = "";
}

function addTeam() {
  const ok = salesStore.addTeam(teamForm.name, teamForm.departmentId);
  organizationFeedback.value = ok ? t("settings.teamAdded") : t("settings.teamFailed");
  if (ok) teamForm.name = "";
}

function addRole() {
  const ok = salesStore.addRole(roleName.value);
  organizationFeedback.value = ok ? t("settings.roleAdded") : t("settings.roleFailed");
  if (ok) {
    selectedRoleKey.value = salesStore.state.roleDefinitions.at(-1).key;
    roleName.value = "";
  }
}

function removeSelectedRole() {
  if (!selectedRole.value) return;
  const ok = salesStore.removeRole(selectedRole.value.key);
  organizationFeedback.value = ok ? t("settings.roleDeleted") : t("settings.roleInUse");
  if (ok) selectedRoleKey.value = salesStore.state.roleDefinitions[0]?.key;
}
function saveBranding() {
  const result = salesStore.updateOrganizationBranding(brandingForm);
  organizationFeedback.value = result.message;
}
</script>

<template>
  <section class="settings-grid">
    <nav class="settings-tabs settings-wide"><RouterLink to="/settings">{{ t("settings.orgTab") }}</RouterLink><RouterLink to="/integrations">{{ t("settings.apiTab") }}</RouterLink></nav>
    <article class="panel settings-wide branding-panel">
      <div><p class="eyebrow">{{ t("settings.brandEyebrow") }}</p><h3>{{ t("settings.brandTitle") }}</h3><p class="settings-description">{{ t("settings.brandHint") }}</p></div>
      <form class="branding-form" @submit.prevent="saveBranding">
        <label><span>{{ t("settings.orgName") }}</span><input v-model="brandingForm.name" class="search-input" required /></label>
        <label><span>{{ t("settings.productName") }}</span><input v-model="brandingForm.productName" class="search-input" required /></label>
        <label><span>{{ t("settings.brandMark") }}</span><input v-model="brandingForm.brandMark" class="search-input brand-mark-input" maxlength="3" required /></label>
        <button class="primary-button compact">{{ t("settings.saveBrand") }}</button>
      </form>
    </article>
    <article class="panel settings-wide">
      <div class="panel-header"><div><p class="eyebrow">{{ t("settings.permEyebrow") }}</p><h3>{{ t("settings.permTitle") }}</h3></div><select v-model="selectedUserId" class="select-input user-permission-select"><option v-for="user in salesStore.state.users" :key="user.id" :value="user.id">{{ user.name }}</option></select></div>
      <p class="settings-description">{{ t("settings.permHint") }}</p>
      <div v-if="selectedUser" class="permission-grid">
        <label v-for="permission in permissionCatalog" :key="permission.key" class="permission-item">
          <input type="checkbox" :checked="selectedUser.permissions.includes(permission.key)" @change="salesStore.toggleUserPermission(selectedUser.id, permission.key)" />
          <span><strong>{{ permissionLabel(permission) }}</strong><small>{{ permission.key }}</small></span>
        </label>
      </div>
    </article>

    <article class="panel settings-wide">
      <div class="panel-header"><div><p class="eyebrow">{{ t("settings.rolesEyebrow") }}</p><h3>{{ t("settings.rolesTitle") }}</h3></div><div class="role-actions"><select v-model="selectedRoleKey" class="select-input user-permission-select"><option v-for="role in salesStore.state.roleDefinitions" :key="role.key" :value="role.key">{{ displayRole(role) }}</option></select><button class="remove-role-button" :disabled="!selectedRole" @click="removeSelectedRole">{{ t("settings.deleteRole") }}</button></div></div>
      <form class="inline-add-form role-add-form" @submit.prevent="addRole"><input v-model="roleName" class="search-input" :placeholder="t('settings.newRole')" required /><button class="primary-button compact" type="submit">{{ t("settings.addRole") }}</button></form>
      <p class="settings-description">{{ t("settings.rolesHint") }}</p>
      <div v-if="selectedRole" class="permission-grid">
        <label v-for="permission in permissionCatalog" :key="permission.key" class="permission-item">
          <input type="checkbox" :checked="selectedRole.permissions.includes(permission.key)" @change="salesStore.toggleRolePermission(selectedRole.key, permission.key)" />
          <span><strong>{{ permissionLabel(permission) }}</strong><small>{{ permission.key }}</small></span>
        </label>
      </div>
    </article>

    <article class="panel">
      <p class="eyebrow">{{ t("settings.deptEyebrow") }}</p><h3>{{ t("settings.deptTitle") }}</h3>
      <form class="inline-add-form" @submit.prevent="addDepartment"><input v-model="departmentName" class="search-input" :placeholder="t('settings.deptPh')" required /><button class="primary-button compact" type="submit">{{ t("common.add") }}</button></form>
      <div class="settings-list">
        <div v-for="department in salesStore.state.departments" :key="department.id"><span>{{ department.name }}</span><button class="remove-button" :aria-label="t('settings.removeDept')" @click="organizationFeedback = salesStore.removeDepartment(department.id) ? t('settings.deptDeleted') : t('settings.deptInUse')">×</button></div>
      </div>
    </article>

    <article class="panel">
      <p class="eyebrow">{{ t("settings.teamsEyebrow") }}</p><h3>{{ t("settings.teamsTitle") }}</h3>
      <form class="task-form compact-form" @submit.prevent="addTeam">
        <input v-model="teamForm.name" class="search-input" :placeholder="t('settings.teamPh')" required />
        <select v-model="teamForm.departmentId" class="select-input" required><option v-for="department in salesStore.state.departments" :key="department.id" :value="department.id">{{ department.name }}</option></select>
        <button class="primary-button" type="submit">{{ t("settings.addTeam") }}</button>
      </form>
      <div class="settings-list">
        <div v-for="team in salesStore.state.teams" :key="team.id"><span><strong>{{ team.name }}</strong><small>{{ salesStore.state.departments.find((item) => item.id === team.departmentId)?.name }}</small></span><button class="remove-button" :aria-label="t('settings.removeTeam')" @click="organizationFeedback = salesStore.removeTeam(team.id) ? t('settings.teamDeleted') : t('settings.teamInUse')">×</button></div>
      </div>
    </article>

    <article class="panel settings-wide token-panel">
      <div><p class="eyebrow">{{ t("settings.tokenEyebrow") }}</p><h3>{{ t("settings.tokenTitle") }}</h3><p>{{ t("settings.tokenHint") }}</p></div>
      <dl><div><dt>{{ t("settings.accessToken") }}</dt><dd>{{ salesStore.tokenPreview() }}</dd></div><div><dt>{{ t("settings.refreshAt") }}</dt><dd>{{ tokenExpiresAt }}</dd></div><div><dt>{{ t("settings.interval") }}</dt><dd>{{ t("settings.minutes", { count: TOKEN_LIFETIME_MS / 60000 }) }}</dd></div><div><dt>{{ t("settings.refreshCount") }}</dt><dd>{{ salesStore.state.tokenSession?.refreshCount || 0 }}</dd></div></dl>
    </article>
    <article class="panel settings-wide sync-panel">
      <div><p class="eyebrow">{{ t("settings.syncEyebrow") }}</p><h3>{{ t("settings.syncTitle") }}</h3><p>{{ t("settings.syncHint") }}</p></div>
      <div class="sync-controls">
        <label><span>{{ t("settings.frequency") }}</span><select :value="salesStore.state.syncSettings.frequency" class="select-input" @change="salesStore.setSyncFrequency($event.target.value)"><option value="hourly">{{ t("settings.hourly") }}</option><option value="daily">{{ t("settings.daily") }}</option></select></label>
        <label class="sync-toggle"><input type="checkbox" :checked="salesStore.state.syncSettings.enabled" @change="salesStore.toggleSync($event.target.checked)" /><span>{{ t("settings.autoSync") }}</span></label>
        <button class="secondary-button" @click="salesStore.syncExternalLeads(Date.now(), true)">{{ t("settings.syncNow") }}</button>
      </div>
      <dl><div><dt>{{ t("settings.lastRun") }}</dt><dd>{{ syncLastRun }}</dd></div><div><dt>{{ t("settings.nextRun") }}</dt><dd>{{ syncNextRun }}</dd></div><div><dt>{{ t("settings.sources") }}</dt><dd>{{ salesStore.state.syncSettings.sources.join(', ') }}</dd></div></dl>
    </article>
    <p v-if="organizationFeedback" class="settings-wide form-feedback settings-feedback" role="status">{{ organizationFeedback }}</p>
  </section>
</template>
