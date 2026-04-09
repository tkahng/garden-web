export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-[var(--line)] bg-[var(--foam)] px-4 py-12">
      <div className="page-wrap">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {/* Col 1 — Brand */}
          <div>
            <p className="text-base font-bold text-[var(--sea-ink)]">The Garden Shop</p>
            <p className="mt-2 text-sm text-[var(--sea-ink-soft)]">
              Plants, seeds & tools for every garden.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Follow The Garden Shop on X"
                className="rounded-lg p-2 text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
              >
                <svg viewBox="0 0 16 16" aria-hidden="true" width="18" height="18">
                  <path
                    fill="currentColor"
                    d="M12.6 1h2.2L10 6.48 15.64 15h-4.41L7.78 9.82 3.23 15H1l5.14-5.84L.72 1h4.52l3.12 4.73L12.6 1zm-.77 12.67h1.22L4.57 2.26H3.26l8.57 11.41z"
                  />
                </svg>
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                aria-label="The Garden Shop on GitHub"
                className="rounded-lg p-2 text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
              >
                <svg viewBox="0 0 16 16" aria-hidden="true" width="18" height="18">
                  <path
                    fill="currentColor"
                    d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"
                  />
                </svg>
              </a>
            </div>
          </div>

          {/* Col 2 — Shop */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">
              Shop
            </p>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href="/products"
                  className="text-sm text-[var(--sea-ink)] no-underline transition hover:text-[var(--lagoon-deep)]"
                >
                  Products
                </a>
              </li>
              <li>
                <a
                  href="/collections"
                  className="text-sm text-[var(--sea-ink)] no-underline transition hover:text-[var(--lagoon-deep)]"
                >
                  Collections
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3 — Company */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">
              Company
            </p>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href="/about"
                  className="text-sm text-[var(--sea-ink)] no-underline transition hover:text-[var(--lagoon-deep)]"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="/"
                  className="text-sm text-[var(--sea-ink)] no-underline transition hover:text-[var(--lagoon-deep)]"
                >
                  Home
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-[var(--line)] pt-6">
          <p className="text-sm text-[var(--sea-ink-soft)]">
            &copy; {year} The Garden Shop. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
