# SAHAYAK Kiosk Backend Analysis

## What is the Codebase?
The codebase is **SAHAYAK Bank Kiosk**, a React-based (React 18 + Vite) frontend interface meant for banking self-service machines inside bank branches, specifically tailored for Indian customers. 
It features a complete 10-step guided customer journey that handles form submissions via on-screen touch and simulated voice input, operating primarily in English, Hindi, and Tamil. 

Currently, the entire application is powered by mock data and client-side validations, which indicates the backend needs to completely replace this mock layer with a database and APIs.

## Key Features It Supports

1. **Authentication System**
   - **User / OTP Authentication**: Initial stages before accessing services (legacy/optional paths exist).
   - **Staff Authentication**: A PIN-based login (currently hardcoded as "1234") that grants permission to the machine before a customer uses it.
   - **Staff Verification (Approval)**: Staff must re-authenticate with a PIN to verify and submit the form data collected from the customer at the end of the transaction.
   - **Auto-timeout/Reset**: Sessions automatically terminate and reset, returning the machine to an unauthenticated state.

2. **Localization**
   - The kiosk operates in English, Hindi, and Tamil. Content localization is currently managed by static objects in `src/data/mockData.js`.

3. **Multi-Modal Inputs**
   - Touch Only (Large Keypads, Text Inputs)
   - Voice + IVR (Simulated Voice-to-Text inputs)
   - Assisted Mode

## Core Data & Services: The 9 Form Categories
The core of the backend needs to store and process form entries for 9 comprehensive service categories. Each category maps to specific data fields (currently defined in `mockData.js`):

1. **Account Opening Forms**: Account Type, Names, DOB, Aadhar, PAN, Addresses, Initial Deposit.
2. **Transaction Forms**: Deposits / Withdrawals.
3. **Loan Application Forms**: Loan Type, Amount, Income, PAN, Aadhar.
4. **KYC Forms**: Updating addresses, PAN, and Aadhar against an Account Number.
5. **Service Request Forms**: Cheque books, ATM cards, Contact updates.
6. **Transfer & Remittance Forms**: RTGS/NEFT/Inward remittance details.
7. **Investment & Wealth Forms**: Mutual funds, Insurance, Investments.
8. **Enquiry & Dispute Forms**: Complaints, statement requests.
9. **Closure & Nomination Forms**: Closing an account, updating nominee details.

## Backend Implementation Requirements

To bring this application to life, the backend (e.g., Node.js/Express, Python/FastAPI, etc.) will need:

1. **Database Schema**
   - **Staff Users Table**: Validates staff PINs for login and final approval.
   - **Users/Customers Table**: Track basic account numbers, verification statuses, and basic details like phone numbers.
   - **Submissions/Transactions Table**: Models to handle the disparate structures of the 9 form categories (perhaps a JSONB column in PostgreSQL or a NoSQL collection if fields vary wildly).

2. **API Endpoints Required**
   - `POST /api/auth/staff-login`: Authenticate staff at the start of the session.
   - `POST /api/auth/otp/send` & `POST /api/auth/otp/verify`: If OTP is strictly required per user session.
   - `GET /api/forms/:serviceName`: Fetch form templates dynamically (replacing `formTemplates` in `mockData.js`).
   - `POST /api/forms/submit`: Endpoint that accepts the full payload of a verified user transaction, taking in the form data + final staff verification PIN, securely persisting it.
   
3. **Integration Steps for the React App**
   - Replace the static PIN check `pin === "1234"` in `AuthenticationScreen.jsx` and `HumanVerificationScreen.jsx`.
   - Update `AppStateContext` to manage auth tokens instead of just boolean flags.
   - Replace `mockData.js` object accesses with `fetch` calls to your new backend API.
