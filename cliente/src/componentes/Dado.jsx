import Icono from './Icono';
import clases from '../lib/clases';

// Posición de los puntos de cada cara en un viewBox de 100×100
const I = 27;
const C = 50;
const D = 73;
const PUNTOS = [
    null,
    [[C, C]],
    [[D, I], [I, D]],
    [[D, I], [C, C], [I, D]],
    [[I, I], [D, I], [I, D], [D, D]],
    [[I, I], [D, I], [C, C], [I, D], [D, D]],
    [[I, I], [D, I], [I, C], [D, C], [I, D], [D, D]],
];

// Mientras rueda se van enseñando estas caras, una tras otra (lo hace el CSS)
const CARAS_GIRO = [3, 6, 1, 5, 2, 4];

function Puntos({ valor }) {
    // El uno es el comodín: un punto grande y rojo
    if (valor === 1) return <circle className="dado__punto dado__punto--uno" cx={C} cy={C} r="14" />;
    return PUNTOS[valor].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} className="dado__punto" cx={cx} cy={cy} r="9.5" />
    ));
}

// valor: 1..6, o null si aún no se ha tirado.
// Con onClick es un botón que alterna "guardado"; sin él, solo se muestra.
// tamano: 'pequeno' | 'mediano' | 'grande'
export default function Dado({
    valor = null,
    guardado = false,
    rodando = false,
    onClick,
    disabled = false,
    tamano = 'mediano',
}) {
    const etiqueta = `Dado: ${valor ?? 'sin tirar'}${guardado ? ', guardado' : ''}`;
    const clase = clases(
        'dado',
        `dado--${tamano}`,
        guardado && 'dado--guardado',
        rodando && 'dado--rodando',
        valor === null && 'dado--sin-tirar',
        onClick && 'dado--interactivo',
    );
    const contenido = (
        <>
            <svg className="dado__cara" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
                <g className="dado__actual">
                    {valor === null
                        ? <text className="dado__incognita" x={C} y={C}>?</text>
                        : <Puntos valor={valor} />}
                </g>
                {rodando && (
                    <g className="dado__giro">
                        {CARAS_GIRO.map(v => (
                            <g key={v} className="dado__giro-cara"><Puntos valor={v} /></g>
                        ))}
                    </g>
                )}
            </svg>
            {guardado && (
                <span className="dado__candado" aria-hidden="true">
                    <Icono nombre="candado" />
                </span>
            )}
        </>
    );

    if (!onClick) {
        return (
            <span className={clase} role="img" aria-label={etiqueta} data-valor={valor ?? undefined}>
                {contenido}
            </span>
        );
    }

    return (
        <button
            type="button"
            className={clase}
            onClick={onClick}
            disabled={disabled}
            aria-pressed={guardado}
            aria-label={etiqueta}
            data-valor={valor ?? undefined}
        >
            {contenido}
        </button>
    );
}
