import { Trans, useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import Cargando from '../componentes/Cargando';
import Clasificacion from '../componentes/Clasificacion';
import ErrorConexion from '../componentes/ErrorConexion';
import Icono from '../componentes/Icono';
import Mano from '../componentes/Mano';
import useArmado from '../hooks/useArmado';
import usePartidaGuardada from '../hooks/usePartidaGuardada';
import { textoError } from '../api';
import clases from '../lib/clases';
import { describirDados } from '../lib/puntuacion';
import { crearPartida, salirDePartida, selectPartida } from '../slices/partida';

// Para quien pierde. Se elige según la partida, así no cambia al volver a pintar
// (ni al cambiar de idioma: todos tienen la misma lista, en el mismo orden)
function castigoPara(t, partidaId) {
    const castigos = t('final.castigos', { returnObjects: true });
    return castigos[Math.abs(Number(partidaId) || 0) % castigos.length];
}

export default function PantallaFinal() {
    const { t } = useTranslation();
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
                    ? <ErrorConexion mensaje={textoError(t, error)} onReintentar={reintentar} />
                    : <Cargando texto={t('final.cargando')} />}
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
                <h1 id="final-titulo" className="final__titulo">{t('final.titulo')}</h1>
                {perdedor && (
                    <p className="final__perdedor">
                        <Trans i18nKey="final.pierde">
                            <strong className="final__perdedor-nombre">{{ nombre: perdedor.nombre }}</strong>
                        </Trans>
                    </p>
                )}
                {perdedor && (
                    <p className="final__castigo">
                        <span className="final__castigo-etiqueta">{t('final.castigo')}</span>
                        {castigoPara(t, estado.id)}
                    </p>
                )}
            </section>

            <div className="final__acciones">
                {errorCreacion && (
                    <p className="final__error" role="alert">{textoError(t, errorCreacion)}</p>
                )}
                <button
                    type="button"
                    className={clases('boton boton--principal final__revancha', !armado && 'boton--armando')}
                    onClick={armado ? revancha : undefined}
                    disabled={creando}
                    aria-disabled={!armado || undefined}
                >
                    <Icono nombre="tirar" />
                    {t(creando ? 'comun.creandoPartida' : 'final.revancha')}
                </button>
                <button
                    type="button"
                    className={clases('boton boton--secundario final__menu', !armado && 'boton--armando')}
                    onClick={armado ? irAlMenu : undefined}
                    aria-disabled={!armado || undefined}
                >
                    {t('comun.menuPrincipal')}
                </button>
            </div>

            <div className="final__detalles">
                {ultimaRonda && (
                    <section className="final__ultima-ronda tarjeta" aria-labelledby="final-ultima-ronda-titulo">
                        <h2 id="final-ultima-ronda-titulo" className="final__subtitulo">
                            {t('final.ultimaRonda', { ronda: ultimaRonda.ronda })}
                        </h2>
                        <p className="final__ultima-jugada">
                            {ultimaRonda.perdedor.nombre}: <strong>{describirDados(ultimaRonda.dados)}</strong>
                        </p>
                        <Mano dados={ultimaRonda.dados} tamano="mediano" />
                    </section>
                )}

                <section className="final__clasificacion tarjeta" aria-labelledby="final-clasificacion-titulo">
                    <h2 id="final-clasificacion-titulo" className="final__subtitulo">{t('final.clasificacion')}</h2>
                    <Clasificacion jugadores={estado.jugadores} perdedorId={perdedor?.id} />
                </section>
            </div>
        </main>
    );
}
