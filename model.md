🏷 Products / Inventory Collection

This is the missing core logic.

Collection: products

Stores items or services sold.

Schema
Field	Type	Required	Description
id	string	✅	Product ID
companyId	string	✅	Owner company
name	string	✅	Product name
sku	string	❌	Stock keeping unit
description	string	❌	Product description
type	string	✅	product OR service
unitPrice	number	✅	Default selling price
costPrice	number	❌	Purchase cost
quantityInStock	number	❌	Current stock
reorderLevel	number	❌	Low stock alert
isActive	boolean	✅	Product availability
createdAt	timestamp	✅	Creation date
updatedAt	timestamp	❌	Last update
📊 Inventory Transactions Collection

Tracks stock movement history.

Collection: inventoryTransactions
Schema
Field	Type	Required	Description
id	string	✅	Transaction ID
companyId	string	✅	Owner company
productId	string	✅	Linked product
type	string	✅	purchase, sale, adjustment
quantity	number	✅	Stock change amount
referenceId	string	❌	Invoice or purchase reference
createdBy	string	✅	User who triggered
createdAt	timestamp	✅	Timestamp
💰 Payments Collection

Tracks payments received from customers.

Collection: payments
Schema
Field	Type	Required	Description
id	string	✅	Payment ID
companyId	string	✅	Owner company
invoiceId	string	✅	Linked invoice
amount	number	✅	Payment amount
paymentMethod	string	✅	cash, transfer, card
paymentDate	timestamp	✅	Payment date
referenceNumber	string	❌	Bank reference
notes	string	❌	Extra details
createdBy	string	✅	User ID
createdAt	timestamp	✅	Timestamp
🧾 Expenses Collection

Tracks company expenses.

Collection: expenses
Schema
Field	Type	Required	Description
id	string	✅	Expense ID
companyId	string	✅	Owner company
vendorId	string	❌	Supplier reference
category	string	✅	Expense type
amount	number	✅	Expense amount
expenseDate	timestamp	✅	Date
paymentMethod	string	❌	Payment method
description	string	❌	Expense details
createdBy	string	✅	User ID
createdAt	timestamp	✅	Timestamp
🏭 Vendors / Suppliers Collection
Collection: vendors
Schema
Field	Type	Required	Description
id	string	✅	Vendor ID
companyId	string	✅	Owner company
name	string	✅	Vendor name
email	string	❌	Email
phone	string	❌	Phone
address	string	❌	Address
createdAt	timestamp	✅	Timestamp
🏦 Bank Accounts Collection
Collection: bankAccounts
Schema
Field	Type	Required	Description
id	string	✅	Account ID
companyId	string	✅	Owner company
accountName	string	✅	Bank account name
bankName	string	❌	Bank name
accountNumber	string	❌	Account number
balance	number	✅	Current balance
currency	string	✅	Account currency
createdAt	timestamp	✅	Timestamp
📚 Chart Of Accounts Collection

This is the HEART of accounting.

Collection: chartOfAccounts
Schema
Field	Type	Required	Description
id	string	✅	Account ID
companyId	string	✅	Owner company
name	string	✅	Account name
type	string	✅	asset, liability, income, expense, equity
code	string	❌	Account code
isActive	boolean	✅	Status
createdAt	timestamp	✅	Timestamp
📖 General Ledger Transactions Collection

This records accounting entries.

Collection: ledgerTransactions
Schema
Field	Type	Required	Description
id	string	✅	Transaction ID
companyId	string	✅	Owner company
accountId	string	✅	Chart account
debit	number	❌	Debit value
credit	number	❌	Credit value
referenceType	string	❌	invoice, expense, payment
referenceId	string	❌	Related record
createdAt	timestamp	✅	Timestamp
🔄 INVENTORY LOGIC FLOW
When invoice is created
Step 1

Fetch product from products collection

Step 2

Reduce stock

quantityInStock -= quantitySold

Step 3

Create inventoryTransactions record

type = "sale"

When purchase is recorded
quantityInStock += purchasedQuantity

💰 ACCOUNTING LOGIC FLOW
Invoice Created
Account	Entry
Accounts Receivable	Debit
Revenue	Credit
Payment Received
Account	Entry
Bank	Debit
Accounts Receivable	Credit
Expense Recorded
Account	Entry
Expense	Debit
Bank	Credit
🧮 Updated Invoice Items Schema (IMPORTANT)

You must link products to invoice items.

Add this field:

Field	Type
productId	string
🔐 Multi Tenant Rule Still Applies

Every new collection MUST contain:

companyId

📊 NEW RELATIONSHIP STRUCTURE
Company
 ├ Users
 ├ Customers
 ├ Vendors
 ├ Products
 │    └ Inventory Transactions
 ├ Invoices
 │    └ Invoice Items
 │           └ Products
 ├ Payments
 ├ Expenses
 ├ Bank Accounts
 ├ Chart Of Accounts
 ├ Ledger Transactions
 ├ Settings
 └ Audit Logs

🚀 FUTURE FEATURES NOW SUPPORTED

You can now easily add:

Profit & Loss reports

Balance sheet

Cashflow reports

Inventory valuation

Purchase orders

Payroll

Subscription billing

⭐ IMPORTANT ARCHITECTURE ADVICE (Senior Dev Tip)

Firestore works fine but accounting systems become relational heavy.

If this grows big later:

👉 You may migrate accounting core to SQL
👉 Keep Firestore for realtime UI features

Many fintech systems do this hybrid approach.