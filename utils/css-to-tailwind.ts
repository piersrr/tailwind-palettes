
type TailwindMapping = {
  [key: string]: (value: string) => string | null;
};

/**
 * Parses RGBA color values and converts to a standardized format
 * @param rgba The RGBA color string to parse
 * @returns A formatted RGBA color string
 */
function parseRgba(rgba: string): string {
  // Convert rgba(255,255,255,0.8) to tailwind style `text-white/80` where possible
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return `[${rgba}]`;
  const [_, r, g, b, a] = match;
  return `rgba(${r}, ${g}, ${b}, ${a ?? 1})`; // or map color to known Tailwind colors
}

// Define common Tailwind scales for spacing, font sizes, etc.
const spacingScale: Record<number, string> = {
  0: '0',
  1: 'px',
  2: '0.5',
  4: '1',
  6: '1.5',
  8: '2',
  10: '2.5',
  12: '3',
  14: '3.5',
  16: '4',
  20: '5',
  24: '6',
  28: '7',
  32: '8',
  36: '9',
  40: '10',
  44: '11',
  48: '12',
  56: '14',
  64: '16',
  80: '20',
  96: '24',
  112: '28',
  128: '32',
  144: '36',
  160: '40',
  176: '44',
  192: '48',
  208: '52',
  224: '56',
  240: '60',
  256: '64',
  288: '72',
  320: '80',
  384: '96',
};

// Map common CSS color names to Tailwind color classes
const commonColors: Record<string, string> = {
  'white': 'white',
  'black': 'black',
  '#000': 'black',
  '#000000': 'black',
  '#fff': 'white',
  '#ffffff': 'white',
  'transparent': 'transparent',
  'currentcolor': 'current',
  'inherit': 'inherit',
};

