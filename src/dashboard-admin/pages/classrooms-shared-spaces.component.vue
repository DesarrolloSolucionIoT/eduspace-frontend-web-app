<template>
  <div class="classrooms-shared-spaces-container">
    <h2>Classrooms and Shared Spaces</h2>

    <div class="p-grid p-align-center p-justify-center">
    <!-- Card 1: Classrooms -->
    <div class="p-col-12 p-md-6">
      <pv-card class="pv-card">
        <template #header>
          <h3>Classrooms</h3>
          <p>
            Management and registration of the classrooms with resources environment available with the infrastructure.
          </p>
        </template>
        <template #footer>
          <pv-button  class = "pv-button" label="Go" @click="goToClassrooms" />
        </template>
      </pv-card>
    </div>

    <!-- Card 2: Shared Spaces -->
    <div class="p-col-12 p-md-6">
      <pv-card class="pv-card">
        <template #header>
          <h3>Shared Spaces</h3>
          <p>
            Management and registration of spaces designated for sports activities within the institution.
            This includes gyms, courts, and other spaces dedicated to sports.
          </p>
        </template>

        <template #footer>
          <pv-button  class = "pv-button" label="Go" @click="goToSpaceShared" />
        </template>
      </pv-card>
    </div>

    <!-- Card 3: Resources -->
    <div class="p-col-12 p-md-6">
      <pv-card class="pv-card">
        <template #header>
          <h3>Resources</h3>
          <p>
            Management and registration of resources available in classrooms such as projectors, computers, and other equipment.
          </p>
        </template>

        <template #footer>
          <pv-button  class = "pv-button" label="Go" @click="goToResources" />
        </template>
      </pv-card>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "classrooms-shared-spaces",
  methods: {
    goToClassrooms() {
      this.$router.push('/dashboard-admin/classrooms-shared-spaces/classrooms');
    },
    goToSpaceShared() {
      this.$router.push('/dashboard-admin/classrooms-shared-spaces/shared-spaces');
    },
    goToResources() {
      this.$router.push('/dashboard-admin/classrooms-shared-spaces/resources');
    }
  }
}
</script>

<style scoped>
h2 {
  text-align: left;
  font-size: 1.8rem;
  margin-bottom: 2rem;
  color: #000;
}

.pv-card {
  width: 60vw;
  background-color: #fff;
  border: 1px solid #0CC0DF;
  border-radius: 50px;
  box-shadow: 0 4px 28px rgba(12, 192, 223, 0.58);
  margin-bottom: 4rem;
  padding: 1.5rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}

.pv-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 30px rgba(12, 192, 223, 0.4) !important;
}

h3 {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: #333;
}

.pv-button {
  display: inline-block;
  background-color: #ffcc00;
  color: #000;
  font-size: 1rem;
  font-weight: bold;
  border: none;
  border-radius: 50px;
  padding: 0.5rem 1.5rem;
  cursor: pointer;
  text-transform: uppercase;
  transition: background-color 0.2s ease-in-out;
}

.pv-button:hover {
  background-color: #ffdb4d;
}



.p-col-12 {
  flex: 0 0 100%;
}

.p-md-6 {
  flex: 0 0 calc(50% - 1.5rem);
}
</style>
