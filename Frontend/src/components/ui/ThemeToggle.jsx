import { useTheme } from "../../contexts/ThemeContext"

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <button 
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  )
}

export default ThemeToggle
