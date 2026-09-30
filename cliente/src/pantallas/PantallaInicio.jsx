import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import FormularioJugador from '../componentes/FormularioJugador';
import Icono from '../componentes/Icono';
import ListaJugadores from '../componentes/ListaJugadores';
import PartidaEnCurso from '../componentes/PartidaEnCurso';
import ReglasJuego from '../componentes/ReglasJuego';
import useListaJugadores from '../hooks/useListaJugadores';
import usePartidaGuardada from '../hooks/usePartidaGuardada';
import { textoError } from '../api';
import { MAX_JUGADORES, MIN_JUGADORES } from '../lib/reglas';
import { crearPartida, selectPartida } from '../slices/partida';

function textoRecuento(t, n) {
    if (n === 0) return t('inicio.recuento.vacio', { min: MIN_JUGADORES, max: MAX_JUGADORES });
    if (n < MIN_JUGADORES) return t('inicio.recuento.faltan', { count: MIN_JUGADORES - n });
    if (n < MAX_JUGADORES) return t('inicio.recuento.caben', { count: MAX_JUGADORES - n });
    return t('inicio.recuento.completa', { total: n });
}

// En escritorio las reglas caben abiertas al lado del formulario
function pantallaAncha() {
    return typeof window.matchMedia === 'function' && window.matchMedia('(min-width: 900px)').matches;
}

export default function PantallaInicio() {
    const { t } = useTranslation();
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
                <h1 id="inicio-titulo" className="inicio__titulo">{t('inicio.titulo')}</h1>

                <section className="inicio__jugadores" aria-labelledby="inicio-jugadores-titulo">
                    <div className="inicio__encabezado">
                        <h2 id="inicio-jugadores-titulo" className="inicio__subtitulo">{t('inicio.jugadores')}</h2>
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
                    <p id="inicio-recuento" className="inicio__recuento">{textoRecuento(t, lista.jugadores.length)}</p>
                </section>

                <div className="inicio__acciones">
                    {errorCreacion && (
                        <p className="inicio__error" role="alert">{textoError(t, errorCreacion)}</p>
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
                                {t('inicio.confirmar.pregunta')}
                            </p>
                            <p id="inicio-confirmar-detalle" className="inicio__confirmar-detalle">
                                {guardada.estado
                                    ? t('inicio.confirmar.detalleRonda', { ronda: guardada.estado.ronda })
                                    : t('inicio.confirmar.detalle')}
                            </p>
                            <div className="inicio__confirmar-botones">
                                <button
                                    type="button"
                                    className="boton boton--secundario"
                                    onClick={cancelar}
                                    disabled={creando}
                                >
                                    {t('inicio.confirmar.cancelar')}
                                </button>
                                <button
                                    type="button"
                                    className="boton boton--peligro"
                                    onClick={empezar}
                                    disabled={!lista.valido || creando}
                                >
                                    {t(creando ? 'comun.creandoPartida' : 'inicio.confirmar.aceptar')}
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
                            {t(creando ? 'comun.creandoPartida' : 'inicio.empezar')}
                        </button>
                    )}
                </div>
            </section>

            <ReglasJuego abierto={reglasAbiertas} />
        </main>
    );
}
