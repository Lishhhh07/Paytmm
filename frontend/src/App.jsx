
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { Signup } from "./pages/Signup";
import { Signin } from "./pages/Signin";
import { Dashboard } from "./pages/Dashboard";
import { SendMoney } from "./pages/SendMoney";
import { TransactionHistory } from "./pages/TransactionHistory";
import { Analytics } from "./pages/Analytics";
import { SplitBills } from "./pages/SplitBills";
import { SplitBillDetails } from "./pages/SplitBillDetails";
import { ScheduledPayments } from "./pages/ScheduledPayments";
import { Profile } from "./pages/Profile";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/send" element={<SendMoney />} />
          <Route path="/transactions" element={<TransactionHistory />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/split-bills" element={<SplitBills />} />
          <Route path="/split/:splitId" element={<SplitBillDetails />} />
          <Route path="/scheduled-payments" element={<ScheduledPayments />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
