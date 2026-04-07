// Simulated API delay
export const delay = (ms = 800) => new Promise((r) => setTimeout(r, ms));

export const stories = [
  {
    id: 1,
    quote: "North Star gave me the courage to start over. Today, I have my own apartment and a job I love.",
    name: "Maria S.",
    program: "Safe Housing → Job Training",
    year: 2024,
  },
  {
    id: 2,
    quote: "The counselors here didn't just listen — they helped me find myself again. My children and I are thriving.",
    name: "Anonymous",
    program: "Trauma Counseling",
    year: 2023,
  },
  {
    id: 3,
    quote: "I never thought I'd feel safe again. This place proved me wrong.",
    name: "Jordan T.",
    program: "Emergency Shelter",
    year: 2024,
  },
];

export const donors = [
  { id: "D001", name: "Sarah Mitchell", email: "sarah.m@email.com", totalGiven: 12500, lastDonation: "2024-03-15", frequency: "Monthly", churnRisk: "Low", score: 92 },
  { id: "D002", name: "Robert Chen", email: "r.chen@corp.com", totalGiven: 45000, lastDonation: "2024-01-20", frequency: "Quarterly", churnRisk: "Medium", score: 67 },
  { id: "D003", name: "Elena Rodriguez", email: "elena.r@email.com", totalGiven: 3200, lastDonation: "2023-11-05", frequency: "One-time", churnRisk: "High", score: 23 },
  { id: "D004", name: "James Walker", email: "j.walker@email.com", totalGiven: 28000, lastDonation: "2024-03-28", frequency: "Monthly", churnRisk: "Low", score: 95 },
  { id: "D005", name: "Priya Patel", email: "priya.p@email.com", totalGiven: 8700, lastDonation: "2024-02-14", frequency: "Annual", churnRisk: "Medium", score: 58 },
  { id: "D006", name: "Michael Okafor", email: "m.okafor@email.com", totalGiven: 1500, lastDonation: "2023-09-01", frequency: "One-time", churnRisk: "High", score: 15 },
  { id: "D007", name: "Lisa Yamamoto", email: "l.yama@email.com", totalGiven: 67000, lastDonation: "2024-03-30", frequency: "Monthly", churnRisk: "Low", score: 98 },
  { id: "D008", name: "David Foster", email: "d.foster@corp.com", totalGiven: 15000, lastDonation: "2024-02-28", frequency: "Quarterly", churnRisk: "Low", score: 81 },
];

export const residents = [
  { id: "R001", name: "Confidential A", age: 32, program: "Safe Housing", status: "Active", riskLevel: "Moderate", progressScore: 72, daysInProgram: 45, nextReview: "2024-04-15" },
  { id: "R002", name: "Confidential B", age: 27, program: "Counseling", status: "Active", riskLevel: "Low", progressScore: 88, daysInProgram: 90, nextReview: "2024-04-10" },
  { id: "R003", name: "Confidential C", age: 19, program: "Job Training", status: "Active", riskLevel: "High", progressScore: 45, daysInProgram: 14, nextReview: "2024-04-05" },
  { id: "R004", name: "Confidential D", age: 41, program: "Legal Aid", status: "Transitioning", riskLevel: "Low", progressScore: 91, daysInProgram: 120, nextReview: "2024-04-20" },
  { id: "R005", name: "Confidential E", age: 24, program: "Safe Housing", status: "Active", riskLevel: "High", progressScore: 38, daysInProgram: 7, nextReview: "2024-04-03" },
  { id: "R006", name: "Confidential F", age: 35, program: "Counseling", status: "Active", riskLevel: "Moderate", progressScore: 65, daysInProgram: 60, nextReview: "2024-04-12" },
];

export const processRecordings = [
  { id: "PR001", title: "Initial Assessment — Confidential A", date: "2024-03-28", worker: "Dr. Kim", status: "Complete", type: "Assessment" },
  { id: "PR002", title: "Weekly Session — Confidential B", date: "2024-03-30", worker: "Sarah L.", status: "Draft", type: "Session Note" },
  { id: "PR003", title: "Crisis Intervention — Confidential E", date: "2024-04-01", worker: "Dr. Kim", status: "Urgent Review", type: "Crisis" },
  { id: "PR004", title: "Progress Review — Confidential D", date: "2024-03-25", worker: "Maria G.", status: "Complete", type: "Review" },
  { id: "PR005", title: "Family Conference — Confidential C", date: "2024-03-29", worker: "Sarah L.", status: "Pending", type: "Conference" },
];

export const homeVisitations = [
  { id: "HV001", resident: "Confidential D", address: "███ Oak Street", date: "2024-04-05", time: "10:00 AM", worker: "Maria G.", status: "Scheduled", notes: "Transition readiness check" },
  { id: "HV002", resident: "Confidential B", address: "███ Maple Ave", date: "2024-04-03", time: "2:00 PM", worker: "Sarah L.", status: "Completed", notes: "Positive environment, child thriving" },
  { id: "HV003", resident: "Confidential A", address: "███ Pine Road", date: "2024-04-08", time: "11:00 AM", worker: "Dr. Kim", status: "Scheduled", notes: "Follow-up on housing stability" },
  { id: "HV004", resident: "Confidential F", address: "███ Elm Blvd", date: "2024-04-02", time: "9:30 AM", worker: "Maria G.", status: "Cancelled", notes: "Rescheduling due to weather" },
];

export const aiInsights = [
  { type: "churn", title: "3 Donors at Risk of Lapsing", description: "Elena Rodriguez, Michael Okafor, and 1 other haven't donated in 90+ days. Personalized re-engagement emails could recover ~$4,700.", urgency: "high" as const, action: "View At-Risk Donors" },
  { type: "opportunity", title: "High-Potential Donor Identified", description: "Robert Chen's giving pattern suggests readiness for a major gift conversation. Likelihood score: 78%.", urgency: "medium" as const, action: "View Profile" },
  { type: "resident", title: "Resident Needs Attention", description: "Confidential E's progress score dropped 15 points this week. Recommend immediate case review.", urgency: "high" as const, action: "Review Case" },
  { type: "social", title: "Top Performing Content", description: "Your survivor story post reached 12.4K people — 340% above average. Consider similar storytelling content.", urgency: "low" as const, action: "View Analytics" },
  { type: "prediction", title: "Donation Surge Expected", description: "Based on seasonal patterns and current campaigns, expect a 25% increase in donations over the next 2 weeks.", urgency: "low" as const, action: "Prepare Campaign" },
];

export const socialMetrics = [
  { platform: "Instagram", followers: 8420, engagement: 4.2, reach: 32000, growth: 12 },
  { platform: "Facebook", followers: 12300, engagement: 2.8, reach: 45000, growth: 5 },
  { platform: "Twitter/X", followers: 3200, engagement: 1.9, reach: 11000, growth: -2 },
  { platform: "LinkedIn", followers: 5600, engagement: 3.5, reach: 18000, growth: 18 },
];
