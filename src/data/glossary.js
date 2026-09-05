/**
 * glossary.js
 *
 * The content behind the "?" button in the corner of the screen.
 * Every term a player might not know, explained in two lines of plain Indian
 * English, with a real rupee example. Deliberately kept separate from the
 * scenarios so you can add terms without touching game logic.
 */

export const GLOSSARY = [
  {
    term: "SIP",
    full: "Systematic Investment Plan",
    definition:
      "A fixed amount auto-invested into a mutual fund every month, so you buy more units when markets are low and fewer when they are high.",
    example: "₹2,000/month for 30 years at 12% grows to roughly ₹70 lakh.",
  },
  {
    term: "FD",
    full: "Fixed Deposit",
    definition:
      "Money locked with a bank for a fixed period at a fixed interest rate. Safe and predictable, but the returns barely beat inflation.",
    example: "₹1,00,000 in a 1-year FD at 7% returns about ₹7,000 as interest.",
  },
  {
    term: "PPF",
    full: "Public Provident Fund",
    definition:
      "A 15-year government savings scheme where the interest and the maturity amount are both completely tax-free.",
    example: "Deposit up to ₹1.5 lakh a year at about 7.1%; also qualifies for 80C.",
  },
  {
    term: "EPF & VPF",
    full: "Employees' / Voluntary Provident Fund",
    definition:
      "12% of your basic salary goes to EPF and your employer matches it. VPF lets you voluntarily add more at the same rate.",
    example: "On a ₹25,000 salary, ₹3,000 of yours plus ₹3,000 from the employer, at about 8.25%.",
  },
  {
    term: "ELSS",
    full: "Equity Linked Savings Scheme",
    definition:
      "An equity mutual fund that also saves tax under Section 80C, with the shortest lock-in of any 80C option - just 3 years.",
    example: "Invest ₹1.5 lakh a year to claim the full 80C deduction under the old tax regime.",
  },
  {
    term: "NPS",
    full: "National Pension System",
    definition:
      "A retirement account where you choose how much goes into equity (up to 75%). At 60, 40% of the corpus must be used to buy an annuity.",
    example: "An extra ₹50,000 deduction under 80CCD(1B), over and above the ₹1.5 lakh 80C limit.",
  },
  {
    term: "Term Insurance",
    full: "Pure Life Cover",
    definition:
      "Life insurance with no investment attached. If you die during the policy term your family gets the full amount; if you survive, you get nothing back - and that is exactly why it is cheap.",
    example: "₹1 crore cover costs about ₹12,000/year at age 25, but about ₹30,000/year at age 40.",
  },
  {
    term: "Health Insurance",
    full: "Mediclaim Cover",
    definition:
      "Pays your hospital bills up to the cover amount. Your employer's policy ends the day you leave the job, so a personal policy matters.",
    example: "₹10 lakh personal cover costs roughly ₹8,000-₹12,000/year in your twenties.",
  },
  {
    term: "Emergency Fund",
    full: "Your Financial Airbag",
    definition:
      "3 to 6 months of living expenses kept where you can withdraw it the same day. It is not an investment - its job is to stop a crisis becoming debt.",
    example: "If you spend ₹15,000/month, target ₹45,000 to ₹90,000 in a savings or liquid fund.",
  },
  {
    term: "EMI",
    full: "Equated Monthly Instalment",
    definition:
      "A fixed monthly repayment on a loan, made up of interest plus principal. Keep all your EMIs together under about 40% of your take-home pay.",
    example: "A ₹48 lakh home loan at 8.5% for 20 years is roughly ₹41,600 a month.",
  },
  {
    term: "CIBIL Score",
    full: "Credit Score (300-900)",
    definition:
      "A number showing how reliably you repay. Built from paying bills on time and keeping card usage low; lenders use it to decide your loan and your interest rate.",
    example: "Above 750 gets you the best home loan rates. Never using credit at all keeps you invisible to lenders.",
  },
  {
    term: "Liquid Fund",
    full: "Ultra Short-Term Debt Fund",
    definition:
      "A low-risk mutual fund holding very short-term debt. Returns beat a savings account and the money reaches you in about one working day.",
    example: "About 6.5-7% a year, versus roughly 3% in a savings account.",
  },
  {
    term: "Index Fund",
    full: "Passive Equity Fund",
    definition:
      "A fund that simply copies an index like the Nifty 50 instead of paying a manager to pick stocks - which is why its fees are tiny.",
    example: "Costs about 0.2% a year against 1.5-2% for an active fund; over 20 years that gap is worth lakhs.",
  },
  {
    term: "80C",
    full: "Section 80C Deduction",
    definition:
      "Lets you reduce your taxable income by up to ₹1.5 lakh a year through EPF, PPF, ELSS, life insurance premiums and similar. Available only in the OLD tax regime.",
    example: "In the 30% bracket, using the full ₹1.5 lakh saves you about ₹46,800 of tax.",
  },
  {
    term: "Lumpsum vs SIP",
    full: "How you enter the market",
    definition:
      "Lumpsum means investing everything at once; SIP spreads it across months. Lumpsum usually wins mathematically, SIP wins behaviourally because you do not panic.",
    example: "₹5 lakh at once, or ₹1 lakh a month for 5 months through an STP.",
  },
  {
    term: "STP",
    full: "Systematic Transfer Plan",
    definition:
      "Park a big amount in a liquid fund and move a fixed sum into an equity fund every month. You earn interest while you wait and average out your entry price.",
    example: "₹5 lakh in a liquid fund, transferring ₹1 lakh a month into equity.",
  },
  {
    term: "Super Top-up",
    full: "Add-on Health Cover",
    definition:
      "Extra health cover that only starts paying above a set deductible, which makes it far cheaper than buying the same cover directly.",
    example: "₹20 lakh cover above a ₹5 lakh deductible costs roughly ₹5,000/year.",
  },
  {
    term: "Old vs New Tax Regime",
    full: "Two ways to compute your tax",
    definition:
      "The old regime has higher rates but allows deductions like 80C, 80D and HRA. The new regime has lower rates and almost no deductions. Salaried people can switch each year.",
    example: "At ₹12 lakh income, choosing the right one is worth ₹30,000-₹80,000 a year.",
  },
];
