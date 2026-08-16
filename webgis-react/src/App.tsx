import { Routes, Route, Navigate } from 'react-router-dom';
import Index from './pages/Index';
import Login from './pages/Login';
import RegisterUser from './pages/RegisterUser';
import RecoveryPassword from './pages/RecoveryPassword';
import ResetPassword from './pages/ResetPassword';
import EmailVerificado from './pages/EmailVerificado';
import Webgis from './pages/Webgis';
import Dados from './pages/Dados';
import Manager from './pages/manager/Manager';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register-user" element={<RegisterUser />} />
      <Route path="/recovery-password" element={<RecoveryPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/email-verified" element={<EmailVerificado />} />
      <Route path="/webgis" element={<Webgis />} />
      <Route path="/dados" element={<Dados />} />
      <Route path="/manager" element={<Manager />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}