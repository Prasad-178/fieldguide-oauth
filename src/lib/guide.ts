export type Provider = "gmail" | "slack" | "github";
export type Context = {
  provider: Provider;
  intent: "send" | "read";
  audience: "test" | "public";
  managed: boolean;
};
export type Step = {
  title: string;
  short: string;
  action: string;
  destination: string;
  link: string;
  visual: [string, string, string];
  detail: string;
  check: string;
  recovery: string;
  source: string;
};
export const providers = {
  gmail: { name: "Gmail", hint: "Send or read email", domain: "gmail.com" },
  slack: { name: "Slack", hint: "Post to a workspace", domain: "slack.com" },
  github: { name: "GitHub", hint: "Read an account profile", domain: "github.com" },
} as const;
export const sources = {
  scopes: "https://developers.google.com/workspace/gmail/api/auth/scopes",
  google: "https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification",
  restricted: "https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification",
  expiration: "https://developers.google.com/identity/protocols/oauth2#expiration",
  slack: "https://docs.slack.dev/authentication/installing-with-oauth/",
  distribution: "https://docs.slack.dev/app-management/distribution/",
  github: "https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app",
  org: "https://docs.github.com/en/organizations/managing-oauth-access-to-your-organizations-data/about-oauth-app-access-restrictions",
  composio: "https://docs.composio.dev/toolkits/managed-auth",
};
export function scope(c: Context) {
  return c.provider === "gmail" ? (c.intent === "read" ? "gmail.readonly" : "gmail.send") : c.provider === "slack" ? "chat:write" : "read:user";
}
export function operation(c: Context) {
  return c.provider === "gmail" ? (c.intent === "read" ? "Read email" : "Send email") : c.provider === "slack" ? "Post messages" : "Read profile";
}
export function gate(c: Context) {
  if (c.managed) return "Confirm managed-client scope and audience support before launch.";
  if (c.provider === "gmail") return c.intent === "read" ? "Public launch may need restricted-scope review and a security assessment." : "Public launch may need sensitive-scope verification.";
  return c.provider === "slack" ? "Workspace permission and public distribution are separate checks." : "Organization access can need an owner’s approval.";
}
export function reviewSource(c: Context) {
  return c.managed ? sources.composio : c.provider === "gmail" ? (c.intent === "read" ? sources.restricted : sources.google) : c.provider === "slack" ? sources.distribution : sources.org;
}
export function getSteps(c: Context): Step[] {
  const p = providers[c.provider], gmail = c.provider === "gmail";
  const portal = gmail ? "https://console.cloud.google.com/" : c.provider === "slack" ? "https://api.slack.com/apps" : "https://github.com/settings/developers";
  const official = gmail ? sources.scopes : c.provider === "slack" ? sources.slack : sources.github;
  const registration: Step = {
    title: c.managed ? "Choose a managed connection" : `Create your ${p.name} app`,
    short: c.managed ? "Choose connection" : "Create app",
    action: c.managed ? "Choose this toolkit’s managed authentication option in Composio." : gmail ? "Create a Google Cloud project and enable the Gmail API." : c.provider === "slack" ? "Create a Slack app in a workspace you control." : "Register an OAuth app under the intended owner.",
    destination: c.managed ? "Open Composio" : gmail ? "Open Google Cloud" : `Open ${p.name} settings`,
    link: c.managed ? "https://platform.composio.dev/" : portal,
    visual: [c.managed ? "Composio" : p.name, c.managed ? "Managed auth" : "New app", c.managed ? "Configuration" : "App created"],
    detail: c.managed ? "Confirm the managed client supports the operation and audience you need. Custom branding, scopes or provider controls may require your own client." : gmail ? "Use a dedicated project. Set its owner, enable Gmail, then prepare your consent-screen app name and support contact. Public verification can also require a homepage, privacy policy and domain ownership." : c.provider === "github" ? "Check the app owner. Prepare Application name, Homepage URL and the callback shown by your auth configuration. The registration form was inspected on 20 October 2026; no app was created. This guide uses an OAuth app." : "Use a dedicated test workspace. Check that its administrator allows app creation and installation.",
    check: c.managed ? "The intended managed auth configuration exists." : "The app or project exists under the intended owner.",
    recovery: "If creation is blocked, check your account’s permissions or ask the workspace owner.",
    source: c.managed ? sources.composio : official,
  };
  return [
    registration,
    {
      title: "Choose the permission you need", short: "Set permissions",
      action: `Use ${scope(c)} for ${operation(c).toLowerCase()}.`,
      destination: c.managed ? "Check managed scopes" : "View provider instructions",
      link: c.managed ? sources.composio : official,
      visual: [operation(c), scope(c), gmail ? c.intent === "read" ? "Restricted" : "Sensitive" : "Task permission"],
      detail: c.managed ? "Verify the managed configuration’s actual scopes. If it cannot support your use case, use your own client." : gmail ? `Configure your consent audience and test users. ${c.intent === "read" ? "Mailbox reading uses a restricted scope. Server handling of restricted data may require a security assessment, subject to exceptions." : "Sending uses a sensitive scope. Do not request mailbox-reading permissions for a send-only feature."}` : c.provider === "slack" ? "chat:write lets a bot post messages. Workspace installation and channel access still need checking." : "read:user covers profile information. Private repositories are outside this sample.",
      check: "The consent screen and configuration show the intended scope.",
      recovery: "Check the exact provider error before adding permissions.",
      source: c.managed ? sources.composio : official,
    },
    {
      title: c.managed ? "Connect a test account" : "Match your callback URL", short: c.managed ? "Connect account" : "Set callback",
      action: c.managed ? "Start consent with a dedicated test account." : "Copy the exact callback from your auth configuration into the provider settings.",
      destination: c.managed ? "Open Composio" : "Open provider settings",
      link: c.managed ? "https://platform.composio.dev/" : portal,
      visual: c.managed ? ["Test account", "Consent", "Connection"] : ["Auth config", "Exact URL", "Provider settings"],
      detail: c.managed ? "Check the account and displayed permissions before granting access. A workspace administrator may need to allow installation." : "Keep the client secret on your server. Compare scheme, host, path and trailing slash. Use the callback shown for this environment; older supported callbacks can differ from current defaults.",
      check: c.managed ? "The expected test account is connected." : "The two callback URLs match exactly.",
      recovery: c.managed ? "Inspect consent, organization policy and the connected account." : "For redirect_uri_mismatch, compare the configured URLs character by character.",
      source: sources.composio,
    },
    {
      title: "Try one controlled operation", short: "Test connection",
      action: gmail ? c.intent === "send" ? "Send one message to an explicit test recipient." : "Read a known message from a test mailbox." : c.provider === "slack" ? "Post one message in a dedicated test channel." : "Read the connected test account’s profile.",
      destination: "Check testing guidance", link: official,
      visual: ["Test account", operation(c), "Check result"],
      detail: gmail ? "Use a dedicated test account. Send-only testing must not depend on an endpoint requiring read scopes. External Testing refresh tokens usually expire after seven days, with exceptions." : "Check both the returned result and the account or workspace used. Avoid real customer data for the first test.",
      check: "The observed result matches your intended account and input.",
      recovery: "Check account, scopes and provider errors. Token expiry or revocation can require reconnecting.",
      source: gmail ? sources.expiration : official,
    },
    {
      title: "Check what launch needs", short: "Plan launch",
      action: gate(c), destination: "Read launch requirements", link: reviewSource(c),
      visual: ["Working test", "Review requirements", "External launch"],
      detail: c.managed ? "Managed authentication can handle client registration but does not approve your product or remove its privacy and data-handling responsibilities." : gmail ? c.intent === "read" ? "Restricted-scope review can take several weeks. An assessment may apply when restricted data passes through or is stored on a server, subject to exceptions. Confirm applicability and costs." : "Google describes a typical sensitive-scope review of 3–5 business days. Exceptions, incomplete submissions and remediation affect timing. Publishing status is separate from verification." : c.provider === "slack" ? "An unlisted pilot and commercial distribution follow different requirements. Check Slack Marketplace requirements and each workspace’s admin policy." : "Organization owners may restrict OAuth access. A user’s consent does not establish permission to access restricted organization resources.",
      check: "Each applicable launch requirement has an owner and evidence.",
      recovery: "Document unresolved requirements and seek provider clarification before promising a launch date.",
      source: reviewSource(c),
    },
  ];
}
