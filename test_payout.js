const payrollService = require('./src/modules/payroll/payroll.service');
const employeeService = require('./src/modules/employee/employee.service');
const paymentService = require('./src/modules/payment/payment.service');

async function testPayoutFlow() {
    console.log('--- Testing Payroll Payout Flow ---');

    const companyId = 'test-company-id';
    const userId = 'test-user-id';

    // 1. Create a test employee with bank details
    console.log('\n1. Creating test employee with bank details...');
    let employee;
    try {
        employee = await employeeService.createEmployee({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            salary: 50000,
            hireDate: new Date().toISOString(),
            bankCode: '044', // Access Bank
            accountNumber: '0123456789'
        }, userId, companyId);
        console.log('Employee created:', employee);
    } catch (error) {
        console.error('Failed to create employee:', error.message);
        return;
    }

    // 2. Submit a payroll run
    console.log('\n2. Submitting payroll run...');
    let payrollRun;
    try {
        payrollRun = await payrollService.submitPayroll({
            periodStart: '2023-11-01',
            periodEnd: '2023-11-30',
            totalAmount: 50000,
            details: [
                {
                    employeeId: employee.id,
                    name: 'John Doe',
                    netPay: 50000
                }
            ]
        }, userId, companyId);
        console.log('Payroll run submitted:', payrollRun);
    } catch (error) {
        console.error('Failed to submit payroll:', error.message);
        return;
    }

    // 3. Trigger payout
    console.log('\n3. Triggering payout initialization...');
    try {
        const payoutResult = await payrollService.payoutPayroll(payrollRun.id, userId, companyId);
        console.log('Payout Result:', JSON.stringify(payoutResult, null, 2));

        if (payoutResult.results.some(r => r.status === 'SUCCESS' || (r.status === 'FAILED' && r.error.includes('Flutterwave')))) {
            console.log('\nSUCCESS: Payout logic executed and reached transfer stage.');
        } else {
            console.log('\nFAILURE: Payout logic failed before reaching transfer stage or unexpected error.');
        }
    } catch (error) {
        console.error('Payout failed:', error.message);
    }
}

// Mocking environment variables for test if not present
if (!process.env.FLW_SECRET_KEY) process.env.FLW_SECRET_KEY = 'FLWSECK-test';
if (!process.env.FLW_WEBHOOK_SECRET) process.env.FLW_WEBHOOK_SECRET = 'test-secret';

testPayoutFlow();
