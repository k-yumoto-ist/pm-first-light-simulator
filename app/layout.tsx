import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const basePath = isGitHubPages ? "/pm-first-light-simulator" : "";
const siteUrl = isGitHubPages
  ? "https://k-yumoto-ist.github.io/pm-first-light-simulator"
  : "https://pm-first-light-simulator.yumoto-kazunori.chatgpt.site";
const imageUrl = `${siteUrl}/og.png`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "PROJECT: FIRST LIGHT | PM Simulator",
  description: "PMとして人に聞き、判断し、プロジェクトを動かす体験型PMシミュレーション。",
  icons: { icon: `${basePath}/favicon.svg`, shortcut: `${basePath}/favicon.svg` },
  openGraph: {
    title: "PROJECT: FIRST LIGHT",
    description: "初めてのプロジェクトマネジメント — 人に聞き、状況を読み、限られた時間で判断する。",
    url: siteUrl,
    images: [{ url: imageUrl, width: 1792, height: 1024, alt: "PROJECT: FIRST LIGHT PMシミュレーション" }],
  },
  twitter: { card: "summary_large_image", images: [imageUrl] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body></html>;
}
