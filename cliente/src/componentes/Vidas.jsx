import { useTranslation } from 'react-i18next';
import Icono from './Icono';
import clases from '../lib/clases';
import { VIDAS_INICIALES } from '../lib/reglas';

// recienPerdida: anima el corazón que se acaba de perder (resumen de ronda)
export default function Vidas({ vidas, maximo = VIDAS_INICIALES, recienPerdida = false }) {
    const { t } = useTranslation();
    const total = Math.max(maximo, vidas);
    return (
        <span className="vidas" role="img" aria-label={t('comun.vidas', { count: vidas })} data-vidas={vidas}>
            {Array.from({ length: total }, (_, i) => (
                <span
                    key={i}
                    className={clases(
                        'vidas__vida',
                        i >= vidas && 'vidas__vida--perdida',
                        recienPerdida && i === vidas && 'vidas__vida--rota',
                    )}
                >
                    <Icono nombre="corazon" />
                </span>
            ))}
        </span>
    );
}
