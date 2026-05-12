import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Roleta from './pages/Roleta'
import RoletaTestAutoSpin from './pages/RoletaTestAutoSpin'
import Sinuca from './pages/Sinuca'
import CashIn from './pages/CashIn'
import CashInCheckout from './pages/CashInCheckout'
import Tasks from './pages/Tasks'
import MiningTask from './pages/MiningTask'
import Vip from './pages/Vip'
import VipCheckout from './pages/VipCheckout'
import Invite from './pages/Invite'
import Profile from './pages/Profile'
import InvestmentOrders from './pages/InvestmentOrders'
import BankCards from './pages/BankCards'
import TeamReport from './pages/TeamReport'
import Position from './pages/Position'
import Checkin from './pages/Checkin'
import NotFound from './pages/NotFound'
import Community from './pages/Community'
import TaxDeclaration from './pages/TaxDeclaration'
import WithdrawPassword from './pages/WithdrawPassword'
import ChangePassword from './pages/ChangePassword'
import Withdraw from './pages/Withdraw'
import WithdrawReceipt from './pages/WithdrawReceipt'
import GiftVouchers from './pages/GiftVouchers'
import RedeemCode from './pages/RedeemCode'
import CaixasBox from './pages/CaixasBox'
import CycleProducts from './pages/CycleProducts'
import MiniTasks from './pages/MiniTasks'
import VipRules from './pages/VipRules'
import Statement from './pages/Statement'
import Manual from './pages/Manual'
import MonthlySalary from './pages/MonthlySalary'
import RegistroDoDia from './pages/RegistroDoDia'
import RegistrosTarefas from './pages/RegistrosTarefas'
import Support from './pages/Support'
import TeamExpansion from './pages/TeamExpansion'
import Admin from './pages/Admin'
import AdminUsers from './pages/AdminUsers'
import AdminUserDetails from './pages/AdminUserDetails'
import AdminUserHistory from './pages/AdminUserHistory'
import AdminWithdrawConfig from './pages/AdminWithdrawConfig'
import AdminRankings from './pages/AdminRankings'
import AdminLogs from './pages/AdminLogs'
import AdminSecurityLogs from './pages/AdminSecurityLogs'
import AdminPendingWithdrawals from './pages/AdminPendingWithdrawals'
import AdminUserWithdrawals from './pages/AdminUserWithdrawals'
import AdminRouletteCode from './pages/AdminRouletteCode'
import AdminGiftCode from './pages/AdminGiftCode'
import AdminDeposits from './pages/AdminDeposits'
import AdminDepositConfig from './pages/AdminDepositConfig'
import AdminCommissionConfig from './pages/AdminCommissionConfig'
import AdminTelegramConfig from './pages/AdminTelegramConfig'
import AdminCycleProducts from './pages/AdminCycleProducts'
import AdminMonthlySalary from './pages/AdminMonthlySalary'
import AdminSiteBranding from './pages/AdminSiteBranding'
import AdminSiteSettings from './pages/AdminSiteSettings'
import AdminCommunityLinks from './pages/AdminCommunityLinks'
import AdminMiniTasks from './pages/AdminMiniTasks'
import AdminRouletteProbabilities from './pages/AdminRouletteProbabilities'
import AdminCaixasBox from './pages/AdminCaixasBox'
import AdminShopProducts from './pages/AdminShopProducts'
import AdminCorrectionLogs from './pages/AdminCorrectionLogs'
import AdminVipLevels from './pages/AdminVipLevels'
import AdminTaskCommissions from './pages/AdminTaskCommissions'
import AdminCommissionReversal from './pages/AdminCommissionReversal'
import AdminVipRefunds from './pages/AdminVipRefunds'
import AdminVipUsers from './pages/AdminVipUsers'
import AdminVipPhotos from './pages/AdminVipPhotos'
import About from './pages/About'
import Introduction from './pages/Introduction'
import RequireAuth from './components/RequireAuth'
import RequireMaxAdmin from './components/RequireMaxAdmin'
import './App.css'

