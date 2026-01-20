import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { AuthService } from '@/lib/auth';
import { Plan, Subscription } from '@/types';
import { Loader2, ArrowLeft, CreditCard, User, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ username: string; user_id: string; created_at: string } | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Payment Dialog State
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const userData = await AuthService.getCurrentUser();
      setUser(userData);

      const plansData = await api.getPlans();
      setPlans(plansData);

      try {
        const subData = await api.getMySubscription();
        setSubscription(subData);
      } catch (e) {
        // 404 means no subscription, which is fine
        setSubscription(null);
      }
    } catch (error) {
      console.error(error);
      toast.error('정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribeClick = (plan: Plan) => {
    setSelectedPlan(plan);
    setPaymentDialogOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedPlan) return;
    setProcessing(true);
    try {
      // Mock payment - using a dummy token
      await api.subscribe(selectedPlan.id, 'tok_mock_payment');
      toast.success(`${selectedPlan.name} 구독이 완료되었습니다.`);
      setPaymentDialogOpen(false);
      loadData(); // Reload to update subscription status
    } catch (error) {
      console.error(error);
      toast.error('결제 처리에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('정말로 구독을 취소하시겠습니까? 다음 결제일부터 적용됩니다.')) return;
    setProcessing(true);
    try {
      await api.cancelSubscription();
      toast.success('구독이 취소되었습니다.');
      loadData();
    } catch (error) {
      console.error(error);
      toast.error('구독 취소에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Button>
        <h1 className="text-xl font-bold text-gray-900">내 정보 & 구독 관리</h1>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        {/* User Profile Section */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-100 rounded-full">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">기본 정보</h2>
              <p className="text-gray-500">계정 정보를 확인하세요.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500">사용자명</label>
              <div className="text-lg font-medium">{user?.username}</div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500">가입일</label>
              <div className="text-lg font-medium">
                {user?.created_at ? format(new Date(user.created_at), 'yyyy년 MM월 dd일') : '-'}
              </div>
            </div>
          </div>
        </section>

        {/* Subscription Section */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-green-100 rounded-full">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">구독 상태</h2>
              <p className="text-gray-500">현재 이용 중인 플랜을 관리하세요.</p>
            </div>
          </div>

          {subscription ? (
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-blue-700">
                      {plans.find(p => p.id === subscription.plan_id)?.name || subscription.plan_id}
                    </h3>
                    <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                      {subscription.status === 'active' ? '이용 중' : subscription.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    다음 결제일: {format(new Date(subscription.current_period_end), 'yyyy년 MM월 dd일')}
                    {!subscription.auto_renew && <span className="text-red-500 ml-2">(해지 예약됨)</span>}
                  </p>
                </div>
                {subscription.auto_renew && (
                  <Button variant="outline" onClick={handleCancelSubscription} disabled={processing} className="text-red-600 hover:bg-red-50 border-red-200">
                    {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    구독 해지
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">현재 이용 중인 구독 상품이 없습니다.</p>
            </div>
          )}
        </section>

        {/* Plans Section */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-6">요금제 선택</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className={`relative flex flex-col ${subscription?.plan_id === plan.id ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50' : ''}`}>
                <CardHeader>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.currency.toUpperCase()} {plan.price.toLocaleString()} / 월</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-2 text-sm text-gray-600">
                    {plan.limits && Object.entries(plan.limits).map(([key, val]) => (
                       <li key={key} className="flex items-center gap-2">
                         <Check className="w-4 h-4 text-green-500" />
                         {key}: {val}
                       </li>
                    ))}
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      모든 기능 무제한 접근
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    variant={subscription?.plan_id === plan.id ? "outline" : "default"}
                    disabled={subscription?.plan_id === plan.id || processing}
                    onClick={() => handleSubscribeClick(plan)}
                  >
                    {subscription?.plan_id === plan.id ? "현재 이용 중" : "구독하기"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* Payment Mock Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>결제 확인 (Mock)</DialogTitle>
            <DialogDescription>
              이것은 테스트 결제입니다. 실제 비용이 청구되지 않습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
             <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <p className="font-bold text-gray-700">상품명: {selectedPlan?.name}</p>
                <p className="text-gray-600">가격: {selectedPlan?.currency.toUpperCase()} {selectedPlan?.price.toLocaleString()}</p>
             </div>
             <p className="text-sm text-gray-500">
               '결제하기' 버튼을 누르면 테스트 카드로 결제가 진행됩니다.
             </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>취소</Button>
            <Button onClick={handleConfirmPayment} disabled={processing}>
              {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              결제하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
