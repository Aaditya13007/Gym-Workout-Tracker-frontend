const API_URL = "http://127.0.0.1:5001/api/products";

const workoutList = document.querySelector("#workoutList");
const statusMessage = document.querySelector("#statusMessage");
const searchInput = document.querySelector("#searchInput");
const categoryFilter = document.querySelector("#categoryFilter");
const intensityFilter = document.querySelector("#intensityFilter");
const sortSelect = document.querySelector("#sortSelect");
const resetButton = document.querySelector("#resetButton");

const totalWorkouts = document.querySelector("#totalWorkouts");
const totalMinutes = document.querySelector("#totalMinutes");
const totalCalories = document.querySelector("#totalCalories");
const highIntensity = document.querySelector("#highIntensity");

let debounceTimer;

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

function getFilterParams() {
  const params = new URLSearchParams();

  if (searchInput.value.trim()) {
    params.set("search", searchInput.value.trim());
  }
  if (categoryFilter.value) {
    params.set("category", categoryFilter.value);
  }
  if (intensityFilter.value) {
    params.set("intensity", intensityFilter.value);
  }
  if (sortSelect.value) {
    params.set("sort", sortSelect.value);
  }

  return params;
}

function formatDate(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function setStatus(message, type = "neutral") {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
}

function updateMetrics(workouts) {
  const minutes = workouts.reduce((sum, workout) => sum + Number(workout.duration_minutes || 0), 0);
  const calories = workouts.reduce((sum, workout) => sum + Number(workout.calories || 0), 0);
  const highCount = workouts.filter((workout) => workout.intensity === "High").length;

  totalWorkouts.textContent = workouts.length;
  totalMinutes.textContent = minutes;
  totalCalories.textContent = calories;
  highIntensity.textContent = highCount;
}

function buildStat(label, value) {
  const stat = createElement("span", "card-stat");
  stat.append(createElement("strong", "", value));
  stat.append(createElement("span", "", label));
  return stat;
}

function buildWorkoutCard(workout) {
  const card = createElement("article", "workout-card");

  const cardTop = createElement("div", "card-top");
  const titleBlock = createElement("div");
  titleBlock.append(createElement("h2", "", workout.name));
  titleBlock.append(createElement("p", "muted", `${workout.muscle_group} • ${formatDate(workout.date)}`));

  const badge = createElement("span", `badge ${workout.intensity.toLowerCase()}`, workout.intensity);
  cardTop.append(titleBlock, badge);

  const meta = createElement("div", "card-meta");
  meta.append(
    buildStat("minutes", workout.duration_minutes),
    buildStat("sets", workout.sets),
    buildStat("reps", workout.reps),
    buildStat("calories", workout.calories)
  );

  const category = createElement("p", "category-line", workout.category);
  const notes = createElement("p", "notes", workout.notes || "No notes added.");

  const actions = createElement("div", "card-actions");
  const deleteButton = createElement("button", "danger-button", "Delete");
  deleteButton.type = "button";
  deleteButton.addEventListener("click", () => deleteWorkout(workout.id, workout.name));
  actions.append(deleteButton);

  card.append(cardTop, category, meta, notes, actions);
  return card;
}

function renderWorkouts(workouts) {
  workoutList.textContent = "";
  updateMetrics(workouts);

  if (workouts.length === 0) {
    setStatus("No workouts match your filters.", "empty");
    return;
  }

  setStatus(`${workouts.length} workout${workouts.length === 1 ? "" : "s"} loaded.`, "success");
  const fragment = document.createDocumentFragment();
  workouts.forEach((workout) => fragment.append(buildWorkoutCard(workout)));
  workoutList.append(fragment);
}

async function loadWorkouts() {
  const params = getFilterParams();
  const url = params.toString() ? `${API_URL}?${params}` : API_URL;

  setStatus("Loading workouts...");

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.success === false) {
      throw new Error(data.error || "Unable to load workouts.");
    }

    renderWorkouts(data.products || data.workouts || []);
  } catch (error) {
    updateMetrics([]);
    workoutList.textContent = "";
    setStatus(
      "Could not connect to the Flask API. Start the backend at http://127.0.0.1:5001 and refresh.",
      "error"
    );
  }
}

async function deleteWorkout(id, name) {
  const confirmed = window.confirm(`Delete "${name}" from your workout log?`);
  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok || data.success === false) {
      throw new Error(data.error || "Delete failed.");
    }
    await loadWorkouts();
  } catch (error) {
    setStatus("Delete failed. Please check that the backend is running.", "error");
  }
}

function scheduleSearch() {
  window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(loadWorkouts, 250);
}

searchInput.addEventListener("input", scheduleSearch);
categoryFilter.addEventListener("change", loadWorkouts);
intensityFilter.addEventListener("change", loadWorkouts);
sortSelect.addEventListener("change", loadWorkouts);

resetButton.addEventListener("click", () => {
  searchInput.value = "";
  categoryFilter.value = "";
  intensityFilter.value = "";
  sortSelect.value = "date_desc";
  loadWorkouts();
});

loadWorkouts();
