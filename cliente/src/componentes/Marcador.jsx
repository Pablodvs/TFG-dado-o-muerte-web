import Icono from './Icono';
import Vidas from './Vidas';
import clases from '../lib/clases';
import { describirDados } from '../lib/puntuacion';

function estadoJugador(jugador, esActual) {
    if (jugador.haJugado) return describirDados(jugador.dados) ?? `${jugador.puntuacion} puntos`;
    return esActual ? 'Jugando' : 'Por jugar';
}

// Todos los jugadores en el orden de turno de la ronda
export default function Marcador({ jugadores, jugadorActualId = null, peorJugadorId = null }) {
    return (
        <section className="marcador" aria-labelledby="marcador-titulo">
            <h2 id="marcador-titulo" className="marcador__titulo">Marcador</h2>
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
                                {estadoJugador(jugador, esActual)}
                                {esPeor && <span className="solo-lectores"> (va perdiendo)</span>}
                            </span>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}
