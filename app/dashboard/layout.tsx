import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ContractorFinder - Dashboard",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
