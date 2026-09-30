import { Trans, useTranslation } from 'react-i18next';
import Icono from './Icono';
import Mano from './Mano';

// clave: reglas.jugadas.<clave>.nombre / .detalle
const JUGADAS = [
    { clave: 'escalera', dados: [2, 3, 4, 5, 6] },
    { clave: 'repoker', dados: [4, 4, 4, 4, 4] },
    { clave: 'poker', dados: [5, 5, 5, 5, 2] },
    { clave: 'trio', dados: [3, 3, 3, 6, 2] },
    { clave: 'pareja', dados: [6, 6, 2, 4, 5] },
];

// Resumen de las reglas en un desplegable nativo (<details>)
export default function ReglasJuego({ abierto = false }) {
    const { t } = useTranslation();
    return (
        <details className="reglas" open={abierto}>
            <summary className="reglas__titulo">
                {t('reglas.titulo')}
                <Icono nombre="flecha" className="reglas__flecha" />
            </summary>
            <div className="reglas__contenido">
                <ul className="reglas__lista">
                    <li>{t('reglas.jugadores')}</li>
                    <li>{t('reglas.turno')}</li>
                    <li>{t('reglas.abrir')}</li>
                    <li>{t('reglas.plantarse')}</li>
                </ul>
                <h3 className="reglas__subtitulo">{t('reglas.jugadasTitulo')}</h3>
                <ol className="reglas__jugadas">
                    {JUGADAS.map(j => (
                        <li key={j.clave} className="reglas__jugada">
                            <span>
                                <strong>{t(`reglas.jugadas.${j.clave}.nombre`)}</strong>
                                : {t(`reglas.jugadas.${j.clave}.detalle`)}.
                            </span>
                            <Mano dados={j.dados} decorativa />
                        </li>
                    ))}
                </ol>
                <ul className="reglas__lista">
                    <li>{t('reglas.desempate')}</li>
                    <li>
                        <Trans i18nKey="reglas.comodines"><strong /></Trans>
                        <span className="reglas__ejemplo">
                            <span className="solo-lectores">{t('reglas.ejemplo')}</span>
                            <Mano dados={[1, 4, 4, 2, 6]} decorativa />
                            <span>{t('reglas.ejemploResultado')}</span>
                        </span>
                    </li>
                    <li>{t('reglas.perder')}</li>
                    <li>{t('reglas.fin')}</li>
                </ul>
            </div>
        </details>
    );
}
