const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const paymentRepository = require('./payment.repository');
const invoiceRepository = require('../invoice/invoice.repository');
const auditLogService = require('../../services/auditLogService');

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;
const FLW_REDIRECT_URL = process.env.FLW_REDIRECT_URL || 'http://localhost:5173/payment/callback';

class PaymentService {
    /**
     * Initialize a Flutterwave payment for an invoice.
     * Creates a pending payment record, then calls Flutterwave Standard API
     * to generate a hosted payment link.
     */
    async initializePayment(invoiceId, companyId, userId) {
        // 1. Fetch the invoice
        const invoice = await invoiceRepository.findById(invoiceId);

        if (!invoice) {
            throw new Error('Invoice not found');
        }

        if (invoice.company_id !== companyId) {
            throw new Error('Unauthorized: Invoice does not belong to your company');
        }

        if (invoice.is_deleted) {
            throw new Error('Invoice has been deleted');
        }

        if (invoice.status === 'paid') {
            throw new Error('Invoice is already paid');
        }

        // 2. Generate a unique transaction reference
        const txRef = `NB-${invoice.invoice_number}-${Date.now()}`;

        // 3. Get customer info (use invoice data or defaults)
        const customerEmail = invoice.customer_email || 'customer@nanobooks.io';
        const customerName = invoice.customer_name || 'Customer';

        // 4. Create a pending payment record
        const paymentData = {
            id: uuidv4(),
            company_id: companyId,
            invoice_id: invoiceId,
            flw_tx_ref: txRef,
            amount: parseFloat(invoice.total_amount),
            currency: invoice.currency || 'NGN',
            status: 'pending',
            customer_email: customerEmail,
            customer_name: customerName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        await paymentRepository.create(paymentData);

        // 5. Call Flutterwave Standard Payment API
        const flwPayload = {
            tx_ref: txRef,
            amount: paymentData.amount,
            currency: paymentData.currency,
            redirect_url: FLW_REDIRECT_URL,
            customer: {
                email: customerEmail,
                name: customerName
            },
            customizations: {
                title: 'Nano Books Payment',
                description: `Payment for Invoice #${invoice.invoice_number}`,
                logo: '' // Add your logo URL here
            },
            meta: {
                invoice_id: invoiceId,
                company_id: companyId,
                user_id: userId
            }
        };

        try {
            const response = await axios.post(
                'https://api.flutterwave.com/v3/payments',
                flwPayload,
                {
                    headers: {
                        'Authorization': `Bearer ${FLW_SECRET_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.status !== 'success') {
                throw new Error(response.data.message || 'Failed to initialize payment');
            }

            // 6. Log the payment initialization
            try {
                await auditLogService.log(userId, companyId, 'CREATE', 'payment', paymentData.id, {
                    invoiceId,
                    txRef,
                    amount: paymentData.amount,
                    currency: paymentData.currency
                });
            } catch (auditError) {
                console.warn('Audit log failed:', auditError.message);
            }

            return {
                paymentLink: response.data.data.link,
                txRef,
                paymentId: paymentData.id
            };
        } catch (error) {
            // If Flutterwave API call fails, update payment record as failed
            await paymentRepository.updateStatus(paymentData.id, {
                status: 'failed',
                flw_response: { error: error.message }
            });

            if (error.response) {
                throw new Error(`Flutterwave Error: ${error.response.data?.message || error.message}`);
            }
            throw error;
        }
    }

    /**
     * Initiate a transfer to an employee bank account via Flutterwave.
     */
    async initiateTransfer(data) {
        const { employeeId, amount, currency, naration, companyId, userId, payrollRunId } = data;

        // 1. Generate unique transfer reference
        const txRef = `TR-${employeeId.substring(0, 8)}-${Date.now()}`;

        // 2. Prepare payload for Flutterwave
        const payload = {
            account_bank: data.bankCode,
            account_number: data.accountNumber,
            amount: amount,
            narration: naration || 'Payroll Disbursement',
            currency: currency || 'NGN',
            reference: txRef,
            callback_url: FLW_REDIRECT_URL, // Use same for now or a specific one
            debit_currency: currency || 'NGN'
        };

        // 3. Create a pending transfer/payment record
        const paymentData = {
            id: uuidv4(),
            company_id: companyId,
            flw_tx_ref: txRef,
            amount: amount,
            currency: payload.currency,
            status: 'pending',
            customer_email: data.employeeEmail || 'employee@nanobooks.io',
            customer_name: data.employeeName || 'Employee',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
            // type: 'disbursement' // Suggested addition to schema
        };

        // If we have additional fields like payroll_run_id, we'd add them here
        // For now, let's keep it compatible with existing schema

        await paymentRepository.create(paymentData);

        try {
            const response = await axios.post(
                'https://api.flutterwave.com/v3/transfers',
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${FLW_SECRET_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.status !== 'success') {
                throw new Error(response.data.message || 'Failed to initiate transfer');
            }

            const flwData = response.data.data;

            // Update record with Flutterwave transfer ID
            await paymentRepository.updateStatus(paymentData.id, {
                flw_transaction_id: String(flwData.id),
                status: 'successful' // Transfers are often immediate or 'NEW'
            });

            // Log the transfer
            try {
                await auditLogService.log(userId, companyId, 'CREATE', 'transfer', paymentData.id, {
                    employeeId,
                    amount,
                    currency,
                    txRef
                });
            } catch (auditError) {
                console.warn('Audit log failed:', auditError.message);
            }

            return {
                id: paymentData.id,
                txRef,
                status: flwData.status,
                flwId: flwData.id
            };
        } catch (error) {
            await paymentRepository.updateStatus(paymentData.id, {
                status: 'failed',
                flw_response: { error: error.message }
            });

            if (error.response) {
                throw new Error(`Flutterwave Transfer Error: ${error.response.data?.message || error.message}`);
            }
            throw error;
        }
    }

    /**
     * Verify a transaction with Flutterwave and reconcile.
     * Called after redirect from Flutterwave or via webhook.
     */
    async verifyTransaction(transactionId, txRef) {
        // 1. Find the payment record
        const payment = await paymentRepository.findByTxRef(txRef);

        if (!payment) {
            throw new Error('Payment record not found for this transaction');
        }

        // 2. Skip if already processed (idempotent)
        if (payment.status === 'successful') {
            return {
                status: 'successful',
                message: 'Payment already verified and reconciled',
                payment: this.mapToCamelCase(payment)
            };
        }

        // 3. Verify with Flutterwave
        let flwData;
        try {
            const response = await axios.get(
                `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
                {
                    headers: {
                        'Authorization': `Bearer ${FLW_SECRET_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            flwData = response.data.data;
        } catch (error) {
            console.error('Flutterwave verification API error:', error.message);
            throw new Error('Failed to verify transaction with Flutterwave');
        }

        // 4. Validate the response
        const isSuccessful =
            flwData.status === 'successful' &&
            flwData.tx_ref === txRef &&
            parseFloat(flwData.amount) >= parseFloat(payment.amount) &&
            flwData.currency === payment.currency;

        const newStatus = isSuccessful ? 'successful' : 'failed';

        // 5. Update payment record
        const updateData = {
            status: newStatus,
            flw_transaction_id: String(flwData.id),
            payment_method: flwData.payment_type || 'unknown',
            flw_response: {
                flw_ref: flwData.flw_ref,
                amount_settled: flwData.amount_settled,
                payment_type: flwData.payment_type,
                processor_response: flwData.processor_response,
                auth_model: flwData.auth_model,
                narration: flwData.narration,
                status: flwData.status
            }
        };

        const updatedPayment = await paymentRepository.updateStatus(payment.id, updateData);

        // 6. Reconcile invoice if payment was successful
        if (isSuccessful) {
            await this.reconcileInvoice(payment.invoice_id, updatedPayment);
        }

        return {
            status: newStatus,
            message: isSuccessful
                ? 'Payment verified and invoice marked as paid'
                : 'Payment verification failed — amounts or currency mismatch',
            payment: this.mapToCamelCase(updatedPayment)
        };
    }

    /**
     * Handle incoming Flutterwave webhook
     */
    async handleWebhook(payload, secretHash) {
        // 1. Validate webhook secret
        const expectedHash = process.env.FLW_WEBHOOK_SECRET;

        if (!expectedHash || secretHash !== expectedHash) {
            throw new Error('Invalid webhook signature');
        }

        // 2. Handle different event types
        if (payload.event === 'charge.completed') {
            return await this.handleCollectionWebhook(payload.data);
        } else if (payload.event === 'transfer.completed' || payload.event === 'transfer.failed') {
            return await this.handleTransferWebhook(payload.data, payload.event);
        } else {
            return { status: 'ignored', message: `Event type ${payload.event} is not handled` };
        }
    }

    /**
     * Handle payment collection webhooks (Invoices)
     */
    async handleCollectionWebhook(txData) {
        if (!txData || !txData.tx_ref) {
            throw new Error('Invalid webhook payload: missing transaction data');
        }

        // 3. Find payment record
        const payment = await paymentRepository.findByTxRef(txData.tx_ref);

        if (!payment) {
            console.warn(`Webhook received for unknown tx_ref: ${txData.tx_ref}`);
            return { status: 'ignored', message: 'No payment record found for this tx_ref' };
        }

        // 4. Skip if already processed (duplicate webhook protection)
        if (payment.status === 'successful') {
            return { status: 'duplicate', message: 'Payment already processed' };
        }

        // 5. Verify the transaction with Flutterwave (never trust webhook payload alone)
        return await this.verifyTransaction(txData.id, txData.tx_ref);
    }

    /**
     * Handle transfer webhooks (Payroll Disbursements)
     */
    async handleTransferWebhook(txData, event) {
        if (!txData || !txData.reference) {
            throw new Error('Invalid webhook payload: missing transfer reference');
        }

        // 1. Find the payment/transfer record
        const payment = await paymentRepository.findByTxRef(txData.reference);

        if (!payment) {
            console.warn(`Webhook received for unknown transfer reference: ${txData.reference}`);
            return { status: 'ignored', message: 'No record found for this transfer' };
        }

        const newStatus = event === 'transfer.completed' ? 'successful' : 'failed';

        // 2. Update status
        await paymentRepository.updateStatus(payment.id, {
            status: newStatus,
            flw_response: {
                ...payment.flw_response,
                webhook_payload: txData,
                event
            }
        });

        console.log(`Transfer ${payment.id} updated to ${newStatus} via webhook`);
        return { status: 'success', message: `Transfer updated to ${newStatus}` };
    }

    /**
     * Reconcile: Mark the invoice as paid and log the transaction.
     */
    async reconcileInvoice(invoiceId, payment) {
        try {
            // Update invoice status to 'paid'
            const invoiceUpdate = {
                status: 'paid',
                updated_at: new Date().toISOString()
            };

            await invoiceRepository.update(invoiceId, invoiceUpdate);

            // Audit log
            await auditLogService.log(
                payment.company_id, // Use company_id as user context for webhook-triggered reconciliations
                payment.company_id,
                'UPDATE',
                'invoice',
                invoiceId,
                {
                    action: 'payment_reconciliation',
                    paymentId: payment.id,
                    flwTransactionId: payment.flw_transaction_id,
                    amount: payment.amount,
                    currency: payment.currency,
                    paymentMethod: payment.payment_method
                }
            );

            console.log(`Invoice ${invoiceId} marked as paid. Payment: ${payment.id}`);
        } catch (error) {
            console.error(`Failed to reconcile invoice ${invoiceId}:`, error.message);
            // Don't throw — payment was successful even if reconciliation had issues
        }
    }

    /**
     * Get payments for an invoice
     */
    async getPaymentsByInvoice(invoiceId, companyId) {
        // Verify invoice belongs to company
        const invoice = await invoiceRepository.findById(invoiceId);
        if (!invoice || invoice.company_id !== companyId) {
            throw new Error('Invoice not found');
        }

        const payments = await paymentRepository.findByInvoiceId(invoiceId);
        return payments.map(this.mapToCamelCase);
    }

    /**
     * Map snake_case DB fields to camelCase for API response
     */
    mapToCamelCase(data) {
        if (!data) return null;
        return {
            id: data.id,
            companyId: data.company_id,
            invoiceId: data.invoice_id,
            flwTransactionId: data.flw_transaction_id,
            flwTxRef: data.flw_tx_ref,
            amount: data.amount,
            currency: data.currency,
            paymentMethod: data.payment_method,
            status: data.status,
            customerEmail: data.customer_email,
            customerName: data.customer_name,
            flwResponse: data.flw_response,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    }
}

module.exports = new PaymentService();
