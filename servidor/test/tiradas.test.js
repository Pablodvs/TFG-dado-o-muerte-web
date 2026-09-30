// Reglas de las tiradas: qué jugada es cada mano y quién tiene la peor de la ronda.
// Parte de un caso real (ronda 1 con j4 abriendo y j5 empatándole) y de los ejemplos del README.
const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const { puntuar, peorMano } = require('../puntuacion')

// Jugadores en orden de juego a partir de sus manos: orden 1, 2, 3...
function ronda(manos) {
  return Object.entries(manos).map(([nombre, dados], i) => ({
    nombre, orden: i + 1, dados, puntuacion: dados ? puntuar(dados).puntuacion : null,
  }))
}

describe('ronda 1: j4 abre con póker de 5 y j5 le empata', () => {
  const j4 = [5, 5, 3, 5, 1]
  const j5 = [1, 3, 5, 1, 5]

  it('j4 [5,5,3,5,1] es póker de 5: tres cincos y un comodín', () => {
    assert.deepEqual(puntuar(j4), { puntuacion: 45, tipo: 'grupo', cantidad: 4, valor: 5 })
  })

  it('j5 [1,3,5,1,5] también es póker de 5: dos cincos y dos comodines', () => {
    assert.deepEqual(puntuar(j5), { puntuacion: 45, tipo: 'grupo', cantidad: 4, valor: 5 })
  })

  it('el número de comodines no desempata: las dos manos valen lo mismo', () => {
    assert.equal(puntuar(j4).puntuacion, puntuar(j5).puntuacion)
  })

  it('con el empate la peor tirada pasa a ser la de j5, que juega después', () => {
    assert.equal(peorMano(ronda({ j4, j5 })).nombre, 'j5')
  })

  it('mientras j5 no se planta, la tirada a superar es la de j4', () => {
    assert.equal(peorMano(ronda({ j4, j5: null, j1: null, j2: null, j3: null })).nombre, 'j4')
  })

  it('j5 solo se salva superando los 45 puntos', () => {
    assert.equal(peorMano(ronda({ j4, j5: [1, 5, 5, 1, 5] })).nombre, 'j4') // repóker de 5
    assert.equal(peorMano(ronda({ j4, j5: [6, 6, 6, 1, 2] })).nombre, 'j4') // póker de 6
    assert.equal(peorMano(ronda({ j4, j5: [5, 5, 5, 3, 2] })).nombre, 'j5') // trío de 5
  })
})

describe('ejemplos del README', () => {
  it('ejemplo 1: empatan J1 y J3 a trío de 2 y pierde J3 por jugar después', () => {
    const jugadores = ronda({
      J1: [1, 2, 2, 5, 6], J2: [1, 1, 1, 4, 5], J3: [2, 2, 2, 4, 4], J4: [1, 1, 3, 4, 4],
    })
    assert.deepEqual(jugadores.map((j) => j.puntuacion), [32, 45, 32, 44])
    assert.equal(peorMano(jugadores).nombre, 'J3')
  })

  it('ejemplo 2: J2 pierde con una pareja; la escalera de J4 es la mejor', () => {
    const jugadores = ronda({
      J1: [1, 2, 2, 2, 6], J2: [2, 2, 3, 6, 6], J3: [2, 2, 2, 6, 6], J4: [2, 3, 4, 5, 6],
    })
    assert.deepEqual(jugadores.map((j) => j.puntuacion), [42, 26, 32, 60])
    assert.equal(peorMano(jugadores).nombre, 'J2')
  })
})

describe('peorMano', () => {
  it('sin nadie que haya jugado no hay peor tirada', () => {
    assert.equal(peorMano([]), null)
    assert.equal(peorMano(ronda({ A: null, B: null })), null)
  })

  it('en un empate a tres pierde el último en jugar', () => {
    const jugadores = ronda({ A: [3, 3, 4, 5, 6], B: [3, 3, 2, 4, 5], C: [3, 3, 2, 4, 6], D: [6, 6, 6, 2, 3] })
    assert.deepEqual(jugadores.map((j) => j.puntuacion), [23, 23, 23, 36])
    assert.equal(peorMano(jugadores).nombre, 'C')
  })

  it('el empate lo decide el orden de juego, no el orden de la lista', () => {
    const [a, b] = ronda({ A: [4, 4, 2, 3, 6], B: [4, 4, 2, 3, 5] })
    assert.equal(a.puntuacion, b.puntuacion)
    assert.equal(peorMano([b, a]).nombre, 'B')
  })

  it('la escalera gana al repóker de 6 y el repóker de 6 a cualquier otra mano', () => {
    const jugadores = ronda({ A: [2, 3, 4, 5, 6], B: [1, 1, 1, 1, 1], C: [6, 6, 6, 6, 6], D: [5, 5, 5, 5, 5] })
    assert.deepEqual(jugadores.map((j) => j.puntuacion), [60, 56, 56, 55])
    assert.equal(peorMano(jugadores).nombre, 'D')
    assert.equal(peorMano(jugadores.slice(0, 3)).nombre, 'C')
  })
})
