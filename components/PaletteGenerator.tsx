import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ColorPicker } from "./ColorPicker";
import { ColorSwatch } from "./ColorSwatch";
import { BentoLayout } from "./BentoLayout";
import { 
  generatePalette, 
  generatePaletteFromTwoColors, 
  generateTailwindTheme,
  generateCssVariables,
  determinePalettePosition,
  ColorInfo 
} from "../utils/color-utils";
import { CheckIcon, RefreshCwIcon, PaletteIcon, InfoIcon } from "lucide-react";

export function PaletteGenerator() {
  const [baseColor1, setBaseColor1] = useState("#3b82f6");
  const [baseColor2, setBaseColor2] = useState("#8b5cf6");
  const [useTwoColors, setUseTwoColors] = useState(false);
  const [colorName, setColorName] = useState("theme");
  const [palette, setPalette] = useState<ColorInfo[]>([]);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("tailwind");
  const [showBentoPreview, setShowBentoPreview] = useState(true);
  const [basePosition, setBasePosition] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  
  useEffect(() => {
    generateColorPalette();
  }, [baseColor1, baseColor2, useTwoColors]);
  
  const generateColorPalette = () => {
    setIsGenerating(true);
    
    // Use setTimeout to allow the spin animation to be visible
    setTimeout(() => {
      let newPalette: ColorInfo[];
      
      if (useTwoColors) {
        newPalette = generatePaletteFromTwoColors(baseColor1, baseColor2);
      } else {
        // Determine the base position for the main color
        const position = determinePalettePosition(baseColor1);
        setBasePosition(position);
        newPalette = generatePalette(baseColor1);
      }
      
      // Sort palette by index to ensure consistent order
      newPalette.sort((a, b) => a.index - b.index);
      setPalette(newPalette);
      
      // Log the palette for debugging
      console.log("Generated palette:", newPalette);
      
      setIsGenerating(false);
    }, 300);
  };
  
  const handleColorChange = (colorIndex: number, newColor: ColorInfo) => {
    setPalette(prev => 
      prev.map(color => color.index === colorIndex ? newColor : color)
    );
  };
  
  const copyToClipboard = () => {
    let textToCopy = "";
    
    if (activeTab === "tailwind") {
      textToCopy = generateTailwindTheme(colorName, palette);
    } else if (activeTab === "css") {
      textToCopy = generateCssVariables(colorName, palette);
    }
    
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Map base position to corresponding color scale
  const getPositionInfo = () => {
    if (useTwoColors) return null;
    
    const shadeMap = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
    const baseShade = shadeMap[basePosition];
    
    return {
      position: basePosition,
      shade: baseShade
    };
  };
  
  const positionInfo = getPositionInfo();
  
  return (
    <div className="space-y-10">
      <Card className="w-full max-w-7xl mx-auto pt-6 border-none p-0">        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="text-xl font-medium">Input your base color</div>
              <ColorPicker 
                label="Base Color"
                value={baseColor1}
                onChange={setBaseColor1}
              />
              
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="use-two-colors" 
                  checked={useTwoColors}
                  onChange={(e) => setUseTwoColors(e.target.checked)}
                />
                <label htmlFor="use-two-colors">Use two colors</label>
              </div>
              
              {!useTwoColors && positionInfo && (
                <div className="bg-muted p-3 rounded-md text-sm flex items-start gap-2">
                  <InfoIcon className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                  <div>
                    <p>Your base color is positioned at shade <strong>{positionInfo.shade}</strong> in the palette.</p>
                    <p className="text-muted-foreground mt-1">
                      The dashboard card in the preview below will always use this exact color as its primary background.
                    </p>
                  </div>
                </div>
              )}
              
              {useTwoColors && (
                <ColorPicker 
                  label="Second Color"
                  value={baseColor2}
                  onChange={setBaseColor2}
                />
              )}
              
              <div className="space-y-2">
                <label htmlFor="color-name">Color Name (optional)</label>
                <Input 
                  id="color-name"
                  value={colorName}
                  onChange={(e) => setColorName(e.target.value)}
                  placeholder="e.g., primary, brand, accent"
                />
              </div>
              
              <Button 
                onClick={generateColorPalette}
                disabled={isGenerating}
                className="w-full transition-all duration-200 hover:scale-[1.01] h-10
                hover:bg-primary/80 hover:shadow-lg active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <RefreshCwIcon className={`mr-2 h-4 w-4 transition-transform duration-200 ${isGenerating ? 'animate-spin' : ''}`} />
                Generate Palette
              </Button>
            </div>
            
            <div className="space-y-4 p-4 rounded-xl border border-gray-200 bg-gray-100">
              <div className="text-md font-medium">Copy and paste the output to your project</div>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="tailwind">Tailwind Config</TabsTrigger>
                  <TabsTrigger value="css">CSS Variables</TabsTrigger>
                </TabsList>
                
                <TabsContent value="tailwind" className="space-y-4">
                  <div className="relative">
                    <pre className="p-4 rounded bg-muted overflow-auto max-h-64 text-xs border border-gray-200">
                      {generateTailwindTheme(colorName, palette)}
                    </pre>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="absolute top-2 right-2"
                      onClick={copyToClipboard}
                    >
                      {copied ? <CheckIcon className="h-4 w-4" /> : "Copy"}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">
                    Add this @theme block to your CSS file (Tailwind v4). Then you can use 
                    the colors as Tailwind utility classes. For example:
                    <pre className="p-4 rounded bg-muted border border-gray-200 overflow-auto max-h-64 text-sm mt-2 whitespace-pre-wrap break-words">
                      {`bg-${colorName || 'theme'}-500`}
                    </pre> 
                    <p className="text-sm text-gray-600 mt-2">
                      You can also use the colors as CSS variables in your CSS. For example:
                      <pre className="p-4 rounded bg-muted border border-gray-200 overflow-auto max-h-64 text-sm mt-2 whitespace-pre-wrap break-words">
                        {`.class-name { background-color: var(--color-${colorName || 'theme'}-500); }`}
                      </pre> 
                    </p>
                  </p>
                </TabsContent>
                
                <TabsContent value="css" className="space-y-4">
                  <div className="relative">
                    <pre className="p-4 rounded bg-muted overflow-auto max-h-64 text-xs">
                      {`:root {\n${generateCssVariables(colorName, palette)}}`}
                    </pre>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="absolute top-2 right-2"
                      onClick={copyToClipboard}
                    >
                      {copied ? <CheckIcon className="h-4 w-4" /> : "Copy"}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Add these CSS variables to your stylesheets
                  </p>
                </TabsContent>
              </Tabs>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <PaletteIcon className="h-4 w-4" />
              <span>Click on any color to customize it with the color picker</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-3">
              {palette.map((color) => (
                <ColorSwatch 
                  key={color.index} 
                  color={color}
                  onColorChange={handleColorChange}
                />
              ))}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between text-sm text-muted-foreground">
          <p>Generated palette for {colorName}</p>
          <div className="flex items-center gap-2">
            <span>Preview:</span>
            <input 
              type="checkbox" 
              id="show-bento" 
              checked={showBentoPreview}
              onChange={(e) => setShowBentoPreview(e.target.checked)}
            />
            <label htmlFor="show-bento">Show</label>
          </div>
        </CardFooter>
      </Card>
      
      {showBentoPreview && palette.length > 0 && (
        <div className="w-full max-w-7xl mx-auto border-t pt-8">
          <BentoLayout colorName={colorName} palette={palette} basePosition={useTwoColors ? 4 : basePosition} />
        </div>
      )}
    </div>
  );
}