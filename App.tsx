import { useState } from "react";
import { PaletteGenerator } from "./components/PaletteGenerator";
import { CssToTailwind } from "./components/CssToTailwind";
import { OklchGradientGenerator } from "./components/OklchGradientGenerator";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

export default function App() {
  const [activePage, setActivePage] = useState("palette");

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Header activePage={activePage} onPageChange={setActivePage} />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-5 pb-16 pt-8 md:px-8 md:pt-12">
        {activePage === "palette" && <PaletteGenerator />}
        {activePage === "css-to-tailwind" && <CssToTailwind />}
        {activePage === "oklch-gradient" && <OklchGradientGenerator />}
      </main>

      <Footer />
    </div>
  );
}
