
import React, { useEffect, useState } from 'react';
import { ScanLine, User } from "lucide-react";
import { biya, font, formatNaira } from "./theme";
import { supabase } from "../../../lib/supabase";

export function Landing({ onLaunch, userId }: { onLaunch: (role: "picker" | "student" | "vendor") => void, userId?: string | null }) {
  const [profile, setProfile] = useState<{ name: string, type: "student" | "vendor" } | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    supabase.from("users").select("name, type").eq("id", userId).single().then(({ data }) => {
      if (data && (data as any).name) setProfile(data as any);
    });
  }, [userId]);

  return (
<div className="bg-canvas-white text-charcoal-ink font-body-md antialiased overflow-x-hidden w-full min-h-screen">
      <nav className="sticky top-0 w-full z-50 backdrop-blur-md bg-background/80 border-b border-whisper-border">
<div className="flex justify-between items-center h-20 px-edge-margin-mobile md:px-edge-margin-desktop max-w-container-max mx-auto">
<div className="flex items-center gap-2 md:gap-3">
  <img src="/logo.png" alt="Biya Logo" className="h-8 w-auto object-contain" />
  <span className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg tracking-tighter text-primary font-bold">Biya</span>
</div>
<div className="hidden md:flex gap-12">
<a className="text-secondary font-bold border-b-2 border-secondary font-body-md text-body-md" href="#">Features</a>
<a className="text-on-surface-variant hover:text-primary transition-colors font-body-md text-body-md" href="#">Security</a>
<a className="text-on-surface-variant hover:text-primary transition-colors font-body-md text-body-md" href="#">Campus</a>
</div>
<div className="flex items-center gap-3 md:gap-6">
{profile ? (
  <button onClick={() => onLaunch(profile.type)} className="flex items-center gap-2 bg-surface-container-high px-4 md:px-5 py-2 md:py-2.5 rounded-full hover:bg-surface-variant transition-colors border border-whisper-border">
    <div className="bg-secondary text-on-secondary rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
      {profile.name.charAt(0).toUpperCase()}
    </div>
    <span className="font-body-md font-bold text-sm hidden sm:inline-block">{profile.name.split(' ')[0]}</span>
  </button>
) : (
  <>
    <button className="hidden sm:block text-on-surface-variant hover:opacity-80 transition-opacity font-body-md text-body-md" onClick={() => onLaunch("picker")}>Sign In</button>
    <button className="bg-primary text-on-primary px-5 md:px-8 py-2.5 md:py-3 rounded-full hover:opacity-90 transition-all active:scale-[0.98] font-body-md text-sm md:text-body-md whitespace-nowrap" onClick={() => onLaunch("picker")}>Get Started</button>
  </>
)}
</div>
</div>
</nav>
<main>
<section className="max-w-container-max mx-auto px-edge-margin-mobile md:px-edge-margin-desktop pt-16 md:pt-24 pb-section-gap grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start ">
<div className="lg:col-span-8">
<span className="inline-block px-4 py-1 rounded-full border border-whisper-border text-label-mono font-label-mono uppercase mb-8 tracking-widest text-secondary">Revolutionizing Campus Trade at ABU</span>
<h1 className="font-display-xl text-display-xl text-charcoal-ink leading-none mb-8 font-bold">
  USDT payments for<br />Nigerians. Pay and get<br />settled in Naira.
</h1>
<p className="text-body-md text-on-surface-variant max-w-xl mb-12 text-balance">
                The borderless financial operating system built exclusively for the Nigerian student. Secure, instant, and institutional-grade security for every cafe meal, handout, and peer-to-peer transfer.
            </p>
<div className="flex flex-wrap gap-6">
<button onClick={() => onLaunch("picker")} className="bg-secondary text-on-secondary w-full sm:w-auto px-6 md:px-10 py-4 md:py-5 rounded-premium text-body-md font-bold hover:bg-on-secondary-fixed-variant transition-all hover:scale-[1.02] active:scale-[0.98] whisper-shadow">
                    Start Paying Now
                </button>
<button onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} className="flex justify-center items-center gap-3 w-full sm:w-auto px-6 md:px-10 py-4 md:py-5 rounded-premium border border-whisper-border text-body-md font-bold hover:bg-surface-container transition-all">
<span className="material-symbols-outlined">play_circle</span>
                    How it works
                </button>
