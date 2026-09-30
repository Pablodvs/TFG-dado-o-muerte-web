import { useTranslation } from 'react-i18next';
import clases from '../lib/clases';
import { describirJugada } from '../lib/puntuacion';

// "Llevas: Trío de 5", comparado con la peor tirada de la ronda
export default function JugadaActual({ jugada, peorTirada }) {
    const { t } = useTranslation();
    if (!jugada) return null;
    // Quien juega después pierde los empates, así que hay que superarla
    const supera = peorTirada ? jugada.puntuacion > peorTirada.puntuacion : null;

    return (
        <p
            className={clases(
                'jugada-actual',
                supera === true && 'jugada-actual--a-salvo',
                supera === false && 'jugada-actual--peligro',
            )}
            aria-live="polite"
        >
            <span className="jugada-actual__etiqueta">{t('jugadaActual.etiqueta')}</span>
            <strong className="jugada-actual__nombre">{describirJugada(jugada)}</strong>
            {supera !== null && (
                <span className="jugada-actual__comparacion">
                    <span className="jugada-actual__separador"> · </span>
                    {t(supera ? 'jugadaActual.supera' : 'jugadaActual.peor')}
                </span>
            )}
        </p>
    );
}
