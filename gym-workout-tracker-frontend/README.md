# Gym Workout Tracker Frontend

HTML, CSS, and JavaScript frontend for the Gym Workout Tracker project.

## Run Locally

Start the Flask backend first from `gym-workout-tracker-backend`.

Then open `index.html` directly in the browser, or run a simple local server:

```bash
python3 -m http.server 5500
```

If you use the local server, open `http://127.0.0.1:5500`.

## Features

- Home page with navbar and workout list.
- Add Workout page with form validation.
- GET integration with `http://127.0.0.1:5001/api/products`.
- POST integration to add new workouts to the backend in-memory list.
- DOM manipulation for rendering workout cards, summary metrics, filters, and delete actions.
