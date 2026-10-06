migrate(
  (app) => {
    // Intentionally empty. The founder admin account is no longer seeded —
    // the first sign-up claims ownership (see pocketbase/hooks/on_user_create.js).
  },
  (app) => {},
)
