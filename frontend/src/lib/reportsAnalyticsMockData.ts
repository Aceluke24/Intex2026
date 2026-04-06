/** Staff portal — reports & analytics (demo aggregates) */

export const reportsOverview = {
  totalResidentsServed: 1842,
  reintegrationSuccessRate: 87,
  activeCases: 47,
  donationsThisMonth: 61200,
};

export const donationTrends = [
  { month: "Oct", amount: 47000 },
  { month: "Nov", amount: 63000 },
  { month: "Dec", amount: 89000 },
  { month: "Jan", amount: 72000 },
  { month: "Feb", amount: 58000 },
  { month: "Mar", amount: 61000 },
  { month: "Apr", amount: 61200 },
];

export const residentOutcomeBars = [
  { label: "Education progress", value: 78 },
  { label: "Health & well-being", value: 84 },
  { label: "Legal advocacy", value: 71 },
  { label: "Livelihood / skills", value: 69 },
];

export const safehouseComparison = [
  { name: "North Safehouse", score: 88 },
  { name: "Riverside Safehouse", score: 82 },
  { name: "Harbor Safehouse", score: 91 },
];

export const reintegrationTrend = [
  { quarter: "Q1", rate: 82 },
  { quarter: "Q2", rate: 84 },
  { quarter: "Q3", rate: 86 },
  { quarter: "Q4", rate: 87 },
];

export const annualAccomplishment = {
  caring: {
    title: "Caring",
    subtitle: "Services provided & shelter operations",
    items: [
      { label: "Safe nights provided", value: "12,400+" },
      { label: "Crisis responses", value: "186" },
      { label: "Meals & provisions", value: "48,200" },
    ],
  },
  healing: {
    title: "Healing",
    subtitle: "Therapy, counseling & recovery supports",
    items: [
      { label: "Counseling hours", value: "9,850" },
      { label: "Group sessions", value: "412" },
      { label: "Clinical referrals completed", value: "328" },
    ],
  },
  teaching: {
    title: "Teaching",
    subtitle: "Education, skills & livelihood pathways",
    items: [
      { label: "Residents in education track", value: "156" },
      { label: "Vocational certifications", value: "89" },
      { label: "Job placements (with follow-up)", value: "64" },
    ],
  },
};
