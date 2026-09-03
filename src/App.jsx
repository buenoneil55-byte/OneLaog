import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import { LanguageProvider } from './lib/LanguageContext'
import { ToastProvider } from './components/useToast'
import ScrollToTop from './components/ScrollToTop'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Home from './pages/Home'
import CategoryPage from './pages/CategoryPage'
import Cart from './pages/Cart'
import Orders from './pages/Orders'
import History from './pages/History'
import Profile from './pages/Profile'
import Chat from './pages/Chat'
import AdminDashboard from './pages/AdminDashboard'
import AdminProducts from './pages/AdminProducts'
import AdminProductForm from './pages/AdminProductForm'
import AdminOrders from './pages/AdminOrders'
import AdminSalesReport from './pages/AdminSalesReport'
import AdminMembers from './pages/AdminMembers'
import AdminSettings from './pages/AdminSettings'
import AdminChats from './pages/AdminChats'
import RiderDashboard from './pages/RiderDashboard'

function NotFound() { return <div className="center-screen"><h2>Page not found</h2></div> }

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <ToastProvider>
          <Router>
            <ScrollToTop />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
                <Route path="/" element={<Home />} />
                <Route path="/category/:category" element={<CategoryPage />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/history" element={<History />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/products/new" element={<AdminProductForm />} />
                <Route path="/admin/products/edit/:id" element={<AdminProductForm />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/sales-report" element={<AdminSalesReport />} />
                <Route path="/admin/members" element={<AdminMembers />} />
                <Route path="/admin/chats" element={<AdminChats />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/rider" element={<RiderDashboard />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </ToastProvider>
      </LanguageProvider>
    </AuthProvider>
  )
}