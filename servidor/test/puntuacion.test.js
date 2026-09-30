const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const { puntuar } = require('../puntuacion')

// Todas las manos posibles de 5 dados (6^5 = 7776)
function todasLasManos() {
  const manos = []
  for (let n = 0; n < 6 ** 5; n++) {
    const mano = []
    for (let i = 0, resto = n; i < 5; i++, resto = Math.floor(resto / 6)) mano.push((resto % 6) + 1)
    manos.push(mano)
  }
  return manos
}

// Referencia por fuerza bruta: prueba todas las formas de convertir los comodines en 2..6
// y se queda con el mejor grupo. La escalera solo cuenta si ya está sin comodines.
function puntuacionDeReferencia(dados) {
  if ([...dados].sort().join('') === '23456') return 60
  let mejor = 0
  const probar = (mano, i) => {
    if (i === mano.length) {
      for (let v = 2; v <= 6; v++) {
        const cantidad = mano.filter((d) => d === v).length
        if (cantidad > 0) mejor = Math.max(mejor, cantidad * 10 + v)
      }
      return
    }
    if (mano[i] !== 1) return probar(mano, i + 1)
    for (let v = 2; v <= 6; v++) probar([...mano.slice(0, i), v, ...mano.slice(i + 1)], i + 1)
  }
  probar(dados, 0)
  return mejor
}

describe('puntuar', () => {
  describe('ejemplos del contrato', () => {
    const ejemplos = [
      [[1, 2, 2, 5, 6], 32],
      [[1, 1, 1, 4, 5], 45],
      [[2, 2, 2, 4, 4], 32],
      [[1, 1, 3, 4, 4], 44],
      [[2, 3, 4, 5, 6], 60],
      [[1, 2, 3, 4, 5], 25],
      [[1, 1, 1, 1, 1], 56],
      [[6, 6, 6, 6, 6], 56],
      [[1, 2, 3, 4, 6], 26],
      [[2, 2, 3, 3, 4], 23],
      [[3, 3, 2, 2, 4], 23],
    ]
    for (const [dados, esperada] of ejemplos) {
      it(`[${dados}] → ${esperada}`, () => {
        assert.equal(puntuar(dados).puntuacion, esperada)
      })
    }
  })

  it('devuelve el desglose completo de un grupo', () => {
    assert.deepEqual(puntuar([1, 2, 2, 5, 6]), { puntuacion: 32, tipo: 'grupo', cantidad: 3, valor: 2 })
    assert.deepEqual(puntuar([1, 1, 1, 4, 5]), { puntuacion: 45, tipo: 'grupo', cantidad: 4, valor: 5 })
    assert.deepEqual(puntuar([6, 6, 6, 6, 6]), { puntuacion: 56, tipo: 'grupo', cantidad: 5, valor: 6 })
  })

  it('cinco comodines son un repóker de 6', () => {
    assert.deepEqual(puntuar([1, 1, 1, 1, 1]), { puntuacion: 56, tipo: 'grupo', cantidad: 5, valor: 6 })
  })

  it('la escalera vale 60 en cualquier orden y no usa comodines', () => {
    const escalera = { puntuacion: 60, tipo: 'escalera', cantidad: 5, valor: null }
    assert.deepEqual(puntuar([2, 3, 4, 5, 6]), escalera)
    assert.deepEqual(puntuar([6, 4, 2, 5, 3]), escalera)
  })

  it('un 1 no puede completar una escalera', () => {
    assert.equal(puntuar([1, 3, 4, 5, 6]).tipo, 'grupo')
    assert.equal(puntuar([1, 3, 4, 5, 6]).puntuacion, 26)
    assert.equal(puntuar([1, 2, 3, 4, 5]).tipo, 'grupo')
    assert.equal(puntuar([2, 1, 4, 5, 6]).puntuacion, 26)
  })

  it('en empate de cantidad gana el valor más alto', () => {
    assert.deepEqual(puntuar([2, 2, 3, 3, 4]), { puntuacion: 23, tipo: 'grupo', cantidad: 2, valor: 3 })
    assert.deepEqual(puntuar([5, 6, 1, 5, 6]), { puntuacion: 36, tipo: 'grupo', cantidad: 3, valor: 6 })
    assert.deepEqual(puntuar([1, 1, 2, 3, 4]), { puntuacion: 34, tipo: 'grupo', cantidad: 3, valor: 4 })
  })

  it('los comodines se suman al valor más repetido, no al primero ni al último', () => {
    assert.equal(puntuar([1, 6, 2, 2, 3]).puntuacion, 32)
    assert.equal(puntuar([3, 3, 1, 6, 1]).puntuacion, 43)
  })

  it('no modifica el array recibido', () => {
    const dados = [1, 6, 1, 2, 2]
    puntuar(dados)
    assert.deepEqual(dados, [1, 6, 1, 2, 2])
    assert.doesNotThrow(() => puntuar(Object.freeze([6, 5, 4, 3, 2])))
    assert.doesNotThrow(() => puntuar(Object.freeze([1, 1, 3, 4, 4])))
  })

  it('coincide con la referencia por fuerza bruta en las 7776 manos posibles', () => {
    for (const dados of todasLasManos()) {
      const resultado = puntuar(dados)
      assert.equal(resultado.puntuacion, puntuacionDeReferencia(dados), `mano [${dados}]`)
      if (resultado.tipo === 'grupo') {
        assert.equal(resultado.puntuacion, resultado.cantidad * 10 + resultado.valor, `mano [${dados}]`)
        assert.ok(resultado.cantidad >= 2 && resultado.cantidad <= 5, `mano [${dados}]`)
        assert.ok(resultado.valor >= 2 && resultado.valor <= 6, `mano [${dados}]`)
      }
    }
  })

  it('no depende del orden de los dados', () => {
    for (const dados of todasLasManos()) {
      const ordenados = [...dados].sort()
      assert.deepEqual(puntuar(dados), puntuar(ordenados), `mano [${dados}]`)
    }
  })
})
