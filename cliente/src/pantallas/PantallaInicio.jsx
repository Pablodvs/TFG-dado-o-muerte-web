import { useCallback, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import FormularioJugador from '../componentes/FormularioJugador';
import Icono from '../componentes/Icono';
import ListaJugadores from '../componentes/ListaJugadores';
import PartidaEnCurso from '../componentes/PartidaEnCurso';
import ReglasJuego from '../componentes/ReglasJuego';
import useListaJugadores from '../hooks/useListaJugadores';
import usePartidaGuardada from '../hooks/usePartidaGuardada';
import { MAX_JUGADORES, MIN_JUGADORES, plural } from '../lib/reglas';
import { crearPartida, selectPartida } from '../slices/partida';

function textoRecuento(n) {
    if (n === 0) return `Apunta entre ${MIN_JUGADORES} y ${MAX_JUGADORES} jugadores para empezar.`;
    if (n < MIN_JUGADORES) return `Falta al menos ${plural(MIN_JUGADORES - n, 'jugador', 'jugadores')} más.`;
    if (n < MAX_JUGADORES) return `¡Listos para jugar! Aún caben ${MAX_JUGADORES - n} más.`;
    return `Mesa completa: ${n} jugadores.`;
}

// En escritorio las reglas caben abiertas al lado del formulario
function pantallaAncha() {
    return typeof window.matchMedia === 'function' && window.matchMedia('(min-width: 900px)').matches;
}

export default function PantallaInicio() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const lista = useListaJugadores();
    const guardada = usePartidaGuardada();
    const { creando, errorCreacion } = useSelector(selectPartida);
    const [reglasAbiertas] = useState(pantallaAncha);
    const [confirmando, setConfirmando] = useState(false);
    const volverAlBoton = useRef(false);

    // Solo cuando ya se ha cargado: si no, parpadea con una partida que resulta estar terminada
    const hayPartidaEnCurso = Boolean(guardada.estado) && !guardada.estado.finalizada;
    // Empezar otra partida hace olvidar la guardada: antes se pregunta
    const pideConfirmar = confirmando && hayPartidaEnCurso;

    // Al abrir la pregunta el foco va a ella; al cancelar, vuelve al botón
    const enfocarPregunta = useCallback(el => el?.focus(), []);
    const refEmpezar = useCallback((el) => {
        if (el && volverAlBoton.current) {
            volverAlBoton.current = false;
            el.focus();
        }
    }, []);

    const cancelar = () => {
        volverAlBoton.current = true;
        setConfirmando(false);
    };

    const empezar = async () => {
        try {
            await dispatch(crearPartida(lista.nombres)).unwrap();
            navigate('/partida');
        } catch {
            // El mensaje queda en errorCreacion
        }
    };

    const pedirEmpezar = () => {
        if (hayPartidaEnCurso) setConfirmando(true);
        else empezar();
    };

    return (
        <main className="inicio">
            {hayPartidaEnCurso && <PartidaEnCurso estado={guardada.estado} />}

            <section className="inicio__nueva tarjeta" aria-labelledby="inicio-titulo">
                <h1 id="inicio-titulo" className="inicio__titulo">Nueva partida</h1>

                <section className="inicio__jugadores" aria-labelledby="inicio-jugadores-titulo">
                    <div className="inicio__encabezado">
                        <h2 id="inicio-jugadores-titulo" className="inicio__subtitulo">Jugadores</h2>
                        <span className="inicio__cupo" aria-hidden="true">
                            {lista.jugadores.length}/{MAX_JUGADORES}
                        </span>
                    </div>
                    <FormularioJugador
                        borrador={lista.borrador}
                        error={lista.error}
                        completo={lista.completo}
                        onCambiar={lista.cambiarBorrador}
                        onAnadir={lista.anadir}
                    />
                    <ListaJugadores jugadores={lista.jugadores} onQuitar={lista.quitar} />
                    <p id="inicio-recuento" className="inicio__recuento">{textoRecuento(lista.jugadores.length)}</p>
                </section>

                <div className="inicio__acciones">
                    {errorCreacion && (
                        <p className="inicio__error" role="alert">{errorCreacion.mensaje}</p>
                    )}
                    {pideConfirmar ? (
                        <div
                            className="inicio__confirmar"
                            role="group"
                            aria-labelledby="inicio-confirmar-pregunta"
                            aria-describedby="inicio-confirmar-detalle"
                        >
                            <p
                                id="inicio-confirmar-pregunta"
                                className="inicio__confirmar-pregunta"
                                tabIndex={-1}
                                ref={enfocarPregunta}
                            >
                                ¿Empezar una partida nueva?
                            </p>
                            <p id="inicio-confirmar-detalle" className="inicio__confirmar-detalle">
                                La partida a medias{guardada.estado ? ` (ronda ${guardada.estado.ronda})` : ''} se
                                abandonará y ya no se podrá continuar.
                            </p>
                            <div className="inicio__confirmar-botones">
                                <button
                                    type="button"
                                    className="boton boton--secundario"
                                    onClick={cancelar}
                                    disabled={creando}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="boton boton--peligro"
                                    onClick={empezar}
                                    disabled={!lista.valido || creando}
                                >
                                    {creando ? 'Creando partida…' : 'Sí, empezar otra'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            ref={refEmpezar}
                            type="button"
                            className="boton boton--principal boton--grande inicio__empezar"
                            onClick={pedirEmpezar}
                            disabled={!lista.valido || creando}
                            aria-describedby="inicio-recuento"
                        >
                            <Icono nombre="tirar" />
                            {creando ? 'Creando partida…' : 'Empezar partida'}
                        </button>
                    )}
                </div>
            </section>

            <ReglasJuego abierto={reglasAbiertas} />
        </main>
    );
}
