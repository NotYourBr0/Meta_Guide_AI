import { Routes, Route } from "react-router-dom"
import Home from "../pages/Home"
import Subjects from "../pages/Subjects"
import Topics from "../pages/Topics"
import TopicDetail from "../pages/TopicDetail"
import Profile from "../pages/Profile"
import Login from "../pages/Login"
import Signup from "../pages/Signup"
import AdminDashboard from "../pages/AdminDashboard"
import PrivateRoute from "../components/PrivateRoute"

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/subjects" element={<Subjects />} />
      <Route path="/subjects/:id" element={<Topics />} />
      <Route path="/topics/:id" element={<TopicDetail />} />
      
      {/* Protected Routes */}
      <Route element={<PrivateRoute />}>
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Admin Route */}
      <Route element={<PrivateRoute adminOnly={true} />}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes
