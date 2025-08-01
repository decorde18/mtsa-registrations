import { Geist, Geist_Mono } from "next/font/google";

import Header from "@/components/Header";
import ClientProviders from "@/contexts/ClientProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "MTSA Registrations",
  description: "Middle TN Soccer Association Registrations",
  icons: { icon: "/images/logo.png" },
};

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ClientProviders>
          <header>
            <Header />
          </header>
          <main>{children}</main>
          <footer>
            <p>
              &copy; {new Date().getFullYear()}
              <span lang='en'> Middle Tennessee Soccer Association</span>
            </p>
          </footer>
        </ClientProviders>
      </body>
    </html>
  );
}
