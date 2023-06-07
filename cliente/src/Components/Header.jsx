import { useDispatch, useSelector } from "react-redux";
import dado1 from '../images/dado1.png';
import dado2 from '../images/dado2.png';
import dado3 from '../images/dado3.png';
import dado4 from '../images/dado4.png';
import dado5 from '../images/dado5.png';
import dado6 from '../images/dado6.png';
import { Navbar } from "react-bootstrap";
import { setMostrarVidas, setVidas } from "../slices/PartidaSlice";
import axios from "axios";
import { useEffect, useState } from "react";

export default function Header() {

    const perdedor = useSelector(state => state.partida.perdedor || []);
    const perdedor_dados = perdedor[0]?.dados_guardados || [];
    const partida_id = useSelector(state => state.partida?.id)
    const [mostrar, setMostrar] = useState(false)

    const server = 'http://localhost:3001';

    useEffect(() => {
        if (localStorage.getItem)
            localStorage.clear()
    }, [])

    const dispatch = useDispatch()
    const getVidas = async () => {
        let response = await axios.post(server + '/api/get-vidas', { partida_id });
        dispatch(setVidas(response.data))
        dispatch(setMostrarVidas())
        setMostrar(!mostrar)
    };

    const dados_p = (
        <div className='d-flex align-items-center'>
            <h4 className="mb-0 me-3">Peor tirada: {perdedor[0]?.nombre} </h4>
            {perdedor_dados.map((dado, index) => (
                <div key={index}>
                    <img
                        src={
                            dado === '1' ? dado1
                                : dado === '2' ? dado2
                                    : dado === '3' ? dado3
                                        : dado === '4' ? dado4
                                            : dado === '5' ? dado5
                                                : dado6
                        }
                        alt={`Dado ${dado}`}
                        style={{ width: '50px', height: '50px', marginRight: '3px' }}
                    />
                </div>
            ))}
        </div>
    );

    return (
        <Navbar className="d-flex align-items-center bg-primary pb-3 mb-3">
            <Navbar.Collapse id="basic-navbar-nav" className="justify-content-center">
                {(Object.values(perdedor).length ? dados_p : <h2>Dado o muerte</h2>)}
            </Navbar.Collapse>
            {partida_id &&
                <button onClick={() => getVidas()} className="btn btn-dark ms-0 me-5">
                    {!mostrar ? 'Ver vidas' : 'Ocultar Vidas'}
                </button>
            }
        </Navbar>
    );
}
