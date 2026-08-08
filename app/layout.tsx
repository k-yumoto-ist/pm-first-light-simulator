import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") || incoming.get("host") || "localhost:3000";
  const protocol = incoming.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const imageUrl = `${protocol}://${host}/og.png`;
  return {
    title: "PROJECT: FIRST LIGHT | PM Simulator",
    description: "PMとして人に聞き、判断し、プロジェクトを動かす体験型PMシミュレーション。",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      title: "PROJECT: FIRST LIGHT",
      description: "初めてのプロジェクトマネジメント — 人に聞き、状況を読み、限られた時間で判断する。",
      images: [{ url: imageUrl, width: 1792, height: 1024, alt: "PROJECT: FIRST LIGHT PMシミュレーション" }],
    },
    twitter: { card: "summary_large_image", images: [imageUrl] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body></html>;
}
