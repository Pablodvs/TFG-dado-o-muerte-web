import { useRef, useState } from 'react';
import { MAX_JUGADORES, puedenEmpezar, validarNombre } from '../lib/reglas';

// Lista de nombres de la pantalla de inicio, con validación en línea
export default function useListaJugadores() {
    const [jugadores, setJugadores] = useState([]);   // [{ id, nombre }]
    const [borrador, setBorrador] = useState('');
    const [error, setError] = useState(null);
    const siguienteId = useRef(1);

    const nombres = jugadores.map(j => j.nombre);

    const cambiarBorrador = (texto) => {
        setBorrador(texto);
        setError(null);
    };

    // Devuelve true si se ha añadido
    const anadir = () => {
        const mensaje = validarNombre(borrador, nombres);
        if (mensaje) {
            setError(mensaje);
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
        error,
        completo: jugadores.length >= MAX_JUGADORES,
        valido: puedenEmpezar(nombres),
        cambiarBorrador,
        anadir,
        quitar,
    };
}
