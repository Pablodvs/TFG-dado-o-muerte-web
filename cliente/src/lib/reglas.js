export const NUM_DADOS = 5;
export const TIRADAS_MAXIMAS = 3;
export const VIDAS_INICIALES = 3;
export const MIN_JUGADORES = 2;
export const MAX_JUGADORES = 8;
export const MAX_LONGITUD_NOMBRE = 20;

// Devuelve por qué no se puede añadir el nombre ('vacio', 'largo', 'mesaCompleta'
// o 'repetido'; son claves de formularioJugador.errores), o null si se puede
export function validarNombre(nombre, existentes) {
    const limpio = nombre.trim();
    if (!limpio) return 'vacio';
    if (limpio.length > MAX_LONGITUD_NOMBRE) return 'largo';
    if (existentes.length >= MAX_JUGADORES) return 'mesaCompleta';
    const repetido = existentes.some(e => e.toLocaleLowerCase('es') === limpio.toLocaleLowerCase('es'));
    if (repetido) return 'repetido';
    return null;
}

export function puedenEmpezar(nombres) {
    return nombres.length >= MIN_JUGADORES && nombres.length <= MAX_JUGADORES;
}
