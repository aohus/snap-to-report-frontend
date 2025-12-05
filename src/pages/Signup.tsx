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
  const [registerForm, setRegisterForm] = useState({ username: '', password: '', confirmPassword: '' });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerForm.username.length < 6) {
      toast.error('아이디는 최소 6자 이상이어야 합니다');
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다');
      return;
    }

    if (registerForm.password.length < 6) {
      toast.error('비밀번호는 최소 6자 이상이어야 합니다');
      return;
    }

    setIsLoading(true);

    try {
      await AuthService.register(registerForm.username,registerForm.password, registerForm.company_name);
      toast.success('회원가입 성공! 로그인해주세요.');
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
              <Label htmlFor="register-username">아이디</Label>
              <Input
                id="register-username"
                type="text"
                placeholder="아이디 (6자 이상)"
                value={registerForm.username}
                onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                required
                minLength={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-name">회사명(선택)</Label>
              <Input
                id="company-name"
                type="text"
                placeholder="회사명을 입력하세요"
                value={registerForm.company_name}
                onChange={(e) => setRegisterForm({ ...registerForm, company_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-password">비밀번호</Label>
              <Input
                id="register-password"
                type="password"
                placeholder="비밀번호 (6자 이상)"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-confirm-password">비밀번호 확인</Label>
              <Input
                id="register-confirm-password"
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                value={registerForm.confirmPassword}
                onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                required
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