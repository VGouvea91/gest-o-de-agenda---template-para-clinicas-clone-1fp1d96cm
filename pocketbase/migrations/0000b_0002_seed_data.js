migrate(
  (app) => {
    // Intentionally empty. Example/seed data was removed so a fresh clone starts
    // clean. The first person to sign up becomes the clinic owner (Administrador)
    // via the on_user_create hook.
  },
  (app) => {},
)
