import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import AdminUsers from "./pages/AdminUsers";
import AdminLoginAttempts from "./pages/AdminLoginAttempts";
import ParticipantArea from "./pages/ParticipantArea";
import CreateAssembly from "./pages/CreateAssembly";
import AssemblyList from "./pages/AssemblyList";
import AdminAssemblies from "./pages/AdminAssemblies";
import RoleManagement from "./pages/RoleManagement";
import DelegateRegistration from "./pages/DelegateRegistration";
import Voting from "./pages/Voting";
import GenerateReports from "./pages/GenerateReports";
import CreateVoting from "./pages/CreateVoting";
import SelectAssemblyForVoting from "./pages/SelectAssemblyForVoting";

 function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/admin-users" element={<AdminUsers />} />
      <Route path="/admin-login-attempts" element={<AdminLoginAttempts />} />
      <Route path="/participant-area" element={<ParticipantArea />} />
      <Route path="/create-assembly" element={<CreateAssembly />} />
      <Route path="/assembly-list" element={<AssemblyList />} />
      <Route path="/admin-assemblies" element={<AdminAssemblies />} />
      <Route path="/role-management" element={<RoleManagement />} />
      <Route path="/delegate-registration" element={<DelegateRegistration />} />
      <Route path="/voting/:assemblyId" element={<Voting />} />
      <Route path="/create-voting" element={<SelectAssemblyForVoting />} />
      <Route path="/create-voting/:assemblyId" element={<CreateVoting />} />
      <Route path="/generate-reports" element={<GenerateReports />} />
    </Routes>
  );
}

export default App;