
import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { convertCssToTailwind, preprocessCssInput } from "../utils/css-to-tailwind";
import { CheckIcon, ClipboardCopyIcon, ArrowRightIcon, TrashIcon } from "lucide-react";

export function CssToTailwind() {
  const [cssInput, setCssInput] = useState("");
  const [tailwindOutput, setTailwindOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  
  const handleConvert = () => {
    const preprocessed = preprocessCssInput(cssInput);
    const result = convertCssToTailwind(preprocessed);
    setTailwindOutput(result);
    
    // Scroll to output if needed
    if (outputRef.current) {
      outputRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  const handleClear = () => {
    setCssInput("");
    setTailwindOutput("");
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(tailwindOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Example CSS snippets to help users get started
  const examples = [
    {
      name: "Button",
      css: `display: inline-flex;
padding: 8px 16px;
background: #3b82f6;
color: white;
border-radius: 4px;
font-weight: 500;
cursor: pointer;
transition: background-color 150ms;`
    },
    {
      name: "Card",
      css: `display: flex;
flex-direction: column;
background: white;
border-radius: 8px;
padding: 16px;
box-shadow: 0 1px 3px rgba(0,0,0,0.12);`
    },
    {
      name: "Flex Container",
      css: `display: flex;
justify-content: space-between;
align-items: center;
gap: 16px;
padding: 12px;`
    },
    {
      name: "Gradient Button",
      css: `display: inline-block;
padding: 10px 20px;
background: linear-gradient(to right, #6366f1, #8b5cf6);
color: white;
border-radius: 4px;
font-weight: 500;
text-align: center;
box-shadow: 0 4px 6px rgba(0,0,0,0.1);`
    },
    {
      name: "Positioning",
      css: `position: absolute;
top: 0;
right: 0;
z-index: 10;
margin: 16px;
opacity: 0.8;`
    }
  ];
  
  return (
    <Card className="w-full max-w-5xl">
      <CardHeader>
        <CardTitle>CSS to Tailwind Converter</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <label htmlFor="css-input" className="text-sm font-medium">
                  CSS Properties
                </label>
                <div className="flex flex-wrap gap-2">
                  {examples.map((example) => (
                    <Button 
                      key={example.name}
                      variant="outline" 
                      size="sm"
                      onClick={() => setCssInput(example.css)}
                    >
                      {example.name}
                    </Button>
                  ))}
                </div>
              </div>
              <Textarea
                id="css-input"
                placeholder={`Enter CSS properties:
display: flex;
flex-direction: column;
align-items: center;
padding: 1rem;
background: #f8f9fa;
border-radius: 8px;`}
                value={cssInput}
                onChange={(e) => setCssInput(e.target.value)}
                className="min-h-[240px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Paste CSS properties, inline style attributes, or a CSS rule block. The converter supports common CSS properties and will automatically map them to Tailwind classes.
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleConvert}
                disabled={!cssInput.trim()}
                className="flex-1"
              >
                <ArrowRightIcon className="mr-2 h-4 w-4" />
                Convert to Tailwind
              </Button>
              <Button 
                variant="outline" 
                onClick={handleClear}
                disabled={!cssInput.trim() && !tailwindOutput.trim()}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-4" ref={outputRef}>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="tailwind-output" className="text-sm font-medium">
                  Tailwind Classes
                </label>
                {tailwindOutput && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={copyToClipboard}
                    className="h-8 px-2"
                  >
                    {copied ? <CheckIcon className="h-4 w-4 mr-1" /> : <ClipboardCopyIcon className="h-4 w-4 mr-1" />}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                )}
              </div>
              <div className="border rounded-md bg-muted p-4 min-h-[240px] overflow-auto">
                {tailwindOutput ? (
                  <div>
                    <code className="text-sm font-mono whitespace-pre-wrap break-all">
                      {tailwindOutput}
                    </code>
                    
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium mb-2">Preview:</p>
                      <div className="border border-dashed rounded p-4 flex justify-center">
                        <div className={tailwindOutput}>
                          Element with applied classes
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <p>Converted Tailwind classes will appear here</p>
                  </div>
                )}
              </div>
              {tailwindOutput && (
                <p className="text-xs text-muted-foreground">
                  The converter tries to use standard Tailwind classes where possible and falls back to arbitrary values [property:value] for unsupported or complex properties.
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col gap-2 text-sm text-muted-foreground">
        <p>Supported property types include:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full">
          <div>• Layout (display, position)</div>
          <div>• Spacing (margin, padding)</div>
          <div>• Sizing (width, height)</div>
          <div>• Typography (font, text)</div>
          <div>• Colors & Backgrounds</div>
          <div>• Borders & Shadows</div>
          <div>• Flexbox & Grid</div>
          <div>• Effects & Transitions</div>
        </div>
      </CardFooter>
    </Card>
  );
}