</div>
</div>
<div className="hidden lg:block lg:col-span-4 relative h-full">
<div className="absolute inset-0 bg-pure-surface rounded-[40px] flex items-center justify-center p-8 overflow-hidden shadow-sm" style={{ boxShadow: "0 20px 40px -15px rgba(0,0,0,0.05)" }}>
  <div className="rotate-[-5deg] hover:rotate-0 transition-transform duration-500 relative">
    <div className="absolute inset-0 bg-secondary rounded-full blur-[60px] opacity-20 scale-150 -z-10"></div>
    <PhoneMock />
  </div>
</div>
</div>
</section>
<section id="how-it-works" className="bg-surface pt-section-gap pb-section-gap ">
<div className="max-w-container-max mx-auto px-edge-margin-mobile md:px-edge-margin-desktop">
<div className="mb-16 grid grid-cols-1 lg:grid-cols-2 items-end">
<div>
<h2 className="font-headline-lg text-headline-lg mb-4">Financial Autonomy</h2>
<p className="text-on-surface-variant text-body-md">Built for speed on the USDT network, settled in Naira.</p>
</div>
</div>
<div className="grid grid-cols-1 md:grid-cols-4 gap-stack-gap">
<div className="md:col-span-2 bento-card bg-pure-surface rounded-premium p-10 border border-whisper-border whisper-shadow flex flex-col justify-between h-[450px]">
<div>
<div className="w-14 h-14 bg-primary text-on-primary rounded-xl flex items-center justify-center mb-8">
<span className="material-symbols-outlined text-3xl">qr_code_scanner</span>
</div>
<h3 className="text-headline-lg font-headline-lg mb-4">Scan to Pay</h3>
<p className="text-on-surface-variant text-body-md text-balance">Zero friction vendor payments at ABU. Point your camera, enter the Naira amount, and settle in USDT instantly. No cash, no change issues.</p>
</div>
<div className="mt-8 flex gap-2">
<div className="h-1.5 w-12 bg-secondary rounded-full"></div>
<div className="h-1.5 w-4 bg-outline-variant rounded-full"></div>
</div>
</div>
<div className="md:col-span-1 bento-card bg-surface-container-low rounded-premium p-10 border border-whisper-border flex flex-col justify-between h-[450px]">
<div>
<div className="w-14 h-14 bg-secondary text-on-secondary rounded-xl flex items-center justify-center mb-8">
<span className="material-symbols-outlined text-3xl">bolt</span>
</div>
<h3 className="text-headline-lg font-headline-lg mb-4">Instant</h3>
<p className="text-on-surface-variant text-body-md">Move funds across Samaru in under 3 seconds with global USDT rails.</p>
</div>
</div>
<div className="md:col-span-1 bento-card bg-charcoal-ink rounded-premium p-10 flex flex-col justify-between h-[450px]">
<div className="text-white">
<div className="w-14 h-14 bg-white/10 text-white rounded-xl flex items-center justify-center mb-8">
<span className="material-symbols-outlined text-3xl">account_balance</span>
</div>
<h3 className="text-headline-lg font-headline-lg mb-4">Campus Wide</h3>
<p className="text-white/60 text-body-md">Accepted at North &amp; South Gates, and by 500+ registered student vendors.</p>
</div>
</div>
</div>
</div>
</section>
<section className="py-section-gap ">
<div className="max-w-container-max mx-auto px-edge-margin-mobile md:px-edge-margin-desktop space-y-24 md:space-y-32">
<div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
<div className="order-2 md:order-1">
<div className="relative rounded-premium overflow-hidden aspect-video whisper-shadow group">
<img alt="Two confident young African women in a modern outdoor campus setting, reflecting security and financial empowerment." className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSTz8q1Rq_9o2i440YNA4SD3VpsUVSD05V_H-oE6VmfByK7HZYvJSqNqR5_kf8EcEgPOXPohWDX6a44WzRpMS_CQ8_2HUcPP4kb0TK3J2LXOt-_WfjzBB8Rx8-ENb92WIcjglfRkM3L8hwvJSiqRa_hyuEeNFx0akZZnb0PchAtWx4mR36UCrwiXb2nypQV5xNdz4EJIdQPQSUorwkpYKnwKrC3CdyeFpyR5zCThkIZrld5RPvTjiXog" />
<div className="absolute inset-0 bg-primary/10"></div>
</div>
</div>
<div className="order-1 md:order-2">
<span className="text-label-mono font-label-mono text-secondary uppercase tracking-widest mb-4 block">Uncompromising Safety</span>
<h2 className="font-headline-lg text-headline-lg mb-6">Secured by Cleva</h2>
<p className="text-body-md text-on-surface-variant mb-8 text-balance">
                        Your Naira and USDT are protected by world-class infrastructure. Biya leverages Cleva's institutional custody, ensuring your funds are safe and verifiable at all times.
                    </p>
