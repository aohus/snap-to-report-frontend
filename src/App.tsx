import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import JobList from './pages/JobList';
import Dashboard from './pages/Dashboard';
import JobEditor from './pages/JobEditor';
import NotFound from './pages/NotFound';
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
            <Route path="/" element={<JobList />} />
            <Route path="/jobs/:jobId" element={<Dashboard />} />
            <Route path="/jobs/:jobId/edit" element={<JobEditor />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;