const tailwindMapping: TailwindMapping = {
  'border-radius': (value) => {
    // Handle percentage values
    if (value.endsWith('%')) {
      return `rounded-[${value}]`;
    }
    
    // Convert px values
    const px = parseFloat(value);
    if (isNaN(px)) return `rounded-[${value}]`;
    
    if (px === 0) return 'rounded-none';
    if (px <= 2) return 'rounded-sm';
    if (px <= 4) return 'rounded';
    if (px <= 6) return 'rounded-md';
    if (px <= 8) return 'rounded-lg';
    if (px <= 12) return 'rounded-xl';
    if (px <= 16) return 'rounded-2xl';
    if (px <= 24) return 'rounded-3xl';
    if (px === 9999 || px === 100000 || value === '50%') return 'rounded-full';
    return `rounded-[${value}]`;
  },
  'border': (value) => {
    const match = value.match(/(\d+)px\s+solid\s+(rgba?\([^)]+\)|#[a-fA-F0-9]{3,8}|[a-zA-Z]+)/);
    if (!match) return `border-[${value}]`;
    
    const [, width, color] = match;
    const borderSize = width === '1' ? 'border' : `border-[${width}px]`;
    
    let borderColor = '';
    if (color.startsWith('rgba') || color.startsWith('rgb')) {
      const parsedColor = parseRgba(color);
      borderColor = `border-[${parsedColor}]`;
    } else if (commonColors[color.toLowerCase()]) {
      borderColor = `border-${commonColors[color.toLowerCase()]}`;
    } else {
      borderColor = `border-[${color}]`;
    }
    
    return `${borderSize} ${borderColor}`;
  },
  'background': (value) => {
    if (value.includes('linear-gradient')) {
      const match = value.match(/linear-gradient\((.+?)\)/);
      if (!match) return `bg-[${value}]`;
      
      const gradientContent = match[1];
      
      // Check for angle
      let direction = 'to-b'; // Default direction (top to bottom)
      if (gradientContent.includes('deg')) {
        const angleMatch = gradientContent.match(/(\d+)deg/);
        if (angleMatch) {
          const angle = parseInt(angleMatch[1]);
          // Map angle to closest Tailwind direction
          if (angle >= 0 && angle < 45) direction = 'to-t';
          else if (angle >= 45 && angle < 90) direction = 'to-tr';
          else if (angle >= 90 && angle < 135) direction = 'to-r';
          else if (angle >= 135 && angle < 180) direction = 'to-br';
          else if (angle >= 180 && angle < 225) direction = 'to-b';
          else if (angle >= 225 && angle < 270) direction = 'to-bl';
          else if (angle >= 270 && angle < 315) direction = 'to-l';
          else direction = 'to-tl';
        }
      } else if (gradientContent.includes('to ')) {
        // Handle 'to bottom', 'to right', etc.
        const dirMatch = gradientContent.match(/to\s+([a-z]+)(?:\s+([a-z]+))?/);
        if (dirMatch) {
          const dir1 = dirMatch[1];
          const dir2 = dirMatch[2];
          
          if (dir1 === 'top' && !dir2) direction = 'to-t';
          else if (dir1 === 'top' && dir2 === 'right') direction = 'to-tr';
          else if (dir1 === 'right' && !dir2) direction = 'to-r';
          else if (dir1 === 'bottom' && dir2 === 'right') direction = 'to-br';
          else if (dir1 === 'bottom' && !dir2) direction = 'to-b';
          else if (dir1 === 'bottom' && dir2 === 'left') direction = 'to-bl';
          else if (dir1 === 'left' && !dir2) direction = 'to-l';
          else if (dir1 === 'top' && dir2 === 'left') direction = 'to-tl';
        }
      }
      
      const stops = gradientContent
        .split(',')
        .map((s) => s.trim())
        .filter((s) => !s.includes('deg') && !s.includes('to '));

      // Handle up to 3 color stops
      if (stops.length === 2) {
        const [from, to] = stops;
        return `bg-gradient-${direction} from-[${from}] to-[${to}]`;
      } else if (stops.length === 3) {
        const [from, via, to] = stops;
        return `bg-gradient-${direction} from-[${from}] via-[${via}] to-[${to}]`;
      }
      return `bg-[${value}]`;
    }
    
    // Handle solid colors
    if (value.startsWith('#') || value.startsWith('rgb')) {
      if (commonColors[value.toLowerCase()]) {
        return `bg-${commonColors[value.toLowerCase()]}`;
      }
      if (value.startsWith('rgba') || value.startsWith('rgb')) {
        const parsedColor = parseRgba(value);
        return `bg-[${parsedColor}]`;
      }
      return `bg-[${value}]`;
    }
    
    // Handle named colors and other values
    if (commonColors[value.toLowerCase()]) {
      return `bg-${commonColors[value.toLowerCase()]}`;
    }
    
    return `bg-[${value}]`;
  },
  'background-color': (value) => {
    if (commonColors[value.toLowerCase()]) {
      return `bg-${commonColors[value.toLowerCase()]}`;
    }
    if (value.startsWith('rgba') || value.startsWith('rgb')) {
      const parsedColor = parseRgba(value);
      return `bg-[${parsedColor}]`;
    }
    return `bg-[${value}]`;
  },
  'box-shadow': (value) => {
    // Handle common shadow values
    if (value === 'none') return 'shadow-none';
    
    const shadowMap: Record<string, string> = {
      '0 1px 2px 0 rgba(0, 0, 0, 0.05)': 'shadow-sm',
      '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)': 'shadow',
      '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)': 'shadow-md',
      '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)': 'shadow-lg',
      '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)': 'shadow-xl',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)': 'shadow-2xl',
      'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)': 'shadow-inner',
    };
    
    if (shadowMap[value]) return shadowMap[value];
    
    // Simplified shadow parsing for common formats
    if (value.includes('px') && !value.includes(',')) {
      const parts = value.split(' ').filter(p => p.trim());
      if (parts.length >= 3) {
        // Very basic shadow detection - not comprehensive
        const xOffset = parseFloat(parts[0]);
        const yOffset = parseFloat(parts[1]);
        const blur = parts[2] ? parseFloat(parts[2]) : 0;
        
        if (xOffset === 0 && yOffset === 0 && blur <= 4) return 'shadow-sm';
        if (Math.abs(xOffset) <= 1 && Math.abs(yOffset) <= 3 && blur <= 6) return 'shadow';
        if (Math.abs(xOffset) <= 4 && Math.abs(yOffset) <= 6 && blur <= 10) return 'shadow-md';
        if (Math.abs(xOffset) <= 10 && Math.abs(yOffset) <= 15 && blur <= 20) return 'shadow-lg';
        if (Math.abs(xOffset) <= 20 && Math.abs(yOffset) <= 25 && blur <= 30) return 'shadow-xl';
        if (Math.abs(xOffset) <= 25 && Math.abs(yOffset) <= 50 && blur <= 50) return 'shadow-2xl';
      }
    }
    
    // Fallback to custom shadow
    return `shadow-[${value.replace(/\s+/g, '_')}]`;
  },
  'margin': (value) => {
    // Handle auto value
    if (value === 'auto') return 'm-auto';
    
    // Handle multiple values (shorthand)
    if (value.includes(' ')) {
      const parts = value.trim().split(/\s+/);
      
      if (parts.length === 2) {
        const [y, x] = parts;
        const yClass = mapSpacingValue('my', y);
        const xClass = mapSpacingValue('mx', x);
        return `${yClass} ${xClass}`;
      } else if (parts.length === 4) {
        const [top, right, bottom, left] = parts;
        const topClass = mapSpacingValue('mt', top);
        const rightClass = mapSpacingValue('mr', right);
        const bottomClass = mapSpacingValue('mb', bottom);
        const leftClass = mapSpacingValue('ml', left);
        return `${topClass} ${rightClass} ${bottomClass} ${leftClass}`;
      } else if (parts.length === 3) {
        const [top, xAxis, bottom] = parts;
        const topClass = mapSpacingValue('mt', top);
        const xClass = mapSpacingValue('mx', xAxis);
        const bottomClass = mapSpacingValue('mb', bottom);
        return `${topClass} ${xClass} ${bottomClass}`;
      }
    }
    
    return mapSpacingValue('m', value);
  },
  'margin-top': (value) => mapSpacingValue('mt', value),
  'margin-right': (value) => mapSpacingValue('mr', value),
  'margin-bottom': (value) => mapSpacingValue('mb', value),
  'margin-left': (value) => mapSpacingValue('ml', value),
  'padding': (value) => {
    // Handle multiple values (shorthand)
    if (value.includes(' ')) {
      const parts = value.trim().split(/\s+/);
      
      if (parts.length === 2) {
        const [y, x] = parts;
        const yClass = mapSpacingValue('py', y);
        const xClass = mapSpacingValue('px', x);
        return `${yClass} ${xClass}`;
      } else if (parts.length === 4) {
        const [top, right, bottom, left] = parts;
        const topClass = mapSpacingValue('pt', top);
        const rightClass = mapSpacingValue('pr', right);
        const bottomClass = mapSpacingValue('pb', bottom);
        const leftClass = mapSpacingValue('pl', left);
        return `${topClass} ${rightClass} ${bottomClass} ${leftClass}`;
      } else if (parts.length === 3) {
        const [top, xAxis, bottom] = parts;
        const topClass = mapSpacingValue('pt', top);
        const xClass = mapSpacingValue('px', xAxis);
        const bottomClass = mapSpacingValue('pb', bottom);
        return `${topClass} ${xClass} ${bottomClass}`;
      }
    }
    
    return mapSpacingValue('p', value);
  },
  'padding-top': (value) => mapSpacingValue('pt', value),
  'padding-right': (value) => mapSpacingValue('pr', value),
  'padding-bottom': (value) => mapSpacingValue('pb', value),
  'padding-left': (value) => mapSpacingValue('pl', value),
  'width': (value) => {
    if (value === '100%') return 'w-full';
    if (value === '50%') return 'w-1/2';
    if (value === '33.333%' || value === '33.33%') return 'w-1/3';
    if (value === '66.666%' || value === '66.67%') return 'w-2/3';
    if (value === '25%') return 'w-1/4';
    if (value === '75%') return 'w-3/4';
    if (value === '20%') return 'w-1/5';
    if (value === '40%') return 'w-2/5';
    if (value === '60%') return 'w-3/5';
    if (value === '80%') return 'w-4/5';
    if (value === '0' || value === '0px') return 'w-0';
    if (value === 'auto') return 'w-auto';
    if (value === 'min-content') return 'w-min';
    if (value === 'max-content') return 'w-max';
    if (value === 'fit-content') return 'w-fit';
    
    // Handle pixel values
    if (value.endsWith('px')) {
      const px = parseFloat(value);
      if (!isNaN(px) && spacingScale[px]) {
        return `w-${spacingScale[px]}`;
      }
    }
    
    return `w-[${value}]`;
  },
  'height': (value) => {
    if (value === '100%') return 'h-full';
    if (value === '50%') return 'h-1/2';
    if (value === '25%') return 'h-1/4';
    if (value === '75%') return 'h-3/4';
    if (value === '0' || value === '0px') return 'h-0';
    if (value === 'auto') return 'h-auto';
    if (value === 'min-content') return 'h-min';
    if (value === 'max-content') return 'h-max';
    if (value === 'fit-content') return 'h-fit';
    if (value === '100vh') return 'h-screen';
    
    // Handle pixel values
    if (value.endsWith('px')) {
      const px = parseFloat(value);
      if (!isNaN(px) && spacingScale[px]) {
        return `h-${spacingScale[px]}`;
      }
    }
    
    return `h-[${value}]`;
  },
  'display': (value) => {
    const displays: Record<string, string> = {
      'block': 'block',
      'inline-block': 'inline-block',
      'inline': 'inline',
      'flex': 'flex',
      'inline-flex': 'inline-flex',
      'grid': 'grid',
      'inline-grid': 'inline-grid',
      'none': 'hidden',
      'table': 'table',
      'table-cell': 'table-cell',
      'table-row': 'table-row',
      'flow-root': 'flow-root',
      'contents': 'contents'
    };
    return displays[value] || `[display:${value}]`;
  },
  'color': (value) => {
    if (commonColors[value.toLowerCase()]) {
      return `text-${commonColors[value.toLowerCase()]}`;
    }
    if (value.startsWith('rgba') || value.startsWith('rgb')) {
      const parsedColor = parseRgba(value);
      return `text-[${parsedColor}]`;
    }
    return `text-[${value}]`;
  },
  'font-size': (value) => {
    const fontSizes: Record<string, string> = {
      '0.75rem': 'text-xs',
      '0.875rem': 'text-sm',
      '1rem': 'text-base',
      '1.125rem': 'text-lg',
      '1.25rem': 'text-xl',
      '1.5rem': 'text-2xl',
      '1.875rem': 'text-3xl',
      '2.25rem': 'text-4xl',
      '3rem': 'text-5xl',
      '3.75rem': 'text-6xl',
      '4.5rem': 'text-7xl',
      '6rem': 'text-8xl',
      '8rem': 'text-9xl',
      '12px': 'text-xs',
      '14px': 'text-sm',
      '16px': 'text-base',
      '18px': 'text-lg',
      '20px': 'text-xl',
      '24px': 'text-2xl',
      '30px': 'text-3xl',
      '36px': 'text-4xl',
      '48px': 'text-5xl',
      '60px': 'text-6xl',
      '72px': 'text-7xl',
      '96px': 'text-8xl',
      '128px': 'text-9xl'
    };
    return fontSizes[value] || `text-[${value}]`;
  },
  'font-weight': (value) => {
    const weights: Record<string, string> = {
      '100': 'font-thin',
      '200': 'font-extralight',
      '300': 'font-light',
      '400': 'font-normal',
      '500': 'font-medium',
      '600': 'font-semibold',
      '700': 'font-bold',
      '800': 'font-extrabold',
      '900': 'font-black',
      'normal': 'font-normal',
      'bold': 'font-bold'
    };
    return weights[value] || `font-[${value}]`;
  },
  'text-align': (value) => {
    const aligns: Record<string, string> = {
      'left': 'text-left',
      'center': 'text-center',
      'right': 'text-right',
      'justify': 'text-justify'
    };
    return aligns[value] || `[text-align:${value}]`;
  },
  'position': (value) => {
    const positions: Record<string, string> = {
      'static': 'static',
      'relative': 'relative',
      'absolute': 'absolute',
      'fixed': 'fixed',
      'sticky': 'sticky'
    };
    return positions[value] || `[position:${value}]`;
  },
  'top': (value) => {
    if (value === '0' || value === '0px') return 'top-0';
    if (value === '50%') return 'top-1/2';
    if (value === '100%') return 'top-full';
    if (value === 'auto') return 'top-auto';
    
    return mapSpacingValue('top', value);
  },
  'right': (value) => {
    if (value === '0' || value === '0px') return 'right-0';
    if (value === '50%') return 'right-1/2';
    if (value === '100%') return 'right-full';
    if (value === 'auto') return 'right-auto';
    
    return mapSpacingValue('right', value);
  },
  'bottom': (value) => {
    if (value === '0' || value === '0px') return 'bottom-0';
    if (value === '50%') return 'bottom-1/2';
    if (value === '100%') return 'bottom-full';
    if (value === 'auto') return 'bottom-auto';
    
    return mapSpacingValue('bottom', value);
  },
  'left': (value) => {
    if (value === '0' || value === '0px') return 'left-0';
    if (value === '50%') return 'left-1/2';
    if (value === '100%') return 'left-full';
    if (value === 'auto') return 'left-auto';
    
    return mapSpacingValue('left', value);
  },
  'z-index': (value) => {
    const zIndexes: Record<string, string> = {
      '0': 'z-0',
      '10': 'z-10',
      '20': 'z-20',
      '30': 'z-30',
      '40': 'z-40',
      '50': 'z-50',
      'auto': 'z-auto'
    };
    return zIndexes[value] || `z-[${value}]`;
  },
  'flex': (value) => {
    if (value === '1') return 'flex-1';
    if (value === 'auto') return 'flex-auto';
    if (value === 'initial') return 'flex-initial';
    if (value === 'none') return 'flex-none';
    return `flex-[${value}]`;
  },
  'flex-direction': (value) => {
    const directions: Record<string, string> = {
      'row': 'flex-row',
      'row-reverse': 'flex-row-reverse',
      'column': 'flex-col',
      'column-reverse': 'flex-col-reverse'
    };
    return directions[value] || `[flex-direction:${value}]`;
  },
  'flex-wrap': (value) => {
    const wraps: Record<string, string> = {
      'wrap': 'flex-wrap',
      'nowrap': 'flex-nowrap',
      'wrap-reverse': 'flex-wrap-reverse'
    };
    return wraps[value] || `[flex-wrap:${value}]`;
  },
  'justify-content': (value) => {
    const justifies: Record<string, string> = {
      'flex-start': 'justify-start',
      'flex-end': 'justify-end',
      'center': 'justify-center',
      'space-between': 'justify-between',
      'space-around': 'justify-around',
      'space-evenly': 'justify-evenly',
      'start': 'justify-start',
      'end': 'justify-end'
    };
    return justifies[value] || `[justify-content:${value}]`;
  },
  'align-items': (value) => {
    const aligns: Record<string, string> = {
      'flex-start': 'items-start',
      'flex-end': 'items-end',
      'center': 'items-center',
      'baseline': 'items-baseline',
      'stretch': 'items-stretch',
      'start': 'items-start',
      'end': 'items-end'
    };
    return aligns[value] || `[align-items:${value}]`;
  },
  'align-self': (value) => {
    const aligns: Record<string, string> = {
      'auto': 'self-auto',
      'flex-start': 'self-start',
      'flex-end': 'self-end',
      'center': 'self-center',
      'baseline': 'self-baseline',
      'stretch': 'self-stretch',
      'start': 'self-start',
      'end': 'self-end'
    };
    return aligns[value] || `[align-self:${value}]`;
  },
  'gap': (value) => mapSpacingValue('gap', value),
  'row-gap': (value) => mapSpacingValue('gap-y', value),
  'column-gap': (value) => mapSpacingValue('gap-x', value),
  'text-transform': (value) => {
    const transforms: Record<string, string> = {
      'uppercase': 'uppercase',
      'lowercase': 'lowercase',
      'capitalize': 'capitalize',
      'none': 'normal-case'
    };
    return transforms[value] || `[text-transform:${value}]`;
  },
  'text-decoration': (value) => {
    if (value.includes('underline')) return 'underline';
    if (value.includes('line-through')) return 'line-through';
    if (value.includes('none')) return 'no-underline';
    return `[text-decoration:${value}]`;
  },
  'text-overflow': (value) => {
    if (value === 'ellipsis') return 'truncate'; // Note: truncate also sets overflow: hidden and whitespace: nowrap
    return `[text-overflow:${value}]`;
  },
  'white-space': (value) => {
    const whitespaces: Record<string, string> = {
      'nowrap': 'whitespace-nowrap',
      'pre': 'whitespace-pre',
      'pre-line': 'whitespace-pre-line',
      'pre-wrap': 'whitespace-pre-wrap',
      'normal': 'whitespace-normal'
    };
    return whitespaces[value] || `[white-space:${value}]`;
  },
  'overflow': (value) => {
    const overflows: Record<string, string> = {
      'auto': 'overflow-auto',
      'hidden': 'overflow-hidden',
      'visible': 'overflow-visible',
      'scroll': 'overflow-scroll'
    };
    return overflows[value] || `[overflow:${value}]`;
  },
  'overflow-x': (value) => {
    const overflows: Record<string, string> = {
      'auto': 'overflow-x-auto',
      'hidden': 'overflow-x-hidden',
      'visible': 'overflow-x-visible',
      'scroll': 'overflow-x-scroll'
    };
    return overflows[value] || `[overflow-x:${value}]`;
  },
  'overflow-y': (value) => {
    const overflows: Record<string, string> = {
      'auto': 'overflow-y-auto',
      'hidden': 'overflow-y-hidden',
      'visible': 'overflow-y-visible',
      'scroll': 'overflow-y-scroll'
    };
    return overflows[value] || `[overflow-y:${value}]`;
  },
  'cursor': (value) => {
    const cursors: Record<string, string> = {
      'auto': 'cursor-auto',
      'default': 'cursor-default',
      'pointer': 'cursor-pointer',
      'wait': 'cursor-wait',
      'text': 'cursor-text',
      'move': 'cursor-move',
      'help': 'cursor-help',
      'not-allowed': 'cursor-not-allowed',
      'none': 'cursor-none',
      'context-menu': 'cursor-context-menu',
      'progress': 'cursor-progress',
      'cell': 'cursor-cell',
      'crosshair': 'cursor-crosshair',
      'vertical-text': 'cursor-vertical-text',
      'alias': 'cursor-alias',
      'copy': 'cursor-copy',
      'no-drop': 'cursor-no-drop',
      'grab': 'cursor-grab',
      'grabbing': 'cursor-grabbing',
      'all-scroll': 'cursor-all-scroll',
      'col-resize': 'cursor-col-resize',
      'row-resize': 'cursor-row-resize',
      'n-resize': 'cursor-n-resize',
      'e-resize': 'cursor-e-resize',
      's-resize': 'cursor-s-resize',
      'w-resize': 'cursor-w-resize',
      'ne-resize': 'cursor-ne-resize',
      'nw-resize': 'cursor-nw-resize',
      'se-resize': 'cursor-se-resize',
      'sw-resize': 'cursor-sw-resize',
      'ew-resize': 'cursor-ew-resize',
      'ns-resize': 'cursor-ns-resize',
      'nesw-resize': 'cursor-nesw-resize',
      'nwse-resize': 'cursor-nwse-resize',
      'zoom-in': 'cursor-zoom-in',
      'zoom-out': 'cursor-zoom-out'
    };
    return cursors[value] || `cursor-[${value}]`;
  },
  'transition': (value) => {
    if (value === 'none') return 'transition-none';
    if (value.includes('all')) return 'transition-all';
    if (value.includes('colors') || value.includes('color')) return 'transition-colors';
    if (value.includes('opacity')) return 'transition-opacity';
    if (value.includes('shadow')) return 'transition-shadow';
    if (value.includes('transform')) return 'transition-transform';
    return `transition-[${value}]`;
  },
  'transform': (value) => {
    if (value === 'none') return 'transform-none';
    return 'transform';
  },
  'transition-duration': (value) => {
    const ms = parseInt(value);
    if (isNaN(ms)) return `duration-[${value}]`;
    
    const durations: Record<number, string> = {
      75: 'duration-75',
      100: 'duration-100',
      150: 'duration-150',
      200: 'duration-200',
      300: 'duration-300',
      500: 'duration-500',
      700: 'duration-700',
      1000: 'duration-1000',
    };
    
    // Find the closest match
    const closest = Object.keys(durations)
      .map(Number)
      .reduce((prev, curr) => 
        Math.abs(curr - ms) < Math.abs(Number(prev) - ms) ? curr : prev
      );
    
    return durations[closest] || `duration-[${value}]`;
  },
  'opacity': (value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return `opacity-[${value}]`;
    
    // Convert to scale of 100
    const intValue = Math.round(numValue * 100);
    
    const opacityMap: Record<number, string> = {
      0: 'opacity-0',
      5: 'opacity-5',
      10: 'opacity-10',
      20: 'opacity-20',
      25: 'opacity-25',
      30: 'opacity-30',
      40: 'opacity-40',
      50: 'opacity-50',
      60: 'opacity-60',
      70: 'opacity-70',
      75: 'opacity-75',
      80: 'opacity-80',
      90: 'opacity-90',
      95: 'opacity-95',
      100: 'opacity-100',
    };
    
    // Find the closest match
    const closest = Object.keys(opacityMap)
      .map(Number)
      .reduce((prev, curr) => 
        Math.abs(curr - intValue) < Math.abs(Number(prev) - intValue) ? curr : prev
      );
    
    return opacityMap[closest] || `opacity-[${value}]`;
  },
  // Add more property mappings as needed
};