<ul className="space-y-4">
<li className="flex items-center gap-4 text-body-md font-bold">
<span className="material-symbols-outlined text-secondary" style={{"fontVariationSettings":"&quot"}}>verified_user</span>
                            Biometric Confirmation
                        </li>
<li className="flex items-center gap-4 text-body-md font-bold">
<span className="material-symbols-outlined text-secondary" style={{"fontVariationSettings":"&quot"}}>security</span>
                            Real-time Fraud Detection
                        </li>
</ul>
</div>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
<div>
<span className="text-label-mono font-label-mono text-secondary uppercase tracking-widest mb-4 block">Dual-Sided Ecosystem</span>
<h2 className="font-headline-lg text-headline-lg mb-6">For Students &amp; Vendors</h2>
<p className="text-body-md text-on-surface-variant mb-8 text-balance">
                        Whether you're paying for tuition or selling customized hoodies, Biya provides a warm and engaging interface. Students get a beautiful wallet; vendors get a powerful dashboard to settle instantly to local bank accounts.
                    </p>
<div className="flex gap-4">
<div className="flex-1 p-6 rounded-xl bg-surface-container border border-whisper-border">
<p className="font-bold text-primary mb-2">Vendors</p>
<p className="text-on-surface-variant text-sm">Low fees. No daily minimums. Instant bank settlement.</p>
</div>
<div className="flex-1 p-6 rounded-xl bg-surface-container border border-whisper-border">
<p className="font-bold text-primary mb-2">Students</p>
<p className="text-on-surface-variant text-sm">Free P2P. Reward points. Budget analytics.</p>
</div>
</div>
</div>
<div className="relative">
<div className="rounded-premium overflow-hidden aspect-square whisper-shadow">
<img alt="Diverse group of Nigerian university students collaborating on campus" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXBQQZ30kNYewaUDR--GqqHrDe0NKIryLAASN1DZHtBH9uG7iVazcap4A7pAEhgULtsYXuHAdwJb17uhzA5l3tAwzQgdNFJWADWpcGhUllTZ5bZKqJ1cLv4MspZQ_-7Kg0E52_oQEAOga7hxEdEh2CG9pnM5hCf7M9Dyi_FIoiQ6G8EbZkaCIy633OHGXWMtZH_L_BYyTYcnFni3omHEdo94Lauf-CLd7BxYAWgJa3L-A4Ov1GqhGD6w" />
</div>
</div>
</div>
</div>
</section>
<section className="py-section-gap max-w-container-max mx-auto px-edge-margin-mobile md:px-edge-margin-desktop ">
<div className="bg-primary rounded-premium p-8 md:p-24 relative overflow-hidden grid grid-cols-1 md:grid-cols-2 items-center gap-12">
<div className="relative z-10">
<h2 className="font-display-xl text-display-xl text-white mb-8">Ready to join the campus elite?</h2>
<p className="text-white/60 text-body-md mb-12 text-balance">Download Biya today and experience the future of campus trade at ABU. Available on all major platforms.</p>
<div className="flex gap-4">
<button className="bg-white text-primary px-8 py-4 rounded-full font-bold hover:scale-105 transition-transform active:scale-95">App Store</button>
<button className="bg-white/10 text-white border border-white/20 px-8 py-4 rounded-full font-bold hover:bg-white/20 transition-all">Google Play</button>
</div>
</div>
<div className="hidden md:block absolute -right-20 -bottom-20 w-3/4 aspect-square bg-secondary rounded-full blur-[120px] opacity-20"></div>
<div className="hidden md:block relative z-10">
<div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-premium rotate-3 hover:rotate-0 transition-transform duration-500">
<div className="flex justify-between items-center mb-12">
<div className="h-8 w-8 bg-secondary rounded-full"></div>
<div className="text-white/40 text-label-mono uppercase">USDT • NAIRA</div>
</div>
<div className="space-y-4">
<div className="h-1 bg-white/20 w-full"></div>
<div className="h-1 bg-white/20 w-4/5"></div>
<div className="h-1 bg-white/20 w-3/4"></div>
</div>
<div className="mt-12 text-white font-display-xl">₦42,500.00</div>
<div className="text-white/60 text-sm mt-1">≈ 28.70 USDT</div>
</div>
</div>
</div>
</section>
</main>
<footer className="w-full py-10 md:py-16 bg-canvas-white border-t border-whisper-border">
<div className="max-w-container-max mx-auto px-edge-margin-mobile md:px-edge-margin-desktop grid grid-cols-1 md:grid-cols-2 gap-stack-gap items-start">
<div>
<div className="font-headline-lg text-headline-lg text-primary mb-6">Biya</div>
<p className="text-muted-slate max-w-sm mb-8 font-body-md text-body-md">
                Building the financial infrastructure for the next generation of scholars at ABU and beyond.
            </p>
