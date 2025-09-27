// Type declarations for functions used in InvoiceGenerator.tsx
// This file silences TypeScript errors related to untyped function calls with type arguments

declare module 'lucide-react' {
  import { ComponentType } from 'react';
  
  interface IconProps {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
    className?: string;
    [key: string]: any;
  }

  // Declare all icons used in the project
  export const Download: ComponentType<IconProps>;
  export const Printer: ComponentType<IconProps>;
  export const FileText: ComponentType<IconProps>;
  export const Save: ComponentType<IconProps>;
  export const Trash: ComponentType<IconProps>;
  export const Check: ComponentType<IconProps>;
  export const X: ComponentType<IconProps>;
  export const Plus: ComponentType<IconProps>;
  export const Minus: ComponentType<IconProps>;
  export const Edit: ComponentType<IconProps>;
  export const Copy: ComponentType<IconProps>;
  export const Clipboard: ComponentType<IconProps>;
  export const ClipboardCheck: ComponentType<IconProps>;
  export const Send: ComponentType<IconProps>;
  export const ArrowLeft: ComponentType<IconProps>;
  export const ArrowRight: ComponentType<IconProps>;
  export const ChevronDown: ComponentType<IconProps>;
  export const ChevronUp: ComponentType<IconProps>;
  export const ChevronLeft: ComponentType<IconProps>;
  export const ChevronRight: ComponentType<IconProps>;
  export const Settings: ComponentType<IconProps>;
  export const User: ComponentType<IconProps>;
  export const Users: ComponentType<IconProps>;
  export const Home: ComponentType<IconProps>;
  export const Mail: ComponentType<IconProps>;
  export const Phone: ComponentType<IconProps>;
  export const Calendar: ComponentType<IconProps>;
  export const Clock: ComponentType<IconProps>;
  export const Search: ComponentType<IconProps>;
  export const Filter: ComponentType<IconProps>;
  export const MoreHorizontal: ComponentType<IconProps>;
  export const MoreVertical: ComponentType<IconProps>;
  export const Menu: ComponentType<IconProps>;
  export const LogOut: ComponentType<IconProps>;
  export const LogIn: ComponentType<IconProps>;
  export const Upload: ComponentType<IconProps>;
  export const Eye: ComponentType<IconProps>;
  export const EyeOff: ComponentType<IconProps>;
  export const Lock: ComponentType<IconProps>;
  export const Unlock: ComponentType<IconProps>;
  export const Star: ComponentType<IconProps>;
  export const Heart: ComponentType<IconProps>;
  export const Bookmark: ComponentType<IconProps>;
  export const Flag: ComponentType<IconProps>;
  export const Share: ComponentType<IconProps>;
  export const Link: ComponentType<IconProps>;
  export const ExternalLink: ComponentType<IconProps>;
  export const Info: ComponentType<IconProps>;
  export const AlertCircle: ComponentType<IconProps>;
  export const AlertTriangle: ComponentType<IconProps>;
  export const HelpCircle: ComponentType<IconProps>;
  export const Bell: ComponentType<IconProps>;
  export const BellOff: ComponentType<IconProps>;
}

// Declare any other untyped functions that might be used with type arguments
declare module '@/components/ui/button' {
  import { ComponentType, ButtonHTMLAttributes } from 'react';
  
  interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    asChild?: boolean;
    className?: string;
  }
  
  export const Button: ComponentType<ButtonProps>;
}

// Add any other modules that need type declarations here
