import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthService } from '@/lib/auth';
import { toast } from 'sonner';

export default function Signup() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [registerForm, setRegisterForm] = useState({ username: '', password: '', confirmPassword: '', company_name: '' });
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;
    setUsernameError(null); // Clear previous errors
    setPasswordError(null);

    if (registerForm.username.length < 6) {
      setUsernameError('아이디는 최소 6자 이상이어야 합니다');
      hasError = true;
    }

    if (registerForm.password.length < 6) {
      setPasswordError('비밀번호는 최소 6자 이상이어야 합니다');
      hasError = true;
    } else if (registerForm.password !== registerForm.confirmPassword) {
      setPasswordError('비밀번호가 일치하지 않습니다');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setIsLoading(true);

    try {
      await AuthService.register(registerForm.username, registerForm.password, registerForm.company_name);
      await AuthService.login(registerForm.username, registerForm.password); // Auto-login after successful registration
      toast.success('회원가입 성공! 자동으로 로그인됩니다.');
      navigate('/');
      setRegisterForm({ username: '', password: '', confirmPassword: '', company_name: '' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '회원가입 실패');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>회원가입</CardTitle>
          <CardDescription>새로운 계정을 만드세요.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                id="register-username"
                type="text"
                placeholder="아이디 (6자 이상)"
                value={registerForm.username}
                onChange={(e) => {
                  setRegisterForm({ ...registerForm, username: e.target.value });
                  if (usernameError) setUsernameError(null);
                }}
                required
                minLength={6}
                className={usernameError ? 'border-red-500' : ''}
              />
              {usernameError && <p className="text-sm text-red-500">{usernameError}</p>}
            </div>
            <div className="space-y-2">
              <Input
                id="register-password"
                type="password"
                placeholder="비밀번호 (6자 이상)"
                value={registerForm.password}
                onChange={(e) => {
                  setRegisterForm({ ...registerForm, password: e.target.value });
                  if (passwordError) setPasswordError(null);
                }}
                required
                minLength={6}
                className={passwordError ? 'border-red-500' : ''}
              />
              {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
            </div>
            <div className="space-y-2">
              <Input
                id="register-confirm-password"
                type="password"
                placeholder="비밀번호 확인"
                value={registerForm.confirmPassword}
                onChange={(e) => {
                  setRegisterForm({ ...registerForm, confirmPassword: e.target.value });
                  if (passwordError) setPasswordError(null); // Clear error on change, as mismatch affects passwordError
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                id="company-name"
                name="company_name"
                type="text"
                placeholder="[선택] 사업체명"
                value={registerForm.company_name}
                onChange={(e) => setRegisterForm({ ...registerForm, company_name: e.target.value })}
                required={false}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button type="submit" className="w-full">회원가입</Button>
            <div className="text-sm text-center text-gray-500">
              이미 계정이 있으신가요? <Link to="/login" className="text-blue-600 hover:underline">로그인</Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}