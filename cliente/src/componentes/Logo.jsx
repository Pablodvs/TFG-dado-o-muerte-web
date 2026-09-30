import clases from '../lib/clases';

// El dado-calavera de la marca: dos puntos por ojos, un corazón por nariz y
// tres puntos por dientes. Es el mismo dibujo que public/favicon.svg.
export default function Logo({ className }) {
    return (
        <svg className={clases('logo', className)} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
            <g transform="rotate(-10 50 50)">
                <rect className="logo__canto" x="14" y="19" width="72" height="72" rx="18" />
                <rect className="logo__cara" x="14" y="12" width="72" height="72" rx="18" />
                <ellipse className="logo__punto" cx="36.5" cy="41" rx="9.5" ry="10.5" />
                <ellipse className="logo__punto" cx="63.5" cy="41" rx="9.5" ry="10.5" />
                <path
                    className="logo__nariz"
                    d="M50 62.5s-6.2-3.8-6.2-7.6c0-2 1.5-3.4 3.2-3.4 1.3 0 2.3.7 3 1.8.7-1.1 1.7-1.8 3-1.8 1.7 0 3.2 1.4 3.2 3.4 0 3.8-6.2 7.6-6.2 7.6z"
                />
                <circle className="logo__punto" cx="37" cy="72" r="4.3" />
                <circle className="logo__punto" cx="50" cy="73" r="4.3" />
                <circle className="logo__punto" cx="63" cy="72" r="4.3" />
            </g>
        </svg>
    );
}