function AdminRestoreBanner() {
  const [visible, setVisible] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const check = () => setVisible(!!sessionStorage.getItem('admin_restore_token'))
    check()
    window.addEventListener('storage', check)
    const id = setInterval(check, 1500)
    return () => { window.removeEventListener('storage', check); clearInterval(id) }
  }, [])

  if (!visible) return null

  const handleRestore = () => {
    const adminToken = sessionStorage.getItem('admin_restore_token') ?? ''
    const adminUser = sessionStorage.getItem('admin_restore_user') ?? ''
    localStorage.setItem('token', adminToken)
    if (adminUser) localStorage.setItem('user', adminUser)
    sessionStorage.removeItem('admin_restore_token')
    sessionStorage.removeItem('admin_restore_user')
    setVisible(false)
    navigate('/adf/users')
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 72,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      background: 'linear-gradient(135deg,#4f46e5,#6366f1)',
      color: '#fff',
      borderRadius: 12,
      padding: '10px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      boxShadow: '0 6px 24px rgba(99,102,241,0.5)',
      fontSize: 13,
      fontWeight: 700,
      whiteSpace: 'nowrap',
    }}>
      <span>👁️ Modo Admin</span>
      <button
        type="button"
        onClick={handleRestore}
        style={{
          background: 'rgba(255,255,255,0.22)',
          border: '1px solid rgba(255,255,255,0.4)',
          color: '#fff',
          borderRadius: 8,
          padding: '5px 12px',
          fontWeight: 700,
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        Voltar ao Admin
      </button>
    </div>
  )
}

