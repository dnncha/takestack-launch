(function () {
  var MAX_UTM_LENGTH = 150;
  var MAX_REFERENCE_LENGTH = 200;
  var ATTRIBUTION_DEFAULTS = {
    utm_source: "site",
    utm_medium: "landing_page",
    utm_campaign: "founder_launch"
  };

  function sanitize(value, fallback, maxLength) {
    var raw = (value || fallback || "").toString().trim();
    var cleaned = raw
      .replace(/[^A-Za-z0-9_-]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");
    return (cleaned || fallback || "site").slice(0, maxLength);
  }

  function queryValue(params, name, fallback, maxLength) {
    return sanitize(params.get(name), fallback, maxLength);
  }

  function checkoutBaseURL(link) {
    var url = new URL(link.getAttribute("href"), window.location.href);
    url.search = "";
    url.hash = "";
    return url;
  }

  function linkSearchParams(link) {
    return new URL(link.getAttribute("href"), window.location.href).searchParams;
  }

  function hasInboundAttribution(params) {
    return [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
      "client_reference_id"
    ].some(function (key) {
      return params.has(key);
    });
  }

  function buildClientReference(attributes, linkSource) {
    return sanitize(
      [
        attributes.utm_source,
        attributes.utm_medium,
        attributes.utm_campaign,
        attributes.utm_content || linkSource
      ].join("_"),
      "site_founder",
      MAX_REFERENCE_LENGTH
    );
  }

  function buildCheckoutURL(link, params) {
    var linkSource = sanitize(link.dataset.launchSource, "site_checkout", 80);
    var fallbackParams = linkSearchParams(link);
    var attributes = {
      utm_source: queryValue(params, "utm_source", fallbackParams.get("utm_source") || ATTRIBUTION_DEFAULTS.utm_source, MAX_UTM_LENGTH),
      utm_medium: queryValue(params, "utm_medium", fallbackParams.get("utm_medium") || ATTRIBUTION_DEFAULTS.utm_medium, MAX_UTM_LENGTH),
      utm_campaign: queryValue(params, "utm_campaign", fallbackParams.get("utm_campaign") || ATTRIBUTION_DEFAULTS.utm_campaign, MAX_UTM_LENGTH),
      utm_content: queryValue(params, "utm_content", linkSource, MAX_UTM_LENGTH)
    };
    var utmTerm = params.get("utm_term");
    var inboundReference = params.get("client_reference_id");
    var fallbackReference = fallbackParams.get("client_reference_id") || "site_" + linkSource;
    var url = checkoutBaseURL(link);

    Object.keys(attributes).forEach(function (key) {
      url.searchParams.set(key, attributes[key]);
    });
    if (utmTerm) {
      url.searchParams.set("utm_term", sanitize(utmTerm, "", MAX_UTM_LENGTH));
    }
    url.searchParams.set(
      "client_reference_id",
      inboundReference
        ? sanitize(inboundReference, fallbackReference, MAX_REFERENCE_LENGTH)
        : hasInboundAttribution(params)
          ? buildClientReference(attributes, linkSource)
          : sanitize(fallbackReference, "site_" + linkSource, MAX_REFERENCE_LENGTH)
    );
    return url.toString();
  }

  function applyAttribution() {
    var params = new URLSearchParams(window.location.search);
    document.querySelectorAll('[data-launch-link="checkout"]').forEach(function (link) {
      link.href = buildCheckoutURL(link, params);
      link.rel = "noopener";
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyAttribution);
  } else {
    applyAttribution();
  }
})();
