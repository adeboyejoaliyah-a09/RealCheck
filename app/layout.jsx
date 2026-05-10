import "./globals.css";

export const metadata = {
  title: "RealCheck | Explainable Fraud Decisioning",
  description: "AI-powered fraud decisioning for fintechs and payment processors."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
