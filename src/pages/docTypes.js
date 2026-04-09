export const loanTypes = [
  "Buy & Build",
  "Mortgage DCL",
  "Construction Loan",
  "Secured Loan DCL",
  "Stock Loan DCL",
  "Equity Release Loan",
  "Shamba Loan",
  // "Multiple Purpose Loan DCL",
  "Multiple Loan Type",
];

export const loanTypeDocuments = {
  "Buy & Build": [
    {
      title: "Contract Documents",
      documents: ["Executed Offer Letter", "Executed Affidavit of Title"],
    },
    {
      title: "KYC Documents",
      documents: ["Borrower's PIN & ID/Passport"],
    },
    {
      title: "Mortgage – Security Documents",
      documents: [
        "Original Title",
        "Pre-Construction Valuation Report",
        "Full Salary to NCBA Account",
        "NEMA EIA License (if applicable)",
        "Bills of Quantities",
        "QS BORAQs Certificate",
        "Architect BORAQs Certificate",
        "Contractor NCA Registration Certificate",
        "NCA Project Approvals or Submission Proof",
        "NCA Compliance Certificate",
        "Construction Plans & Program of Work",
        "Executed Construction Contract",
        "All Risk Insurance",
        "Contractor Performance Bond",
        "Progress-Based Loan Disbursement",
        "Principal Moratorium",
        "Bank QS Monitoring Access",
        "Adequate Property Insurance",
        "Final Post-Construction Valuation",
        "10% Performance Bond",
        "Executed Sale Agreement",
        "Borrower's Contribution Injected First",
        "Marriage Certificate",
        "Spouse ID & PIN",
        "Spousal Legal Advice Letter",
        "Spouse Advocate Certificate",
        "Spousal Consent",
        "Domestic Package Insurance",
        "Mortgage Protection Insurance",
        "Tax Compliance Certificate",
      ],
    },
  ],

  "Mortgage DCL": [
    {
      title: "Contract Documents",
      documents: [
        "Executed Facility Letter",
        "Guarantor Acknowledgment",
        "Directors' Assets & Liabilities Statement",
        "Certificate of Compliance",
        "Board Resolution",
        "Total Cost of Credit",
      ],
    },
    {
      title: "KYC Documents",
      documents: [
        "Directors' Certified IDs & PIN",
        "Certificate of Incorporation + CR1/CR2/CR8",
        "Business Licenses & Permits",
      ],
    },
    {
      title: "Security Conditions",
      documents: [
        "Mortgage Registration Certificate",
        "Form CR25",
        "Post Registration Search (CR12)",
        "Legal Fees",
        "Certificate of Clean Title",
        "Affidavit of Title",
        "Deed of Assignment of Receivables",
        "Updated CRB (Zero Arrears)",
      ],
    },
    {
      title: "Mortgage Loan Conditions",
      documents: [
        "Payment to Vendor’s Account",
        "Executed Sale Agreement",
        "20% Contribution Evidence",
        "Contribution Before Drawdown",
        "Borrower to Channel 80% Wallet",
        "Borrower Pays All Fees",
        "Subject to Banker's Rights",
      ],
    },
    {
      title: "Financial Conditions",
      documents: [
        "Annual Audited Accounts",
        "Quarterly Management Accounts",
        "Finance Covenant Certificate",
      ],
    },
    {
      title: "Compliance Documents",
      documents: [
        "Current CR12",
        "Tax Compliance Certificate",
        "Land Rates & Rent Receipts (3 years)",
        "Annual Returns (3 years)",
        "Comprehensive Insurance Cover",
        "Business Loan Protector Cover",
      ],
    },
  ],
  "Construction Loan": [
    {
      title: "Contract Documents",
      documents: [
        "Executed Facility Letter",
        "Guarantor Acknowledgment",
        "Directors' Assets & Liabilities Statement",
        "Certificate of Compliance",
        "Board Resolution",
        "Tax Compliance Certificate",
      ],
    },
    {
      title: "KYC Documents",
      documents: [
        "Directors’ Certified IDs & PIN",
        "Incorporation Docs + Memorandum & Articles",
      ],
    },
    {
      title: "Security Documents",
      documents: [
        "Certificate of Clean Title",
        "Post Registration Search",
        "Legal Fees",
        "Green Card Search",
        "Directors’ Personal Guarantees",
        "Assignment of Rent Receivables",
        "Business Loan Protector Cover",
        "Comprehensive Valuation Report",
        "Annual Returns (3 years)",
        "Land Rates & Rent Receipts (3 years)",
        "NCBA Linked Till/Paybill Setup",
        "Valid TCC",
        "Current CR12",
      ],
    },
  ],
  "Secured Loan DCL": [
    {
      title: "CONTRACT DOCUMENTS",
      documents: [
        "Duly executed Offer Letter dated 14.11.2022",
        "HR Memo",
        "TCC",
      ],
    },
    {
      title: "KYC DOCUMENTS",
      documents: ["Copy of the Borrower's PIN & ID/Passport of the Borrower"],
    },
    {
      title: "SECURITY DOCUMENTS",
      documents: [
        "Original title deed of the property to be lodged with NCBA bank",
        "Property to have a current valuation report over property",
        "Approved amount to be used...",
        "Spousal consent...",
        "Certificate from the advocate of borrower’s spouse(s)...",
        "Service providers’ fees...",
        "Letter of independent legal advice...",
        "Affidavit of Title",
      ],
    },
    {
      title: "COMPLIANCE DOCUMENTS",
      documents: [
        "Life Assurance Cover",
        "Current land rent payment confirmation",
        "Current Land rates payment confirmation",
        "Post registration search",
        "Disbursement Details",
        "Certificate of clean title.",
      ],
    },
  ],

  "Equity Release Loan": [
    {
      title: "Contract Documents",
      documents: [
        "Duly executed facility letter (Latest)",
        "Acknowledgement by Guarantors",
        "Personal financial statement",
        "Financial Ratios Compliance",
        "Board resolution authorizing entire borrowing",
      ],
    },
    {
      title: "KYC Documents",
      documents: [
        "Certified copies of National IDs/Passports and PINs of directors",
        "Certificate of Incorporation",
        "Company PIN Certificate",
        "Memorandum & Articles of Association",
      ],
    },
    {
      title: "Security Documents",
      documents: [
        "First legal charge with original title",
        "Post registration search",
        "Certificate of clean title",
        "Directors’ Personal Guarantees",
        "Valuation report from approved valuer",
        "Original title to be lodged with bank",
        "Affidavit of title",
      ],
    },
    {
      title: "Compliance Documents",
      documents: [
        "Relevant business licenses",
        "Comprehensive insurance cover with bank as first loss payee",
        "Annual returns (last 3 years)",
        "Land rates & rent receipts (3 years)",
        "Tax Compliance Certificate",
        "Valid CR12",
        "Business loan protector insurance",
      ],
    },
  ],

  "Stock Loan DCL": [
    {
      title: "CONTRACT DOCUMENTS",
      documents: [
        "Duly Executed Facility letter dated",
        "Acknowledgement by Guarantor",
        "Statement of assets and liabilities...",
        "Financial Ratios Compliance Page",
        "Accompanying Board Resolution-Borrower",
        "Total cost of credit",
      ],
    },
    {
      title: "KYC DOCUMENTS",
      documents: [
        "A copy of the Borrower’s Memorandum and Articles of Association...",
        "Certified copies of Identity card/Passport...",
      ],
    },
    {
      title: "FACILITIES SECURITY & DOCUMENTS",
      documents: [
        "Hire Purchase agreement...",
        "Credit Guarantee Scheme Endorsement Cover...",
        "Director’s Personal Guarantee...",
        "Post registration search",
        "Certificate of clean title",
        "Legal fees",
        "Property owner’s guarantee",
        "Corporate guarantee...",
      ],
    },
    {
      title: "STOCK LOAN CONDITION",
      documents: [
        "Payment to be done direct to suppliers.",
        "Bank to finance a maximum of 70% of the invoice amount.",
        "Borrower to evidence own contribution",
      ],
    },
    {
      title: "OTHER CONDITIONS",
      documents: [
        "Borrower to channel 100% share of wallet through NCBA.",
        "Security perfection before drawdown.",
        "The Borrower to ensure ALL rental income…",
        "If an Event of Default has occurred...",
        "All arising fees, commissions and charges...",
      ],
    },
    {
      title: "COMPLIANCE DOCUMENTS",
      documents: [
        "Updated CRB report",
        "Copy of Annual Returns...",
        "Copy of Annual Returns for the Guarantor...",
        "CR 12",
        "Valid TCC",
        "Business loan insurance cover",
        "MPC COVER",
        "Business permit corrected",
        "Notice of registration under MPSR Act 2017",
      ],
    },
  ],
  "Shamba Loan": [
    {
      title: "Contract Documents",
      documents: ["Duly executed Offer letter (Latest)", "HR Memo", "TCC"],
    },
    {
      title: "KYC Documents",
      documents: [
        "Borrower ID + PIN",
        "Marriage certificate or affidavit of single status",
        "Spouse ID + PIN",
      ],
    },
    {
      title: "Security Documents",
      documents: [
        "First legal charge & title",
        "Valuation report",
        "Spousal consent",
        "Independent legal advice certificate",
        "Post registration search",
      ],
    },
    {
      title: "Compliance Documents",
      documents: [
        "Life assurance cover",
        "Land rent confirmation",
        "Land rates confirmation",
        "Certificate of clean title",
      ],
    },
  ],
};
