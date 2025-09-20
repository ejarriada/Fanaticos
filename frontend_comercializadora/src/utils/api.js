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


// Dashboard-specific functions
export const fetchSalesVolume = async (tenantId) => {
    const response = await axiosInstance.get(`/trading/sales-volume/?tenant_id=${tenantId}`);
    return response.data;
};

export const fetchInventoryTurnoverRate = async (tenantId) => {
    const response = await axiosInstance.get(`/trading/inventory-turnover-rate/?tenant_id=${tenantId}`);
    return response.data;
};

export const fetchSupplierPerformance = async (tenantId) => {
    const response = await axiosInstance.get(`/trading/supplier-performance/?tenant_id=${tenantId}`);
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

export const fetchAvailableProductsForImport = async () => {
    const response = await axiosInstance.get('/products/available_for_import/');
    return response.data;
};
