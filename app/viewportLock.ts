export const VIEWPORT_CONTENT =
  'width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content';

export function getViewportScale(): number {
  return window.visualViewport?.scale ?? 1;
}

export function isApproxScaleOne(scale = getViewportScale()): boolean {
  return Math.abs(scale - 1) < 0.02;
}

export function resetDocumentScroll() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

export function resetViewportZoom() {
  const meta = document.querySelector('meta[name="viewport"]');
  if (!(meta instanceof HTMLMetaElement)) return;
  meta.setAttribute('content', `${VIEWPORT_CONTENT}, maximum-scale=1`);
  requestAnimationFrame(() => {
    meta.setAttribute('content', VIEWPORT_CONTENT);
  });
}

function isFormField(el: EventTarget | null): el is HTMLElement {
  return el instanceof HTMLElement && el.matches('input, textarea, select');
}

/** Pin the layout after iOS/Android input-zoom or pinch-reset leaves a stale offset. */
export function lockMobileViewport(): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => {};

  const onScaleOne = () => {
    if (!isApproxScaleOne()) return;
    resetDocumentScroll();
  };

  const onPageShow = () => {
    resetViewportZoom();
    resetDocumentScroll();
  };

  const onBlurField = (event: FocusEvent) => {
    if (!isFormField(event.target)) return;
    window.setTimeout(() => {
      if (isFormField(document.activeElement)) return;
      resetViewportZoom();
      resetDocumentScroll();
    }, 80);
  };

  window.addEventListener('orientationchange', onScaleOne);
  window.addEventListener('pageshow', onPageShow);
  window.visualViewport?.addEventListener('resize', onScaleOne);
  window.visualViewport?.addEventListener('scroll', onScaleOne);
  document.addEventListener('focusout', onBlurField);
  onPageShow();

  return () => {
    window.removeEventListener('orientationchange', onScaleOne);
    window.removeEventListener('pageshow', onPageShow);
    window.visualViewport?.removeEventListener('resize', onScaleOne);
    window.visualViewport?.removeEventListener('scroll', onScaleOne);
    document.removeEventListener('focusout', onBlurField);
  };
}
