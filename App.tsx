import { useState } from "react";
import { PaletteGenerator } from "./components/PaletteGenerator";
import { CssToTailwind } from "./components/CssToTailwind";
import { Header } from "./components/Header";

export default function App() {
  const [activePage, setActivePage] = useState("palette");
  
  return (
    <div className="min-h-screen bg-background">
      <Header 
        activePage={activePage} 
        onPageChange={setActivePage}
      />
      
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {activePage === "palette" && <PaletteGenerator />}
        {activePage === "css-to-tailwind" && <CssToTailwind />}
      </main>
      
      <footer className="max-w-7xl mx-auto px-4 md:px-8 mt-8 pt-4 border-t text-sm text-muted-foreground">
      
      </footer>
    </div>
  );
}