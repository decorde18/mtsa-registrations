import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import styles from "./page.module.css";
import Header from "@/components/Header";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";

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
      <AuthProvider>
        <body className={`${geistSans.variable} ${geistMono.variable}`}>
          <DataProvider>
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
          </DataProvider>
        </body>
      </AuthProvider>
    </html>
  );
}
