migrate(
  (app) => {
    // Intentionally empty. Admin role is no longer assigned to a seeded account;
    // the first sign-up becomes Administrador via the on_user_create hook.
  },
  (app) => {},
)
