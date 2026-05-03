const API_URL = "http://127.0.0.1:5001/api/products";

const workoutForm = document.querySelector("#workoutForm");
const formStatus = document.querySelector("#formStatus");
const dateInput = document.querySelector("#date");

const requiredFields = [
  "name",
  "category",
  "muscle_group",
  "duration_minutes",
  "intensity",
  "date",
];

function todayLocalDate() {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  const localDate = new Date(today.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 10);
}

function setFormStatus(message, type = "neutral") {
  formStatus.textContent = message;
  formStatus.className = `form-status ${type}`;
}

function setFieldError(field, message) {
  const errorElement = document.querySelector(`[data-error-for="${field}"]`);
  const input = document.querySelector(`#${field}`);

  if (errorElement) {
    errorElement.textContent = message || "";
  }

  if (input) {
    input.classList.toggle("invalid", Boolean(message));
  }
}

function clearErrors() {
  document.querySelectorAll(".field-error").forEach((element) => {
    element.textContent = "";
  });
  document.querySelectorAll(".invalid").forEach((element) => {
    element.classList.remove("invalid");
  });
}

function numberValue(formData, field) {
  const rawValue = formData.get(field);
  if (rawValue === "") {
    return 0;
  }
  return Number(rawValue);
}

function formToWorkout() {
  const formData = new FormData(workoutForm);
  return {
    name: formData.get("name").trim(),
    category: formData.get("category"),
    muscle_group: formData.get("muscle_group").trim(),
    duration_minutes: numberValue(formData, "duration_minutes"),
    intensity: formData.get("intensity"),
    sets: numberValue(formData, "sets"),
    reps: numberValue(formData, "reps"),
    calories: numberValue(formData, "calories"),
    date: formData.get("date"),
    notes: formData.get("notes").trim(),
  };
}

function validateClient(workout) {
  const errors = {};

  requiredFields.forEach((field) => {
    if (!workout[field]) {
      errors[field] = "Required.";
    }
  });

  if (workout.name && workout.name.length < 2) {
    errors.name = "Use at least 2 characters.";
  }

  if (workout.duration_minutes && (workout.duration_minutes < 1 || workout.duration_minutes > 300)) {
    errors.duration_minutes = "Use 1 to 300 minutes.";
  }

  if (workout.sets < 0 || workout.sets > 100) {
    errors.sets = "Use 0 to 100.";
  }

  if (workout.reps < 0 || workout.reps > 500) {
    errors.reps = "Use 0 to 500.";
  }

  if (workout.calories < 0 || workout.calories > 3000) {
    errors.calories = "Use 0 to 3000.";
  }

  if (workout.notes.length > 240) {
    errors.notes = "Use 240 characters or fewer.";
  }

  return errors;
}

function showErrors(errors) {
  clearErrors();
  Object.entries(errors).forEach(([field, message]) => setFieldError(field, message));
}

function showServerErrors(errors) {
  clearErrors();
  Object.entries(errors).forEach(([field, message]) => setFieldError(field, message));
  setFormStatus("Please fix the highlighted fields.", "error");
}

async function saveWorkout(workout) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(workout),
  });

  const data = await response.json();
  if (!response.ok || data.success === false) {
    const error = new Error("Save failed.");
    error.details = data.errors || {};
    throw error;
  }

  return data.workout || data.product;
}

workoutForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const workout = formToWorkout();
  const clientErrors = validateClient(workout);

  if (Object.keys(clientErrors).length > 0) {
    showErrors(clientErrors);
    setFormStatus("Please fix the highlighted fields.", "error");
    return;
  }

  setFormStatus("Saving workout...");
  clearErrors();

  try {
    const savedWorkout = await saveWorkout(workout);
    workoutForm.reset();
    dateInput.value = todayLocalDate();
    document.querySelector("#name").focus();
    setFormStatus(`${savedWorkout.name} was added to your workout log.`, "success");
  } catch (error) {
    if (error.details && Object.keys(error.details).length > 0) {
      showServerErrors(error.details);
      return;
    }
    setFormStatus("Could not connect to the Flask API. Start the backend and try again.", "error");
  }
});

workoutForm.addEventListener("reset", () => {
  window.setTimeout(() => {
    clearErrors();
    setFormStatus("");
    dateInput.value = todayLocalDate();
  }, 0);
});

dateInput.value = todayLocalDate();
