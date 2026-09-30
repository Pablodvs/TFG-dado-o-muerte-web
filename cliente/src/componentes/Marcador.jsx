import { useTranslation } from 'react-i18next';
import Icono from './Icono';
import Vidas from './Vidas';
import clases from '../lib/clases';
import { describirDados } from '../lib/puntuacion';

function estadoJugador(t, jugador, esActual) {
    if (jugador.haJugado) return describirDados(jugador.dados) ?? t('comun.puntos', { count: jugador.puntuacion });
    return t(esActual ? 'marcador.jugando' : 'marcador.porJugar');
}

// Todos los jugadores en el orden de turno de la ronda
export default function Marcador({ jugadores, jugadorActualId = null, peorJugadorId = null }) {
    const { t } = useTranslation();
    return (
        <section className="marcador" aria-labelledby="marcador-titulo">
            <h2 id="marcador-titulo" className="marcador__titulo">{t('marcador.titulo')}</h2>
            <ol className="marcador__lista">
                {jugadores.map(jugador => {
                    const esActual = jugador.id === jugadorActualId;
                    const esPeor = jugador.id === peorJugadorId;
                    return (
                        <li
                            key={jugador.id}
                            className={clases(
                                'marcador__jugador',
                                esActual && 'marcador__jugador--actual',
                                jugador.haJugado && 'marcador__jugador--ha-jugado',
                                esPeor && 'marcador__jugador--peor',
                                jugador.vidas === 0 && 'marcador__jugador--sin-vidas',
                            )}
                            aria-current={esActual ? 'true' : undefined}
                        >
                            <span className="marcador__nombre">{jugador.nombre}</span>
                            <Vidas vidas={jugador.vidas} />
                            <span className="marcador__estado">
                                {esPeor && <Icono nombre="calavera" className="marcador__calavera" />}
                                {estadoJugador(t, jugador, esActual)}
                                {esPeor && <span className="solo-lectores">{t('marcador.vaPerdiendo')}</span>}
                            </span>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}
