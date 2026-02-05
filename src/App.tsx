import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import JobWorkspace from './pages/JobWorkspace';
import JobEditor from './pages/JobEditor';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import { AuthService } from './lib/auth';

const queryClient = new QueryClient();

// Protected Route Wrapper
const ProtectedRoute = () => {
  const isAuthenticated = AuthService.isAuthenticated();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/jobs/:jobId" element={<JobWorkspace />} />
            <Route path="/jobs/:jobId/edit" element={<JobEditor />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;