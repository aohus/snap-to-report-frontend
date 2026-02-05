import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthService } from '@/lib/auth';
import { toast } from 'sonner';
import { LayoutGrid, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Signup() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [registerForm, setRegisterForm] = useState({ username: '', password: '', confirmPassword: '', company_name: '' });
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;
    setUsernameError(null); 
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
      await AuthService.login(registerForm.username, registerForm.password); 
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 py-12">
      <div className="mb-8 text-center">
        <div className="inline-flex p-3 bg-primary rounded-2xl shadow-xl shadow-primary/20 mb-4">
          <LayoutGrid className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Field Note</h1>
        <p className="text-slate-500 font-medium mt-2">전문가를 위한 현장 사진 관리 도구</p>
      </div>

      <Card className="w-full max-w-md border-none shadow-professional bg-white rounded-3xl overflow-hidden">
        <CardHeader className="pt-8 pb-4 px-8">
          <CardTitle className="text-2xl font-black text-slate-900">회원가입</CardTitle>
          <CardDescription className="text-slate-500 font-medium text-base">새로운 계정을 만들고 시작하세요.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-5 px-8">
            <div className="space-y-2">
              <Label htmlFor="register-username" className="text-sm font-bold text-slate-700 ml-1">아이디</Label>
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
                className={cn(
                  "h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary text-base",
                  usernameError ? 'border-red-500 bg-red-50/30' : ''
                )}
              />
              {usernameError && <p className="text-sm text-red-500 font-bold ml-1">{usernameError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-password" className="text-sm font-bold text-slate-700 ml-1">비밀번호</Label>
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
                className={cn(
                  "h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary text-base",
                  passwordError ? 'border-red-500 bg-red-50/30' : ''
                )}
              />
              {passwordError && <p className="text-sm text-red-500 font-bold ml-1">{passwordError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-confirm-password" className="text-sm font-bold text-slate-700 ml-1">비밀번호 확인</Label>
              <Input
                id="register-confirm-password"
                type="password"
                placeholder="비밀번호를 한 번 더 입력하세요"
                value={registerForm.confirmPassword}
                onChange={(e) => {
                  setRegisterForm({ ...registerForm, confirmPassword: e.target.value });
                  if (passwordError) setPasswordError(null); 
                }}
                required
                className="h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-name" className="text-sm font-bold text-slate-700 ml-1">사업체명 <span className="font-normal text-slate-400">(선택)</span></Label>
              <Input
                id="company-name"
                name="company_name"
                type="text"
                placeholder="예: (주)필드노트"
                value={registerForm.company_name}
                onChange={(e) => setRegisterForm({ ...registerForm, company_name: e.target.value })}
                className="h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary text-base"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 p-8 pt-6">
            <Button type="submit" size="lg" className="w-full h-12 rounded-xl font-black text-lg shadow-lg shadow-primary/20" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "가입 완료하기"}
            </Button>
            <div className="text-base text-center font-medium text-slate-500">
              이미 계정이 있으신가요? <Link to="/login" className="text-primary font-bold hover:underline ml-1">로그인</Link>
            </div>
          </CardFooter>
        </form>
      </Card>
      
      <p className="mt-8 text-sm text-slate-400 font-medium italic">© 2026 Field Note. All rights reserved.</p>
    </div>
  );
}