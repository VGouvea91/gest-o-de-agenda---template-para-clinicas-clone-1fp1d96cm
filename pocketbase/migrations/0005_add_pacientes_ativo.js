migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('pacientes')
    if (!col.fields.getByName('ativo')) {
      col.fields.add(new BoolField({ name: 'ativo' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('pacientes')
    if (col.fields.getByName('ativo')) {
      col.fields.removeByName('ativo')
      app.save(col)
    }
  },
)
