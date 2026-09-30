import { Link } from 'react-router-dom';
import Icono from './Icono';

export default function ErrorConexion({ titulo = 'No se ha podido cargar la partida', mensaje, onReintentar }) {
    return (
        <section className="error-conexion" role="alert">
            <Icono nombre="alerta" className="error-conexion__icono" />
            <h2 className="error-conexion__titulo">{titulo}</h2>
            <p className="error-conexion__mensaje">{mensaje}</p>
            <div className="error-conexion__acciones">
                <button type="button" className="boton boton--principal" onClick={onReintentar}>
                    Reintentar
                </button>
                <Link to="/" className="boton boton--secundario">Menú principal</Link>
            </div>
        </section>
    );
}
