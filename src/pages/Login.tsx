import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthService } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { LayoutGrid, Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await AuthService.login(loginForm.username, loginForm.password);
        navigate('/');
        // onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '로그인 실패');
    } finally {
      setIsLoading(false);
    }
  };

    return (

      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">

        <div className="mb-8 text-center">

          <div className="inline-flex p-3 bg-primary rounded-2xl shadow-xl shadow-primary/20 mb-4">

            <LayoutGrid className="w-8 h-8 text-primary-foreground" />

          </div>

          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Field Note</h1>

          <p className="text-slate-500 font-medium mt-2">전문가를 위한 현장 사진 관리 도구</p>

        </div>

  

        <Card className="w-full max-w-md border-none shadow-professional bg-white rounded-3xl overflow-hidden">

          <CardHeader className="pt-8 pb-4 px-8">

            <CardTitle className="text-2xl font-black text-slate-900">로그인</CardTitle>

            <CardDescription className="text-slate-500 font-medium text-base">현장 관리의 시작, 필드노트입니다.</CardDescription>

          </CardHeader>

          <form onSubmit={handleLogin}>

            <CardContent className="space-y-5 px-8">

              <div className="space-y-2">

                <Label htmlFor="login-username" className="text-sm font-bold text-slate-700 ml-1">아이디</Label>

                <Input

                  id="login-username"

                  type="text"

                  placeholder="아이디를 입력하세요"

                  className="h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary text-base"

                  value={loginForm.username}

                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}

                  required

                />

              </div>

              <div className="space-y-2">

                <Label htmlFor="login-password" className="text-sm font-bold text-slate-700 ml-1">비밀번호</Label>

                <Input

                  id="login-password"

                  type="password"

                  placeholder="비밀번호를 입력하세요"

                  className="h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary text-base"

                  value={loginForm.password}

                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}

                  required

                />

              </div>

            </CardContent>

            <CardFooter className="flex flex-col space-y-4 p-8 pt-6">

              <Button type="submit" size="lg" className="w-full h-12 rounded-xl font-black text-lg shadow-lg shadow-primary/20" disabled={isLoading}>

                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "로그인하기"}

              </Button>

              <div className="text-base text-center font-medium text-slate-500">

                아직 계정이 없으신가요? <Link to="/signup" className="text-primary font-bold hover:underline ml-1">회원가입</Link>

              </div>

            </CardFooter>

          </form>

        </Card>

        

        <p className="mt-8 text-sm text-slate-400 font-medium italic">© 2026 Field Note. All rights reserved.</p>

      </div>

    );

  }

  