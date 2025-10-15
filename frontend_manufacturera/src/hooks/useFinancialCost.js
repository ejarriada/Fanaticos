import { useState, useEffect } from 'react';
import * as api from '../utils/api';

export const useFinancialCost = () => {
    const calculateFinancialCost = async (paymentMethodId, bankId, amount) => {
        if (!paymentMethodId || !amount) return 0;
        
        const ruleQuery = `/financial-cost-rules/?payment_method=${paymentMethodId}${bankId ? `&bank=${bankId}` : ''}`;
        const rules = await api.list(ruleQuery);
        
        if (rules && rules.length > 0) {
            const percentage = parseFloat(rules[0].percentage);
            return (parseFloat(amount) * percentage) / 100;
        }
        return 0;
    };

    return { calculateFinancialCost };
};
