migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!users.fields.getByName('sobrenome')) {
      users.fields.add(new TextField({ name: 'sobrenome' }))
    }
    if (!users.fields.getByName('cargo')) {
      users.fields.add(new TextField({ name: 'cargo' }))
    }
    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          values: ['Administrador', 'Atendimento', 'Profissional'],
          maxSelect: 1,
        }),
      )
    }

    users.createRule = ''
    users.updateRule = "id = @request.auth.id || @request.auth.role = 'Administrador'"

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.fields.removeByName('sobrenome')
    users.fields.removeByName('cargo')
    users.fields.removeByName('role')
    users.createRule = null
    users.updateRule = 'id = @request.auth.id'
    app.save(users)
  },
)
