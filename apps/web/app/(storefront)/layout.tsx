import { Header, Footer } from "@stemory/ui";
import { ClerkAuthSlot } from "./ClerkAuthSlot";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header authSlot={<ClerkAuthSlot />} />
      <main style={{ minHeight: '100vh' }}>
        {children}
      </main>
      <Footer />
    </>
  );
}
