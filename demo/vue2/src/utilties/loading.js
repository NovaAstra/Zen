
export function unmountGlobalLoading() {
  const loadingElement = document.querySelector('#__app-loading__');
  console.log(loadingElement, "loadingElement")

  if (loadingElement) {
    loadingElement.classList.add('!hidden');

    const injectLoadingElements = document.querySelectorAll(
      '[data-app-loading^="inject"]',
    );

    loadingElement.addEventListener(
      'transitionend',
      () => {
        loadingElement.remove(); 
        injectLoadingElements.forEach((el) => el.remove()); 
      },
      { once: true },
    );
  }
}