import { Layout } from 'antd'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AdminOrderDetailPage, AdminOrderEditPage, AdminOrdersPage } from './pages/AdminOrdersPage'
import { InvitationPage } from './pages/InvitationPage'
import { LoginPage } from './pages/LoginPage'
import { MarketingHomePage } from './pages/MarketingHomePage'

const { Header, Content } = Layout

export default function App() {
  const location = useLocation()
  const isPublic = location.pathname.startsWith('/i/') || location.pathname.startsWith('/invitations/')
  const isAdmin = location.pathname.startsWith('/admin') || location.pathname === '/login'

  if (isPublic) {
    return (
      <Routes>
        <Route path="/i/:token/*" element={<InvitationPage />} />
        <Route path="/invitations/:token/*" element={<InvitationPage />} />
      </Routes>
    )
  }

  if (!isAdmin) {
    return (
      <Routes>
        <Route path="*" element={<MarketingHomePage />} />
      </Routes>
    )
  }

  return (
    <Layout className="app-shell">
      <Header className="app-header">
        <div className="brand">公司注册资料系统</div>
      </Header>
      <Content className="app-content">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/orders/:id" element={<AdminOrderDetailPage />} />
          <Route path="/admin/orders/:id/edit" element={<AdminOrderEditPage />} />
          <Route path="*" element={<Navigate to="/admin/orders" replace />} />
        </Routes>
      </Content>
    </Layout>
  )
}
