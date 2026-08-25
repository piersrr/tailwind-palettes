import { useState, useRef, useMemo } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  convertCssToTailwind,
  preprocessCssInput,
  cssDeclarationsToReactStyle,
} from "../utils/css-to-tailwind";
import { PageIntro } from "./PageIntro";
import { CheckIcon, ClipboardCopyIcon, ArrowRightIcon, TrashIcon } from "lucide-react";

export function CssToTailwind() {
  const [cssInput, setCssInput] = useState("");
  const [tailwindOutput, setTailwindOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  const previewStyle = useMemo(
    () => cssDeclarationsToReactStyle(cssInput),
    [cssInput],
  );

  const handleConvert = () => {
    const preprocessed = preprocessCssInput(cssInput);
    const result = convertCssToTailwind(preprocessed);
    setTailwindOutput(result);

    if (outputRef.current) {
      outputRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleClear = () => {
    setCssInput("");
    setTailwindOutput("");
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(tailwindOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

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
transition: background-color 150ms;`,
    },
    {
      name: "Card",
      css: `display: flex;
flex-direction: column;
background: white;
border-radius: 8px;
padding: 16px;
box-shadow: 0 1px 3px rgba(0,0,0,0.12);`,
    },
    {
      name: "Flex",
      css: `display: flex;
justify-content: space-between;
align-items: center;
gap: 16px;
padding: 12px;`,
    },
    {
      name: "Gradient",
      css: `display: inline-block;
padding: 10px 20px;
background: linear-gradient(to right, #6366f1, #8b5cf6);
color: white;
border-radius: 4px;
font-weight: 500;
text-align: center;
box-shadow: 0 4px 6px rgba(0,0,0,0.1);`,
    },
    {
      name: "Pin",
      css: `position: absolute;
top: 0;
right: 0;
z-index: 10;
margin: 16px;
opacity: 0.8;`,
    },
  ];

  return (
    <div className="space-y-10">
      <PageIntro kicker="Convert" title="Paste CSS. Leave with utilities.">
        Declarations, a rule block, or an inline style attribute. ⌘/Ctrl + Enter
        converts.
      </PageIntro>

      <div className="flex flex-wrap gap-2">
        {examples.map((example) => (
          <button
            key={example.name}
            type="button"
            onClick={() => setCssInput(example.css)}
            className="rounded-full border border-border bg-card/70 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground"
          >
            {example.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <div className="space-y-3">
          <label htmlFor="css-input" className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            CSS
          </label>
          <Textarea
            id="css-input"
            placeholder={`display: flex;\npadding: 1rem;\nbackground: #f8f9fa;`}
            value={cssInput}
            onChange={(e) => setCssInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (cssInput.trim()) handleConvert();
              }
            }}
            className="min-h-[280px] rounded-2xl border-border/80 bg-card font-mono text-[13px]"
          />
          <div className="flex gap-2">
            <Button
              onClick={handleConvert}
              disabled={!cssInput.trim()}
              className="flex-1"
            >
              <ArrowRightIcon className="h-4 w-4" />
              Convert
            </Button>
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={!cssInput.trim() && !tailwindOutput.trim()}
              aria-label="Clear"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-3" ref={outputRef}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Tailwind
            </p>
            {tailwindOutput ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="h-8 px-2"
              >
                {copied ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  <ClipboardCopyIcon className="h-4 w-4" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            ) : null}
          </div>

          <div className="min-h-[280px] overflow-auto rounded-2xl bg-ink p-5 text-ink-foreground">
            {tailwindOutput ? (
              <div>
                <code className="font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-all text-ink-foreground/90">
                  {tailwindOutput}
                </code>
                <div className="mt-6 grid grid-cols-1 gap-4 border-t border-white/10 pt-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                      CSS
                    </p>
                    <div className="flex min-h-[88px] items-center justify-center rounded-xl bg-white/5 p-4">
                      <div style={previewStyle} className="text-sm">
                        Sample
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                      Utilities
                    </p>
                    <div className="flex min-h-[88px] items-center justify-center rounded-xl bg-white/5 p-4">
                      <div className={`text-sm ${tailwindOutput}`}>Sample</div>
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-[11px] leading-relaxed text-ink-muted">
                  This app only ships utilities found in source. Dynamic class
                  strings may look incomplete here.
                </p>
              </div>
            ) : cssInput.trim() ? (
              <div className="space-y-4">
                <p className="text-sm text-ink-muted">Convert to see utilities.</p>
                <div className="flex min-h-[88px] items-center justify-center rounded-xl bg-white/5 p-4">
                  <div style={previewStyle} className="text-sm text-ink-foreground">
                    Sample
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[240px] items-center justify-center text-center text-sm text-ink-muted">
                Output lands here.
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Layout, spacing, type, color, border, shadow, flex, grid, and most
        effects. Unknown values become arbitrary{" "}
        <span className="font-mono">[property:value]</span>.
      </p>
    </div>
  );
}
