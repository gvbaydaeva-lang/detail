if (
  window.location.protocol === 'http:' &&
  /(^|\.)ls-detailing\.ru$/i.test(window.location.hostname)
) {
  window.location.replace(`https:${window.location.href.slice(5)}`);
}
