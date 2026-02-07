import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < MOBILE_BREAKPOINT || window.matchMedia('(pointer: coarse)').matches;
    }
    return undefined;
  });

  React.useEffect(() => {
    const mqlWidth = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const mqlTouch = window.matchMedia('(pointer: coarse)');
    
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT || mqlTouch.matches);
    };
    
    mqlWidth.addEventListener('change', onChange);
    mqlTouch.addEventListener('change', onChange);
    
    // Initial check
    onChange();
    
    return () => {
      mqlWidth.removeEventListener('change', onChange);
      mqlTouch.removeEventListener('change', onChange);
    };
  }, []);

  return !!isMobile;
}
