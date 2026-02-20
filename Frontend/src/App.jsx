import { BrowserRouter } from "react-router-dom"
import { ThemeProvider } from "./contexts/ThemeContext"
import { AssistantProvider } from "./contexts/AssistantContext"
import MainLayout from "./components/layout/MainLayout"
import AppRoutes from "./routes/AppRoutes"
import "./i18n"

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AssistantProvider>
          <MainLayout>
            <AppRoutes />
          </MainLayout>
        </AssistantProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App

