let chart;
let currentPage = 1;
const limit = 200;

function showError(msg) {
  const box = document.getElementById("errorBox");
  box.textContent = msg;
  box.classList.remove("d-none");
}

function clearError() {
  const box = document.getElementById("errorBox");
  box.classList.add("d-none");
  box.textContent = "";
}

function resetMetrics() {
  const ids = ["metric-avg", "metric-min", "metric-max", "metric-std"];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = "-";
  });
}

function changePage(step) {
  currentPage += step;
  loadData();
}

async function loadData() {
  clearError();

  const field = document.getElementById("field").value;
  const chartType = document.getElementById("chartType").value;
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;

  if (!start || !end) {
    showError("Please select both Start Date and End Date.");
    return;
  }

    const startDate = new Date(start);
    const endDate = new Date(end);
    const maxDate = new Date("2026-12-31"); 

    if (startDate > endDate) {
        showError("Start Date must be earlier than or equal to End Date.");
        return;
    }

    if (endDate > maxDate || startDate.getFullYear() < 2000) {
        showError("Please enter a valid date between 2000 and 2026.");
        return;
    }

  try {
    const url = new URL(`/api/measurements`, window.location.origin);
    url.searchParams.set("field", field);
    url.searchParams.set("start_date", start);
    url.searchParams.set("end_date", end);
    url.searchParams.set("page", currentPage.toString());
    url.searchParams.set("limit", limit.toString());

    const res = await fetch(url);
    const payload = await res.json();

    if (!res.ok) {
      showError(payload.error || "Request failed");
      if (chart) chart.destroy();
      resetMetrics();
      document.getElementById("pageInfo").textContent = "";
      return;
    }

    const data = payload.data;
    const meta = payload.meta;


    const labels = data.map(d => new Date(d.timestamp).toLocaleDateString());
    const values = data.map(d => d[field] || 0); 

    if (chart) chart.destroy();

    const ctx = document.getElementById("chart").getContext("2d");
    chart = new Chart(ctx, {
      type: chartType,
      data: {
        labels,
        datasets: [{
          label: `Activity: ${field}`,
          data: values,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          fill: chartType === 'line'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });

    document.getElementById("pageInfo").textContent =
      `Total records: ${meta.total}`;

    const mUrl = new URL(`/api/measurements/metrics`, window.location.origin);
    mUrl.searchParams.set("field", field);
    mUrl.searchParams.set("start_date", start);
    mUrl.searchParams.set("end_date", end);

    const metricsRes = await fetch(mUrl);
    const metrics = await metricsRes.json();

    if (!metricsRes.ok) {
      resetMetrics();
      return;
    }
    
    document.getElementById("currentPageDisplay").textContent = `Страница: ${meta.page}`;
    document.getElementById("prevBtn").disabled = (meta.page <= 1);
    document.getElementById("nextBtn").disabled = (meta.page >= meta.totalPages);
    document.getElementById("metric-avg").textContent = metrics.avg ? Number(metrics.avg).toFixed(2) : "0";
    document.getElementById("metric-min").textContent = metrics.min ?? "0";
    document.getElementById("metric-max").textContent = metrics.max ?? "0";
    document.getElementById("metric-std").textContent = metrics.stdDev ? Number(metrics.stdDev).toFixed(2) : "0";

  } catch (e) {
    console.error("Fetch error:", e);
    showError("Network or server error");
  }
}