export default function App() {
  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'
    const sendHeartbeat = () => {
      try {
        const raw = localStorage.getItem('user') ?? sessionStorage.getItem('user')
        if (!raw) return // nao envia se nao estiver logado
        const userId = String((JSON.parse(raw) as { id?: unknown })?.id ?? '')
        if (!userId || userId === '0') return // nao envia se nao tiver userId valido
        fetch(`${API_URL}/api/presence/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        }).catch(() => {})
      } catch {
        // silencioso
      }
    }
    sendHeartbeat()
    const interval = setInterval(sendHeartbeat, 30_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <BrowserRouter>
      <AdminRestoreBanner />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/support" element={<Support />} />
        <Route path="/roleta" element={<Roleta />} />
        <Route path="/roleta-test" element={<RoletaTestAutoSpin />} />
        <Route path="/sinuca" element={<Sinuca />} />
        <Route path="/cashin" element={<CashIn />} />
        <Route path="/cashin/checkout" element={<CashInCheckout />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/tasks/mining/:taskId" element={<MiningTask />} />
        <Route path="/vip" element={<Vip />} />
        <Route path="/vip/checkout/:id" element={<VipCheckout />} />
        <Route path="/about" element={<About />} />
        <Route path="/introducao" element={<Introduction />} />
        <Route path="/invite" element={<Invite />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/mini-tasks" element={<MiniTasks />} />
        <Route path="/vip-rules" element={<VipRules />} />
        <Route path="/statement" element={<Statement />} />
        <Route path="/manual" element={<Manual />} />
        <Route path="/investment-orders" element={<InvestmentOrders />} />
        <Route
          path="/monthly-salary"
          element={(
            <RequireAuth>
              <MonthlySalary />
            </RequireAuth>
          )}
        />
        <Route
          path="/salario-mensal"
          element={(
            <RequireAuth>
              <MonthlySalary />
            </RequireAuth>
          )}
        />
        <Route path="/bank-cards" element={<BankCards />} />
        <Route
          path="/registro-do-dia"
          element={(
            <RequireAuth>
              <RegistroDoDia />
            </RequireAuth>
          )}
        />
        <Route
          path="/registros-tarefas"
          element={(
            <RequireAuth>
              <RegistrosTarefas />
            </RequireAuth>
          )}
        />
        <Route path="/team-report" element={<TeamReport />} />
        <Route
          path="/team-expansion"
          element={(
            <RequireAuth>
              <TeamExpansion />
            </RequireAuth>
          )}
        />
        <Route path="/position" element={<Position />} />
        <Route path="/checkin" element={<Checkin />} />
        <Route path="/community" element={<Community />} />
        <Route path="/tax-declaration" element={<TaxDeclaration />} />
        <Route path="/withdraw-password" element={<WithdrawPassword />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route
          path="/envelope"
          element={(
            <RequireAuth>
              <GiftVouchers />
            </RequireAuth>
          )}
        />
        <Route
          path="/gift-vouchers"
          element={(
            <RequireAuth>
              <GiftVouchers />
            </RequireAuth>
          )}
        />
        <Route
          path="/redeem-code"
          element={(
            <RequireAuth>
              <RedeemCode />
            </RequireAuth>
          )}
        />
        <Route
          path="/caixas-box"
          element={(
            <RequireAuth>
              <CaixasBox />
            </RequireAuth>
          )}
        />
        <Route
          path="/cycle-products"
          element={(
            <RequireAuth>
              <CycleProducts />
            </RequireAuth>
          )}
        />
        <Route
          path="/saque"
          element={(
            <RequireAuth>
              <Withdraw />
            </RequireAuth>
          )}
        />
        <Route
          path="/saque/comprovante"
          element={(
            <RequireAuth>
              <WithdrawReceipt />
            </RequireAuth>
          )}
        />
        <Route
          path="/adf"
          element={(
            <RequireMaxAdmin>
              <Admin />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/users"
          element={(
            <RequireMaxAdmin>
              <AdminUsers />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/users/:id"
          element={(
            <RequireMaxAdmin>
              <AdminUserDetails />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/users/:id/history"
          element={(
            <RequireMaxAdmin>
              <AdminUserHistory />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/withdraw-config"
          element={(
            <RequireMaxAdmin>
              <AdminWithdrawConfig />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/rankings"
          element={(
            <RequireMaxAdmin>
              <AdminRankings />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/logs"
          element={(
            <RequireMaxAdmin>
              <AdminLogs />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/security-logs"
          element={(
            <RequireMaxAdmin>
              <AdminSecurityLogs />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/roulette-code"
          element={(
            <RequireMaxAdmin>
              <AdminRouletteCode />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/gift-codes"
          element={(
            <RequireMaxAdmin>
              <AdminGiftCode />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/withdrawals/users"
          element={(
            <RequireMaxAdmin>
              <AdminUserWithdrawals />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/withdrawals/pending"
          element={(
            <RequireMaxAdmin>
              <AdminPendingWithdrawals />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/deposits"
          element={(
            <RequireMaxAdmin>
              <AdminDeposits />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/deposit-config"
          element={(
            <RequireMaxAdmin>
              <AdminDepositConfig />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/commission-config"
          element={(
            <RequireMaxAdmin>
              <AdminCommissionConfig />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/telegram-config"
          element={(
            <RequireMaxAdmin>
              <AdminTelegramConfig />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/cycle-products"
          element={(
            <RequireMaxAdmin>
              <AdminCycleProducts />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/monthly-salary"
          element={(
            <RequireMaxAdmin>
              <AdminMonthlySalary />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/site-settings"
          element={(
            <RequireMaxAdmin>
              <AdminSiteSettings />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/site-branding"
          element={(
            <RequireMaxAdmin>
              <AdminSiteBranding />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/community-links"
          element={(
            <RequireMaxAdmin>
              <AdminCommunityLinks />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/mini-tasks"
          element={(
            <RequireMaxAdmin>
              <AdminMiniTasks />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/roulette-probabilities"
          element={(
            <RequireMaxAdmin>
              <AdminRouletteProbabilities />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/caixas-box"
          element={(
            <RequireMaxAdmin>
              <AdminCaixasBox />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/shop-products"
          element={(
            <RequireMaxAdmin>
              <AdminShopProducts />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/correction-logs"
          element={(
            <RequireMaxAdmin>
              <AdminCorrectionLogs />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/commission-reversal"
          element={(
            <RequireMaxAdmin>
              <AdminCommissionReversal />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/vip-levels"
          element={(
            <RequireMaxAdmin>
              <AdminVipLevels />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/task-commissions"
          element={(
            <RequireMaxAdmin>
              <AdminTaskCommissions />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/vip-refunds"
          element={(
            <RequireMaxAdmin>
              <AdminVipRefunds />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/vip-users"
          element={(
            <RequireMaxAdmin>
              <AdminVipUsers />
            </RequireMaxAdmin>
          )}
        />
        <Route
          path="/adf/vip-photos"
          element={(
            <RequireMaxAdmin>
              <AdminVipPhotos />
            </RequireMaxAdmin>
          )}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
