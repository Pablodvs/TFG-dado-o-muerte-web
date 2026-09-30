import Icono from './Icono';
import clases from '../lib/clases';
import { plural, VIDAS_INICIALES } from '../lib/reglas';

// recienPerdida: anima el corazón que se acaba de perder (resumen de ronda)
export default function Vidas({ vidas, maximo = VIDAS_INICIALES, recienPerdida = false }) {
    const total = Math.max(maximo, vidas);
    return (
        <span className="vidas" role="img" aria-label={plural(vidas, 'vida', 'vidas')} data-vidas={vidas}>
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
