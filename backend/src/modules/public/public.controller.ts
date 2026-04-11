import { Controller, Get, Header } from '@nestjs/common';

@Controller()
export class PublicController {
  private layout(title: string, body: string) {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="theme-color" content="#0f766e" />
  <title>${title}</title>
  <style>
    :root{--ink:#0f172a;--muted:#475569;--line:#dbe4ee;--brand:#0f766e;--brand-2:#14b8a6;--surface:#ffffff;--bg:#f8fafc;--dark:#0b1324}
    *{box-sizing:border-box}
    body{margin:0;background:radial-gradient(circle at top, #ecfeff 0, #f8fafc 42%, #f8fafc 100%);color:var(--ink);font-family:Georgia,'Times New Roman',serif;line-height:1.6}
    a{color:var(--brand)}
    .container{max-width:1120px;margin:0 auto;padding:28px 20px 56px}
    header{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:8px 0 20px}
    .brand{font:700 20px/1.1 'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:var(--dark);letter-spacing:.02em}
    nav a{margin-left:16px;text-decoration:none;font:700 14px/1 'Segoe UI',Tahoma,Geneva,Verdana,sans-serif}
    .hero{display:grid;grid-template-columns:1.12fr .88fr;gap:28px;align-items:center;padding:30px;border:1px solid rgba(15,118,110,.12);background:linear-gradient(135deg, rgba(255,255,255,.97), rgba(236,254,255,.92));border-radius:24px;box-shadow:0 18px 60px rgba(15,23,42,.08)}
    .eyebrow{display:inline-block;margin-bottom:16px;padding:6px 10px;border-radius:999px;background:rgba(20,184,166,.12);color:var(--brand);font:700 12px/1 'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;letter-spacing:.08em;text-transform:uppercase}
    h1,h2,h3{line-height:1.14;color:var(--dark)}
    h1{margin:0;font-size:clamp(34px,6vw,58px)}
    h2{margin:0 0 12px;font-size:28px}
    h3{margin:0 0 8px;font-size:18px}
    .lead{max-width:60ch;margin:18px 0 0;color:var(--muted);font:500 18px/1.7 'Segoe UI',Tahoma,Geneva,Verdana,sans-serif}
    .muted{color:var(--muted);font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif}
    .actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:24px}
    .cta,.secondary{display:inline-block;padding:12px 18px;border-radius:12px;text-decoration:none;font:700 14px/1 'Segoe UI',Tahoma,Geneva,Verdana,sans-serif}
    .cta{background:linear-gradient(135deg,var(--brand),var(--brand-2));color:#fff;box-shadow:0 12px 24px rgba(15,118,110,.2)}
    .secondary{border:1px solid rgba(15,118,110,.2);background:#fff;color:var(--brand)}
    .stats,.features{display:grid;gap:16px}
    .stats{grid-template-columns:repeat(3,1fr);margin-top:24px}
    .features{grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}
    .card,.panel{padding:20px;border-radius:18px;background:var(--surface);border:1px solid rgba(148,163,184,.18);box-shadow:0 12px 32px rgba(15,23,42,.05)}
    .stat{padding:18px;border-radius:18px;background:#fff;border:1px solid rgba(15,118,110,.1)}
    .stat strong{display:block;font-size:24px;margin-bottom:6px}
    .section{margin-top:32px}
    .highlight{background:linear-gradient(180deg,#0f172a,#10233b);color:#e2e8f0}
    .highlight h2,.highlight h3{color:#fff}
    ul{padding-left:20px}
    li{margin:8px 0}
    footer{margin-top:42px;padding-top:18px;border-top:1px solid var(--line);color:#64748b;font:500 13px/1.6 'Segoe UI',Tahoma,Geneva,Verdana,sans-serif}
    @media (max-width:860px){.hero{grid-template-columns:1fr}.stats{grid-template-columns:1fr}.container{padding:20px 16px 44px}header{flex-direction:column;align-items:flex-start}}
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">BizRecord</div>
      <nav>
        <a href="/">Home</a>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
      </nav>
    </header>
    ${body}
    <footer>
      <p>&copy; ${new Date().getFullYear()} BizRecord. Built for businesses that want cleaner records, faster sales, and stronger operational control.</p>
    </footer>
  </div>
</body>
</html>`;
  }

  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  landing() {
    const body = `
      <section class="hero">
        <div>
          <span class="eyebrow">Sales, inventory and debt management</span>
          <h1>Keep your business organized from the first sale to the final report.</h1>
          <p class="lead">BizRecord gives growing businesses a practical way to record sales, track stock, manage customer debts, issue receipts, and stay in control without relying on scattered notebooks or inconsistent spreadsheets.</p>
          <div class="actions">
            <a class="cta" href="mailto:hello@bizrecord.tech?subject=Book%20a%20BizRecord%20demo">Book a demo</a>
            <a class="secondary" href="mailto:hello@bizrecord.tech?subject=BizRecord%20pricing%20request">Request pricing</a>
          </div>
          <div class="stats">
            <div class="stat">
              <strong>Faster sales</strong>
              <span class="muted">Move from customer order to recorded transaction in seconds.</span>
            </div>
            <div class="stat">
              <strong>Clear inventory</strong>
              <span class="muted">See stock movement, low inventory, and product performance with less guesswork.</span>
            </div>
            <div class="stat">
              <strong>Better cash flow</strong>
              <span class="muted">Track debt, payments, and receipts so outstanding balances are easier to follow up.</span>
            </div>
          </div>
        </div>
        <div class="panel">
          <h3>Built for everyday business pressure</h3>
          <p class="muted">BizRecord is designed for retailers, pharmacies, mini marts, wholesalers, distributors, and service teams that need speed at the counter and clarity in the back office.</p>
          <ul class="muted">
            <li>Record sales and generate customer receipts</li>
            <li>Manage products, quantities, and branch-level stock</li>
            <li>Track credit sales and outstanding customer balances</li>
            <li>Support staff workflows with cleaner records and less confusion</li>
          </ul>
        </div>
      </section>

      <section class="section">
        <h2>What BizRecord helps you do</h2>
        <div class="features">
          <div class="card"><h3>Sell with confidence</h3><p class="muted">Capture transactions accurately, reduce manual mistakes, and keep a reliable sales history your team can trust.</p></div>
          <div class="card"><h3>Stay ahead of stock issues</h3><p class="muted">Know what is available, what is running low, and what needs attention before it affects customers.</p></div>
          <div class="card"><h3>Control customer debt</h3><p class="muted">Keep proper records of who owes, how much is outstanding, and which debts have been settled.</p></div>
          <div class="card"><h3>Grow across branches</h3><p class="muted">Support expanding operations with branch-aware workflows, staff access, and cleaner reporting.</p></div>
        </div>
      </section>

      <section class="section card highlight">
        <h2>Designed for practical adoption</h2>
        <div class="features">
          <div>
            <h3>For business owners</h3>
            <p>Get visibility into sales, stock, and outstanding payments without waiting for end-of-day manual summaries.</p>
          </div>
          <div>
            <h3>For staff teams</h3>
            <p>Use a straightforward workflow that makes daily operations easier to learn and harder to get wrong.</p>
          </div>
          <div>
            <h3>For growing businesses</h3>
            <p>Add more structure as you grow, without forcing your team into a heavy or overly complex system.</p>
          </div>
        </div>
      </section>

      <section class="section">
        <h2>Subscriptions and billing</h2>
        <div class="card">
          <p class="muted">On Android, BizRecord subscriptions are managed through Google Play Billing. Eligible purchases are verified by our backend before premium access or add-ons are activated.</p>
          <ul>
            <li>Monthly and yearly subscription options</li>
            <li>Add-ons for extra workspaces, additional staff seats, and messaging capacity</li>
            <li>Secure backend verification for supported purchases</li>
          </ul>
        </div>
      </section>

      <section class="section">
        <h2>How to get started</h2>
        <div class="card">
          <p class="muted">Install the app, create your workspace, add your products, and begin recording sales. When your team is ready for advanced features, choose a plan in the app and complete the purchase through the supported billing channel. For demos, onboarding, migration help, or partnership discussions, contact hello@bizrecord.tech.</p>
        </div>
      </section>

      <section class="section">
        <h2>Frequently asked questions</h2>
        <div class="card">
          <p class="muted"><strong>Can I switch plans later?</strong> Yes. Plan changes are supported through the app and follow the billing platform's rules where applicable.</p>
          <p class="muted"><strong>Will my team be able to use it easily?</strong> BizRecord is built to be operationally simple for owners, managers, and staff.</p>
          <p class="muted"><strong>What if my internet is unstable?</strong> BizRecord is designed with offline-first behavior so daily work can continue more reliably in low-connectivity environments.</p>
        </div>
      </section>
    `;
    return this.layout(
      'BizRecord | Bookkeeping and inventory management for modern businesses',
      body,
    );
  }

  @Get('privacy')
  @Header('Content-Type', 'text/html; charset=utf-8')
  privacy() {
    const body = `
      <section class="section">
        <div class="card">
          <span class="eyebrow">Privacy Policy</span>
          <h2>Your business data deserves careful handling</h2>
          <p class="muted">This Privacy Policy explains how BizRecord collects, uses, stores, and protects information when you use our mobile app, backend services, website pages, and support channels. We use information to deliver the service, secure accounts, improve reliability, and support legitimate business operations.</p>
          <h3>Information we collect</h3>
          <ul>
            <li>Account and contact details such as name, email address, phone number, and authentication information.</li>
            <li>Business records you create in the app, including products, inventory counts, transactions, debts, receipts, workspaces, branches, and staff access settings.</li>
            <li>Technical and operational information such as device identifiers, push notification tokens, app diagnostics, and service usage signals.</li>
            <li>Billing or purchase verification details needed to confirm subscriptions and eligible in-app purchases.</li>
          </ul>
          <h3>How we use information</h3>
          <p class="muted">We use information to provide core app functionality, secure the platform, sync data, generate receipts, communicate service updates, verify billing events, improve performance, and respond to support issues. We do not sell your personal information.</p>
          <h3>Sharing of information</h3>
          <p class="muted">We may share limited data with trusted service providers that support hosting, notifications, email delivery, analytics, or billing verification. These providers only receive the information reasonably required to perform their role.</p>
          <h3>Data retention</h3>
          <p class="muted">We retain information for as long as necessary to operate the service, comply with legal obligations, maintain account integrity, resolve disputes, and support valid recordkeeping needs.</p>
          <h3>Security</h3>
          <p class="muted">We apply reasonable technical and organizational safeguards to reduce the risk of unauthorized access, misuse, alteration, or loss of information. No online service can guarantee absolute security, but we work to maintain protections appropriate to the nature of the data we handle.</p>
          <h3>Your choices</h3>
          <p class="muted">You may contact us to request support, account updates, or clarification about how your data is handled. Depending on your jurisdiction, you may also have additional privacy rights under applicable law.</p>
          <h3>Updates to this policy</h3>
          <p class="muted">We may update this Privacy Policy from time to time. The latest version becomes effective when published on this page.</p>
          <h3>Contact</h3>
          <p class="muted">For privacy questions or requests, contact <a href="mailto:hello@bizrecord.tech">hello@bizrecord.tech</a>.</p>
        </div>
      </section>
    `;
    return this.layout('Privacy Policy | BizRecord', body);
  }

  @Get('terms')
  @Header('Content-Type', 'text/html; charset=utf-8')
  terms() {
    const body = `
      <section class="section">
        <div class="card">
          <span class="eyebrow">Terms of Use</span>
          <h2>Clear terms for using BizRecord</h2>
          <p class="muted">These Terms and Conditions govern your access to and use of BizRecord, including our mobile applications, backend services, website pages, and related communications. By creating an account, accessing the service, or continuing to use BizRecord, you agree to these terms.</p>
          <h3>Account responsibility</h3>
          <p class="muted">You are responsible for maintaining the confidentiality of your account credentials and for activities carried out under your account. You agree to provide accurate information and keep your business details reasonably up to date.</p>
          <h3>Permitted use</h3>
          <p class="muted">You may use BizRecord to manage inventory, sales, debts, receipts, workspaces, subscriptions, and related business operations. You must not use the service for unlawful conduct, fraud, abuse of platform resources, or actions that interfere with system integrity.</p>
          <h3>Your business data</h3>
          <p class="muted">You remain responsible for the accuracy, legality, and completeness of the records entered into the service. BizRecord provides operational tools and reporting support, but it does not replace professional accounting, tax, compliance, or legal advice.</p>
          <h3>Subscriptions and billing</h3>
          <p class="muted">Paid features may be offered through Google Play or other approved billing channels. Subscription renewals, cancellations, and refunds are generally governed by the platform through which the purchase was made. Access to premium features may be limited where a payment is canceled, reversed, expired, or found to be invalid.</p>
          <h3>Availability and updates</h3>
          <p class="muted">We may improve, modify, suspend, or discontinue parts of the service from time to time. We aim for reliable service, but uninterrupted availability cannot be guaranteed.</p>
          <h3>Limitation of liability</h3>
          <p class="muted">To the maximum extent permitted by law, BizRecord is provided on an as-available basis. We are not liable for indirect, incidental, special, or consequential damages arising from use of the service, including lost profits, interrupted operations, or data-related disruption, except where such limitation is prohibited by law.</p>
          <h3>Termination</h3>
          <p class="muted">We may suspend or terminate access where there is misuse, fraud, non-payment, legal risk, or violation of these terms. You may stop using the service at any time.</p>
          <h3>Contact</h3>
          <p class="muted">For legal, billing, or support inquiries, contact <a href="mailto:hello@bizrecord.tech">hello@bizrecord.tech</a>.</p>
        </div>
      </section>
    `;
    return this.layout('Terms and Conditions | BizRecord', body);
  }
}

export default PublicController;
