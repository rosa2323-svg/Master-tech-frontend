/**
 * Distritos de Lima Metropolitana y el Callao con su centro APROXIMADO.
 * Mientras no haya Google Maps (etapa 4), el cliente elige su distrito y la tarifa se calcula
 * desde ese punto. En la etapa 4 se reemplaza por la ubicación exacta de la dirección.
 */
export interface DistritoLima {
    nombre: string
    latitud: number
    longitud: number
}

export const DISTRITOS_LIMA: DistritoLima[] = [
    { nombre: 'Ate', latitud: -12.0256, longitud: -76.9189 },
    { nombre: 'Barranco', latitud: -12.1403, longitud: -77.0206 },
    { nombre: 'Bellavista (Callao)', latitud: -12.0583, longitud: -77.125 },
    { nombre: 'Breña', latitud: -12.0586, longitud: -77.0508 },
    { nombre: 'Callao', latitud: -12.0566, longitud: -77.1181 },
    { nombre: 'Carabayllo', latitud: -11.8667, longitud: -77.0333 },
    { nombre: 'Chaclacayo', latitud: -11.975, longitud: -76.7667 },
    { nombre: 'Chorrillos', latitud: -12.1692, longitud: -77.0153 },
    { nombre: 'Cieneguilla', latitud: -12.1167, longitud: -76.8167 },
    { nombre: 'Comas', latitud: -11.9333, longitud: -77.05 },
    { nombre: 'El Agustino', latitud: -12.0442, longitud: -77.0108 },
    { nombre: 'Independencia', latitud: -11.9936, longitud: -77.0567 },
    { nombre: 'Jesús María', latitud: -12.07, longitud: -77.05 },
    { nombre: 'La Molina', latitud: -12.08, longitud: -76.9 },
    { nombre: 'La Perla (Callao)', latitud: -12.0722, longitud: -77.115 },
    { nombre: 'La Victoria', latitud: -12.0658, longitud: -77.0194 },
    { nombre: 'Lima (Cercado)', latitud: -12.0464, longitud: -77.0428 },
    { nombre: 'Lince', latitud: -12.0833, longitud: -77.0333 },
    { nombre: 'Los Olivos', latitud: -11.9731, longitud: -77.0719 },
    { nombre: 'Lurigancho-Chosica', latitud: -11.95, longitud: -76.7 },
    { nombre: 'Lurín', latitud: -12.2744, longitud: -76.8706 },
    { nombre: 'Magdalena del Mar', latitud: -12.0914, longitud: -77.0728 },
    { nombre: 'Miraflores', latitud: -12.1211, longitud: -77.0297 },
    { nombre: 'Pachacámac', latitud: -12.23, longitud: -76.86 },
    { nombre: 'Pueblo Libre', latitud: -12.0725, longitud: -77.0628 },
    { nombre: 'Puente Piedra', latitud: -11.8667, longitud: -77.075 },
    { nombre: 'Rímac', latitud: -12.0289, longitud: -77.0428 },
    { nombre: 'San Borja', latitud: -12.1089, longitud: -77.0003 },
    { nombre: 'San Isidro', latitud: -12.0972, longitud: -77.0372 },
    { nombre: 'San Juan de Lurigancho', latitud: -11.9833, longitud: -77.0 },
    { nombre: 'San Juan de Miraflores', latitud: -12.155, longitud: -76.9722 },
    { nombre: 'San Luis', latitud: -12.0764, longitud: -77.0006 },
    { nombre: 'San Martín de Porres', latitud: -12.0, longitud: -77.0833 },
    { nombre: 'San Miguel', latitud: -12.0775, longitud: -77.0903 },
    { nombre: 'Santa Anita', latitud: -12.0447, longitud: -76.9714 },
    { nombre: 'Santiago de Surco', latitud: -12.1453, longitud: -77.0014 },
    { nombre: 'Surquillo', latitud: -12.1111, longitud: -77.0206 },
    { nombre: 'Villa El Salvador', latitud: -12.2133, longitud: -76.9319 },
    { nombre: 'Villa María del Triunfo', latitud: -12.1667, longitud: -76.9333 },
]
