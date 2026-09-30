import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Icono from './Icono';
import { MAX_LONGITUD_NOMBRE } from '../lib/reglas';

// onAnadir() devuelve true si el nombre se ha añadido
export default function FormularioJugador({ borrador, error, completo, onCambiar, onAnadir }) {
    const { t } = useTranslation();
    const entrada = useRef(null);

    const enviar = (evento) => {
        evento.preventDefault();
        // Devolver el foco al campo para escribir el siguiente nombre sin tocar nada más
        if (onAnadir()) entrada.current?.focus();
    };

    return (
        <form className="form-jugador" onSubmit={enviar} noValidate>
            <label htmlFor="form-jugador-nombre" className="form-jugador__etiqueta">
                {t('formularioJugador.etiqueta')}
            </label>
            <div className="form-jugador__fila">
                <input
                    ref={entrada}
                    id="form-jugador-nombre"
                    className="form-jugador__entrada"
                    type="text"
                    value={borrador}
                    onChange={e => onCambiar(e.target.value)}
                    maxLength={MAX_LONGITUD_NOMBRE}
                    autoComplete="off"
                    autoCapitalize="words"
                    enterKeyHint="done"
                    placeholder={t('formularioJugador.ejemplo')}
                    disabled={completo}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? 'form-jugador-error' : undefined}
                />
                <button type="submit" className="boton boton--secundario form-jugador__anadir" disabled={completo}>
                    <Icono nombre="mas" />
                    {t('formularioJugador.anadir')}
                </button>
            </div>
            {error && (
                <p id="form-jugador-error" className="form-jugador__error" role="alert">
                    {error}
                </p>
            )}
        </form>
    );
}