/**
 * Maps spacing values (margin, padding, gap, etc.) to Tailwind classes
 * @param prefix The Tailwind prefix (m, p, gap, etc.)
 * @param value The CSS value
 * @returns A Tailwind class
 */
function mapSpacingValue(prefix: string, value: string): string {
  // Handle negative values
  let isNegative = false;
  let cleanValue = value;
  
  if (value.startsWith('-')) {
    isNegative = true;
    cleanValue = value.substring(1);
  }
  
  // Handle zero and auto values
  if (cleanValue === '0' || cleanValue === '0px') {
    return `${prefix}-0`;
  }
  if (cleanValue === 'auto') {
    return `${prefix}-auto`;
  }
  
  // Handle pixel values
  if (cleanValue.endsWith('px')) {
    const px = parseFloat(cleanValue);
    if (!isNaN(px)) {
      // Check if the pixel value maps to a Tailwind spacing scale
      if (spacingScale[px]) {
        return isNegative 
          ? `-${prefix}-${spacingScale[px]}`
          : `${prefix}-${spacingScale[px]}`;
      }
    }
  }
  
  // Handle rem values
  if (cleanValue.endsWith('rem')) {
    const rem = parseFloat(cleanValue);
    if (!isNaN(rem)) {
      // Convert rem to px (assuming 1rem = 16px)
      const px = rem * 16;
      if (spacingScale[px]) {
        return isNegative 
          ? `-${prefix}-${spacingScale[px]}`
          : `${prefix}-${spacingScale[px]}`;
      }
    }
  }
  
  // Fallback to arbitrary value
  return isNegative 
    ? `-${prefix}-[${cleanValue}]`
    : `${prefix}-[${value}]`;
}

