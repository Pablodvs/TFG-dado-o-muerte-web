import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Icono from './Icono';

// Aviso en la pantalla de inicio cuando hay una partida guardada.
// estado puede ser null mientras se carga (o si el servidor no responde).
export default function PartidaEnCurso({ estado }) {
    const { t } = useTranslation();
    return (
        <section className="partida-en-curso" aria-labelledby="partida-en-curso-titulo">
            <div className="partida-en-curso__texto">
                <h2 id="partida-en-curso-titulo" className="partida-en-curso__titulo">
                    {t('partidaEnCurso.titulo')}
                </h2>
                {estado && (
                    <p className="partida-en-curso__detalle">
                        {t('partidaEnCurso.detalle', {
                            ronda: estado.ronda,
                            jugadores: estado.jugadores.map(j => j.nombre).join(', '),
                        })}
                    </p>
                )}
            </div>
            <Link to="/partida" className="boton boton--principal partida-en-curso__continuar">
                {t('partidaEnCurso.continuar')}
                <Icono nombre="flecha" />
            </Link>
        </section>
    );
}
