import { Heart, Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAppContext } from '../context/useAppContext'
import SearchPanel from '../components/SearchPanel'

const links = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/collection' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
]

function SiteLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const location = useLocation()
  const { user, cart, signOut } = useAppContext()

  return (
    <div className="min-h-screen bg-ivory text-ink">
      <header className="sticky top-0 z-30 border-b border-divider bg-ivory/95 backdrop-blur">
        <div className="bg-ink px-4 py-2 text-center text-[0.62rem] tracking-[0.08em] text-bone">
          A quiet study in fine fragrance
        </div>
        <div className="mx-auto grid h-[4.75rem] max-w-[1360px] grid-cols-[1fr_auto_1fr] items-center px-5 sm:px-8 lg:px-14">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-[0.65rem] uppercase tracking-editorial text-secondary-ink lg:hidden"
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={18} strokeWidth={1.4} /> : <Menu size={18} strokeWidth={1.4} />}
            <span className="hidden sm:inline">Menu</span>
          </button>

          <nav className="hidden items-center gap-8 text-sm lg:flex" aria-label="Primary">
            {links.map((link) => (
              <NavLink
                className="relative py-2 text-secondary-ink transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-ink after:transition-transform hover:after:scale-x-100"
                key={link.label}
                to={link.to}
                onClick={() => {
                  if (link.to === '/' && location.pathname === '/') window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
                }}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <Link
            className="font-editorial text-3xl tracking-[0.08em] text-ink sm:text-4xl"
            to="/"
            aria-label="Misty home"
            onClick={() => {
              if (location.pathname === '/') window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
            }}
          >
            MISTY
          </Link>

          <div className="flex items-center justify-self-end gap-4 text-secondary-ink sm:gap-5" aria-label="Utility navigation">
            <button type="button" className="transition-colors hover:text-oxblood" aria-label="Search" onClick={() => setSearchOpen(true)}>
              <Search size={16} strokeWidth={1.3} />
            </button>
            <Link to={user ? '/account' : '/login'} className="hidden transition-colors hover:text-oxblood sm:block" aria-label="Account">
              <UserRound size={16} strokeWidth={1.3} />
            </Link>
            <Link to={user ? '/wishlist' : '/login'} className="hidden transition-colors hover:text-oxblood sm:block" aria-label="Wishlist">
              <Heart size={16} strokeWidth={1.3} />
            </Link>
            <Link to={user ? '/cart' : '/login'} className="relative transition-colors hover:text-oxblood" aria-label="Shopping bag">
              <ShoppingBag size={16} strokeWidth={1.3} />
              {cart?.items?.length ? <span className="absolute -right-2 -top-2 text-[0.55rem] text-oxblood">{cart.items.length}</span> : null}
            </Link>
            {user ? <button className="hidden text-[0.6rem] uppercase tracking-editorial text-secondary-ink lg:block" onClick={signOut}>Sign out</button> : null}
          </div>
        </div>
        {menuOpen ? (
          <nav className="border-t border-divider px-6 py-6 lg:hidden" aria-label="Mobile primary">
            <div className="flex flex-col gap-5">
              {links.map((link) => (
                <NavLink
                  className="text-[0.7rem] uppercase tracking-editorial text-secondary-ink"
                  key={link.label}
                  to={link.to}
                  onClick={() => {
                    setMenuOpen(false)
                    if (link.to === '/' && location.pathname === '/') window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
                  }}
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </nav>
        ) : null}
      </header>

      <main>
        <Outlet />
      </main>
      {searchOpen ? <SearchPanel onClose={() => setSearchOpen(false)} /> : null}

      <footer id="contact" className="mx-auto mt-12 max-w-[1360px] border-t border-divider px-6 py-14 sm:px-8 lg:px-14">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <Link className="font-editorial text-3xl tracking-[0.08em]" to="/">
              MISTY
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-secondary-ink/70">
              Quietly made for the senses.
            </p>
          </div>
          <div className="flex flex-col gap-3 text-[0.65rem] uppercase tracking-editorial text-secondary-ink/70">
            <Link to="/collection">Collection</Link>
            <Link to="/about">Our story</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <div className="flex flex-col gap-3 text-[0.65rem] uppercase tracking-editorial text-secondary-ink/70">
            <a href="https://www.instagram.com" target="_blank" rel="noreferrer">Instagram</a>
            <a href="https://www.pinterest.com" target="_blank" rel="noreferrer">Pinterest</a>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-divider pt-5 text-[0.62rem] uppercase tracking-editorial text-secondary-ink/60 sm:flex-row sm:items-center sm:justify-between">
          <span>Misty Fine Fragrance</span>
          <span>Misty / Fine fragrance</span>
        </div>
      </footer>
    </div>
  )
}

export default SiteLayout
