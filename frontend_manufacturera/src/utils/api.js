import axiosInstance from './axiosInstance';

// Generic API functions
export const list = async (endpoint) => {
    const response = await axiosInstance.get(endpoint);
    return response.data;
};

export const get = async (endpoint, id) => {
    const response = await axiosInstance.get(`${endpoint}${id}/`);
    return response.data;
};

export const create = async (endpoint, data, config = {}) => {
    const response = await axiosInstance.post(endpoint, data, config);
    return response.data;
};

export const update = async (endpoint, id, data, config = {}) => {
    const response = await axiosInstance.put(`${endpoint}${id}/`, data, config);
    return response.data;
};

export const remove = async (endpoint, id) => {
    await axiosInstance.delete(`${endpoint}${id}/`);
};

export const patch = async (endpoint, id, data, config = {}) => {
    const response = await axiosInstance.patch(`${endpoint}${id}/`, data, config);
    return response.data;
};


// Dashboard-specific functions
export const fetchProductionVolume = async () => {
    const response = await axiosInstance.get(`/manufacturing/production-volume/`);
    return response.data;
};

export const fetchProcessCompletionRate = async () => {
    const response = await axiosInstance.get(`/manufacturing/process-completion-rate/`);
    return response.data;
};

export const fetchRawMaterialConsumption = async () => {
    const response = await axiosInstance.get(`/manufacturing/raw-material-consumption/`);
    return response.data;
};

export const fetchDefectiveProductsRate = async () => {
    const response = await axiosInstance.get(`/manufacturing/defective-products-rate/`);
    return response.data;
};

export const fetchOverallProfitLoss = async (tenantId) => {
    const response = await axiosInstance.get(`/management/overall-profit-loss/?tenant_id=${tenantId}`);
    return response.data;
};

export const fetchCurrentBalance = async (tenantId) => {
    const response = await axiosInstance.get(`/management/current-balance/?tenant_id=${tenantId}`);
    return response.data;
};

export const fetchRevenueExpenses = async (tenantId) => {
    const response = await axiosInstance.get(`/management/revenue-expenses/?tenant_id=${tenantId}`);
    return response.data;
};

export const fetchProjectedGrowth = async (tenantId, dataType, startDate, endDate, projectionStartDate, projectionEndDate) => {
    const response = await axiosInstance.get(`/management/projected-growth/?tenant_id=${tenantId}&data_type=${dataType}&start_date=${startDate}&end_date=${endDate}&projection_start_date=${projectionStartDate}&projection_end_date=${projectionEndDate}`);
    return response.data;
};

// Remitos API functions
const REMITOS_ENDPOINT = '/delivery-notes/';

export const listRemitos = async () => list(REMITOS_ENDPOINT);
export const getRemito = async (id) => get(REMITOS_ENDPOINT, id);
export const createRemito = async (data) => create(REMITOS_ENDPOINT, data);
export const updateRemito = async (id, data) => update(REMITOS_ENDPOINT, id, data);
export const deleteRemito = async (id) => remove(REMITOS_ENDPOINT, id);

// Other module API functions
const CLIENTS_ENDPOINT = '/clients/';
const PRODUCTS_ENDPOINT = '/products/';
const FACTORIES_ENDPOINT = '/factories/';

export const listClients = async () => list(CLIENTS_ENDPOINT);
export const listProducts = async () => list(PRODUCTS_ENDPOINT);
export const listFactories = async () => list(FACTORIES_ENDPOINT);
