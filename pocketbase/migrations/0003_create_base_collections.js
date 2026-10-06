migrate(
  (app) => {
    // 1. convenios
    try {
      app.findCollectionByNameOrId('convenios')
    } catch (_) {
      const convenios = new Collection({
        name: 'convenios',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'nome', type: 'text', required: true },
          { name: 'prazoPagamentoDias', type: 'number', required: true },
          { name: 'valorBaseConsulta', type: 'number', required: true },
          { name: 'ativo', type: 'bool' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(convenios)
    }

    // 2. profissionais
    try {
      app.findCollectionByNameOrId('profissionais')
    } catch (_) {
      const profissionais = new Collection({
        name: 'profissionais',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'nome', type: 'text', required: true },
          { name: 'especialidade', type: 'text', required: true },
          { name: 'registro', type: 'text', required: true },
          { name: 'duracaoConsultaMin', type: 'number', required: true },
          {
            name: 'foto',
            type: 'file',
            maxSelect: 1,
            maxSize: 5242880,
            mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
          },
          { name: 'ativo', type: 'bool' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(profissionais)
    }

    // 3. tipos_atendimento
    try {
      app.findCollectionByNameOrId('tipos_atendimento')
    } catch (_) {
      const tiposAtendimento = new Collection({
        name: 'tipos_atendimento',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'nome', type: 'text', required: true },
          {
            name: 'categoria',
            type: 'select',
            required: true,
            maxSelect: 1,
            values: ['warm', 'mint', 'primary', 'info'],
          },
          { name: 'icone', type: 'text', required: true },
          { name: 'duracaoMin', type: 'number', required: true },
          { name: 'precoBase', type: 'number' },
          { name: 'ativo', type: 'bool' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(tiposAtendimento)
    }

    // 4. pacientes
    try {
      app.findCollectionByNameOrId('pacientes')
    } catch (_) {
      const conveniosId = app.findCollectionByNameOrId('convenios').id
      const pacientes = new Collection({
        name: 'pacientes',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'nome', type: 'text', required: true },
          { name: 'cpf', type: 'text', required: true },
          { name: 'telefone', type: 'text', required: true },
          { name: 'email', type: 'email' },
          { name: 'dataNascimento', type: 'date' },
          { name: 'convenio', type: 'relation', collectionId: conveniosId, maxSelect: 1 },
          { name: 'numeroCarteirinha', type: 'text' },
          { name: 'flags', type: 'json' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(pacientes)
    }

    // 5. agendamentos
    try {
      app.findCollectionByNameOrId('agendamentos')
    } catch (_) {
      const pacientesId = app.findCollectionByNameOrId('pacientes').id
      const profissionaisId = app.findCollectionByNameOrId('profissionais').id
      const tiposAtendimentoId = app.findCollectionByNameOrId('tipos_atendimento').id
      const conveniosId = app.findCollectionByNameOrId('convenios').id
      const usersId = '_pb_users_auth_'

      const agendamentos = new Collection({
        name: 'agendamentos',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'paciente',
            type: 'relation',
            required: true,
            collectionId: pacientesId,
            maxSelect: 1,
          },
          {
            name: 'profissional',
            type: 'relation',
            required: true,
            collectionId: profissionaisId,
            maxSelect: 1,
          },
          {
            name: 'tipo',
            type: 'relation',
            required: true,
            collectionId: tiposAtendimentoId,
            maxSelect: 1,
          },
          { name: 'dataHora', type: 'date', required: true },
          { name: 'duracaoMin', type: 'number', required: true },
          {
            name: 'status',
            type: 'select',
            required: true,
            maxSelect: 1,
            values: ['aguardando', 'confirmado', 'realizado', 'faltou', 'cancelado'],
          },
          { name: 'convenio', type: 'relation', collectionId: conveniosId, maxSelect: 1 },
          { name: 'valor', type: 'number' },
          { name: 'observacoes', type: 'text' },
          { name: 'criado_por', type: 'relation', collectionId: usersId, maxSelect: 1 },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(agendamentos)
    }
  },
  (app) => {
    const collections = [
      'agendamentos',
      'pacientes',
      'tipos_atendimento',
      'profissionais',
      'convenios',
    ]
    for (const name of collections) {
      try {
        const col = app.findCollectionByNameOrId(name)
        app.delete(col)
      } catch (_) {}
    }
  },
)
