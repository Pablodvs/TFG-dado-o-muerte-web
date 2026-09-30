import { useCallback, useEffect, useRef, useState } from 'react';
import { guardarTurno, leerTurno } from '../lib/almacen';
import { puntuar } from '../lib/puntuacion';
import { NUM_DADOS } from '../lib/reglas';

export const DURACION_TIRADA = 500;

function tirarDado() {
    return Math.floor(Math.random() * 6) + 1;
}

function turnoNuevo() {
    return {
        dados: Array.from({ length: NUM_DADOS }, () => ({ valor: null, guardado: false })),
        tirada: 0,
    };
}

// Estado de los dados durante un turno. `clave` identifica el turno
// (partida:ronda:jugador); lo tirado se guarda en localStorage con esa clave
// para que recargar la página no regale tiradas. Montar con key={clave}.
export default function useTurno(clave, tiradaMax) {
    const [turno, setTurno] = useState(() => leerTurno(clave) ?? turnoNuevo());
    const [rodando, setRodando] = useState(false);
    const temporizador = useRef(null);

    useEffect(() => () => clearTimeout(temporizador.current), []);

    useEffect(() => {
        if (turno.tirada > 0) guardarTurno(clave, turno);
    }, [clave, turno]);

    const { dados, tirada } = turno;
    const quedanTiradas = tirada < tiradaMax;
    const todosGuardados = dados.every(d => d.guardado);

    const puedeTirar = quedanTiradas && !todosGuardados && !rodando;
    const puedeGuardar = tirada > 0 && quedanTiradas && !rodando;
    const puedePlantarse = tirada > 0 && !rodando;

    const tirar = useCallback(() => {
        // El temporizador pendiente también frena un doble toque antes de repintar
        if (!puedeTirar || temporizador.current) return;
        setRodando(true);
        // Mientras ruedan no se pueden guardar dados, así que esto no cambia
        const aTirar = dados.map(d => !d.guardado);
        // Los valores cambian al terminar la animación, no antes
        temporizador.current = setTimeout(() => {
            temporizador.current = null;
            const nuevos = aTirar.map(tirarlo => (tirarlo ? tirarDado() : null));
            setTurno(t => ({
                tirada: t.tirada + 1,
                dados: t.dados.map((d, i) => (nuevos[i] === null ? d : { valor: nuevos[i], guardado: false })),
            }));
            setRodando(false);
        }, DURACION_TIRADA);
    }, [puedeTirar, dados]);

    const alternarGuardado = useCallback((indice) => {
        if (!puedeGuardar) return;
        setTurno(t => ({
            ...t,
            dados: t.dados.map((d, i) => (i === indice ? { ...d, guardado: !d.guardado } : d)),
        }));
    }, [puedeGuardar]);

    const valores = dados.map(d => d.valor);
    const jugada = tirada > 0 ? puntuar(valores) : null;

    return {
        dados,
        valores,
        tirada,
        tiradaMax,
        rodando,
        jugada,
        todosGuardados,
        puedeTirar,
        puedeGuardar,
        puedePlantarse,
        tirar,
        alternarGuardado,
    };
}
