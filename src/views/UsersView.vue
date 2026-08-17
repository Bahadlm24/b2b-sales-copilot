<script setup>
import { reactive, ref } from "vue";
import { formatDate, t } from "../i18n/localeStore.js";
import { salesStore } from "../stores/salesStore";

const form = reactive({ name: "", username: "", email: "", password: "1234", role: "representative", departmentId: 1, teamId: 1 });
const feedback = ref("");

function addUser() {
  const result = salesStore.addUser({ ...form, name: form.name.trim() });
  feedback.value = result.ok ? t("users.added") : result.message;
  if (result.ok) {
    form.name = "";
    form.username = "";
    form.email = "";
    form.password = "1234";
    form.role = "representative";
    form.departmentId = salesStore.state.departments[0]?.id || "";
    form.teamId = salesStore.state.teams.find((team) => team.departmentId === form.departmentId)?.id || "";
  }
}

function teamsForDepartment(departmentId) {
  return salesStore.state.teams.filter((team) => team.departmentId === Number(departmentId));
}

function changeFormDepartment() {
  form.teamId = teamsForDepartment(form.departmentId)[0]?.id || "";
}

function changeUserDepartment(user, departmentId) {
  const teamId = teamsForDepartment(departmentId)[0]?.id || null;
  salesStore.updateUserOrganization(user.id, departmentId, teamId);
}

function roleName(role) {
  return salesStore.roleLabel(role.key) || role.label;
}
</script>

<template>
  <div class="user-layout">
    <section class="panel">
      <p class="eyebrow">{{ t("users.newEyebrow") }}</p><h3>{{ t("users.newTitle") }}</h3>
      <form class="task-form" @submit.prevent="addUser">
        <label><span>{{ t("common.name") }}</span><input v-model="form.name" class="search-input" required /></label>
        <label><span>{{ t("users.username") }}</span><input v-model="form.username" class="search-input" required /></label>
        <label><span>{{ t("common.email") }}</span><input v-model="form.email" class="search-input" type="email" required /></label>
        <label><span>{{ t("users.tempPassword") }}</span><input v-model="form.password" class="search-input" type="text" minlength="4" required /></label>
        <label><span>{{ t("users.role") }}</span><select v-model="form.role" class="select-input"><option v-for="role in salesStore.state.roleDefinitions" :key="role.key" :value="role.key">{{ roleName(role) }}</option></select></label>
        <label><span>{{ t("users.department") }}</span><select v-model="form.departmentId" class="select-input" @change="changeFormDepartment"><option v-for="department in salesStore.state.departments" :key="department.id" :value="department.id">{{ department.name }}</option></select></label>
        <label><span>{{ t("users.team") }}</span><select v-model="form.teamId" class="select-input"><option v-for="team in teamsForDepartment(form.departmentId)" :key="team.id" :value="team.id">{{ team.name }}</option></select></label>
        <button class="primary-button" type="submit">{{ t("users.add") }}</button>
        <p v-if="feedback" class="form-feedback" role="status">{{ feedback }}</p>
      </form>
    </section>
    <section class="panel table-panel">
      <div class="list-toolbar"><div><p class="eyebrow">{{ t("users.listEyebrow") }}</p><h3>{{ t("users.listTitle") }}</h3></div><span class="count-badge">{{ salesStore.state.users.length }}</span></div>
      <div class="user-list">
        <article v-for="user in salesStore.state.users" :key="user.id" class="user-row">
          <span class="avatar user-avatar">{{ user.name.split(' ').map((part) => part[0]).slice(0, 2).join('') }}</span>
          <span class="row-main"><strong>{{ user.name }}</strong><small>{{ user.email }}</small></span>
          <div class="user-controls">
            <select :value="user.role" class="select-input role-select" :disabled="user.id === salesStore.state.currentUserId" @change="salesStore.updateUserRole(user.id, $event.target.value)"><option v-for="role in salesStore.state.roleDefinitions" :key="role.key" :value="role.key">{{ roleName(role) }}</option></select>
            <select :value="user.departmentId" class="select-input role-select" @change="changeUserDepartment(user, $event.target.value)"><option :value="null">{{ t("users.noDepartment") }}</option><option v-for="department in salesStore.state.departments" :key="department.id" :value="department.id">{{ department.name }}</option></select>
            <select :value="user.teamId" class="select-input role-select" @change="salesStore.updateUserOrganization(user.id, user.departmentId, $event.target.value)"><option :value="null">{{ t("users.noTeam") }}</option><option v-for="team in teamsForDepartment(user.departmentId)" :key="team.id" :value="team.id">{{ team.name }}</option></select>
          </div>
          <button class="status-button" :class="{ inactive: !user.active }" :disabled="user.id === salesStore.state.currentUserId" @click="salesStore.toggleUserStatus(user.id)">{{ user.active ? t("common.active") : t("common.inactive") }}</button>
          <button class="remove-button" :disabled="user.id === salesStore.state.currentUserId" :aria-label="t('users.remove')" @click="salesStore.removeUser(user.id)">×</button>
        </article>
      </div>
    </section>
    <section class="panel detail-wide">
      <div class="panel-header"><div><p class="eyebrow">{{ t("users.mailEyebrow") }}</p><h3>{{ t("users.mailTitle") }}</h3></div><span class="count-badge">{{ salesStore.state.mailOutbox.length }}</span></div>
      <div v-if="salesStore.state.mailOutbox.length" class="outbox-list">
        <article v-for="mail in salesStore.state.mailOutbox.slice(0, 5)" :key="mail.id">
          <strong>{{ mail.subject }}</strong><span>{{ mail.to }} · {{ formatDate(mail.createdAt) }}</span><p>{{ mail.message }}</p>
        </article>
      </div>
      <p v-else class="empty-state">{{ t("users.noMail") }}</p>
    </section>
  </div>
</template>
