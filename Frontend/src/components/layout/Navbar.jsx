import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"
import { useState, useRef } from "react"
import { useAuth } from "../../context/AuthContext"
import LanguageSwitcher from "../ui/LanguageSwitcher"
import { useTheme } from "../../contexts/ThemeContext"

/* ── Review Modal ─────────────────────────────────────────── */
const ReviewModal = ({ onClose }) => {
  const [status, setStatus] = useState('idle') // idle | sending | success | error
  const formRef = useRef(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('sending')
    const data = new FormData(formRef.current)
    try {
      const res = await fetch('https://formspree.io/f/myzpbqla', {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      })
      if (res.ok) {
        setStatus('success')
        formRef.current.reset()
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient header */}
        <div className="bg-gradient-to-r from-sky-500 to-violet-600 px-6 py-5">
          <h2 className="text-xl font-bold text-white">✨ Leave a Message</h2>
          <p className="text-sky-100 text-sm mt-0.5">We'd love to hear your thoughts!</p>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6">
          {status === 'success' ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">Thank you! 🎉</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Your message has been sent successfully.</p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2 bg-gradient-to-r from-sky-500 to-violet-600 text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Close
              </button>
            </div>
          ) : (
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Your Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Your Message
                </label>
                <textarea
                  name="message"
                  required
                  rows={4}
                  placeholder="Share your experience..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 transition resize-none"
                />
              </div>
              {status === 'error' && (
                <p className="text-sm text-red-500">Something went wrong. Please try again.</p>
              )}
              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-violet-600 text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-60 transition-all"
              >
                {status === 'sending' ? 'Sending…' : 'Send Review'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Navbar ──────────────────────────────────────────────── */
const Navbar = () => {
  const { t } = useTranslation()
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showReview, setShowReview] = useState(false)

  const handleLogout = () => {
    logout()
    navigate("/login")
    setShowUserMenu(false)
  }

  return (
    <>
    <div className="flex justify-between items-center px-4 md:px-6 py-2.5 md:py-3 border-b dark:border-gray-700 bg-white/80 dark:bg-darkbg/80 backdrop-blur-md sticky top-0 z-[100]">
      <Link to="/" className="flex items-center group outline-none">
        <img
          src="/meta.png"
          alt="Meta Guide AI Logo"
          className="h-8 w-auto sm:h-9 md:h-11 object-contain transition-all duration-300 group-hover:scale-105"
        />
      </Link>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Review Button */}
        <button
          onClick={() => setShowReview(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold border border-sky-400 text-sky-600 dark:text-sky-400 dark:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-all active:scale-95 shadow-sm"
        >
          <svg className="w-3.5 h-3.5 sm:w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <span className="hidden xs:inline">Contact</span>
        </button>

        <LanguageSwitcher />

        {isAuthenticated ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 border rounded-full hover:bg-accent hover:text-white dark:border-gray-600 transition-all active:scale-95"
            >
              {user?.avatar && (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-5 h-5 md:w-6 md:h-6 rounded-full object-cover"
                />
              )}
              <span className="text-xs md:text-sm font-medium hidden xs:inline">{user?.name || "User"}</span>
              <svg
                className={`w-4 h-4 transition-transform ${showUserMenu ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 py-2 z-50">
                <Link
                  to="/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {t("navbar.profile")}
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setShowUserMenu(false)}
                    className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Admin Dashboard
                  </Link>
                )}
                <hr className="my-2 dark:border-gray-700" />

                {/* ── Theme toggle ── */}
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300 select-none">
                    {theme === "dark" ? "Dark mode" : "Light mode"}
                  </span>
                  <button
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                    className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      theme === "dark" ? "bg-violet-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${
                        theme === "dark" ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <hr className="my-2 dark:border-gray-700" />
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-red-600 dark:text-red-400"
                >
                  {t("navbar.logout") || "Logout"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm border rounded-full hover:bg-accent hover:text-white dark:border-gray-600 transition-colors"
            >
              {t("navbar.login") || "Login"}
            </Link>
            <Link
              to="/signup"
              className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm bg-accent text-white rounded-full hover:bg-opacity-90 transition-colors shadow-md"
            >
              {t("navbar.signup") || "Sign Up"}
            </Link>
          </div>
        )}
      </div>
    </div>

    {/* Review Modal */}
    {showReview && <ReviewModal onClose={() => setShowReview(false)} />}
    </>
  )
}

export default Navbar
