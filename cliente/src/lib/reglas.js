export const NUM_DADOS = 5;
export const TIRADAS_MAXIMAS = 3;
export const VIDAS_INICIALES = 3;
export const MIN_JUGADORES = 2;
export const MAX_JUGADORES = 8;
export const MAX_LONGITUD_NOMBRE = 20;

// Devuelve el mensaje de error del nombre, o null si se puede añadir
export function validarNombre(nombre, existentes) {
    const limpio = nombre.trim();
    if (!limpio) return 'Escribe un nombre.';
    if (limpio.length > MAX_LONGITUD_NOMBRE) {
        return `El nombre no puede tener más de ${MAX_LONGITUD_NOMBRE} caracteres.`;
    }
    if (existentes.length >= MAX_JUGADORES) return `Como máximo pueden jugar ${MAX_JUGADORES} personas.`;
    const repetido = existentes.some(e => e.toLocaleLowerCase('es') === limpio.toLocaleLowerCase('es'));
    if (repetido) return `Ya hay alguien que se llama ${limpio}.`;
    return null;
}

export function puedenEmpezar(nombres) {
    return nombres.length >= MIN_JUGADORES && nombres.length <= MAX_JUGADORES;
}

export function plural(n, uno, varios) {
    return `${n} ${n === 1 ? uno : varios}`;
}
