// =====================
// API CONFIGURATION
// =====================
const API_URL = "https://fedskillstest.coalitiontechnologies.workers.dev";
const API_HEADERS = {
  Authorization: "Basic " + btoa("coalition:skills-test"),
};

// =====================
// GLOBAL STATE
// =====================
let allPatients = [];
let bpChart = null;

// =====================
// FETCH ALL PATIENTS
// =====================
async function fetchPatients() {
  try {
    const response = await fetch(API_URL, { headers: API_HEADERS });
    if (!response.ok) throw new Error("Failed to fetch patients");
    const data = await response.json();
    allPatients = data;
    renderPatientsList(data);

    // Find Jessica Taylor and display her data
    const jessica = data.find((p) => p.name === "Jessica Taylor");
    if (jessica) {
      renderPatientProfile(jessica);
      renderDiagnosisHistory(jessica);
      renderVitals(jessica);
      renderDiagnosticList(jessica);
      renderLabResults(jessica);
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// =====================
// RENDER PATIENTS LIST
// =====================
function renderPatientsList(patients) {
  const list = document.getElementById("patientsList");
  list.innerHTML = "";

  patients.forEach((patient) => {
    const isJessica = patient.name === "Jessica Taylor";
    const li = document.createElement("li");
    li.className = `patient-item ${isJessica ? "active" : ""}`;

    li.innerHTML = `
            <img 
                src="${patient.profile_picture || "https://i.pravatar.cc/48"}" 
                alt="${patient.name}" 
                class="patient-avatar"
                onerror="this.src='https://i.pravatar.cc/48'"
            >
            <div class="patient-info">
                <div class="patient-name">${patient.name}</div>
                <div class="patient-meta">${patient.gender}, ${patient.age}</div>
            </div>
            <span class="patient-more">⋯</span>
        `;

    list.appendChild(li);
  });
}

// =====================
// RENDER PATIENT PROFILE
// =====================
function renderPatientProfile(patient) {
  const photo = document.getElementById("patientPhoto");
  photo.src = patient.profile_picture || "https://i.pravatar.cc/120?img=5";
  photo.onerror = () => {
    photo.src = "https://i.pravatar.cc/120?img=5";
  };

  document.getElementById("patientName").textContent = patient.name;
  document.getElementById("patientDOB").textContent =
    patient.date_of_birth || "--";
  document.getElementById("patientGender").textContent = patient.gender || "--";
  document.getElementById("patientPhone").textContent =
    patient.phone_number || "--";
  document.getElementById("patientEmergency").textContent =
    patient.emergency_contact || "--";
  document.getElementById("patientInsurance").textContent =
    patient.insurance_type || "--";
}

// =====================
// RENDER BLOOD PRESSURE CHART
// =====================
function renderDiagnosisHistory(patient) {
  const history = patient.diagnosis_history || [];

  // Get first 6 months (most recent, since API data is ordered newest first)
  const last6 = history.slice(0, 6);

  const labels = last6.map((h) => {
    // Month is stored as a string (e.g., "March"), abbreviate to 3 letters
    const abbreviatedMonth = h.month.slice(0, 3);
    return `${abbreviatedMonth}, ${h.year}`;
  });

  const systolicData = last6.map((h) => h.blood_pressure?.systolic?.value || 0);
  const diastolicData = last6.map(
    (h) => h.blood_pressure?.diastolic?.value || 0,
  );

  // Latest readings for the legend (most recent, which is first in the array)
  const latest = last6[0];
  if (latest) {
    document.getElementById("systolicValue").textContent =
      latest.blood_pressure?.systolic?.value || "--";
    document.getElementById("systolicStatus").innerHTML =
      getStatusArrow(latest.blood_pressure?.systolic?.levels) +
      " " +
      (latest.blood_pressure?.systolic?.levels || "");

    document.getElementById("diastolicValue").textContent =
      latest.blood_pressure?.diastolic?.value || "--";
    document.getElementById("diastolicStatus").innerHTML =
      getStatusArrow(latest.blood_pressure?.diastolic?.levels) +
      " " +
      (latest.blood_pressure?.diastolic?.levels || "");
  }

  // Destroy existing chart if any
  if (bpChart) {
    bpChart.destroy();
  }

  const ctx = document.getElementById("bloodPressureChart").getContext("2d");
  bpChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Systolic",
          data: systolicData,
          borderColor: "#E66FD2",
          backgroundColor: "rgba(230, 111, 210, 0.1)",
          borderWidth: 2.5,
          pointBackgroundColor: "#E66FD2",
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.4,
          fill: false,
        },
        {
          label: "Diastolic",
          data: diastolicData,
          borderColor: "#8C6FE6",
          backgroundColor: "rgba(140, 111, 230, 0.1)",
          borderWidth: 2.5,
          pointBackgroundColor: "#8C6FE6",
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.4,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#072635",
          titleColor: "#fff",
          bodyColor: "#CBD5E1",
          cornerRadius: 8,
          padding: 12,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { family: "Manrope", size: 12 },
            color: "#707070",
          },
        },
        y: {
          min: 60,
          max: 180,
          grid: {
            color: "rgba(0,0,0,0.06)",
            drawBorder: false,
          },
          ticks: {
            font: { family: "Manrope", size: 12 },
            color: "#707070",
            stepSize: 20,
          },
        },
      },
    },
  });
}

