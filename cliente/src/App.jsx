import { Navigate, Route, Routes } from 'react-router-dom';
import Cabecera from './componentes/Cabecera';
import PantallaFinal from './pantallas/PantallaFinal';
import PantallaInicio from './pantallas/PantallaInicio';
import PantallaPartida from './pantallas/PantallaPartida';

export default function App() {
    return (
        <>
            <Cabecera />
            <Routes>
                <Route path="/" element={<PantallaInicio />} />
                <Route path="/partida" element={<PantallaPartida />} />
                <Route path="/fin" element={<PantallaFinal />} />
                <Route path="/pantalla-final" element={<Navigate to="/fin" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}
