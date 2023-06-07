export default function escalera(arr) {
    const numerosPresentes = new Array(7).fill(false);

    for (let i = 0; i < arr.length; i++) {
        const numero = arr[i];
        if (numero >= 2 && numero <= 6) {
            numerosPresentes[numero] = true;
        }
    }

    for (let j = 2; j <= 6; j++) {
        if (!numerosPresentes[j]) {
            return false;
        }
    }

    return true;
}

export default function setPuntuacion(values) {

    let valor = 1;

    for (const v of values) {
        if (v !== 1) {
            valor = v;
            break;
        }
    }
    for (let i = 0; i < values.length; i++) {
        if (values[i] === 1) {
            values[i] = valor;
        }
    }

    let count = new Array(7).fill(0);
    let val = 0;

    values.forEach(i => {
        count[i]++;
        val = i;
    });

    const score = (count[val] * 10) + val;

    return score
}