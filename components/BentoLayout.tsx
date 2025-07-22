import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { 
  BarChart3Icon, 
  ArrowUpIcon, 
  ArrowDownIcon, 
  MoreHorizontalIcon, 
  PlusIcon, 
  UsersIcon, 
  ActivityIcon, 
  CalendarIcon,
  BookmarkIcon,
  StarIcon,
  TrendingUpIcon,
  LightbulbIcon,
  BellIcon,
  ImageIcon,
  PaletteIcon
} from "lucide-react";
import { ColorInfo, hexToRgb } from "../utils/color-utils";

interface BentoLayoutProps {
  colorName: string;
  palette: ColorInfo[];
  basePosition?: number;
}

export function BentoLayout({ colorName, palette, basePosition }: BentoLayoutProps) {
  // Find the primary color - use the actual base color from the palette
  const findPrimaryColor = () => {
    // If basePosition is provided, use that specific color
    if (basePosition !== undefined && palette[basePosition]) {
      return palette[basePosition].hex;
    }
    // Otherwise, look for a color with index 500, or fall back to middle of palette
    const primary = palette.find(color => color.index === 500) || palette[4] || palette[0];
    return primary?.hex || "#3b82f6";
  };

  // Calculate color luminance more accurately for contrast checking
  const getLuminance = (hexColor: string) => {
    const rgb = hexToRgb(hexColor);
    if (!rgb) return 0.5; // Default fallback
    
    // Calculate relative luminance using the sRGB color space formula
    // https://www.w3.org/TR/WCAG20/#relativeluminancedef
    const { r, g, b } = rgb;
    const [R, G, B] = [r / 255, g / 255, b / 255].map(val => {
      return val <= 0.03928 
        ? val / 12.92 
        : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  };
  
  // Get text color based on background luminance with better contrast
  const getTextColor = (bgColor: string) => {
    const luminance = getLuminance(bgColor);
    // WCAG recommends 4.5:1 contrast ratio, this threshold gives us approximately that
    return luminance > 0.5 ? "#000000" : "#ffffff";
  };

  // Create a colors object from the palette
  const primaryColor = findPrimaryColor();
  
  // Find relative colors based on the primary color position
  const getPrimaryRelativeColor = (offset: number, fallback: string) => {
    if (basePosition !== undefined) {
      const targetIndex = basePosition + offset;
      if (targetIndex >= 0 && targetIndex < palette.length) {
        return palette[targetIndex].hex;
      }
    }
    return fallback;
  };
  
  const colors = {
    primary: primaryColor, // Always use the actual primary color for the dashboard
    primaryLight: getPrimaryRelativeColor(-2, palette[2]?.hex || "#93c5fd"), // 2 steps lighter
    primaryLighter: getPrimaryRelativeColor(-4, palette[0]?.hex || "#dbeafe"), // 4 steps lighter
    primaryDark: getPrimaryRelativeColor(2, palette[6]?.hex || "#1e40af"), // 2 steps darker
    white: "#ffffff",
    black: "#000000",
    gray: "#f1f5f9",
    darkGray: "#334155"
  };

  // Card style objects
  const cardStyles = {
    primary: {
      background: colors.primary,
      color: getTextColor(colors.primary)
    },
    secondary: {
      background: colors.primaryLight,
      color: getTextColor(colors.primaryLight)
    },
    tertiary: {
      background: colors.primaryLighter,
      color: getTextColor(colors.primaryLighter)
    },
    accent: {
      background: colors.primaryDark,
      color: getTextColor(colors.primaryDark)
    },
    neutral: {
      background: colors.white,
      color: colors.primaryDark
    },
    muted: {
      background: colors.gray,
      color: colors.darkGray
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Bento Layout Preview using {colorName} palette</h3>
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Featured card - spans 2 columns and rows - Always uses the PRIMARY color */}
        <Card className="md:col-span-2 md:row-span-2 group overflow-hidden" style={cardStyles.primary}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl">Dashboard Overview</CardTitle>
              <Badge 
                variant="outline" 
                className="backdrop-blur-sm border-white/10"
                style={{ 
                  backgroundColor: `${cardStyles.primary.color === "#ffffff" ? "rgba(0, 0, 0, 0.2)" : "rgba(255, 255, 255, 0.2)"}`,
                  color: cardStyles.primary.color
                }}
              >
                Featured
              </Badge>
            </div>
            <CardDescription style={{ color: `${cardStyles.primary.color}80` }}>
              Your project metrics and analytics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div 
                className="backdrop-blur-sm rounded-lg p-3 flex items-center gap-3"
                style={{ 
                  backgroundColor: cardStyles.primary.color === "#ffffff" ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)" 
                }}
              >
                <div 
                  className="p-2 rounded-lg"
                  style={{ 
                    backgroundColor: cardStyles.primary.color === "#ffffff" ? "rgba(0, 0, 0, 0.2)" : "rgba(255, 255, 255, 0.2)" 
                  }}
                >
                  <ActivityIcon size={20} />
                </div>
                <div>
                  <p 
                    className="text-sm"
                    style={{ 
                      color: `${cardStyles.primary.color === "#ffffff" ? "rgba(0, 0, 0, 0.7)" : "rgba(255, 255, 255, 0.7)"}` 
                    }}
                  >
                    Active Users
                  </p>
                  <p className="text-2xl font-medium">2,834</p>
                </div>
              </div>
              <div 
                className="backdrop-blur-sm rounded-lg p-3 flex items-center gap-3"
                style={{ 
                  backgroundColor: cardStyles.primary.color === "#ffffff" ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)" 
                }}
              >
                <div 
                  className="p-2 rounded-lg"
                  style={{ 
                    backgroundColor: cardStyles.primary.color === "#ffffff" ? "rgba(0, 0, 0, 0.2)" : "rgba(255, 255, 255, 0.2)" 
                  }}
                >
                  <BarChart3Icon size={20} />
                </div>
                <div>
                  <p 
                    className="text-sm"
                    style={{ 
                      color: `${cardStyles.primary.color === "#ffffff" ? "rgba(0, 0, 0, 0.7)" : "rgba(255, 255, 255, 0.7)"}` 
                    }}
                  >
                    Revenue
                  </p>
                  <p className="text-2xl font-medium">$23.4k</p>
                </div>
              </div>
            </div>
            
            <div className="h-32 flex items-end gap-2 pt-4">
              {[40, 70, 30, 90, 50, 75, 45, 65, 55, 30, 90, 60].map((height, i) => (
                <div 
                  key={i} 
                  className="flex-1 rounded-t-sm transition-all group-hover:h-[80%]"
                  style={{ 
                    height: `${height}%`,
                    transition: `height 0.5s ease-out ${i * 0.05}s`,
                    backgroundColor: cardStyles.primary.color === "#ffffff" ? "rgba(0, 0, 0, 0.2)" : "rgba(255, 255, 255, 0.2)"
                  }}
                ></div>
              ))}
            </div>
          </CardContent>
          <CardFooter 
            className="text-sm"
            style={{ 
              color: `${cardStyles.primary.color === "#ffffff" ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.8)"}` 
            }}
          >
            Last updated: May 29, 2025
          </CardFooter>
        </Card>

        {/* Status card */}
        <Card className="group" style={cardStyles.accent}>
          <CardHeader>
            <CardTitle className="text-base">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-300 animate-pulse"></div>
                  <span className="text-sm">API</span>
                </div>
                <span 
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ 
                    backgroundColor: cardStyles.accent.color === "#ffffff" ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)" 
                  }}
                >
                  99.9% Uptime
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-300 animate-pulse"></div>
                  <span className="text-sm">Database</span>
                </div>
                <span 
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ 
                    backgroundColor: cardStyles.accent.color === "#ffffff" ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)" 
                  }}
                >
                  Operational
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-300 animate-pulse"></div>
                  <span className="text-sm">Storage</span>
                </div>
                <span 
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ 
                    backgroundColor: cardStyles.accent.color === "#ffffff" ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)" 
                  }}
                >
                  87% Available
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks/todo card */}
        <Card style={cardStyles.tertiary}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">Recent Tasks</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <PlusIcon size={16} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 rounded" style={{borderColor: `${colors.primaryDark}33`}} id="task-1" />
              <label htmlFor="task-1" className="text-sm flex-1">Update documentation</label>
              <Badge variant="outline" className="text-xs">Today</Badge>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 rounded" style={{borderColor: `${colors.primaryDark}33`}} id="task-2" checked readOnly />
              <label htmlFor="task-2" className="text-sm flex-1 line-through opacity-50">Team meeting</label>
              <Badge variant="outline" className="text-xs opacity-50">Done</Badge>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 rounded" style={{borderColor: `${colors.primaryDark}33`}} id="task-3" />
              <label htmlFor="task-3" className="text-sm flex-1">Prepare presentation</label>
              <Badge variant="outline" className="text-xs">Tomorrow</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Team card */}
        <Card className="md:col-span-2" style={cardStyles.secondary}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">Team Members</CardTitle>
              <Button variant="ghost" size="sm" className="gap-1">
                <UsersIcon size={14} />
                <span>View All</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div 
                    className="h-12 w-12 rounded-full flex items-center justify-center text-lg font-medium"
                    style={{ 
                      backgroundColor: cardStyles.secondary.color === "#ffffff" ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.5)" 
                    }}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span className="text-xs">User {i+1}</span>
                </div>
              ))}
              <div className="flex flex-col items-center gap-1">
                <div className="h-12 w-12 rounded-full border-2 border-dashed border-current flex items-center justify-center">
                  <PlusIcon size={16} />
                </div>
                <span className="text-xs">Add</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats card */}
        <Card style={cardStyles.neutral}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Weekly Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="font-medium">$12,428</p>
              </div>
              <div className="flex items-center text-green-600">
                <ArrowUpIcon size={14} className="mr-1" />
                <span className="text-xs">+12.5%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Customers</p>
                <p className="font-medium">1,849</p>
              </div>
              <div className="flex items-center text-green-600">
                <ArrowUpIcon size={14} className="mr-1" />
                <span className="text-xs">+8.2%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Bounce Rate</p>
                <p className="font-medium">24.8%</p>
              </div>
              <div className="flex items-center text-red-600">
                <ArrowDownIcon size={14} className="mr-1" />
                <span className="text-xs">-3.1%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar card */}
        <Card style={cardStyles.muted}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">Calendar</CardTitle>
              <CalendarIcon size={16} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-muted-foreground">{day}</div>
              ))}
              {[...Array(31)].map((_, i) => {
                // Highlight today
                const isToday = i === 28;
                return (
                  <div 
                    key={i} 
                    className="rounded-full aspect-square flex items-center justify-center text-xs cursor-pointer hover:bg-black/5"
                    style={isToday ? {
                      background: colors.primary,
                      color: getTextColor(colors.primary)
                    } : {}}
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Image card */}
        <Card className="overflow-hidden group md:col-span-2">
          <div className="relative h-full">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1506744038136-46273834b3fb"
              alt="Landscape"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 flex flex-col justify-end">
              <h3 className="text-white text-lg font-medium">Photography Collection</h3>
              <p className="text-white/80 text-sm">Beautiful landscape photography</p>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <BookmarkIcon size={14} className="mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  View All
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Popular items card */}
        <Card className="md:col-span-2" style={cardStyles.neutral}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">Popular Items</CardTitle>
              <Button variant="outline" size="sm">
                <MoreHorizontalIcon size={14} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex gap-3 items-center">
                <div className="h-10 w-10 rounded flex items-center justify-center" style={{ background: colors.gray }}>
                  <ImageIcon size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Item {item}</p>
                  <p className="text-xs text-muted-foreground">Category</p>
                </div>
                <div className="flex items-center gap-1">
                  <StarIcon size={14} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">{4 + item/10}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick actions card */}
        <Card style={cardStyles.tertiary}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-auto flex flex-col py-3 gap-1" style={{ borderColor: `${colors.primaryDark}20` }}>
              <TrendingUpIcon size={16} />
              <span className="text-xs">Analytics</span>
            </Button>
            <Button variant="outline" className="h-auto flex flex-col py-3 gap-1" style={{ borderColor: `${colors.primaryDark}20` }}>
              <UsersIcon size={16} />
              <span className="text-xs">Team</span>
            </Button>
            <Button variant="outline" className="h-auto flex flex-col py-3 gap-1" style={{ borderColor: `${colors.primaryDark}20` }}>
              <PaletteIcon size={16} />
              <span className="text-xs">Design</span>
            </Button>
            <Button variant="outline" className="h-auto flex flex-col py-3 gap-1" style={{ borderColor: `${colors.primaryDark}20` }}>
              <LightbulbIcon size={16} />
              <span className="text-xs">Ideas</span>
            </Button>
          </CardContent>
        </Card>

        {/* Notifications card */}
        <Card className="md:col-span-2" style={cardStyles.muted}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">Recent Notifications</CardTitle>
              <BellIcon size={16} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { text: 'New comment on your post', time: '2 minutes ago' },
              { text: 'Your project was featured', time: '1 hour ago' },
              { text: 'Team meeting starting soon', time: '3 hours ago' }
            ].map((notification, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div 
                  className="h-2 w-2 rounded-full mt-1.5" 
                  style={{ background: i === 0 ? colors.primary : '#d1d5db' }}
                ></div>
                <div>
                  <p className="text-sm">{notification.text}</p>
                  <p className="text-xs text-muted-foreground">{notification.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="text-sm text-muted-foreground">
        <p>This Bento layout automatically updates when you change colors in the palette generator. Try adjusting the colors above to see how the UI components adapt!</p>
      </div>
    </div>
  );
}