declare module 'lucide-react' {
  import { ComponentType, SVGProps } from 'react';

  export interface LucideProps extends SVGProps<SVGSVGElement> {
    size?: string | number;
    absoluteStrokeWidth?: boolean;
  }

  export type LucideIcon = ComponentType<LucideProps>;

  // Common icons used in the project
  export const X: LucideIcon;
  export const Check: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const Circle: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronUp: LucideIcon;

  // Export all other icons as a generic type
  const lucideReact: {
    [key: string]: LucideIcon;
  };

  export default lucideReact;
}