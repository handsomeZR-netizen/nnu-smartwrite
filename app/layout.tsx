import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/nnu/navigation";
import { Footer } from "@/components/nnu/footer";

export const metadata: Metadata = {
  title: "NNU-SmartWrite | 南师智评",
  description: "AI驱动的英语写作评价平台，专为南京师范大学学生设计",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased flex flex-col min-h-screen">
        <Navigation />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
