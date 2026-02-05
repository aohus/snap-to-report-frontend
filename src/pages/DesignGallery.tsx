import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DesignGallery() {
  return (
    <div className="container mx-auto py-12 px-4 space-y-24">
      <header className="space-y-4 border-b pb-8">
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Design System Gallery</h1>
        <p className="text-lg text-slate-500 max-w-2xl">
          새로운 'Clean & Professional' 디자인 시스템의 핵심 요소와 컴포넌트 스타일을 검증하기 위한 갤러리입니다.
        </p>
      </header>

      {/* --- Typography Section --- */}
      <section id="typography" className="space-y-8">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-black m-0">Typography</h2>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Typography Scale</CardTitle>
            <CardDescription>가독성과 정보 계층 구조를 위한 텍스트 스타일</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-2">
              <Label className="text-xs text-slate-400 uppercase font-black tracking-widest">Heading 1</Label>
              <h1 className="m-0 italic">The quick brown fox jumps over the lazy dog</h1>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-slate-400 uppercase font-black tracking-widest">Heading 2</Label>
              <h2 className="m-0">The quick brown fox jumps over the lazy dog</h2>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-slate-400 uppercase font-black tracking-widest">Heading 3</Label>
              <h3 className="m-0">The quick brown fox jumps over the lazy dog</h3>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-slate-400 uppercase font-black tracking-widest">Body Text (Base)</Label>
              <p className="m-0 text-base">
                전문가용 도구로서의 신뢰감을 주는 폰트 세팅입니다. 
                Pretendard와 Inter의 조합으로 가독성을 높였습니다. 
                줄 간격(Line-height)은 1.6을 기준으로 하여 텍스트가 밀집되어 있어도 피로도를 낮춥니다.
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-slate-400 uppercase font-black tracking-widest">Caption / Small</Label>
              <p className="m-0 text-sm text-slate-500 font-medium italic">
                * 보조 설명이나 데이터 캡션에 사용되는 스타일입니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* --- Colors Section --- */}
      <section id="colors" className="space-y-8">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-black m-0">Colors</h2>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Primary Palette (Professional Navy)</CardTitle>
              <CardDescription>브랜드 정체성과 신뢰감을 형성하는 핵심 컬러</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-5 gap-2">
              {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((step) => (
                <div key={step} className="space-y-1 text-center">
                  <div className={`h-12 w-full rounded-md shadow-inner bg-primary-${step}`} 
                       style={{ backgroundColor: `var(--primary-${step}, hsl(var(--primary)))` }} />
                  <span className="text-[10px] font-bold text-slate-500">{step}</span>
                </div>
              ))}
              <div className="col-span-5 mt-4 p-4 bg-primary text-primary-foreground rounded-lg font-black text-center shadow-lg">
                Default Primary
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Surface Hierarchy</CardTitle>
              <CardDescription>화면의 깊이(Depth)와 영역 구분을 위한 배경색</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
                <span className="text-sm font-black">Surface 1 (Base / Card)</span>
              </div>
              <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm">
                <span className="text-sm font-black">Surface 2 (Sidebar / Section)</span>
              </div>
              <div className="p-6 rounded-xl border border-slate-200 bg-slate-100/50 shadow-sm">
                <span className="text-sm font-black">Surface 3 (Muted / App Background)</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* --- Surfaces & Shadows Section --- */}
      <section id="surfaces" className="space-y-8">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-black m-0">Surfaces & Shadows</h2>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <Label className="font-black uppercase tracking-widest text-slate-400 text-[10px]">Professional Shadow</Label>
            <Card className="shadow-professional border-slate-200/60 transition-transform hover:-translate-y-1">
              <CardHeader><CardTitle className="text-lg">Low Elevation</CardTitle></CardHeader>
              <CardContent className="text-sm italic">기본 카드 및 리스트 아이템</CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Label className="font-black uppercase tracking-widest text-slate-400 text-[10px]">Emphasis Shadow</Label>
            <Card className="shadow-emphasis border-slate-200/60 transition-transform hover:-translate-y-1">
              <CardHeader><CardTitle className="text-lg">Medium Elevation</CardTitle></CardHeader>
              <CardContent className="text-sm italic">호버 상태 또는 강조 영역</CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Label className="font-black uppercase tracking-widest text-slate-400 text-[10px]">Elevated Shadow</Label>
            <Card className="shadow-elevated border-slate-200/60 transition-transform hover:-translate-y-1">
              <CardHeader><CardTitle className="text-lg">High Elevation</CardTitle></CardHeader>
              <CardContent className="text-sm italic">모달, 드롭다운, 부유 버튼</CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* --- Components Section --- */}
      <section id="components" className="space-y-8">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-black m-0">Components</h2>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Base Components Standards</CardTitle>
            <CardDescription>표준화된 UI 원자 요소들</CardDescription>
          </CardHeader>
          <CardContent className="space-y-12">
            <div className="space-y-4">
              <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Buttons</Label>
              <div className="flex flex-wrap gap-4">
                <Button variant="default">Primary Action</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Input Fields (Compact)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="standard">Standard Input</Label>
                  <Input id="standard" placeholder="Enter text..." className="h-9 shadow-sm" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="error" className="text-destructive">Error State</Label>
                  <Input id="error" placeholder="Invalid input" className="h-9 border-destructive ring-destructive shadow-sm" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Status Badges</Label>
              <div className="flex flex-wrap gap-3">
                <Badge variant="default" className="rounded-full px-3 py-0.5">Active</Badge>
                <Badge variant="secondary" className="rounded-full px-3 py-0.5">Pending</Badge>
                <Badge variant="outline" className="rounded-full px-3 py-0.5 border-emerald-500 text-emerald-600 bg-emerald-50/50">Completed</Badge>
                <Badge variant="destructive" className="rounded-full px-3 py-0.5">Alert</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
