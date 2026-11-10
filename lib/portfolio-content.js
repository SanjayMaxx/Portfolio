export const defaultPortfolioContent = {
  profile: {
    name: "Sanjay Bhargav Varma",
    role: "QA Automation Engineer",
    summary: "I work across manual testing, automation, API validation and Pega CRM/BPM workflows in telecom. I like getting close to how a process actually moves—then checking what happens when it doesn’t move as expected.",
    experience: "1.7 years in QA",
    domain: "Telecom",
  },
  contact: {
    email: "kamarothusanjay@gmail.com",
    linkedin: "https://www.linkedin.com/in/sanjay-varma-458515283",
  },
  skills: [
    ["Pega CRM", "Case management, stages, business rules and work-order flows."],
    ["Selenium", "WebDriver automation for repeatable UI and sanity coverage."],
    ["Playwright", "Browser validation for stable, fast end-to-end checks."],
    ["API testing", "Postman-led validation of payloads and integration behavior."],
    ["Java + Python", "Programming foundations for maintainable test code."],
    ["Cucumber / TestNG", "BDD scenarios and test orchestration."],
    ["JMeter", "Performance-focused checks around application behavior."],
    ["Jira / Zephyr", "Traceable test planning, execution and defect lifecycles."],
  ],
  experienceEntries: [
    { year: "2025 — NOW", role: "QA AUTOMATION ENGINEER", detail: "NForce One Pvt. Ltd. / Telecom, Pega CRM and BPM workflows" },
    { year: "2024", role: "SOFTWARE TESTER", detail: "Wavity / Ticketing Management" },
  ],
  projects: [
    { title: "Dispatch Desktop", accent: "Desktop", client: "CCI / FIDIUM, USA", duration: "FEB 2025 — PRESENT", role: "QA AUTOMATION ENGINEER", description: "I test workflows where technician activity, job exceptions and CRM work orders meet. My focus is the whole journey: activity handling, JEP creation, triage and downstream ticket-status synchronization.", workflow: "OFSC → JEP → CRM", responsibilities: "JAVA · SELENIUM · CUCUMBER · TESTNG" },
    { title: "Ticketing Management", accent: "Management", client: "WAVITY", duration: "MAR — MAY 2024", role: "SOFTWARE TESTER", description: "I tested tickets from creation through resolution, including assignment, priority, SLA monitoring, escalation and release verification. I used a hybrid framework combining keyword- and data-driven approaches.", workflow: "NEW → ASSIGNED → IN PROGRESS → ESCALATED → RESOLVED", responsibilities: "MANUAL + AUTOMATION · FUNCTIONAL / INTEGRATION · REGRESSION / RELEASE" },
  ],
  metrics: { automated: "220+", total: "~365", domainCount: "01" },
  education: "BSc Computer Science / St. Joseph’s Degree College",
  certifications: "QSpyders QA certification · Wavity internship · Python course",
};

export function mergePortfolioContent(data) {
  if (!data || typeof data !== "object") return defaultPortfolioContent;
  return {
    ...defaultPortfolioContent,
    ...data,
    profile: { ...defaultPortfolioContent.profile, ...(data.profile || {}) },
    contact: { ...defaultPortfolioContent.contact, ...(data.contact || {}) },
    metrics: { ...defaultPortfolioContent.metrics, ...(data.metrics || {}) },
    skills: Array.isArray(data.skills) && data.skills.length ? data.skills : defaultPortfolioContent.skills,
    projects: Array.isArray(data.projects) && data.projects.length ? data.projects : defaultPortfolioContent.projects,
    experienceEntries: Array.isArray(data.experienceEntries) && data.experienceEntries.length ? data.experienceEntries : defaultPortfolioContent.experienceEntries,
  };
}
