import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import Cargando from '../componentes/Cargando';
import Clasificacion from '../componentes/Clasificacion';
import ErrorConexion from '../componentes/ErrorConexion';
import Icono from '../componentes/Icono';
import Mano from '../componentes/Mano';
import useArmado from '../hooks/useArmado';
import usePartidaGuardada from '../hooks/usePartidaGuardada';
import clases from '../lib/clases';
import { describirDados } from '../lib/puntuacion';
import { crearPartida, salirDePartida, selectPartida } from '../slices/partida';

// Para quien pierde. Se elige según la partida, así no cambia al volver a pintar
const CASTIGOS = [
    'Te toca recoger la mesa.',
    'Invitas a la próxima ronda (de lo que sea).',
    'Los demás eligen la música durante la próxima hora.',
    'Cuenta un chiste malo. Los demás deciden si vale.',
    'Hoy friegas tú.',
    'Imita a una gallina durante diez segundos.',
    'Eliges la próxima peli… de la lista que te hagan los demás.',
    'Sirves las bebidas hasta la revancha.',
];

function castigoPara(partidaId) {
    return CASTIGOS[Math.abs(Number(partidaId) || 0) % CASTIGOS.length];
}

export default function PantallaFinal() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { partidaId, estado, error, reintentar } = usePartidaGuardada();
    const { creando, errorCreacion, rondaTerminada } = useSelector(selectPartida);
    // Se llega con "Ver resultado final", que está donde estos botones: un doble
    // toque no debe empezar la revancha ni salir sin ver el resultado
    const armado = useArmado();

    if (partidaId === null) return <Navigate to="/" replace />;

    if (!estado) {
        return (
            <main className="final final--cargando">
                {error
                    ? <ErrorConexion mensaje={error.mensaje} onReintentar={reintentar} />
                    : <Cargando texto="Cargando resultado…" />}
            </main>
        );
    }

    // También cubre la revancha: al crearse la nueva partida deja de estar finalizada
    if (!estado.finalizada) return <Navigate to="/partida" replace />;

    const perdedor = estado.perdedor ?? estado.jugadores.find(j => j.vidas === 0) ?? null;
    // La última jugada solo llega en la respuesta de plantarse: tras recargar ya no está
    const ultimaRonda = rondaTerminada?.finPartida ? rondaTerminada : null;

    const revancha = () => {
        dispatch(crearPartida(estado.jugadores.map(j => j.nombre)));
    };

    const irAlMenu = () => {
        dispatch(salirDePartida());
        navigate('/');
    };

    return (
        <main className="final">
            <section className="final__foco" aria-labelledby="final-titulo">
                <Icono nombre="calavera" className="final__calavera" />
                <h1 id="final-titulo" className="final__titulo">Fin de la partida</h1>
                {perdedor && (
                    <p className="final__perdedor">
                        <strong className="final__perdedor-nombre">{perdedor.nombre}</strong> pierde la partida
                    </p>
                )}
                {perdedor && (
                    <p className="final__castigo">
                        <span className="final__castigo-etiqueta">Castigo</span>
                        {castigoPara(estado.id)}
                    </p>
                )}
            </section>

            <div className="final__acciones">
                {errorCreacion && (
                    <p className="final__error" role="alert">{errorCreacion.mensaje}</p>
                )}
                <button
                    type="button"
                    className={clases('boton boton--principal final__revancha', !armado && 'boton--armando')}
                    onClick={armado ? revancha : undefined}
                    disabled={creando}
                    aria-disabled={!armado || undefined}
                >
                    <Icono nombre="tirar" />
                    {creando ? 'Creando partida…' : 'Revancha'}
                </button>
                <button
                    type="button"
                    className={clases('boton boton--secundario final__menu', !armado && 'boton--armando')}
                    onClick={armado ? irAlMenu : undefined}
                    aria-disabled={!armado || undefined}
                >
                    Menú principal
                </button>
            </div>

            <div className="final__detalles">
                {ultimaRonda && (
                    <section className="final__ultima-ronda tarjeta" aria-labelledby="final-ultima-ronda-titulo">
                        <h2 id="final-ultima-ronda-titulo" className="final__subtitulo">
                            Última ronda ({ultimaRonda.ronda})
                        </h2>
                        <p className="final__ultima-jugada">
                            {ultimaRonda.perdedor.nombre}: <strong>{describirDados(ultimaRonda.dados)}</strong>
                        </p>
                        <Mano dados={ultimaRonda.dados} tamano="mediano" />
                    </section>
                )}

                <section className="final__clasificacion tarjeta" aria-labelledby="final-clasificacion-titulo">
                    <h2 id="final-clasificacion-titulo" className="final__subtitulo">Clasificación</h2>
                    <Clasificacion jugadores={estado.jugadores} perdedorId={perdedor?.id} />
                </section>
            </div>
        </main>
    );
}
