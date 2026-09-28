# Business Clicks Hub

Build a web application called "Eminent Clicks" using React, Tailwind CSS, and a Firebase backend (Firestore for database and Firebase Storage for receipts). It is a suite of 5 active business tools: SubTrack, JobFlow, PayChaser, ReportSnap, and ClaimDesk.



PRICING & TOOLS SCHEMA:

- SubTrack (₦5,000): Subscription tracker, renewal dates, category tracker, monthly total ₦ auto-calculator.

- JobFlow (₦10,000): Trade business job list with status tracking (New, Quoted, Scheduled, In Progress, Completed, Invoiced), client details, and note updates.

- PayChaser (₦10,000): Invoice reminder system. Create manual invoices, track outstanding balances, calculate Unpaid vs Overdue ₦ totals.

- ReportSnap (₦10,000): Core analytics and financial reports dashboard. Generate sales/expenses/profit reports with interactive visual data charts.

- ClaimDesk (₦10,000): Expense and insurance claims portal with manual image receipt upload logs for internal business claims tracking.



CORE PAYMENT WORKFLOW (NO FAKE DATA):

1. Tagline: "One login. Pay once, unlock instantly." 

2. By default, all 5 tools are locked on the client dashboard, showing a "LOCKED — Subscribe to unlock" state.

3. Clicking "Subscribe" opens a beautiful functional payment modal. It auto-populates the correct price based on the selected tool.

4. The Modal includes a "BANK TRANSFER DETAILS" box showing:

   - Bank Name: Kuda Bank

   - Account Number: 2088333205

   - Account Name: Okechukwu Chimaobi Destiny

   - Text: "Transfer [Amount] and upload receipt. One login. Pay once, unlock instantly."

5. Modal Form Inputs:

   - Email* (Text input)

   - WhatsApp Number* (Text input)

   - Choose File* (Accepts JPG, PNG images)

6. IMAGE PROCESSING LOGIC: When a user selects a receipt file, automatically compress the image on the client-side (e.g., compress a 2.4MB image down to ~180KB for fast uploading). Show a dynamic "Uploading... X%" progress indicator that finishes within 2-3 seconds.

7. FIRESTORE SAVING: On successful upload, create a document in the Firestore collection "eminent_payments" and save the raw image file to Firebase Storage under the folder path `/receipts`.

8. TRACKING CODE: Once saved, display a success screen in the modal stating: "Receipt Uploaded! Awaiting Admin Approval". Generate and display a custom tracking code formatted exactly as: "EC-NGN-[4 random digits]-[4 random digits]". 



SECRET ADMIN SIDEBAR ACCESS (CHOOSE ONE OR ALL ACCESSIBLE INTERFACES):

- Interface 1: If URL contains `?admin=true`

- Interface 2: Triple-tap the "My Dashboard" button quickly (3 taps in 2 seconds)

- Interface 3: Long-press the round logo icon for 1.5 seconds without triggering context menus.



ADMIN DASHBOARD FUNCTIONALITY:

- Bind a live data snapshot (`onSnapshot`) to the Firestore "eminent_payments" collection for real-time live data changes.

- Top Analytics Cards: Total Uploads, Pending, Approved, Rejected.

- Search & Filter Controls: Live search bar filtering by tracking code, email, or tool. Filter tabs for [All, Pending, Approved, Rejected] and a dropdown menu to filter by specific Tool.

- Payment Cards Display: Render a clean list of submissions. Each card must show: Receipt image thumbnail (clickable to enlarge full-screen), Email, WhatsApp number, Service Name, Amount (₦), Tracking Code, Date submitted, and current Status badge.

- Actions: Include a "View Receipt" utility, a Green "Approve" button, and a Red "Reject" button.

- UNLOCK AUTOMATION: Clicking "Approve" updates the document state to 'Approved'. Using Firebase real-time listeners, the user's dashboard must instantly reflect this change, changing the tool status badge to a green "UNLOCKED" marker and transforming the action button to an active "Open" button. When clicked, it launches the fully operational functional tool layout instead of a blank screen. If "Reject" is clicked, it remains locked.



Keep design modern, clean, mobile-optimized, and styled under the branding "Eminent Clicks".

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a19a6502-bfe0-5118-8a47-0dae1616d8f4).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
