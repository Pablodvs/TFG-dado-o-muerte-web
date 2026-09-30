import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Icono from './Icono';

export default function ErrorConexion({ titulo, mensaje, onReintentar }) {
    const { t } = useTranslation();
    return (
        <section className="error-conexion" role="alert">
            <Icono nombre="alerta" className="error-conexion__icono" />
            <h2 className="error-conexion__titulo">{titulo ?? t('errores.tituloCarga')}</h2>
            <p className="error-conexion__mensaje">{mensaje}</p>
            <div className="error-conexion__acciones">
                <button type="button" className="boton boton--principal" onClick={onReintentar}>
                    {t('comun.reintentar')}
                </button>
                <Link to="/" className="boton boton--secundario">{t('comun.menuPrincipal')}</Link>
            </div>
        </section>
    );
}
