// clases('dado', guardado && 'dado--guardado') → "dado dado--guardado"
export default function clases(...nombres) {
    return nombres.filter(Boolean).join(' ');
}
