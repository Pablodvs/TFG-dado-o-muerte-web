import { useEffect, useState } from 'react';

// Las barras de acciones de turno, resumen y final están en el mismo sitio, y la
// cortina de pasar el móvil ocupa toda la pantalla: sin esto, el segundo toque de
// un doble toque "atraviesa" hasta la pantalla siguiente (y se salta la cortina,
// el resumen de la ronda o el resultado final).
export const ESPERA_ARMADO = 450;

// false durante los primeros ESPERA_ARMADO ms tras montar; luego true
export default function useArmado(espera = ESPERA_ARMADO) {
    const [armado, setArmado] = useState(false);
    useEffect(() => {
        const temporizador = setTimeout(() => setArmado(true), espera);
        return () => clearTimeout(temporizador);
    }, [espera]);
    return armado;
}
