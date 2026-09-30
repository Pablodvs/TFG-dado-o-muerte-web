import Dado from './Dado';
import clases from '../lib/clases';

// Una tirada de solo lectura (peor tirada, resumen de ronda...).
// decorativa: el texto de al lado ya la describe, así que se oculta a lectores de pantalla
export default function Mano({ dados, tamano = 'pequeno', className, decorativa = false }) {
    if (!Array.isArray(dados)) return null;
    return (
        <ul className={clases('mano', `mano--${tamano}`, className)} aria-hidden={decorativa || undefined}>
            {dados.map((valor, i) => (
                <li key={i} className="mano__dado">
                    <Dado valor={valor} tamano={tamano} />
                </li>
            ))}
        </ul>
    );
}
