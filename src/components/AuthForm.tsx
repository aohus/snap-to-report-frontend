import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuthService } from '@/lib/auth';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface AuthFormProps {
  onSuccess: () => void;
}

const loginSchema = z.object({
  username: z.string().min(1, '사용자명을 입력하세요'),
  password: z.string().min(1, '비밀번호를 입력하세요'),
});

const registerSchema = z.object({
  username: z.string().min(3, '사용자명은 최소 3자 이상이어야 합니다'),
  email: z.string().email('유효한 이메일 주소를 입력하세요'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export default function AuthForm({ onSuccess }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const { register: registerLogin, handleSubmit: handleSubmitLogin, formState: { errors: loginErrors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const { register: registerSignup, handleSubmit: handleSubmitSignup, reset: resetSignup, formState: { errors: registerErrors } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: '', email: '', password: '', confirmPassword: '' },
  });

  const onLogin = async (data: LoginValues) => {
    setIsLoading(true);
    try {
      await AuthService.login(data.username, data.password);
      toast.success('로그인 성공!');
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '로그인 실패');
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (data: RegisterValues) => {
    setIsLoading(true);
    try {
      await AuthService.register(data.username, data.email, data.password);
      toast.success('회원가입 성공! 로그인해주세요.');
      resetSignup();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '회원가입 실패');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">입찰 정보 시스템</CardTitle>
          <CardDescription className="text-center">로그인 또는 회원가입하여 시작하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">로그인</TabsTrigger>
              <TabsTrigger value="register">회원가입</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleSubmitLogin(onLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">사용자명</Label>
                  <Input
                    id="login-username"
                    type="text"
                    placeholder="사용자명을 입력하세요"
                    {...registerLogin('username')}
                  />
                  {loginErrors.username && <p className="text-sm text-red-500">{loginErrors.username.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">비밀번호</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="비밀번호를 입력하세요"
                    {...registerLogin('password')}
                  />
                  {loginErrors.password && <p className="text-sm text-red-500">{loginErrors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? '로그인 중...' : '로그인'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleSubmitSignup(onRegister)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-username">사용자명</Label>
                  <Input
                    id="register-username"
                    type="text"
                    placeholder="사용자명 (3자 이상)"
                    {...registerSignup('username')}
                  />
                  {registerErrors.username && <p className="text-sm text-red-500">{registerErrors.username.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">이메일</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="이메일을 입력하세요"
                    {...registerSignup('email')}
                  />
                  {registerErrors.email && <p className="text-sm text-red-500">{registerErrors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">비밀번호</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="비밀번호 (6자 이상)"
                    {...registerSignup('password')}
                  />
                  {registerErrors.password && <p className="text-sm text-red-500">{registerErrors.password.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-confirm-password">비밀번호 확인</Label>
                  <Input
                    id="register-confirm-password"
                    type="password"
                    placeholder="비밀번호를 다시 입력하세요"
                    {...registerSignup('confirmPassword')}
                  />
                  {registerErrors.confirmPassword && <p className="text-sm text-red-500">{registerErrors.confirmPassword.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? '가입 중...' : '회원가입'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}