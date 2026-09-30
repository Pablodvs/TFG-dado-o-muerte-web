import { Link } from 'react-router-dom';
import Icono from './Icono';

// Aviso en la pantalla de inicio cuando hay una partida guardada.
// estado puede ser null mientras se carga (o si el servidor no responde).
export default function PartidaEnCurso({ estado }) {
    return (
        <section className="partida-en-curso" aria-labelledby="partida-en-curso-titulo">
            <div className="partida-en-curso__texto">
                <h2 id="partida-en-curso-titulo" className="partida-en-curso__titulo">
                    Hay una partida a medias
                </h2>
                {estado && (
                    <p className="partida-en-curso__detalle">
                        Ronda {estado.ronda} · {estado.jugadores.map(j => j.nombre).join(', ')}
                    </p>
                )}
            </div>
            <Link to="/partida" className="boton boton--principal partida-en-curso__continuar">
                Continuar partida
                <Icono nombre="flecha" />
            </Link>
        </section>
    );
}
