import "./globals.css";

export const metadata = {
  title: "Sanjay Bhargav Varma — QA Automation Engineer",
  description:
    "QA Automation Engineer with 1.7 years of experience in Pega CRM/BPM testing, automation, API validation, regression testing and telecom workflows.",
  keywords: [
    "QA Automation Engineer",
    "Pega CRM",
    "Selenium",
    "Playwright",
    "API Testing",
    "Telecom Testing",
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
