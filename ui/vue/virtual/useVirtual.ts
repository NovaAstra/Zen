export interface VirtualProps {
  count: number;
  size?: number;
  getScrollElement(): Element | Window;
}

export function useVirtual(props: VirtualProps) {
  
}