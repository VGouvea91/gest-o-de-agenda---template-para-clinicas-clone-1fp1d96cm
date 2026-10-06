migrate(
  (app) => {
    // Deduplicate CPFs (no-op on a clean database) so the unique index applies.
    app
      .db()
      .newQuery(`
    DELETE FROM pacientes WHERE id NOT IN (
      SELECT MIN(id) FROM pacientes GROUP BY cpf
    ) AND cpf != '' AND cpf IS NOT NULL
  `)
      .execute()

    const col = app.findCollectionByNameOrId('pacientes')
    col.addIndex('idx_pacientes_cpf', true, 'cpf', '')
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('pacientes')
    col.removeIndex('idx_pacientes_cpf')
    app.save(col)
  },
)
