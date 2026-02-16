import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"
import { useState } from "react"
import { useAuth } from "../../context/AuthContext"
import LanguageSwitcher from "../ui/LanguageSwitcher"
import ThemeToggle from "../ui/ThemeToggle"

const Navbar = () => {
  const { t } = useTranslation()
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = () => {
    logout()
    navigate("/login")
    setShowUserMenu(false)
  }

  return (
    <div className="flex justify-between items-center px-6 py-3 border-b dark:border-gray-700">
      <Link to="/" className="text-xl font-semibold text-primary">
        MetaGuide AI
      </Link>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <LanguageSwitcher />

        {isAuthenticated ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-4 py-2 border rounded-full hover:bg-accent hover:text-white dark:border-gray-600 transition-colors"
            >
              {user?.avatar && (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-6 h-6 rounded-full"
                />
              )}
              <span>{user?.name || "User"}</span>
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
              className="px-4 py-2 border rounded-full hover:bg-accent hover:text-white dark:border-gray-600 transition-colors"
            >
              {t("navbar.login") || "Login"}
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 bg-accent text-white rounded-full hover:bg-opacity-90 transition-colors"
            >
              {t("navbar.signup") || "Sign Up"}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default Navbar
