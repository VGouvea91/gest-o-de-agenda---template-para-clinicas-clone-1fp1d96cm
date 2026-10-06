onRecordCreate((e) => {
  const requested = e.record.getString('role')

  // Does an owner (Administrador) already exist?
  let hasAdmin = false
  try {
    const admins = $app.findRecordsByFilter('users', "role = 'Administrador'", '', 1, 0)
    hasAdmin = admins && admins.length > 0
  } catch (_) {}

  if (!requested) {
    // Public sign-up with no role specified: on a fresh clone the very first
    // account becomes the clinic owner (Administrador). Later self-sign-ups
    // default to Atendimento (non-admin).
    e.record.set('role', hasAdmin ? 'Atendimento' : 'Administrador')
  }
  // Explicit role (staff created by an admin via the Usuários screen) is kept.

  e.next()
}, 'users')
