// /frontend_manufacturera/src/utils/chequeTransformers.js

/**
 * Normaliza un objeto cheque desde el formato del backend al formato del frontend.
 * Esto es necesario para desacoplar el frontend de los nombres de campos específicos del backend.
 * @param {object} cheque - El objeto cheque tal como lo devuelve la API del backend.
 * @returns {object} - El objeto cheque normalizado para ser usado en el frontend.
 */
export const normalizeChequeFromBackend = (cheque) => {
    if (!cheque) return {};
    console.log("Normalizando cheque desde backend:", cheque);
    const normalized = {
        id: cheque.id,
        number: cheque.order_number || cheque.number || '',
        amount: cheque.amount || '',
        bank: typeof cheque.bank === 'object' ? cheque.bank?.id : cheque.bank || '',
        issuer: cheque.issuer || '',
        cuit: cheque.cuit || '',
        due_date: cheque.due_date || '',
        recipient: cheque.receiver || cheque.recipient || '',
        received_from: cheque.received_from || '',
        observations: cheque.observations || '',
        status: cheque.status ? cheque.status.toUpperCase() : 'CARGADO'
    };
    console.log("Cheque normalizado para frontend:", normalized);
    return normalized;
};

/**
 * Normaliza un objeto cheque desde el formato del frontend al formato del backend.
 * Esto asegura que la API reciba los datos en el formato que espera.
 * @param {object} cheque - El objeto cheque del estado del formulario del frontend.
 * @returns {object} - El objeto cheque listo para ser enviado a la API del backend.
 */
export const normalizeChequeToBackend = (cheque) => {
    if (!cheque) return {};
    console.log("Normalizando cheque para backend:", cheque);
    const normalized = {
        order_number: cheque.number,
        amount: parseFloat(cheque.amount) || 0,
        bank: cheque.bank || null,
        issuer: cheque.issuer || '',
        cuit: cheque.cuit || '',
        due_date: cheque.due_date || null,
        receiver: cheque.recipient,
        received_from: cheque.received_from || '',
        observations: cheque.observations || '',
        // El backend espera el formato 'Title Case' (ej. 'Cargado')
        status: cheque.status ? 
            cheque.status.charAt(0).toUpperCase() + cheque.status.slice(1).toLowerCase() 
            : 'Cargado'
    };
    console.log("Cheque normalizado para backend:", normalized);
    return normalized;
};
