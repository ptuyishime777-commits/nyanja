import { Route, Routes } from 'react-router-dom'
import { AdminRoute } from './components/auth/AdminRoute'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { AdminHomeScreen } from './screens/admin/AdminHomeScreen'
import { AdminLayout } from './screens/admin/AdminLayout'
import { AdminOrdersScreen } from './screens/admin/AdminOrdersScreen'
import { AdminProductsScreen } from './screens/admin/AdminProductsScreen'
import { AdminUsersScreen } from './screens/admin/AdminUsersScreen'
import { CartScreen } from './screens/CartScreen'
import { CheckoutScreen } from './screens/CheckoutScreen'
import { HomeScreen } from './screens/HomeScreen'
import { LoginScreen } from './screens/LoginScreen'
import { ProductScreen } from './screens/ProductScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { RegisterScreen } from './screens/RegisterScreen'
import { ShopScreen } from './screens/ShopScreen'
import { UserDashboardScreen } from './screens/UserDashboardScreen'

export default function App() {
  return (
    <Routes>
      <Route
        path="admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminHomeScreen />} />
        <Route path="orders" element={<AdminOrdersScreen />} />
        <Route path="products" element={<AdminProductsScreen />} />
        <Route path="users" element={<AdminUsersScreen />} />
      </Route>

      <Route element={<AppLayout />}>
        <Route index element={<HomeScreen />} />
        <Route path="shop" element={<ShopScreen />} />
        <Route path="product/:slug" element={<ProductScreen />} />
        <Route path="cart" element={<CartScreen />} />
        <Route path="login" element={<LoginScreen />} />
        <Route path="register" element={<RegisterScreen />} />
        <Route
          path="checkout"
          element={
            <ProtectedRoute>
              <CheckoutScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <UserDashboardScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <ProfileScreen />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  )
}
