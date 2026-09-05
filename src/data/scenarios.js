/**
 * scenarios.js
 *
 * THIS IS THE CONTENT FILE OF THE WHOLE GAME.
 * Every financial question the player sees lives here, in one place, so you can
 * read it top-to-bottom and explain it without opening any other file.
 *
 * Shape of one scenario:
 *   id          - unique key, also used to remember which ones are already answered
 *   level       - 1, 2 or 3 (which maze it belongs to)
 *   title       - the question shown in big text on the popup
 *   context     - one or two lines of setup, always with real rupee amounts
 *   options[]   - the 3-4 choices the player can click
 *
 * Shape of one option:
 *   label       - button text
 *   money       - how the player's cash balance changes immediately (negative = spent/invested)
 *   impact      - { wealth, security, lifestyle } score change, each roughly -15 to +15
 *   verdict     - "good" | "okay" | "bad"  -> drives the tick / warning icon and the sound
 *   explanation - 2-3 lines telling the player WHY. This is the educational payload.
 */

export const SCENARIOS = [
  // =========================================================================
  // LEVEL 1 - "First Salary"  (fresher earning Rs 25,000/month)
  // =========================================================================
  {
    id: "l1-first-salary",
    level: 1,
    title: "Your first salary of ₹25,000 just landed.",
    context:
      "Rent is ₹8,000 and food plus travel take about ₹7,000. That leaves roughly ₹10,000 free every month. What do you set up FIRST?",
    options: [
      {
        label: "Auto-transfer ₹3,000/month into an emergency fund",
        money: -3000,
        impact: { wealth: 4, security: 14, lifestyle: -2 },
        verdict: "good",
        explanation:
          "Correct first move. Before investing you need a cushion of 3-6 months of expenses, about ₹45,000 to ₹90,000 for you. Keep it in a savings account or liquid fund so you can withdraw the same day. Without this, one medical bill becomes credit card debt.",
      },
      {
        label: "Buy the new iPhone on a ₹6,500/month EMI",
        money: -6500,
        impact: { wealth: -12, security: -10, lifestyle: 6 },
        verdict: "bad",
        explanation:
          "This locks 26% of your salary for 18-24 months into a depreciating asset. 'No cost EMI' is not free - the discount you would have got for paying cash is the hidden interest. Starting this habit in month one, with zero savings, is the most damaging option here.",
      },
      {
        label: "Start a ₹2,000 SIP in an index mutual fund",
        money: -2000,
        impact: { wealth: 12, security: 3, lifestyle: 0 },
        verdict: "good",
        explanation:
          "Excellent long-term habit - ₹2,000/month at 12% for 30 years becomes roughly ₹70 lakh. Slightly less urgent than an emergency fund though: with no cash buffer you may be forced to sell the SIP at a loss during a crisis.",
      },
      {
        label: "Send the entire ₹10,000 to your parents",
        money: -10000,
        impact: { wealth: -4, security: -3, lifestyle: 4 },
        verdict: "okay",
        explanation:
          "Supporting family is a real obligation, not a mistake. But sending 100% leaves you with zero buffer. A healthier split is ₹5,000 home and ₹5,000 into your own emergency fund - you help far more over a lifetime if you are financially stable yourself.",
      },
    ],
  },
  {
    id: "l1-vpf",
    level: 1,
    title: "HR asks whether you want to contribute extra to EPF through VPF.",
    context:
      "Your EPF already deducts 12% (₹3,000) and your employer matches it. VPF lets you add more at the same tax-free interest of about 8.25%.",
    options: [
      {
        label: "Yes - add 12% more through VPF",
        money: -3000,
        impact: { wealth: 8, security: 10, lifestyle: -6 },
        verdict: "okay",
        explanation:
          "VPF is genuinely good: about 8.25% tax-free and government-backed, far better than any FD. The catch is liquidity - the money is locked until you leave the job or turn 58. At a ₹25,000 salary, locking ₹6,000/month is too aggressive before you have an emergency fund.",
      },
      {
        label: "Keep only the mandatory 12% for now",
        money: 0,
        impact: { wealth: 6, security: 7, lifestyle: 3 },
        verdict: "good",
        explanation:
          "Sensible at this stage. Mandatory EPF already pushes ₹3,000 plus a ₹3,000 employer match into retirement every month, which is real wealth building. Keep the rest liquid, finish your emergency fund, then raise VPF once your income grows.",
      },
      {
        label: "Try to opt out of EPF entirely",
        money: 3000,
        impact: { wealth: -10, security: -8, lifestyle: 4 },
        verdict: "bad",
        explanation:
          "You would be throwing away the employer's matching ₹3,000 - an instant, guaranteed 100% return you cannot get anywhere else. EPF is also tax-free at deposit, growth and withdrawal. Never refuse an employer match.",
      },
    ],
  },
  {
    id: "l1-short-term",
    level: 1,
    title: "You have ₹50,000 saved and want a Goa trip in 6 months.",
    context:
      "The money must be safe AND available in exactly 6 months. Where do you park it?",
    options: [
      {
        label: "6-month bank FD at 7%",
        money: 0,
        impact: { wealth: 6, security: 9, lifestyle: 2 },
        verdict: "good",
        explanation:
          "The right tool for the job. You earn roughly ₹1,750 and the maturity date matches your trip. For short-term goals the rule is capital safety, not maximum returns. Breaking it early costs a small penalty - that is the only real downside.",
      },
      {
        label: "Liquid mutual fund",
        money: 0,
        impact: { wealth: 7, security: 8, lifestyle: 3 },
        verdict: "good",
        explanation:
          "Equally good, arguably better. Liquid funds return about 6.5-7%, have effectively no lock-in, and the money reaches your account in one working day. Ideal when you are not certain of the exact date you will need the cash.",
      },
      {
        label: "Put it in stocks for higher returns",
        money: 0,
        impact: { wealth: -8, security: -12, lifestyle: -2 },
        verdict: "bad",
        explanation:
          "Never put money you need within 1-3 years into equity. The market can fall 20% in a month, turning your ₹50,000 into ₹40,000 the week before the trip. Equity is a 5-year-plus tool; matching your time horizon to the asset is the whole game.",
      },
      {
        label: "Leave it in the savings account",
        money: 0,
        impact: { wealth: 0, security: 6, lifestyle: 2 },
        verdict: "okay",
        explanation:
          "Safe but lazy. Savings accounts pay around 3% while inflation runs near 6%, so you quietly lose purchasing power. Not a disaster over 6 months, but an FD or liquid fund gives you about ₹1,000 more for the same safety.",
      },
    ],
  },
  {
    id: "l1-lending",
    level: 1,
    title: "A friend asks to borrow ₹15,000.",
    context:
      "He has borrowed from you twice before and repaid late both times. Your emergency fund is currently ₹20,000.",
    options: [
      {
        label: "Give the full ₹15,000",
        money: -15000,
        impact: { wealth: -6, security: -11, lifestyle: 2 },
        verdict: "bad",
        explanation:
          "This wipes out 75% of your emergency fund for someone with a proven repayment problem. If it does not come back you lose both the money and the friendship. Never lend money you actually need.",
      },
      {
        label: "Give ₹5,000 as a gift, expect nothing back",
        money: -5000,
        impact: { wealth: -1, security: -1, lifestyle: 8 },
        verdict: "good",
        explanation:
          "The cleanest answer both emotionally and financially. You help within a limit you can absorb, and calling it a gift removes the debt tension that quietly destroys friendships. Rule of thumb: only lend what you can afford to never see again.",
      },
      {
        label: "Politely decline",
        money: 0,
        impact: { wealth: 2, security: 5, lifestyle: -3 },
        verdict: "okay",
        explanation:
          "Financially correct and completely acceptable - 'I am not in a position to lend right now' is a full sentence. It does cost you socially, so a small gift you can genuinely afford is often the better balance.",
      },
      {
        label: "Lend it, but with a written repayment agreement",
        money: -15000,
        impact: { wealth: -2, security: -6, lifestyle: 3 },
        verdict: "okay",
        explanation:
          "Documentation is smart and makes the terms explicit. But paper does not create money - if he could not repay before, a signed note will not change that, and enforcing it against a friend is something you will never actually do.",
      },
    ],
  },
  {
    id: "l1-bonus",
    level: 1,
    title: "You receive a ₹10,000 Diwali bonus.",
    context:
      "Your emergency fund sits at ₹30,000 and you have no loans. Windfall money is where financial habits show up most clearly.",
    options: [
      {
        label: "Upgrade your phone and lifestyle",
        money: -10000,
        impact: { wealth: -6, security: -3, lifestyle: 9 },
        verdict: "okay",
        explanation:
          "Not a crime - spending some windfall money is how you stay motivated to earn. The healthy version is the 50/50 rule: enjoy ₹5,000 guilt-free and invest ₹5,000. Spending 100% of every bonus is how people earn for a decade with nothing to show.",
      },
      {
        label: "Invest in an ELSS fund for tax saving",
        money: -10000,
        impact: { wealth: 11, security: 4, lifestyle: -2 },
        verdict: "good",
        explanation:
          "ELSS gives equity returns plus a Section 80C deduction with only a 3-year lock-in, the shortest of any 80C option. Note that 80C only helps under the OLD tax regime, and at ₹3 lakh annual income your tax is already near zero - so here the growth matters more than the deduction.",
      },
      {
        label: "Prepay any outstanding loan",
        money: -10000,
        impact: { wealth: 9, security: 8, lifestyle: 0 },
        verdict: "good",
        explanation:
          "Killing debt is a guaranteed, risk-free return equal to the interest rate. Paying off a 14% personal loan beats a 12% expected market return, because the 14% saving is certain and the 12% is not. Always clear high-interest debt first.",
      },
      {
        label: "Add all of it to the emergency fund",
        money: 0,
        impact: { wealth: 3, security: 11, lifestyle: -1 },
        verdict: "good",
        explanation:
          "Takes you from ₹30,000 to ₹40,000, close to a proper 3-month cushion. Windfalls are the least painful way to fill this bucket because you never budgeted the money in the first place.",
      },
    ],
  },
  {
    id: "l1-credit-card",
    level: 1,
    title: "The bank offers you a credit card with a ₹1,00,000 limit.",
    context:
      "Credit cards charge 36-42% annual interest if you do not clear the full bill. Used correctly they are free; used wrongly they are the most expensive debt in India.",
    options: [
      {
        label: "Reject it - I do not want debt",
        money: 0,
        impact: { wealth: -2, security: 4, lifestyle: -2 },
        verdict: "okay",
        explanation:
          "Safe, but it costs you something real. Your CIBIL score is built from credit history, and with no card and no loan you stay 'credit invisible', which makes your future home loan harder and costlier. Avoiding debt is good; avoiding credit history is not.",
      },
      {
        label: "Take it, use it for spends, pay the FULL bill every month",
        money: 0,
        impact: { wealth: 6, security: 6, lifestyle: 7 },
        verdict: "good",
        explanation:
          "This is the correct way to use a credit card. You get up to 45 days of interest-free credit, rewards or cashback, and a rising CIBIL score - all free, as long as you pay the total due and never the minimum. Keep usage under 30% of the limit to help your score further.",
      },
      {
        label: "Take it and pay just the minimum due each month",
        money: 0,
        impact: { wealth: -14, security: -12, lifestyle: 5 },
        verdict: "bad",
        explanation:
          "The debt trap by design. Paying the 5% minimum means the rest compounds at close to 40% a year, and you also lose the interest-free period on new purchases. A ₹50,000 balance paid at minimum takes years and costs more than the original spend.",
      },
      {
        label: "Take it and convert big purchases into EMIs",
        money: 0,
        impact: { wealth: -7, security: -5, lifestyle: 6 },
        verdict: "bad",
        explanation:
          "Card EMIs run 13-18% plus processing fees and GST, and they quietly train you to buy things you cannot afford today. If you need an EMI to buy it, the honest answer is usually to wait and save for it instead.",
      },
    ],
  },

  // =========================================================================
  // LEVEL 2 - "Growing Income"  (2 years in, earning Rs 50,000/month)
  // =========================================================================
  {
    id: "l2-term-insurance",
    level: 2,
    title: "Should you buy a ₹1 crore term plan for ₹12,000/year?",
    context:
      "You are 24, unmarried, and your parents partly depend on your income. That premium works out to ₹1,000/month - about 2% of your salary.",
    options: [
      {
        label: "Yes - buy ₹1 crore term cover now",
        money: -12000,
        impact: { wealth: 3, security: 15, lifestyle: -2 },
        verdict: "good",
        explanation:
          "Buy term insurance young: the premium is locked at your entry age for the entire 30-40 year policy. The same ₹1 crore cover costs roughly ₹30,000/year if you start at 40. Rule of thumb - cover should be 10-15 times your annual income.",
      },
      {
        label: "Skip it - nobody depends on me yet",
        money: 0,
        impact: { wealth: 2, security: -9, lifestyle: 3 },
        verdict: "bad",
        explanation:
          "Two problems. Your parents already partly depend on you, and you will likely marry later - at which point the same cover costs two to three times more, or is refused outright if you develop a health condition in between. Insurance is cheapest exactly when you feel you do not need it.",
      },
      {
        label: "Buy a ULIP or endowment plan instead - cover plus returns",
        money: -50000,
        impact: { wealth: -9, security: 4, lifestyle: -5 },
        verdict: "bad",
        explanation:
          "The classic mis-sale. A ₹50,000/year endowment plan typically gives only ₹5-10 lakh of cover and returns of 4-6%. Never mix insurance with investment: buy pure term for protection, invest the difference in an index fund, and you end up with more of both.",
      },
    ],
  },
  {
    id: "l2-health-insurance",
    level: 2,
    title: "Your company gives ₹3 lakh health cover. Is that enough?",
    context:
      "A single cardiac or cancer episode in a metro private hospital costs ₹5-15 lakh. Company cover also disappears the day you leave the job.",
    options: [
      {
        label: "Buy a personal ₹10 lakh policy for about ₹8,000/year",
        money: -8000,
        impact: { wealth: 2, security: 14, lifestyle: -1 },
        verdict: "good",
        explanation:
          "The right move, for two reasons. Corporate cover ends with the job, exactly when you can least afford a gap, and a personal policy bought young has already cleared its waiting periods by the time you need it at 45. Pre-existing disease waiting periods of 2-4 years start ticking from day one.",
      },
      {
        label: "Add a ₹20 lakh super top-up for about ₹5,000/year",
        money: -5000,
        impact: { wealth: 4, security: 12, lifestyle: 1 },
        verdict: "good",
        explanation:
          "Very cost-efficient. A super top-up only pays above a ₹3-5 lakh deductible, which your company plan already covers, so you get ₹20 lakh of catastrophic protection cheaply. The weakness: if you leave the job, the base cover underneath it vanishes.",
      },
      {
        label: "The company cover is enough, do nothing",
        money: 0,
        impact: { wealth: 1, security: -11, lifestyle: 2 },
        verdict: "bad",
        explanation:
          "₹3 lakh does not cover one serious hospitalisation in a metro, and you are one resignation or layoff away from zero cover. Medical bills are among the largest causes of families falling into debt in India.",
      },
    ],
  },
  {
    id: "l2-rent-vs-buy",
    level: 2,
    title: "Rent at ₹18,000/month, or buy with a ₹45,000 EMI?",
    context:
      "The flat costs ₹60 lakh. You would need ₹12 lakh down plus about ₹3.5 lakh in stamp duty and registration. A ₹48 lakh loan at 8.5% over 20 years is roughly ₹41,600/month.",
    options: [
      {
        label: "Keep renting and invest the difference",
        money: 0,
        impact: { wealth: 12, security: 6, lifestyle: 5 },
        verdict: "good",
        explanation:
          "At a ₹50,000 salary a ₹45,000 EMI is not viable - lenders themselves cap EMIs near 40-50% of income. Renting at ₹18,000 and investing the ₹27,000 gap at 12% builds about ₹62 lakh in 10 years. Rent-to-price ratios in Indian metros currently favour renting early in a career.",
      },
      {
        label: "Buy now - rent is money down the drain",
        money: -1550000,
        impact: { wealth: -10, security: -12, lifestyle: -6 },
        verdict: "bad",
        explanation:
          "'Rent is wasted' ignores that loan interest is wasted too - on a ₹48 lakh loan you pay roughly ₹51 lakh of interest over 20 years. It also drains your savings into the down payment and ties you to one city just when switching jobs gives the biggest salary jumps.",
      },
      {
        label: "Buy a cheaper ₹30 lakh flat in the suburbs",
        money: -750000,
        impact: { wealth: 3, security: 1, lifestyle: -4 },
        verdict: "okay",
        explanation:
          "Financially far saner - the EMI drops to about ₹21,000, which your income can actually carry. Do count the hidden costs though: a two-hour daily commute, plus maintenance and property tax that renters never pay.",
      },
    ],
  },
  {
    id: "l2-sip-vs-lumpsum",
    level: 2,
    title: "The market has crashed 20%. You have ₹5 lakh in hand.",
    context:
      "Everyone on social media is panicking. Your horizon is 10 years and your emergency fund is already full.",
    options: [
      {
        label: "Invest the whole ₹5 lakh now",
        money: -500000,
        impact: { wealth: 11, security: -3, lifestyle: -2 },
        verdict: "good",
        explanation:
          "Mathematically the strongest option - a 20% fall means you buy the same fund 20% cheaper, and lumpsum beats staggering roughly two-thirds of the time simply because the money spends longer invested. The real risk is behavioural: if it drops another 15% next month, will you hold?",
      },
      {
        label: "Split it into 5 monthly instalments of ₹1 lakh (STP)",
        money: -100000,
        impact: { wealth: 9, security: 4, lifestyle: 3 },
        verdict: "good",
        explanation:
          "The practical winner. Park the ₹5 lakh in a liquid fund and run a Systematic Transfer Plan into equity. You earn about 7% on the waiting money, average out your entry price, and - most importantly - you will not panic-sell.",
      },
      {
        label: "Wait for the market to recover before investing",
        money: 0,
        impact: { wealth: -11, security: 2, lifestyle: -2 },
        verdict: "bad",
        explanation:
          "This is buying high and selling low, stated as a plan. 'Recovered' means prices have gone back up - you would be paying more for the same asset. Nobody reliably times the bottom; time IN the market beats timing the market.",
      },
      {
        label: "Stop your existing SIPs until things calm down",
        money: 0,
        impact: { wealth: -13, security: -2, lifestyle: 1 },
        verdict: "bad",
        explanation:
          "The most expensive mistake retail investors make. A crash is precisely when your fixed SIP amount buys the most units - that is the entire mechanism behind rupee-cost averaging. Stopping now guarantees you miss the cheap units.",
      },
    ],
  },
  {
    id: "l2-gold-vs-equity",
    level: 2,
    title: "Family says buy gold. Your app says index fund. ₹2 lakh to deploy.",
    context:
      "Over the last 20 years Indian equity has returned roughly 12-13% a year and gold about 9-10%, with gold performing best during crises and currency weakness.",
    options: [
      {
        label: "Put it all in a Nifty index fund",
        money: -200000,
        impact: { wealth: 11, security: 1, lifestyle: 0 },
        verdict: "good",
        explanation:
          "Highest expected long-term return, and an index fund costs about 0.2% a year against 1.5-2% for an active fund - over 20 years that fee gap alone is worth lakhs. The trade-off is volatility: expect 30-40% drops along the way.",
      },
      {
        label: "Split it 80% equity and 20% gold ETF",
        money: -200000,
        impact: { wealth: 9, security: 7, lifestyle: 2 },
        verdict: "good",
        explanation:
          "Textbook allocation. A 10-20% gold sleeve genuinely reduces portfolio swings because gold often rises when equity falls. Use a gold ETF or Sovereign Gold Bond rather than jewellery - jewellery loses 10-20% instantly to making charges.",
      },
      {
        label: "Buy ₹2 lakh of gold jewellery",
        money: -200000,
        impact: { wealth: -8, security: 3, lifestyle: 4 },
        verdict: "bad",
        explanation:
          "Jewellery is consumption, not investment. You pay 10-20% making charges plus 3% GST on the way in, and lose the making charges again when you sell. If you want gold exposure, hold it in paper form.",
      },
    ],
  },
  {
    id: "l2-side-hustle",
    level: 2,
    title: "Your freelance side hustle earns ₹15,000/month.",
    context:
      "This is on top of your ₹50,000 salary. It is irregular - some months ₹5,000, some months ₹30,000 - and it is fully taxable with no TDS deducted for you.",
    options: [
      {
        label: "Invest 100% of it and never touch it for lifestyle",
        money: -15000,
        impact: { wealth: 15, security: 8, lifestyle: -4 },
        verdict: "good",
        explanation:
          "The highest-leverage habit in the whole game. Because your salary already covers your life, this entire amount can compound - ₹15,000/month at 12% becomes roughly ₹35 lakh in 10 years. Do set aside about 30% for tax, since nobody is deducting it for you.",
      },
      {
        label: "Upgrade your lifestyle - you earned it",
        money: -15000,
        impact: { wealth: -9, security: -4, lifestyle: 9 },
        verdict: "bad",
        explanation:
          "Classic lifestyle inflation: extra income silently becomes extra fixed expenses, so you work more hours and end up no wealthier. Worse, side income is unstable, and building a permanent expense on unstable income is how people end up trapped in EMIs.",
      },
      {
        label: "Split it - 70% invested, 30% spent",
        money: -15000,
        impact: { wealth: 11, security: 6, lifestyle: 5 },
        verdict: "good",
        explanation:
          "The realistic, sustainable answer. Rewarding yourself with a visible share keeps you doing the extra work, while 70% still builds serious wealth. A plan you actually stick to beats a perfect plan you abandon in four months.",
      },
    ],
  },

  // =========================================================================
  // LEVEL 3 - "Life Decisions"  (earning Rs 1,00,000/month, family stage)
  // =========================================================================
  {
    id: "l3-home-loan",
    level: 3,
    title: "You are buying an ₹80 lakh home. How much do you put down?",
    context:
      "You have ₹35 lakh saved. Banks fund up to 80%, so the minimum down payment is ₹16 lakh, plus about ₹5 lakh for stamp duty, registration and interiors.",
    options: [
      {
        label: "Minimum 20% down (₹16 lakh) and invest the rest",
        money: -2100000,
        impact: { wealth: 8, security: 2, lifestyle: 4 },
        verdict: "okay",
        explanation:
          "Defensible: a ₹64 lakh loan at 8.5% costs about ₹55,500/month, and if your investments beat 8.5% after tax you come out ahead. Home loan interest also gives up to ₹2 lakh of deduction under Section 24 in the old regime. But that EMI eats 55% of your income, which is uncomfortably tight.",
      },
      {
        label: "Put down 35% (₹28 lakh) for a smaller loan",
        money: -3300000,
        impact: { wealth: 6, security: 12, lifestyle: 2 },
        verdict: "good",
        explanation:
          "The safer structure. A ₹52 lakh loan means about ₹45,000 EMI - roughly 45% of income - and saves close to ₹14 lakh in total interest. Critically, keep ₹2 lakh aside as emergency fund; never let the down payment take your last rupee.",
      },
      {
        label: "Pay ₹30 lakh down and take a tiny loan",
        money: -3500000,
        impact: { wealth: 2, security: -6, lifestyle: -3 },
        verdict: "bad",
        explanation:
          "Emptying your savings into an illiquid asset leaves you with no emergency fund and no liquidity. A house cannot be partly sold when a hospital bill arrives. Always keep 6 months of EMIs plus expenses in cash.",
      },
    ],
  },
  {
    id: "l3-child-education",
    level: 3,
    title: "Your child is 1 year old. When do you start their education fund?",
    context:
      "A private engineering or medical degree costs ₹20-40 lakh today. At 8% education inflation that becomes ₹80 lakh to ₹1.6 crore in 17 years.",
    options: [
      {
        label: "Start now - ₹15,000/month SIP in equity funds",
        money: -15000,
        impact: { wealth: 14, security: 9, lifestyle: -3 },
        verdict: "good",
        explanation:
          "Time is the whole advantage here. ₹15,000/month at 12% for 17 years builds about ₹1 crore. Start the same goal when the child is 10 and you need roughly ₹45,000/month for the same result. Shift the corpus into debt funds in the last 2-3 years so a crash cannot hit you at admission time.",
      },
      {
        label: "Buy a child insurance plan from an agent",
        money: -50000,
        impact: { wealth: -7, security: 3, lifestyle: -3 },
        verdict: "bad",
        explanation:
          "Child plans bundle weak insurance with weak investment and typically return 4-6% - below education inflation, which is the one thing they exist to beat. Buy term insurance on YOUR life, since you are the earner, and invest separately in index funds.",
      },
      {
        label: "Open a Sukanya Samriddhi or PPF account",
        money: -12500,
        impact: { wealth: 6, security: 12, lifestyle: -2 },
        verdict: "okay",
        explanation:
          "Sukanya Samriddhi (for a daughter) pays about 8.2% and PPF about 7.1%, both tax-free and government-backed - excellent for the safe portion of the goal. But 7-8% barely beats 8% education inflation, so pair it with equity rather than relying on it alone.",
      },
      {
        label: "Wait until the child is in high school",
        money: 0,
        impact: { wealth: -12, security: -6, lifestyle: 4 },
        verdict: "bad",
        explanation:
          "You would throw away 15 years of compounding, which is where almost all the growth lives. Families who delay usually end up taking education loans at 10-12% - paying interest instead of earning it.",
      },
    ],
  },
  {
    id: "l3-parents-medical",
    level: 3,
    title: "Your father needs surgery. The hospital estimate is ₹8 lakh.",
    context:
      "He is 58 and has no health insurance. You have ₹6 lakh in emergency funds and ₹15 lakh in equity mutual funds.",
    options: [
      {
        label: "Use the ₹6 lakh emergency fund plus ₹2 lakh of investments",
        money: -800000,
        impact: { wealth: -3, security: 6, lifestyle: 3 },
        verdict: "good",
        explanation:
          "Exactly what the emergency fund exists for - no interest, no paperwork, no delay. Redeeming a small slice of equity on top is fine; you rebuild both over the next year. This is the moment that justifies every boring month you spent saving.",
      },
      {
        label: "Take an ₹8 lakh personal loan at 14%",
        money: 0,
        impact: { wealth: -11, security: -8, lifestyle: -4 },
        verdict: "bad",
        explanation:
          "You would pay roughly ₹2.9 lakh of interest over 5 years while holding ₹21 lakh of your own assets. Borrowing at 14% to protect a portfolio earning 12% is a guaranteed loss. Use your own money.",
      },
      {
        label: "Sell the entire ₹15 lakh equity portfolio",
        money: -800000,
        impact: { wealth: -8, security: 2, lifestyle: -2 },
        verdict: "okay",
        explanation:
          "The bill gets paid, but you liquidate almost twice what you need and trigger avoidable capital gains tax. Redeem only what the situation requires - selling in panic is how a temporary crisis turns into permanent damage.",
      },
      {
        label: "Buy your parents health insurance NOW for future protection",
        money: -35000,
        impact: { wealth: 1, security: 13, lifestyle: 1 },
        verdict: "good",
        explanation:
          "This surgery will not be covered, since pre-existing conditions carry 2-4 year waiting periods. But a senior citizen policy at ₹30,000-40,000/year protects against the NEXT event, which at 58 is a question of when, not if. Do this alongside paying the current bill.",
      },
    ],
  },
  {
    id: "l3-job-loss",
    level: 3,
    title: "Layoffs hit your company. You are let go with 1 month of severance.",
    context:
      "Your monthly expenses including a ₹45,000 home loan EMI come to ₹75,000. Hiring in your field is slow - expect 4-6 months to land the next role.",
    options: [
      {
        label: "Live off your 6-month emergency fund and job hunt properly",
        money: -75000,
        impact: { wealth: 4, security: 14, lifestyle: 6 },
        verdict: "good",
        explanation:
          "This is the entire reason emergency funds exist. Having ₹4.5 lakh means you can refuse the first lowball offer and wait for the right role, while people without a buffer accept 30% pay cuts out of panic. Your fund bought you negotiating power.",
      },
      {
        label: "Keep the SIPs running by withdrawing extra each month",
        money: -75000,
        impact: { wealth: -4, security: -7, lifestyle: -3 },
        verdict: "okay",
        explanation:
          "Admirable discipline, wrong moment. With no income, preserving cash beats compounding - pause the SIPs, protect the runway, and restart the day your first new salary lands. SIPs are designed to be paused for exactly this reason.",
      },
      {
        label: "Take a personal loan to keep paying the EMI",
        money: 0,
        impact: { wealth: -12, security: -14, lifestyle: -6 },
        verdict: "bad",
        explanation:
          "Borrowing at 14% with zero income is the fastest route into a debt spiral. If you are genuinely short, call the bank first - most offer an EMI moratorium or a tenure extension on request, which costs far less than a fresh loan.",
      },
    ],
  },
  {
    id: "l3-nps-vs-ppf",
    level: 3,
    title: "Retirement corpus: NPS or PPF? You are 30, with 30 years to go.",
    context:
      "NPS lets you hold up to 75% equity and adds a ₹50,000 deduction under 80CCD(1B). PPF pays a fixed 7.1%, fully tax-free, with a 15-year lock-in.",
    options: [
      {
        label: "NPS with 75% equity allocation",
        money: -50000,
        impact: { wealth: 12, security: 8, lifestyle: -2 },
        verdict: "good",
        explanation:
          "Over 30 years, equity exposure matters more than anything else - NPS has historically returned 10-12% against PPF's 7.1%. You also get the extra ₹50,000 deduction under 80CCD(1B), over and above the 80C limit. The catch: 40% of the corpus must buy an annuity at 60, and annuity income is taxable.",
      },
      {
        label: "PPF only - guaranteed and completely tax-free",
        money: -150000,
        impact: { wealth: 5, security: 13, lifestyle: -2 },
        verdict: "okay",
        explanation:
          "Rock-solid and genuinely tax-free at every stage, but 7.1% against 6% inflation is barely 1% of real growth. Perfect as the safe sleeve of a retirement plan; far too slow to be the entire plan at age 30.",
      },
      {
        label: "Skip both and just run a large index fund SIP",
        money: -50000,
        impact: { wealth: 11, security: 3, lifestyle: 3 },
        verdict: "good",
        explanation:
          "Highest flexibility and no annuity forced on you at 60, at the cost of the extra tax deductions. It also demands real discipline, since nothing stops you withdrawing at 40. Many people run a mix: NPS for the deduction, index funds for flexibility.",
      },
    ],
  },
  {
    id: "l3-tax-regime",
    level: 3,
    title: "Old tax regime or new? Your salary is ₹12 lakh a year.",
    context:
      "The new regime has lower slab rates but removes almost all deductions. The old regime keeps 80C, 80D, HRA and home loan interest, at higher rates.",
    options: [
      {
        label: "Old regime - I use 80C, 80D, HRA and home loan interest fully",
        money: 0,
        impact: { wealth: 9, security: 7, lifestyle: 1 },
        verdict: "good",
        explanation:
          "Correct if your deductions are real. With ₹1.5 lakh under 80C, ₹25,000 under 80D, HRA and ₹2 lakh of home loan interest, your taxable income drops sharply - the old regime usually wins once total deductions cross roughly ₹3.5-4 lakh.",
      },
      {
        label: "New regime - simpler, and I do not have big deductions",
        money: 0,
        impact: { wealth: 8, security: 4, lifestyle: 5 },
        verdict: "good",
        explanation:
          "Also correct, for the right person. If you rent from family, have no home loan and invest outside 80C, the new regime's lower rates plus the ₹75,000 standard deduction beat the old one. It is the sensible default for most young earners.",
      },
      {
        label: "Buy random insurance policies just to save tax",
        money: -100000,
        impact: { wealth: -10, security: 1, lifestyle: -4 },
        verdict: "bad",
        explanation:
          "The tail wagging the dog. Locking ₹1 lakh into a 5% endowment policy to save ₹30,000 of tax is a bad trade - you lose more to poor returns than you save. Never buy a product for the deduction alone.",
      },
      {
        label: "Whichever - it hardly matters",
        money: 0,
        impact: { wealth: -6, security: -2, lifestyle: 2 },
        verdict: "bad",
        explanation:
          "It matters by ₹30,000-₹80,000 a year at this income. Salaried people can switch regimes every year, so compute both on the income tax portal each March - a ten-minute exercise for a five-figure saving.",
      },
    ],
  },
];

/** Returns every scenario belonging to one level, in order. */
export function getScenariosForLevel(level) {
  return SCENARIOS.filter((s) => s.level === level);
}

/** Finds a single scenario by its id. */
export function getScenarioById(id) {
  return SCENARIOS.find((s) => s.id === id);
}

/**
 * Best possible score on each axis for one level.
 * LevelComplete uses this to turn raw points into a percentage and a letter grade.
 */
export function getMaxScoresForLevel(level) {
  return getScenariosForLevel(level).reduce(
    (best, scenario) => {
      best.wealth += Math.max(...scenario.options.map((o) => o.impact.wealth));
      best.security += Math.max(...scenario.options.map((o) => o.impact.security));
      best.lifestyle += Math.max(...scenario.options.map((o) => o.impact.lifestyle));
      return best;
    },
    { wealth: 0, security: 0, lifestyle: 0 }
  );
}
