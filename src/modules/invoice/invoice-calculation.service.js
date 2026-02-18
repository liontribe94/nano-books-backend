const calculateInvoiceTotals = (items, discount = 0) => {
    let subtotal = 0;
    let taxTotal = 0;

    const processedItems = items.map(item => {
        const amount = item.quantity * item.rate;
        const taxAmount = (amount * (item.taxPercentage || 0)) / 100;

        subtotal += amount;
        taxTotal += taxAmount;

        return {
            ...item,
            amount
        };
    });

    // Apply discount to subtotal
    const discountedSubtotal = Math.max(0, subtotal - discount);

    // Total Amount = Discounted Subtotal + Tax
    // Note: Tax calculation might vary based on jurisdiction (tax on discounted vs original).
    // Assuming tax is calculated on item level (pre-discount) effectively, or post-discount?
    // Original code logic: calculated totals from items, then applied processing.
    // Let's assume strict sum of item amounts + sum of item taxes - global discount.

    const totalAmount = discountedSubtotal + taxTotal;

    return {
        items: processedItems,
        subtotal,
        taxTotal,
        totalAmount
    };
};

module.exports = { calculateInvoiceTotals };
