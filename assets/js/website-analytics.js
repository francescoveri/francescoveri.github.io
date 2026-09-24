// Privacy-conscious anonymous website analytics (Supabase)
(function () {
  "use strict";

  var SUPABASE_URL = "https://uleyuztknttexfeejsiv.supabase.co";
  var SUPABASE_KEY = "sb_publishable_FTz3p__F-mc5r9YRbB_AQA_ebRdWmWi";

  var referrerDomain = null;

  try {
    if (document.referrer) {
      var ref = new URL(document.referrer);
      if (ref.hostname && ref.hostname !== window.location.hostname) {
        referrerDomain = ref.hostname.slice(0, 200);
      }
    }
  } catch (e) {
    referrerDomain = null;
  }

  var payload = {
    page_path: (window.location.pathname || "/").slice(0, 300),
    referrer_domain: referrerDomain
  };

  fetch(SUPABASE_URL + "/rest/v1/website_usage_events", {
    method: "POST",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": "Bearer " + SUPABASE_KEY,
      "Content-Type": "application/json",
      "Prefer": "return=minimal"
    },
    body: JSON.stringify(payload),
    keepalive: true
  }).then(function (response) {
    if (!response.ok) {
      console.error("Website analytics failed:", response.status, response.statusText);
    }
  }).catch(function (error) {
    console.error("Website analytics error:", error);
  });
})();
