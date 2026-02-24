import { NavLink } from "react-router-dom"
import { useTranslation } from "react-i18next"

const Sidebar = () => {
  const { t } = useTranslation()

  return (
    <div className="w-52 border-r dark:border-gray-700 p-4 hidden md:block">
      <nav className="flex flex-col gap-4">
        <NavLink 
          to="/" 
          className={({ isActive }) => 
            `block px-4 py-2 rounded-lg transition-colors ${
              isActive 
                ? 'bg-primary/10 text-primary font-medium' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`
          }
        >
          {t("sidebar.home")}
        </NavLink>
        <NavLink 
          to="/subjects" 
          className={({ isActive }) => 
            `block px-4 py-2 rounded-lg transition-colors ${
              isActive 
                ? 'bg-primary/10 text-primary font-medium' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`
          }
        >
          {t("sidebar.subjects")}
        </NavLink>
        <NavLink 
          to="/tests" 
          className={({ isActive }) => 
            `block px-4 py-2 rounded-lg transition-colors ${
              isActive 
                ? 'bg-primary/10 text-primary font-medium' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`
          }
        >
          {t("sidebar.tests")}
        </NavLink>
        <NavLink 
          to="/leaderboard" 
          className={({ isActive }) => 
            `block px-4 py-2 rounded-lg transition-colors ${
              isActive 
                ? 'bg-primary/10 text-primary font-medium' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`
          }
        >
          {t("sidebar.leaderboard")}
        </NavLink>
      </nav>
    </div>
  )
}

export default Sidebar
