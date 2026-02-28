import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { 
  BookOpen, 
  UserCircle, 
  LayoutDashboard, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Network
} from "lucide-react"

const Home = () => {
  const { t } = useTranslation()
  const { user, isAuthenticated, isAdmin } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
        
        {/* Header Section */}
        <div className="mb-12 max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight text-gray-900 dark:text-white">
            {isAuthenticated 
              ? t("home.welcomeBack", { name: user?.name || "User" })
              : t("home.welcome", { name: "Guest" })}
          </h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {isAuthenticated
              ? t("home.taglineAuth") || "Access your subjects and track your learning progress."
              : t("home.tagline") || "Explore complex topics with structured explanations and interactive tools."}
          </p>
        </div>

        {isAuthenticated ? (
          /* Authenticated User View */
          <div className="space-y-12">
            <section>
              <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
                {t("home.quickActions") || "Navigation"}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ActionCard 
                  to="/subjects"
                  icon={<BookOpen className="w-5 h-5" />}
                  title={t("home.browseSubjects") || "Subjects"}
                  description={t("home.subjectsDesc") || "Browse all available learning materials."}
                />
                
                <ActionCard 
                  to="/profile"
                  icon={<UserCircle className="w-5 h-5" />}
                  title={t("home.yourProfile") || "Account"}
                  description={t("home.profileDesc") || "Manage your profile and view history."}
                />

                {isAdmin && (
                  <ActionCard 
                    to="/admin"
                    icon={<LayoutDashboard className="w-5 h-5" />}
                    title={t("home.adminDashboard") || "Administration"}
                    description={t("home.adminDesc") || "Manage platform users and content."}
                  />
                )}
              </div>
            </section>

            {/* Simple Information Section */}
            <section className="p-8 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Platform Overview</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="flex gap-4">
                  <div className="mt-1 text-sky-600 dark:text-sky-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{t("home.feature1Title") || "Structured Content"}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t("home.feature1Desc") || "Explanations organized by difficulty and complexity."}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 text-violet-600 dark:text-violet-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{t("home.feature2Title") || "Verified Resources"}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t("home.feature2Desc") || "Carefully curated educational materials for consistent learning."}</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        ) : (
          /* Unauthenticated/Landing View */
          <div className="space-y-16">
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/signup"
                className="px-6 py-3 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700 transition-colors flex items-center justify-center gap-2"
              >
                {t("navbar.signup") || "Sign Up"}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
              >
                {t("navbar.login") || "Log In"}
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 border-t border-gray-200 dark:border-gray-700">
              <ValueItem 
                icon={<Network className="w-6 h-6 text-gray-500" />}
                title={t("home.adaptiveTitle") || "Adaptive Approach"}
                desc={t("home.adaptiveDesc") || "Content that scales with your educational level."}
              />
              <ValueItem 
                icon={<Zap className="w-6 h-6 text-gray-500" />}
                title={t("home.instantTitle") || "Direct Explanations"}
                desc={t("home.instantDesc") || "Clear descriptions provided for every topic."}
              />
              <ValueItem 
                icon={<BookOpen className="w-6 h-6 text-gray-500" />}
                title={t("home.multiLangTitle") || "Global Support"}
                desc={t("home.multiLangDesc") || "Available in multiple languages for accessibility."}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const ActionCard = ({ to, icon, title, description }) => (
  <Link
    to={to}
    className="group block p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-sky-500 dark:hover:border-sky-400 transition-all hover:shadow-md"
  >
    <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700 w-fit mb-4 text-gray-600 dark:text-gray-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
      {icon}
    </div>
    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
      {title}
    </h3>
    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
      {description}
    </p>
  </Link>
)

const ValueItem = ({ icon, title, desc }) => (
  <div>
    <div className="mb-4">{icon}</div>
    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
      {desc}
    </p>
  </div>
)

export default Home
