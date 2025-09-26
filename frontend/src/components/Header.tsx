import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth, type SocialProvider } from '../contexts/AuthContext'
import { gameCategories, type CategoryNode } from '../data/categories'

type MegaMenuItem = {
  label: string
  path: string
}

type MegaMenuColumn = {
  title: string
  items: MegaMenuItem[]
}

type NavItem = {
  label: string
  path: string
  mega?: MegaMenuColumn[]
}

type AuthFormState = {
  email: string
  password: string
  confirmPassword: string
}

const buildColumn = (node: CategoryNode | undefined, paramKey: string): MegaMenuColumn | null => {
  if (!node || !node.children || node.children.length === 0) {
    return null
  }

  return {
    title: node.label,
    items: node.children.map((child) => ({
      label: child.label,
      path: `/board/game?${paramKey}=${encodeURIComponent(child.id)}`
    }))
  }
}

const buildGameMega = (): MegaMenuColumn[] => {
  const rootChildren = gameCategories.children ?? []
  const findNode = (id: string) => rootChildren.find((child) => child.id === id)

  const columns: MegaMenuColumn[] = []
  const seriesColumn = buildColumn(findNode('series'), 'series')
  if (seriesColumn) columns.push(seriesColumn)

  const platformColumn = buildColumn(findNode('platform'), 'platform')
  if (platformColumn) columns.push(platformColumn)

  const genreColumn = buildColumn(findNode('genre'), 'genre')
  if (genreColumn) columns.push(genreColumn)

  const resourceColumn = buildColumn(findNode('resource'), 'resource')
  if (resourceColumn) columns.push(resourceColumn)

  return columns
}

const megaGameColumns = buildGameMega()

const NAV_ITEMS: NavItem[] = [
  { label: 'News', path: '/board/news' },
  { label: 'Community', path: '/board/free' },
  { label: 'Media', path: '/board/image' },
  { label: 'Game Hub', path: '/board/game', mega: megaGameColumns }
]

const slugifyLabel = (label: string) =>
  label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '') || 'nav-item'

const MIN_PASSWORD_LENGTH = 6