/**
 * Converts CSS properties to Tailwind CSS classes
 * @param input CSS properties in the format of "property: value;"
 * @returns Tailwind CSS classes as a string
 */
export function convertCssToTailwind(input: string): string {
  // Handle potential CSS blocks wrapped in { }
  const cleanedInput = input.replace(/^\s*\{|\}\s*$/g, '');
  
  const lines = cleanedInput
    .split(';')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const classes: string[] = [];

  for (const line of lines) {
    const [prop, ...rest] = line.split(':');
    if (!prop || rest.length === 0) continue;
    
    const key = prop.trim();
    const value = rest.join(':').trim();
    const handler = tailwindMapping[key];

    if (handler) {
      const result = handler(value);
      if (result) classes.push(result);
    } else {
      classes.push(`[${key}:${value}]`);
    }
  }

  return classes.join(' ');
}

/**
 * Attempts to detect if the input is likely CSS or HTML
 * and extract CSS properties from it
 */
export function preprocessCssInput(input: string): string {
  // Check if input looks like HTML with style attribute
  const styleAttrMatch = input.match(/style=["']([^"']*)["']/);
  if (styleAttrMatch && styleAttrMatch[1]) {
    return styleAttrMatch[1];
  }
  
  // Check if input is a CSS block
  if (input.includes('{') && input.includes('}')) {
    const cssBlockMatch = input.match(/{([^}]*)}/);
    if (cssBlockMatch && cssBlockMatch[1]) {
      return cssBlockMatch[1];
    }
  }
  
  // If no special format detected, return as is
  return input;
}
