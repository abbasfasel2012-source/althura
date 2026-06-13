import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/AppShell";
import { MapPin, Phone, Send } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "الذرى الذكية | تواصل" },
      { name: "description", content: "تواصل مع إدارة ثانوية الذرى الذكية للمتميزين." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <AppShell title="تواصل معنا">
      <div className="animate-reveal mb-5">
        <div className="text-[11px] tracking-[0.2em] text-primary font-bold uppercase mb-1">
          نحن هنا لخدمتكم
        </div>
        <h1 className="text-2xl font-bold">إدارة الذرى الذكية</h1>
        <p className="text-sm text-muted-foreground mt-1">
          كربلاء المقدسة، العراق
        </p>
      </div>

      <div className="space-y-3">
        <Card>
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl bg-primary/10 text-primary grid place-items-center">
              <Phone className="size-5" />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">الهاتف</div>
              <div className="font-mono font-bold" dir="ltr">+964 786 982 3660</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl bg-accent/10 text-accent grid place-items-center">
              <Send className="size-5" />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">تيليجرام</div>
              <div className="font-mono font-bold">@abosy5</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl bg-primary/10 text-primary grid place-items-center">
              <MapPin className="size-5" />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">الموقع</div>
              <div className="font-bold">كربلاء المقدسة — العراق</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6 aspect-video rounded-3xl glass overflow-hidden grid place-items-center">
        <div className="text-center">
          <MapPin className="size-8 text-primary mx-auto mb-2" />
          <div className="text-sm font-bold">خريطة المدرسة</div>
          <div className="text-[11px] text-muted-foreground">كربلاء المقدسة</div>
        </div>
      </div>
    </AppShell>
  );
}
