// Puntuación de una mano de 5 dados (valores 1..6). Los 1 son comodines.
// Función pura: no modifica el array recibido.
function puntuar(dados) {
  const ordenados = [...dados].sort((a, b) => a - b)
  // La escalera no admite comodines
  if (ordenados.join(',') === '2,3,4,5,6') {
    return { puntuacion: 60, tipo: 'escalera', cantidad: 5, valor: null }
  }

  const cuenta = [0, 0, 0, 0, 0, 0, 0]
  for (const dado of dados) cuenta[dado]++
  const comodines = cuenta[1]

  // Valor más repetido entre 2 y 6; en caso de empate gana el más alto.
  // Si los 5 dados son comodines ninguno supera a cuenta[6] = 0 y queda el 6.
  let valor = 6
  for (let v = 5; v >= 2; v--) {
    if (cuenta[v] > cuenta[valor]) valor = v
  }
  const cantidad = cuenta[valor] + comodines

  return { puntuacion: cantidad * 10 + valor, tipo: 'grupo', cantidad, valor }
}

// La peor mano de la ronda entre los jugadores que ya han jugado ({ puntuacion, orden }):
// la de menor puntuación; en caso de empate pierde quien jugó después (orden mayor).
function peorMano(jugadores) {
  let peor = null
  for (const jugador of jugadores) {
    if (jugador.puntuacion === null) continue
    if (peor === null || jugador.puntuacion < peor.puntuacion ||
        (jugador.puntuacion === peor.puntuacion && jugador.orden > peor.orden)) {
      peor = jugador
    }
  }
  return peor
}

module.exports = { puntuar, peorMano }
