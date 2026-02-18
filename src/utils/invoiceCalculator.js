/**
 * Centralized utility for invoice calculations.
 */
const calculateInvoiceTotals = (items = [], discount = 0) => {
    let subtotal = 0;
    let taxTotal = 0;

    const processedItems = items.map(item => {
        const amount = (item.quantity || 0) * (item.rate || 0);
        const taxAmount = (amount * (item.taxPercentage || 0)) / 100;

        subtotal += amount;
        taxTotal += taxAmount;

        return {
            ...item,
            amount,
            taxAmount
        };
    });

    const totalAmount = subtotal + taxTotal - (discount || 0);

    return {
        items: processedItems,
        subtotal,
        taxTotal,
        totalAmount: Math.max(0, totalAmount) // Ensure total isn't negative
    };
};

module.exports = {
    calculateInvoiceTotals
};
