export interface LayoutAsideProps {
  visible?: boolean;
  width?: number;
  fixed?: boolean;
  miniSize?: number;
}

export interface LayoutSectionProps {
  visible?: boolean;
  height?: number;
  fixed?: boolean;
}

export const enum LayoutMode {
  SIDE = 'side',
  MIX_SIDE = 'mix-side',
  TOP = 'top',
  MIX_TOP = 'mix-top',
}

export interface LayoutProps {
  layout?: LayoutMode;
  title?: string;
  logo?: string;
  collapsed?: boolean;
  collapsible?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  aside?: false | LayoutAsideProps;
  header?: false | LayoutSectionProps;
  footer?: false | LayoutSectionProps;
}