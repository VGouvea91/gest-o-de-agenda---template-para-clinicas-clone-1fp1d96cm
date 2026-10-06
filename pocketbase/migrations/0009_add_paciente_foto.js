migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('pacientes')

    if (!col.fields.getByName('foto')) {
      col.fields.add(
        new FileField({
          name: 'foto',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('pacientes')

    if (col.fields.getByName('foto')) {
      col.fields.removeByName('foto')
      app.save(col)
    }
  },
)