const Header: React.FC = () => {
  const { isLoggedIn, user, login, register, logout, loginWithProvider, availableProviders, localAuthEnabled } = useAuth()
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authData, setAuthData] = useState<AuthFormState>({ email: '', password: '', confirmPassword: '' })
  const [authAlert, setAuthAlert] = useState<{ tone: 'error' | 'success'; message: string } | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [providerLoading, setProviderLoading] = useState<SocialProvider | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const formatProviderLabel = useCallback((provider: SocialProvider) => (provider === 'apple' ? 'Apple' : 'Google'), [])
  const resolvedUserLabel = useMemo(() => {
    if (!user) return ''
    if (user.email && user.email.length > 0) {
      return user.email
    }
    if (user.provider && user.provider !== 'local') {
      return `${formatProviderLabel(user.provider as SocialProvider)} user`
    }
    return 'Member'
  }, [user, formatProviderLabel])

  const showLocalAuthForm = localAuthEnabled

  const resetAuthForm = useCallback(() => {
    setAuthMode('login')
    setAuthData({ email: '', password: '', confirmPassword: '' })
    setAuthAlert(null)
  }, [])

  const openAuthModal = useCallback(() => {
    resetAuthForm()
    setShowLoginForm(true)
  }, [resetAuthForm])

  const closeAuthModal = useCallback(() => {
    setShowLoginForm(false)
    setProviderLoading(null)
    resetAuthForm()
  }, [resetAuthForm])

  useEffect(() => {
    setOpenMenu(null)
    setMobileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!showLoginForm) {
      return
    }

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeAuthModal()
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => {
      window.removeEventListener('keydown', handleKeydown)
    }
  }, [showLoginForm, closeAuthModal])

  const handleAuthSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAuthAlert(null)
    if (!showLocalAuthForm) {
      setAuthAlert({ tone: 'error', message: 'Email login is disabled. Please use a social login option.' })
      return
    }

    const email = authData.email.trim()
    const password = authData.password.trim()
    const confirmPassword = authData.confirmPassword.trim()

    if (!email || !password) {
      setAuthAlert({ tone: 'error', message: 'Email and password are required.' })
      return
    }

    if (authMode === 'login') {
      const result = login({ email, password })
      if (!result.success) {
        setAuthAlert({ tone: 'error', message: result.message ?? 'Login failed. Please try again.' })
        return
      }
      closeAuthModal()
      return
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setAuthAlert({ tone: 'error', message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` })
      return
    }

    if (password !== confirmPassword) {
      setAuthAlert({ tone: 'error', message: 'Passwords do not match.' })
      return
    }

    const result = register({ email, password })
    if (!result.success) {
      setAuthAlert({ tone: 'error', message: result.message ?? 'Could not create account.' })
      return
    }

    setAuthAlert({ tone: 'success', message: result.message ?? 'Account created. You can now log in.' })
    setAuthMode('login')
    setAuthData({ email, password: '', confirmPassword: '' })
  }

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = searchValue.trim()
    if (!trimmed) {
      return
    }
    navigate(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  const isActivePath = (targetPath: string) =>
    targetPath === '/' ? location.pathname === '/' : location.pathname.startsWith(targetPath)

  const handleAuthModeSwitch = () => {
    if (!showLocalAuthForm) {
      return
    }
    setAuthMode((mode) => (mode === 'login' ? 'register' : 'login'))
    setAuthData({ email: '', password: '', confirmPassword: '' })
    setAuthAlert(null)
  }

  const openMenuFor = (label: string) => {
    setOpenMenu(label)
  }

  const closeMenuFor = (label: string) => {
    setOpenMenu((prev) => (prev === label ? null : prev))
  }

  const closeAllMenus = () => {
    setOpenMenu(null)
  }

  const handleProviderLogin = async (provider: SocialProvider) => {
    setAuthAlert(null)
    setProviderLoading(provider)
    const result = await loginWithProvider(provider)
    setProviderLoading(null)
    if (result.success) {
      closeAuthModal()
      return
    }
    if (result.message) {
      setAuthAlert({ tone: 'error', message: result.message })
    }
  }

  const handleWrapperBlur = (event: React.FocusEvent<HTMLDivElement>, label: string) => {
    const nextTarget = event.relatedTarget as Node | null
    if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
      closeMenuFor(label)
    }
  }

  const handleWrapperMouseEnter = (label: string) => {
    openMenuFor(label)
  }

  const handleWrapperMouseLeave = (label: string) => {
    closeMenuFor(label)
  }

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      closeAuthModal()
    }
  }

  const handleNavClick = () => {
    closeAllMenus()
  }

  const handleMegaLinkClick = () => {
    closeAllMenus()
  }

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev)
  }, [])

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false)
  }, [])

  const handleMobileNavClick = useCallback(() => {
    closeMobileMenu()
    closeAllMenus()
  }, [closeMobileMenu])

  return (
    <header className="site-header">
      <div className="site-header__container">
        <Link to="/" className="site-header__brand">
          <span className="site-header__logo" aria-hidden="true" />
          <span className="site-header__brand-text">
            <strong className="site-header__title">The News Paper</strong>
            <span className="site-header__tagline">Gaming News &amp; Community</span>
          </span>
        </Link>

        <nav className="site-header__nav" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => {
            const hasMega = Boolean(item.mega && item.mega.length > 0)
            const isOpen = openMenu === item.label
            const isActive = isActivePath(item.path)
            const menuId = hasMega ? `mega-${slugifyLabel(item.label)}` : undefined

            const wrapperClassName = [
              'site-header__nav-item-wrapper',
              hasMega ? 'has-mega' : '',
              isOpen ? 'is-open' : '',
              isActive ? 'is-active' : ''
            ]
              .filter(Boolean)
              .join(' ')

            const navItemClassName = [
              'site-header__nav-item',
              hasMega ? 'has-mega' : '',
              isActive ? 'is-active' : ''
            ]
              .filter(Boolean)
              .join(' ')

            return (
              <div
                key={item.label}
                className={wrapperClassName}
                onMouseEnter={() => hasMega && handleWrapperMouseEnter(item.label)}
                onMouseLeave={() => hasMega && handleWrapperMouseLeave(item.label)}
                onFocus={() => hasMega && openMenuFor(item.label)}
                onBlur={(event) => hasMega && handleWrapperBlur(event, item.label)}
              >
                <Link
                  to={item.path}
                  className={navItemClassName}
                  aria-haspopup={hasMega ? 'true' : undefined}
                  aria-expanded={hasMega ? (isOpen ? 'true' : 'false') : undefined}
                  aria-controls={menuId}
                  onClick={handleNavClick}
                >
                  {item.label}
                </Link>
                {hasMega && (
                  <div
                    id={menuId}
                    className="site-header__mega"
                    role="menu"
                    aria-label={`${item.label} ?�위 메뉴`}
                  >
                    {item.mega?.map((column) => (
                      <div key={column.title} className="mega-menu__column">
                        <p className="mega-menu__title">{column.title}</p>
                        {column.items.map((link) => (
                          <Link
                            key={link.path}
                            to={link.path}
                            className="mega-menu__link"
                            onClick={handleMegaLinkClick}
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <button
          className={`site-header__mobile-menu-toggle ${mobileMenuOpen ? 'is-open' : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
          aria-expanded={mobileMenuOpen}
        >
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </button>

        <div className={`site-header__mobile-menu ${mobileMenuOpen ? 'is-open' : ''}`}>
          <nav className="site-header__mobile-nav" aria-label="Mobile navigation">
            {NAV_ITEMS.map((item) => {
              const isActive = isActivePath(item.path)
              const hasMega = Boolean(item.mega && item.mega.length > 0)

              return (
                <div key={item.label}>
                  <Link
                    to={item.path}
                    className={`site-header__mobile-nav-item ${isActive ? 'is-active' : ''}`}
                    onClick={handleMobileNavClick}
                  >
                    {item.label}
                  </Link>
                  {hasMega && item.mega?.map((column) => (
                    <div key={column.title} className="site-header__mobile-submenu">
                      <div className="site-header__mobile-nav-item" style={{ fontWeight: '600', background: 'rgba(0, 0, 0, 0.1)' }}>
                        {column.title}
                      </div>
                      {column.items.map((link) => (
                        <Link
                          key={link.path}
                          to={link.path}
                          className="site-header__mobile-nav-item"
                          onClick={handleMobileNavClick}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              )
            })}
          </nav>
        </div>

        <div className="site-header__actions">
          <form className="site-header__search" role="search" onSubmit={handleSearch}>
            <input
              type="search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search games, news..."
              aria-label="Search games, news, or communities"
            />
            <button type="submit" aria-label="Submit search">
              <span className="site-header__search-icon" aria-hidden="true" />
            </button>
          </form>

          {isLoggedIn ? (
            <div className="site-header__auth">
              <span className="site-header__welcome">Logged in as {resolvedUserLabel}</span>
              <button type="button" className="button button--ghost" onClick={logout}>
                Log out
              </button>
            </div>
          ) : (
            <div className="site-header__auth">
              <button
                type="button"
                className="button button--primary"
                onClick={openAuthModal}
              >
                Login
              </button>
            </div>
          )}
        </div>
      </div>
      {!isLoggedIn && showLoginForm && (
        <div
          className="login-modal__backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-modal-title"
          onClick={handleOverlayClick}
        >
          <div className="login-modal" role="document">
            <header className="login-modal__header">
              <h2 id="login-modal-title">{showLocalAuthForm ? (authMode === 'login' ? 'Login' : 'Create Account') : 'Sign in'}</h2>
              <button
                type="button"
                className="login-modal__close"
                onClick={closeAuthModal}
                aria-label="Close authentication modal"
              >
                X
              </button>
            </header>
            <div className="login-modal__body">
              <div className="login-modal__providers" role="group" aria-label="Sign in options">
                {availableProviders.map((provider) => (
                  <button
                    key={provider}
                    type="button"
                    className={`login-modal__provider-button login-modal__provider-button--${provider}`}
                    onClick={() => handleProviderLogin(provider)}
                    disabled={providerLoading === provider}
                  >
                    <span
                      className={`login-modal__provider-icon login-modal__provider-icon--${provider}`}
                      aria-hidden="true"
                    >
                      {provider === 'apple' ? '?' : 'G'}
                    </span>
                    {providerLoading === provider
                      ? `Connecting to ${formatProviderLabel(provider)}...`
                      : `Sign in with ${formatProviderLabel(provider)}`}
                  </button>
                ))}
              </div>
              {!showLocalAuthForm && authAlert && (
                <p className={`login-modal__message login-modal__message--${authAlert.tone}`}>{authAlert.message}</p>
              )}
              {showLocalAuthForm && (
                <>
                  <div className="login-modal__divider">
                    <span>or continue with email</span>
                  </div>
                  <form className="login-modal__form" onSubmit={handleAuthSubmit}>
                    <label className="login-modal__field">
                      <span>Email</span>
                      <input
                        type="email"
                        value={authData.email}
                        onChange={(event) => setAuthData({ ...authData, email: event.target.value })}
                        required
                      />
                    </label>
                    <label className="login-modal__field">
                      <span>Password</span>
                      <input
                        type="password"
                        value={authData.password}
                        onChange={(event) => setAuthData({ ...authData, password: event.target.value })}
                        required
                      />
                    </label>
                    {authMode === 'register' && (
                      <label className="login-modal__field">
                        <span>Confirm password</span>
                        <input
                          type="password"
                          value={authData.confirmPassword}
                          onChange={(event) => setAuthData({ ...authData, confirmPassword: event.target.value })}
                          required
                        />
                      </label>
                    )}
                    {authAlert && (
                      <p className={`login-modal__message login-modal__message--${authAlert.tone}`}>{authAlert.message}</p>
                    )}
                    <div className="login-modal__actions">
                      <button type="submit" className="button button--primary">
                        {authMode === 'login' ? 'Sign in' : 'Create'}
                      </button>
                    </div>
                    <button
                      type="button"
                      className="login-modal__switch"
                      onClick={handleAuthModeSwitch}
                    >
                      {authMode === 'login' ? 'Need an account? Create one' : 'Already have an account? Log in'}
                    </button>
                  </form>
                </>
              )}
            </div>
            <footer className="login-modal__footer">
              <button type="button" className="button button--ghost" onClick={closeAuthModal}>
                Close
              </button>
            </footer>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header


