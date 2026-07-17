const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM, VirtualConsole } = require("jsdom");

async function run() {
  const root = __dirname;
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const script = fs.readFileSync(path.join(root, "prototype.js"), "utf8");
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", (error) => errors.push(error.message));

  const dom = new JSDOM(html, {
    runScripts: "outside-only",
    pretendToBeVisual: true,
    url: "https://prototype.local/index.html",
    virtualConsole,
    beforeParse(window) {
      window.HTMLElement.prototype.scrollIntoView = function scrollIntoView() {};
      window.requestAnimationFrame = (callback) => window.setTimeout(callback, 0);
      window.cancelAnimationFrame = (id) => window.clearTimeout(id);
    },
  });

  const { window } = dom;
  const { document } = window;
  window.eval(script);
  let assertions = 0;
  const check = (condition, message) => {
    assert.ok(condition, message);
    assertions += 1;
  };
  const luminance = (hex) => {
    const channels = hex.match(/../g).map((value) => Number.parseInt(value, 16) / 255);
    const linear = channels.map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  };
  const contrast = (foreground, background) => {
    const foregroundLuminance = luminance(foreground);
    const backgroundLuminance = luminance(background);
    return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
  };

  const view = (name) => document.querySelector(`[data-screen="${name}"]`);
  const viewButton = (name) => document.querySelector(`[data-view="${name}"]`);
  const click = (element) => element.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

  check(document.querySelectorAll("main").length === 1, "Prototype must expose one main landmark");
  check(document.querySelectorAll("[id]").length === new Set([...document.querySelectorAll("[id]")].map((node) => node.id)).size, "IDs must be unique");
  check(document.querySelectorAll("[data-screen]").length === 5, "All five requested surfaces must exist");
  check(!view("home").hidden && view("section").hidden, "Home must be the initial view");

  click(viewButton("section"));
  check(!view("section").hidden && view("home").hidden, "Section switch must update the visible surface");
  check(viewButton("section").getAttribute("aria-pressed") === "true", "Active screen control must expose pressed state");

  click(document.getElementById("device-toggle"));
  check(document.getElementById("prototype-shell").classList.contains("is-mobile"), "Mobile composition must activate");
  check(document.getElementById("viewport-name").textContent === "390 mobile", "Mobile viewport label must update");

  click(document.getElementById("theme-toggle"));
  check(document.body.classList.contains("night-mode"), "Night palette must activate");
  click(document.getElementById("motion-toggle"));
  check(document.body.classList.contains("reduce-motion"), "Reduced-motion fallback must activate");

  const density = document.getElementById("density-select");
  density.value = "revenue";
  density.dispatchEvent(new window.Event("change", { bubbles: true }));
  check(document.getElementById("prototype-shell").classList.contains("density-revenue"), "Revenue placement policy must activate explicitly");

  const consentTrigger = document.querySelector("[data-open-consent]");
  click(consentTrigger);
  check(!document.getElementById("consent-modal").hidden, "Consent center must open from an ad-choice control");
  check(document.body.style.overflow === "hidden", "Open modal must lock background scrolling");
  click(document.querySelector("#consent-modal .primary-button"));
  check(document.getElementById("consent-modal").hidden, "Consent center must close after saving choices");

  click(viewButton("studio"));
  check(!view("studio").hidden, "Hunt's Pointe surface must open");
  click(document.getElementById("open-transfer"));
  check(!document.getElementById("transfer-modal").hidden, "SignalDesk preflight must open");
  check(document.getElementById("confirm-transfer").disabled, "Draft action must remain disabled before acknowledgement");

  const acknowledgement = document.getElementById("draft-confirm");
  acknowledgement.checked = true;
  acknowledgement.dispatchEvent(new window.Event("change", { bubbles: true }));
  check(!document.getElementById("confirm-transfer").disabled, "Acknowledgement must unlock only the draft action");
  click(document.getElementById("confirm-transfer"));
  check(document.getElementById("confirm-transfer").textContent.includes("Signing"), "Transfer must expose its staging state");
  await new Promise((resolve) => window.setTimeout(resolve, 900));
  check(!document.getElementById("transfer-success").hidden, "Transfer must produce a review-draft receipt");
  check(document.getElementById("transfer-success").textContent.includes("Status: Review draft"), "Receipt must preserve the unpublished status");

  click(document.getElementById("jump-admin"));
  check(!view("admin").hidden, "Receipt must link to the Payload review queue");
  check(document.getElementById("transfer-modal").hidden, "Transfer dialog must close after handoff");
  check(document.getElementById("prototype-toast").textContent.includes("remains unpublished"), "Payload handoff must restate the publishing boundary");

  click(viewButton("section"));
  const portsmouth = [...document.querySelectorAll(".city-tabs button")].find((button) => button.textContent === "Portsmouth");
  click(portsmouth);
  check(portsmouth.classList.contains("active"), "City-edition selection must update state");

  click(viewButton("article"));
  const anchorClose = document.querySelector(".mobile-anchor button");
  click(anchorClose);
  check(document.querySelector(".mobile-anchor").style.display === "none", "Mobile anchor must be dismissible for the session");

  click(consentTrigger);
  document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  check(document.getElementById("consent-modal").hidden, "Escape must close an open modal");

  check([...document.querySelectorAll("button")].every((button) => button.type === "button"), "Prototype controls must not submit implicitly");
  check([...document.querySelectorAll("button")].every((button) => (button.textContent || button.getAttribute("aria-label") || "").trim()), "Every button must have an accessible name");
  check(errors.length === 0, `Runtime must not emit DOM errors: ${errors.join("; ")}`);
  check(fs.statSync(path.join(root, "assets", "americana-city-inspiration.webp")).size < 500_000, "Hero poster must remain under the prototype asset budget");
  check(contrast("c93d37", "ffffff") >= 4.5, "Signal red controls must meet WCAG AA contrast against white");

  window.close();
  console.log(`PASS: ${assertions} prototype assertions`);
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
