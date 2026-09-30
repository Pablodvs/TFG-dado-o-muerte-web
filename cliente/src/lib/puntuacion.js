// Espejo en el cliente de la puntuación del servidor (el servidor es la
// autoridad; aquí solo se usa para mostrar la jugada mientras se tira).
import i18n from '../i18n';

const ESCALERA = '2,3,4,5,6';

export const PUNTUACION_ESCALERA = 60;

export function esTiradaValida(dados) {
    return Array.isArray(dados)
        && dados.length === 5
        && dados.every(d => Number.isInteger(d) && d >= 1 && d <= 6);
}

// dados: 5 enteros del 1 al 6 → { puntuacion, tipo, cantidad, valor }
export function puntuar(dados) {
    if (!esTiradaValida(dados)) {
        throw new RangeError('Se necesitan exactamente 5 dados con valores del 1 al 6');
    }

    const ordenados = [...dados].sort((a, b) => a - b);
    if (ordenados.join(',') === ESCALERA) {
        return { puntuacion: PUNTUACION_ESCALERA, tipo: 'escalera', cantidad: 5, valor: null };
    }

    // Los unos son comodines y se suman al grupo más numeroso (empate → valor más alto).
    // Con cinco comodines no hay grupo y se queda en repóker de 6.
    const comodines = dados.filter(d => d === 1).length;
    let valor = 6;
    let repeticiones = 0;
    for (let v = 2; v <= 6; v++) {
        const cuenta = dados.filter(d => d === v).length;
        if (cuenta > 0 && cuenta >= repeticiones) {
            valor = v;
            repeticiones = cuenta;
        }
    }

    const cantidad = repeticiones + comodines;
    return { puntuacion: cantidad * 10 + valor, tipo: 'grupo', cantidad, valor };
}

const NOMBRES_GRUPO = { 2: 'pareja', 3: 'trio', 4: 'poker', 5: 'repoker' };

// Resultado de puntuar() → "Escalera", "Trío de 5"... en el idioma actual
export function describirJugada({ puntuacion, cantidad, valor }) {
    if (puntuacion === PUNTUACION_ESCALERA) return i18n.t('jugadas.escalera');
    return i18n.t(`jugadas.${NOMBRES_GRUPO[cantidad]}`, { valor });
}

// Como describirJugada, pero a partir de los dados; null si la tirada no es válida
export function describirDados(dados) {
    return esTiradaValida(dados) ? describirJugada(puntuar(dados)) : null;
}
