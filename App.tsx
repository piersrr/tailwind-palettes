import { useState } from "react";
import { PaletteGenerator } from "./components/PaletteGenerator";
import { CssToTailwind } from "./components/CssToTailwind";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { PaletteIcon, CodeIcon } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("palette");
  
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <header className="max-w-6xl mx-auto mb-8">
        <h1 className="mb-2">Tailwind CSS Toolkit</h1>
        <p className="text-muted-foreground">
          Tools to help you work with Tailwind CSS more efficiently. Generate color palettes,
          convert CSS to Tailwind classes, and visualize design elements.
        </p>
      </header>
      
      <main className="max-w-6xl mx-auto">
        <Tabs defaultValue="palette" value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="palette" className="flex items-center">
              <PaletteIcon className="h-4 w-4 mr-2" />
              Color Palette
            </TabsTrigger>
            <TabsTrigger value="css-to-tailwind" className="flex items-center">
              <CodeIcon className="h-4 w-4 mr-2" />
              CSS to Tailwind
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        {activeTab === "palette" && <PaletteGenerator />}
        {activeTab === "css-to-tailwind" && <CssToTailwind />}
      </main>
      
      <footer className="max-w-6xl mx-auto mt-8 pt-4 border-t text-sm text-muted-foreground">
        <p>
          Built with React and Tailwind CSS v4. 
          {activeTab === "palette" && (
            <span className="inline-block ml-2">✨ Click any color to customize it and see the Bento layout update!</span>
          )}
          {activeTab === "css-to-tailwind" && (
            <span className="inline-block ml-2">✨ Easily convert CSS styles to Tailwind classes!</span>
          )}
        </p>
      </footer>
    </div>
  );
}