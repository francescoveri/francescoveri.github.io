// Privacy-conscious anonymous website analytics (Supabase)
(function () {
  "use strict";

  var SUPABASE_URL = "https://uleyuztknttexfeejsiv.supabase.co";
  var SUPABASE_KEY = "sb_publishable_FTz3p__F-mc5r9YRbB_AQA_ebRdWmWi";

  // ---------------------------------------------------------
  // DEVICE TYPE
  // ---------------------------------------------------------

  function deviceType() {
    var ua = navigator.userAgent || "";

    if (/tablet|ipad|playbook|silk/i.test(ua)) {
      return "tablet";
    }

    if (/mobile|iphone|ipod|android/i.test(ua)) {
      return "mobile";
    }

    return "desktop";
  }

  // ---------------------------------------------------------
  // REFERRER
  // ---------------------------------------------------------

  function getReferrerDomain() {
    try {
      if (!document.referrer) return null;

      var ref = new URL(document.referrer);

      if (
        ref.hostname &&
        ref.hostname !== window.location.hostname
      ) {
        return ref.hostname.slice(0, 200);
      }
    } catch (_) {}

    return null;
  }

  // ---------------------------------------------------------
  // ANONYMOUS IDS
  // ---------------------------------------------------------

  function makeId() {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID === "function"
    ) {
      return window.crypto.randomUUID();
    }

    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        var r = Math.random() * 16 | 0;
        var v =
          c === "x"
            ? r
            : (r & 0x3) | 0x8;

        return v.toString(16);
      }
    );
  }

  // Same anonymous ID for this browser
  var visitorId = null;

  try {
    visitorId =
      localStorage.getItem("fv_visitor_id");

    if (!visitorId) {
      visitorId = makeId();

      localStorage.setItem(
        "fv_visitor_id",
        visitorId
      );
    }
  } catch (_) {
    visitorId = makeId();
  }

  // Same anonymous ID during this browser session
  var sessionId = null;

  try {
    sessionId =
      sessionStorage.getItem("fv_session_id");

    if (!sessionId) {
      sessionId = makeId();

      sessionStorage.setItem(
        "fv_session_id",
        sessionId
      );
    }
  } catch (_) {
    sessionId = makeId();
  }

  // ---------------------------------------------------------
  // BUILD ANALYTICS PAYLOAD
  // ---------------------------------------------------------

  function createPayload() {
    var timezone = null;

    try {
      timezone =
        Intl.DateTimeFormat()
          .resolvedOptions()
          .timeZone || null;
    } catch (_) {}

    return {
      page_path:
        (window.location.pathname || "/")
          .slice(0, 300),

      referrer_domain:
        getReferrerDomain(),

      timezone:
        timezone,

      browser_language:
        navigator.language || null,

      device_type:
        deviceType(),

      local_timestamp:
        new Date().toISOString(),

      visitor_id:
        visitorId,

      session_id:
        sessionId
    };
  }

  // ---------------------------------------------------------
  // SEND TO SUPABASE
  // ---------------------------------------------------------

  function send(payload) {
    return fetch(
      SUPABASE_URL +
        "/rest/v1/website_usage_events",
      {
        method: "POST",

        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization":
            "Bearer " + SUPABASE_KEY,
          "Content-Type":
            "application/json",
          "Prefer":
            "return=minimal"
        },

        body:
          JSON.stringify(payload),

        keepalive:
          true
      }
    );
  }

  var payload = createPayload();

  // ---------------------------------------------------------
  // APPROXIMATE GEOLOCATION
  // ---------------------------------------------------------
  // City/region/country are derived approximately from
  // network location. No IP address is stored in Supabase.

  function addGeoFromIpApi() {
  return fetch("https://ipapi.co/json/")
    .then(function (response) {
      if (!response.ok) {
        throw new Error("ipapi lookup failed");
      }

      return response.json();
    })
    .then(function (geo) {
      payload.city = geo.city || null;
      payload.region = geo.region || null;
      payload.country = geo.country_name || null;
      payload.country_code = geo.country_code || null;

      return true;
    });
}

function addGeoFromIpWho() {
  return fetch("https://ipwho.is/")
    .then(function (response) {
      if (!response.ok) {
        throw new Error("ipwho lookup failed");
      }

      return response.json();
    })
    .then(function (geo) {
      if (geo.success === false) {
        throw new Error("ipwho lookup failed");
      }

      payload.city = geo.city || null;
      payload.region = geo.region || null;
      payload.country = geo.country || null;
      payload.country_code = geo.country_code || null;

      return true;
    });
}

// First try ipapi.co.
// If it fails, try a second provider.
// If both fail, still record the page visit.

addGeoFromIpApi()

  .catch(function () {
    return addGeoFromIpWho();
  })

  .catch(function () {
    // Geo lookup unavailable.
    // The visit will still be recorded.
  })

  .then(function () {
    return send(payload);
  })

  .then(function (response) {
    if (!response.ok) {
      console.error(
        "Website analytics failed:",
        response.status,
        response.statusText
      );
    }
  })

  .catch(function (error) {
    console.error(
      "Website analytics error:",
      error
    );
  });

})();
