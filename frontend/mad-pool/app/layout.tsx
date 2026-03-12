import type { Metadata } from "next";
import "./globals.css";
import { ApolloWrapper } from "./lib/apollo-provider";
import { UserProvider } from "./contexts/UserContext";

export const metadata: Metadata = {
  title: "Pool Runner - March Madness Pools",
  description: "Create and join March Madness basketball tournament pools with friends",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ApolloWrapper>
          <UserProvider>{children}</UserProvider>
        </ApolloWrapper>
      </body>
    </html>
  );
}
