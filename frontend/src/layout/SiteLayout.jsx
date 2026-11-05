import { Heart, Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAppContext } from '../context/useAppContext'

const links = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/collection' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
]

function SiteLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, cart, signOut } = useAppContext()

  return (
    <div className="min-h-screen bg-ivory text-charcoal">
      <header className="sticky top-0 z-30 border-b border-charcoal/10 bg-ivory/95 backdrop-blur">
        <div className="bg-charcoal px-4 py-1.5 text-center text-[0.55rem] uppercase tracking-editorial text-ivory/85">
          Complimentary delivery on orders over ₹5,000
        </div>
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-[0.6rem] uppercase tracking-editorial text-charcoal/70 lg:hidden"
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={18} strokeWidth={1.4} /> : <Menu size={18} strokeWidth={1.4} />}
            <span className="hidden sm:inline">Menu</span>
          </button>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
            {links.map((link) => (
              <NavLink
                className="text-[0.58rem] uppercase tracking-editorial text-charcoal/70 transition-colors hover:text-champagne"
                key={link.label}
                to={link.to}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <Link
            className="absolute left-1/2 -translate-x-1/2 font-editorial text-xl tracking-[0.22em] text-charcoal sm:text-2xl"
            to="/"
            aria-label="Misty home"
          >
            MISTY
          </Link>

          <div className="flex items-center gap-3 text-charcoal/75" aria-label="Utility navigation">
            <Link to="/collection" className="transition-colors hover:text-champagne" aria-label="Search">
              <Search size={16} strokeWidth={1.3} />
            </Link>
            <Link to={user ? '/account' : '/login'} className="hidden transition-colors hover:text-champagne sm:block" aria-label="Account">
              <UserRound size={16} strokeWidth={1.3} />
            </Link>
            <Link to={user ? '/wishlist' : '/login'} className="hidden transition-colors hover:text-champagne sm:block" aria-label="Wishlist">
              <Heart size={16} strokeWidth={1.3} />
            </Link>
            <Link to={user ? '/cart' : '/login'} className="relative transition-colors hover:text-champagne" aria-label="Shopping bag">
              <ShoppingBag size={16} strokeWidth={1.3} />
              {cart?.items?.length ? <span className="absolute -right-2 -top-2 text-[0.55rem] text-champagne">{cart.items.length}</span> : null}
            </Link>
            {user ? <button className="hidden text-[0.6rem] uppercase tracking-editorial text-charcoal/55 lg:block" onClick={signOut}>Sign out</button> : null}
          </div>
        </div>
        {menuOpen ? (
          <nav className="border-t border-charcoal/10 px-6 py-6 lg:hidden" aria-label="Mobile primary">
            <div className="flex flex-col gap-5">
              {links.map((link) => (
                <NavLink
                  className="text-[0.7rem] uppercase tracking-editorial text-charcoal/70"
                  key={link.label}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
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

      <footer id="contact" className="mx-auto mt-12 max-w-[1440px] border-t border-charcoal/10 px-6 py-10 sm:px-8 lg:px-12">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <Link className="font-editorial text-2xl tracking-[0.18em]" to="/">
              MISTY
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-charcoal/55">
              Quietly made for the senses.
            </p>
          </div>
          <div className="flex flex-col gap-3 text-[0.65rem] uppercase tracking-editorial text-charcoal/55">
            <Link to="/collection">Collection</Link>
            <Link to="/about">Our story</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <div className="flex flex-col gap-3 text-[0.65rem] uppercase tracking-editorial text-charcoal/55">
            <a href="https://www.instagram.com" target="_blank" rel="noreferrer">Instagram</a>
            <a href="https://www.pinterest.com" target="_blank" rel="noreferrer">Pinterest</a>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-charcoal/10 pt-5 text-[0.62rem] uppercase tracking-editorial text-charcoal/40 sm:flex-row sm:items-center sm:justify-between">
          <span>Misty Fine Fragrance</span>
          <span>Misty / Fine fragrance</span>
        </div>
      </footer>
    </div>
  )
}

export default SiteLayout
