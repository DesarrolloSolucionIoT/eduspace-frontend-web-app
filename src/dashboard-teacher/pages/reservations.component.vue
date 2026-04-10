<template>
  <div class="reservations-container">
    <h2>Reservations</h2>

    <div class="p-grid p-align-center p-justify-center">

    <div class="p-col-12 p-md-6">
      <pv-card class="pv-card">
        <template #header>
          <h3>Reservation of spaces</h3>
          <p>
            Educators can easily select and book available environments or sports facilities for their activities. The system presents a clear schedule showing available time slots, ensuring efficient space allocation and avoiding scheduling conflicts.
          </p>
        </template>
        <template #footer>
          <pv-button class="pv-button" label="Go" @click="goToReservationSpaces" />
        </template>
      </pv-card>
    </div>

    <div class="p-col-12 p-md-6">
      <pv-card class="pv-card">
        <template #header>
          <h3>Space consultation</h3>
          <p>
            Educators can view the spaces I book. Additionally, they have the option to cancel any of their existing bookings if needed, ensuring flexibility in managing their bookings.
          </p>
        </template>

        <template #footer>
          <pv-button class="pv-button" label="Go" @click="goToSpaceConsultation" />
        </template>
      </pv-card>
    </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TeacherReservations",
  methods: {
    goToReservationSpaces() {
      this.$router.push({name: 'reservation-management'});
    },
    goToSpaceConsultation() {
      this.$router.push({name: 'space-availability'});
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
  width: 100%;
  background-color: #fff;
  border: 1px solid #0CC0DF;
  border-radius: 50px;
  box-shadow: 0 4px 28px rgba(12, 192, 223, 0.28);
  margin-bottom: 2rem;
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