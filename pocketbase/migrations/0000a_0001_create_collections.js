migrate(
  (app) => {
    // Intentionally empty. Collections are created idempotently by
    // 0003_create_base_collections.js. This file previously created them again
    // WITHOUT guards, which breaks fresh clones and re-applies.
  },
  (app) => {},
)
