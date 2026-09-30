import clases from '../lib/clases';

// Iconos en línea (viewBox 24×24). Heredan el color del texto (currentColor).
const TRAZOS = {
    corazon: (
        <path d="M12 21.2s-7.6-4.7-10-9.4C.3 8.4 2.2 3.8 6.3 3.8c2.4 0 4 1.4 5.7 3.5 1.7-2.1 3.3-3.5 5.7-3.5 4.1 0 6 4.6 4.3 8-2.4 4.7-10 9.4-10 9.4z" />
    ),
    calavera: (
        <path
            fillRule="evenodd"
            d="M12 2.2c-5.3 0-9 3.7-9 8.5 0 2.8 1.3 4.7 2.9 5.8v2.3c0 1.2.9 2.1 2.1 2.1h.9v-2.2h1.9v2.2h2.4v-2.2h1.9v2.2h.9c1.2 0 2.1-.9 2.1-2.1v-2.3c1.6-1.1 2.9-3 2.9-5.8 0-4.8-3.7-8.5-9-8.5zM8.6 9.2a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8zm6.8 0a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8zM12 14.3l-1.3 2.3h2.6z"
        />
    ),
    candado: (
        <>
            <path d="M7.5 10.5V7.8a4.5 4.5 0 0 1 9 0v2.7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
            <rect x="4.5" y="10" width="15" height="11.5" rx="3" />
        </>
    ),
    cerrar: (
        <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    ),
    mas: (
        <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
    ),
    flecha: (
        <path d="M8 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    ),
    tirar: (
        <>
            <rect x="2.5" y="7.5" width="12" height="12" rx="3" transform="rotate(-12 8.5 13.5)" />
            <path d="M15.5 3.5l1 2.2 2.2 1-2.2 1-1 2.2-1-2.2-2.2-1 2.2-1zM20 10.5l.6 1.3 1.3.6-1.3.6-.6 1.3-.6-1.3-1.3-.6 1.3-.6z" />
        </>
    ),
    mano: (
        <path d="M9 11.5V5.2a1.7 1.7 0 0 1 3.4 0v5.3-1.6a1.7 1.7 0 0 1 3.4 0v1.9-.9a1.7 1.7 0 0 1 3.2.8v5.1c0 3.6-2.6 6.2-6.1 6.2h-.7c-2 0-3.4-.8-4.6-2.3l-3.2-4.1a1.7 1.7 0 0 1 2.6-2.2z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    ),
    alerta: (
        <path
            fillRule="evenodd"
            d="M10.3 3.3a2 2 0 0 1 3.4 0l8.4 14.6a2 2 0 0 1-1.7 3H3.6a2 2 0 0 1-1.7-3zM12 8.5a1.3 1.3 0 0 0-1.3 1.4l.4 4.6a.9.9 0 0 0 1.8 0l.4-4.6A1.3 1.3 0 0 0 12 8.5zm0 7.9a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6z"
        />
    ),
};

// Decorativo por defecto: quien lo use pone el texto accesible al lado
export default function Icono({ nombre, className }) {
    return (
        <svg
            className={clases('icono', `icono--${nombre}`, className)}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            focusable="false"
        >
            {TRAZOS[nombre]}
        </svg>
    );
}