// =====================
// RENDER VITALS
// =====================
function renderVitals(patient) {
  const history = patient.diagnosis_history || [];
  const latest = history[0]; // Most recent entry is first in the array

  if (!latest) return;

  // Respiratory Rate
  const rr = latest.respiratory_rate;
  document.getElementById("respiratoryRate").textContent = rr?.value
    ? `${rr.value} bpm`
    : "--";
  document.getElementById("respiratoryStatus").innerHTML = rr?.levels || "";

  // Temperature
  const temp = latest.temperature;
  document.getElementById("temperature").textContent = temp?.value
    ? `${temp.value}°F`
    : "--";
  document.getElementById("temperatureStatus").innerHTML = temp?.levels || "";

  // Heart Rate
  const hr = latest.heart_rate;
  document.getElementById("heartRate").textContent = hr?.value
    ? `${hr.value} bpm`
    : "--";
  document.getElementById("heartRateStatus").innerHTML =
    getStatusArrow(hr?.levels) + " " + (hr?.levels || "") || "";
}

// =====================
// RENDER DIAGNOSTIC LIST
// =====================
function renderDiagnosticList(patient) {
  const tbody = document.getElementById("diagnosticTableBody");
  const diagnostics = patient.diagnostic_list || [];
  tbody.innerHTML = "";

  if (diagnostics.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="3" class="loading">No diagnostics available</td></tr>';
    return;
  }

  diagnostics.forEach((diag) => {
    const tr = document.createElement("tr");
    const statusClass = getStatusClass(diag.status);

    tr.innerHTML = `
            <td><strong>${diag.name || "--"}</strong></td>
            <td>${diag.description || "--"}</td>
            <td><span class="status-badge ${statusClass}">${diag.status || "--"}</span></td>
        `;
    tbody.appendChild(tr);
  });
}

// =====================
// RENDER LAB RESULTS
// =====================
function renderLabResults(patient) {
  const list = document.getElementById("labResultsList");
  const labResults = patient.lab_results || [];
  list.innerHTML = "";

  if (labResults.length === 0) {
    list.innerHTML = '<li class="lab-item">No lab results available</li>';
    return;
  }

  labResults.forEach((lab) => {
    const li = document.createElement("li");
    li.className = "lab-item";
    li.innerHTML = `
            <span>${lab}</span>
            <span class="lab-download" title="Download"></span>
        `;
    list.appendChild(li);
  });
}

// =====================
// HELPER FUNCTIONS
// =====================
function getStatusArrow(level) {
  if (!level) return "";
  const lower = level.toLowerCase();
  if (lower.includes("higher") || lower.includes("above")) return "▲";
  if (lower.includes("lower") || lower.includes("below")) return "▼";
  return "";
}

function getStatusClass(status) {
  if (!status) return "";
  const lower = status.toLowerCase();
  if (lower.includes("active")) return "status-active";
  if (lower.includes("cured")) return "status-cured";
  if (lower.includes("observation")) return "status-observation";
  if (lower.includes("inactive")) return "status-inactive";
  return "";
}

// =====================
// INIT
// =====================
document.addEventListener("DOMContentLoaded", fetchPatients);
