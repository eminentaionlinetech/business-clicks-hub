export type ToolKey = "subtrack" | "jobflow" | "paychaser" | "reportsnap" | "claimdesk";

export type Tool = {
  key: ToolKey;
  name: string;
  initials: string;
  tagline: string;
  price: number;
};

export const TOOLS: Tool[] = [
  {
    key: "subtrack",
    name: "SubTrack",
    initials: "ST",
    tagline: "Subscriptions, renewals & monthly total",
    price: 5000,
  },
  {
    key: "jobflow",
    name: "JobFlow",
    initials: "JF",
    tagline: "Job list, client details & status updates",
    price: 10000,
  },
  {
    key: "paychaser",
    name: "PayChaser",
    initials: "PC",
    tagline: "Invoice reminders, unpaid & overdue totals",
    price: 10000,
  },
  {
    key: "reportsnap",
    name: "ReportSnap",
    initials: "RS",
    tagline: "Sales, expenses & profit charts",
    price: 10000,
  },
  {
    key: "claimdesk",
    name: "ClaimDesk",
    initials: "CD",
    tagline: "Expense & insurance claims with receipts",
    price: 10000,
  },
];

export const BANK = {
  bankName: "Kuda Bank",
  accountNumber: "2088333205",
  accountName: "Okechukwu Chimaobi Destiny",
};

export function getTool(key: string): Tool | undefined {
  return TOOLS.find((t) => t.key === key);
}

export function naira(value: number): string {
  return `₦${Math.round(value).toLocaleString("en-NG")}`;
}

export function makeTrackingCode(): string {
  const block = () => String(Math.floor(1000 + Math.random() * 9000));
  return `EC-NGN-${block()}-${block()}`;
}
