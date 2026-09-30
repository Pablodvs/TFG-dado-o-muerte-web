import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MAX_JUGADORES, MAX_LONGITUD_NOMBRE, puedenEmpezar, validarNombre } from '../lib/reglas';

// Lista de nombres de la pantalla de inicio, con validación en línea
export default function useListaJugadores() {
    const { t } = useTranslation();
    const [jugadores, setJugadores] = useState([]);   // [{ id, nombre }]
    const [borrador, setBorrador] = useState('');
    // Código de validarNombre: se traduce al pintar, por si cambia el idioma.
    // Mientras se ve el error el borrador no cambia (escribir lo borra).
    const [error, setError] = useState(null);
    const siguienteId = useRef(1);

    const nombres = jugadores.map(j => j.nombre);

    const cambiarBorrador = (texto) => {
        setBorrador(texto);
        setError(null);
    };

    // Devuelve true si se ha añadido
    const anadir = () => {
        const motivo = validarNombre(borrador, nombres);
        if (motivo) {
            setError(motivo);
            return false;
        }
        setJugadores([...jugadores, { id: siguienteId.current++, nombre: borrador.trim() }]);
        setBorrador('');
        setError(null);
        return true;
    };

    const quitar = (id) => {
        setJugadores(jugadores.filter(j => j.id !== id));
        setError(null);
    };

    return {
        jugadores,
        nombres,
        borrador,
        error: error && t(`formularioJugador.errores.${error}`, {
            nombre: borrador.trim(),
            max: error === 'largo' ? MAX_LONGITUD_NOMBRE : MAX_JUGADORES,
        }),
        completo: jugadores.length >= MAX_JUGADORES,
        valido: puedenEmpezar(nombres),
        cambiarBorrador,
        anadir,
        quitar,
    };
}
