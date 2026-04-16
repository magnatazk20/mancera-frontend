import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Roleta from './pages/Roleta'
import RoletaTestAutoSpin from './pages/RoletaTestAutoSpin'
import Sinuca from './pages/Sinuca'
import CashIn from './pages/CashIn'
import CashInCheckout from './pages/CashInCheckout'
/* import Tasks from './pages/Tasks'
import MiningTask from './pages/MiningTask'
import Vip from './pages/Vip' */
import Invite from './pages/Invite'
import Profile from './pages/Profile'
import InvestmentOrders from './pages/InvestmentOrders'
import BankCards from './pages/BankCards'
import TeamReport from './pages/TeamReport'
import Checkin from './pages/Checkin'
import NotFound from './pages/NotFound'
import Community from './pages/Community'
import Earnings from './pages/Earnings'
import TaxDeclaration from './pages/TaxDeclaration'
import WithdrawPassword from './pages/WithdrawPassword'
import ChangePassword from './pages/ChangePassword'
import Withdraw from './pages/Withdraw'
import WithdrawReceipt from './pages/WithdrawReceipt'
import GiftVouchers from './pages/GiftVouchers'
import CycleProducts from './pages/CycleProducts'
import MiniTasks from './pages/MiniTasks'
import MonthlySalary from './pages/MonthlySalary'
import Admin from './pages/Admin'
import AdminUsers from './pages/AdminUsers'
import AdminUserDetails from './pages/AdminUserDetails'
import AdminUserHistory from './pages/AdminUserHistory'
import AdminWithdrawConfig from './pages/AdminWithdrawConfig'
import AdminRankings from './pages/AdminRankings'
import AdminLogs from './pages/AdminLogs'
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
import AdminCommunityLinks from './pages/AdminCommunityLinks'
import AdminMiniTasks from './pages/AdminMiniTasks'
import RequireAuth from './components/RequireAuth'
import RequireMaxAdmin from './components/RequireMaxAdmin'
import './App.css'

function AnimatedBackground() {
  return (
    <div className="bg-animation" aria-hidden="true">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="orb orb-4" />
      <div className="orb orb-5" />
      <div className="grid-overlay" />
      <div className="particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <span key={i} className="particle" style={{ '--i': i } as React.CSSProperties} />
        ))}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedBackground />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/roleta" element={<Roleta />} />
        <Route path="/roleta-test" element={<RoletaTestAutoSpin />} />
        <Route path="/sinuca" element={<Sinuca />} />
        <Route path="/cashin" element={<CashIn />} />
        <Route path="/cashin/checkout" element={<CashInCheckout />} />
        {/* <Route path="/tasks" element={<Tasks />} />
        <Route path="/tasks/mining/:taskId" element={<MiningTask />} />
        <Route path="/vip" element={<Vip />} /> */}
        <Route path="/invite" element={<Invite />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/mini-tasks" element={<MiniTasks />} />
        <Route path="/investment-orders" element={<InvestmentOrders />} />
        <Route
          path="/monthly-salary"
          element={(
            <RequireAuth>
              <MonthlySalary />
            </RequireAuth>
          )}
        />
        <Route path="/bank-cards" element={<BankCards />} />
        <Route path="/team-report" element={<TeamReport />} />
        <Route path="/checkin" element={<Checkin />} />
        <Route path="/community" element={<Community />} />
        <Route path="/earnings" element={<Earnings />} />
        <Route path="/tax-declaration" element={<TaxDeclaration />} />
        <Route path="/withdraw-password" element={<WithdrawPassword />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route
          path="/gift-vouchers"
          element={(
            <RequireAuth>
              <GiftVouchers />
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
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
