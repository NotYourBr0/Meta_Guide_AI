import Navbar from "./Navbar"
import Sidebar from "./Sidebar"
import AIAssistant from "../ui/AIAssistant"

const MainLayout = ({ children }) => {
  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
      {/* AI Assistant floating widget — always visible */}
      <AIAssistant />
    </div>
  )
}

export default MainLayout