<p className="font-body-md text-body-md text-on-surface-variant">
                © 2024 Biya Financial Technologies. All rights reserved. Built for the modern Nigerian campus.
            </p>
</div>
<div className="grid grid-cols-2 gap-12">
<div className="space-y-4">
<h4 className="font-bold text-primary">Company</h4>
<ul className="space-y-3">
<li className=""><a className="text-muted-slate hover:text-primary transition-colors font-body-md text-body-md" href="#">About Us</a></li>
<li className=""><a className="text-muted-slate hover:text-primary transition-colors font-body-md text-body-md" href="#">Campus Ambassador</a></li>
<li className=""><a className="text-muted-slate hover:text-primary transition-colors font-body-md text-body-md" href="#">Support</a></li>
<li className=""><a className="text-muted-slate hover:text-primary transition-colors font-body-md text-body-md" href="#">Careers</a></li>
</ul>
</div>
<div className="space-y-4">
<h4 className="font-bold text-primary">Legal</h4>
<ul className="space-y-3">
<li className=""><a className="text-muted-slate hover:text-primary transition-colors font-body-md text-body-md" href="#">Privacy Policy</a></li>
<li className=""><a className="text-muted-slate hover:text-primary transition-colors font-body-md text-body-md" href="#">Terms of Service</a></li>
<li className=""><a className="text-muted-slate hover:text-primary transition-colors font-body-md text-body-md" href="#">Cookie Policy</a></li>
<li className=""><a className="text-muted-slate hover:text-primary transition-colors font-body-md text-body-md" href="#">Security FAQ</a></li>
</ul>
</div>
</div>
</div>
</footer>
        </div>
  );
}

function PhoneMock() {
  return (
    <div className="relative rounded-[42px] p-3" style={{ width: 280, backgroundColor: biya.ink, boxShadow: "0px 40px 80px rgba(0,0,0,0.25)" }}>
      <div className="rounded-[32px] overflow-hidden" style={{ backgroundColor: biya.cream }}>
        <div className="p-6" style={{ background: "linear-gradient(135deg, #000218 0%, #141b3c 100%)" }}>
          <p style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: "1px", color: "rgba(190,196,238,0.9)" }}>BALANCE</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span style={{ fontFamily: font.serif, fontSize: 30, color: biya.peach }}>₦</span>
            <span style={{ fontFamily: font.display, fontWeight: 800, fontSize: 36, color: "#fff", letterSpacing: "-0.03em" }}>{formatNaira(42500)}</span>
          </div>
          <p style={{ fontFamily: font.mono, fontSize: 12, color: biya.greenSoft }}>≈ 28.70 USDT · estimate</p>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-3 rounded-3xl px-5 py-4" style={{ backgroundColor: biya.marigold }}>
            <span className="flex items-center justify-center rounded-full" style={{ width: 40, height: 40, backgroundColor: biya.ink }}>
              <ScanLine size={20} color={biya.marigold} />
            </span>
            <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 17, color: biya.goldDeep }}>Scan to Biya</span>
          </div>
          <div className="mt-5 flex flex-col gap-3">
            {[["Iya Basira Food", 1200], ["Campus Print", 500]].map(([n, a]) => (
              <div key={n as string} className="flex items-center justify-between">
                <span style={{ fontFamily: font.display, fontSize: 14, color: biya.ink }}>{n as string}</span>
                <span style={{ fontFamily: font.mono, fontSize: 14, color: biya.gray }}>- ₦{formatNaira(a as number)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}