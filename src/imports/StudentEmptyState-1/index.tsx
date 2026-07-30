import svgPaths from "./svg-0notctm5px";
import imgAb6AXuDj9EuoEiupe8DK9TZr410VTq0QmZpVqrQzVrDn8Jy5WidrSqSmMipYyKeNi912La8HhBMnkJmuFuA3N5IBkNeaZdRf4IDuKah9T1WbZCqC2Ck0W0MTlBis4QMkUj9ZaQkj33F4RdURn61VqUaDs2BPkceq8WmyCYawxoOsaAiOc5NEnxAsJEk3MZgm6FBdPWeme9ZrCgbYnbO4ISzpJYnW9GUeTjqAe0PeWfaQvdc8M5W14QLdE4Q from "./ce79c60f9acf49941bd0c40b317c1ca8de54f158.png";

function Container() {
  return (
    <div className="h-[18px] relative shrink-0 w-[16px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="18" preserveAspectRatio="none" viewBox="0 0 16 18" width="16">
        <g id="Container">
          <path d={svgPaths.p1820480} fill="var(--fill-0, #835500)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Margin() {
  return (
    <div className="content-stretch flex flex-col items-start pt-[4px] relative shrink-0" data-name="Margin">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#835500] text-[12px] tracking-[0.6px] whitespace-nowrap">
        <p className="leading-[12px]">Home</p>
      </div>
    </div>
  );
}

function LinkHomeActive() {
  return (
    <div className="bg-[rgba(254,174,44,0.1)] content-stretch flex flex-col items-center justify-center px-[16px] py-[8px] relative rounded-[12px] shrink-0" data-name="Link - Home (Active)">
      <Container />
      <Margin />
    </div>
  );
}

function Container1() {
  return (
    <div className="h-[18px] relative shrink-0 w-[19px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="18" preserveAspectRatio="none" viewBox="0 0 19 18" width="19">
        <g id="Container">
          <path d={svgPaths.p53fc80} fill="var(--fill-0, #76767F)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Margin1() {
  return (
    <div className="content-stretch flex flex-col items-start pt-[4px] relative shrink-0" data-name="Margin">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#76767f] text-[12px] tracking-[0.6px] whitespace-nowrap">
        <p className="leading-[12px]">Pay</p>
      </div>
    </div>
  );
}

function LinkPay() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center px-[16px] py-[8px] relative shrink-0" data-name="Link - Pay">
      <Container1 />
      <Margin1 />
    </div>
  );
}

function Container2() {
  return (
    <div className="h-[20px] relative shrink-0 w-[18px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="20" preserveAspectRatio="none" viewBox="0 0 18 20" width="18">
        <g id="Container">
          <path d={svgPaths.p396ca1c0} fill="var(--fill-0, #76767F)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Margin2() {
  return (
    <div className="content-stretch flex flex-col items-start pt-[4px] relative shrink-0" data-name="Margin">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#76767f] text-[12px] tracking-[0.6px] whitespace-nowrap">
        <p className="leading-[12px]">History</p>
      </div>
    </div>
  );
}

function LinkHistory() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center px-[16px] py-[8px] relative shrink-0" data-name="Link - History">
      <Container2 />
      <Margin2 />
    </div>
  );
}

function Container3() {
  return (
    <div className="h-[16px] relative shrink-0 w-[20px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="16" preserveAspectRatio="none" viewBox="0 0 20 16" width="20">
        <g id="Container">
          <path d={svgPaths.p25774b00} fill="var(--fill-0, #76767F)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Margin3() {
  return (
    <div className="content-stretch flex flex-col items-start pt-[4px] relative shrink-0" data-name="Margin">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#76767f] text-[12px] tracking-[0.6px] whitespace-nowrap">
        <p className="leading-[12px]">Cards</p>
      </div>
    </div>
  );
}

function LinkCards() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center px-[16px] py-[8px] relative shrink-0" data-name="Link - Cards">
      <Container3 />
      <Margin3 />
    </div>
  );
}

function BottomNavigationBar() {
  return (
    <div className="absolute bg-white bottom-[-0.28px] content-stretch drop-shadow-[0px_-4px_20px_rgba(0,0,0,0.04)] flex gap-[20.3px] items-center left-0 pb-[24px] pt-[8px] px-[26.14px] rounded-tl-[12px] rounded-tr-[12px] w-[390px] z-[3]" data-name="Bottom Navigation Bar">
      <LinkHomeActive />
      <LinkPay />
      <LinkHistory />
      <LinkCards />
    </div>
  );
}

function Ab6AXuDj9EuoEiupe8DK9TZr410VTq0QmZpVqrQzVrDn8Jy5WidrSqSmMipYyKeNi912La8HhBMnkJmuFuA3N5IBkNeaZdRf4IDuKah9T1WbZCqC2Ck0W0MTlBis4QMkUj9ZaQkj33F4RdURn61VqUaDs2BPkceq8WmyCYawxoOsaAiOc5NEnxAsJEk3MZgm6FBdPWeme9ZrCgbYnbO4ISzpJYnW9GUeTjqAe0PeWfaQvdc8M5W14QLdE4Q() {
  return (
    <div className="flex-[1_0_0] h-full min-w-px relative" data-name="AB6AXuDJ9euoEIUPE8dK9TZr410VTq0Qm-zpVQRQzVrDN8JY5WidrSqSmMipYYKeNI912LA8HhBMnkJmuFuA3n5iBkNEAZdRf4IDuKAH9t1wbZCqC2Ck0w0MTlBIS4qMkUJ9zaQkj33f4RdURn61VQUaDs2bPKCEQ8wmyCYawxoOSAAiOC5NEnxAsJ-ek3mZGM6fBdPWeme9zrCgbYnbO4ISzpJYnW9GUeTJQAe0peWfaQVDC_8m5W14qLdE4Q">
      <div className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgAb6AXuDj9EuoEiupe8DK9TZr410VTq0QmZpVqrQzVrDn8Jy5WidrSqSmMipYyKeNi912La8HhBMnkJmuFuA3N5IBkNeaZdRf4IDuKah9T1WbZCqC2Ck0W0MTlBis4QMkUj9ZaQkj33F4RdURn61VqUaDs2BPkceq8WmyCYawxoOsaAiOc5NEnxAsJEk3MZgm6FBdPWeme9ZrCgbYnbO4ISzpJYnW9GUeTjqAe0PeWfaQvdc8M5W14QLdE4Q} />
      </div>
    </div>
  );
}

function BackgroundBorder() {
  return (
    <div className="bg-[#ffddb4] relative rounded-[9999px] shrink-0 size-[40px]" data-name="Background+Border">
      <div className="content-stretch flex items-center justify-center overflow-clip p-px relative rounded-[inherit] size-full">
        <Ab6AXuDj9EuoEiupe8DK9TZr410VTq0QmZpVqrQzVrDn8Jy5WidrSqSmMipYyKeNi912La8HhBMnkJmuFuA3N5IBkNeaZdRf4IDuKah9T1WbZCqC2Ck0W0MTlBis4QMkUj9ZaQkj33F4RdURn61VqUaDs2BPkceq8WmyCYawxoOsaAiOc5NEnxAsJEk3MZgm6FBdPWeme9ZrCgbYnbO4ISzpJYnW9GUeTjqAe0PeWfaQvdc8M5W14QLdE4Q />
      </div>
      <div aria-hidden className="absolute border border-[rgba(20,27,60,0.1)] border-solid inset-0 pointer-events-none rounded-[9999px]" />
    </div>
  );
}

function Container5() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Outfit:Regular',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#835500] text-[28px] whitespace-nowrap">
        <p className="leading-[33.6px]">Biya</p>
      </div>
    </div>
  );
}

function Container4() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-name="Container">
      <BackgroundBorder />
      <Container5 />
    </div>
  );
}

function Container6() {
  return (
    <div className="h-[20px] relative shrink-0 w-[16px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="20" preserveAspectRatio="none" viewBox="0 0 16 20" width="16">
        <g id="Container">
          <path d={svgPaths.p164b49c0} fill="var(--fill-0, #000218)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Button() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 size-[48px]" data-name="Button">
      <Container6 />
    </div>
  );
}

function HeaderTopAppBar() {
  return (
    <div className="bg-[#fbf9f6] relative shrink-0 w-full z-[2]" data-name="Header - Top App Bar">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between px-[24px] py-[16px] relative size-full">
          <Container4 />
          <Button />
        </div>
      </div>
    </div>
  );
}

function Container7() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#76767f] text-[12px] tracking-[1.2px] uppercase w-full">
        <p className="leading-[12px]">WELCOME BACK</p>
      </div>
    </div>
  );
}

function Heading() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 1">
      <div className="[word-break:break-word] flex flex-col font-['Outfit:Regular',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#000218] text-[28px] w-full">
        <p className="leading-[33.6px]">Ibrahim Sani</p>
      </div>
    </div>
  );
}

function WelcomeSection() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full" data-name="Welcome Section">
      <Container7 />
      <Heading />
    </div>
  );
}

function Container9() {
  return (
    <div className="content-stretch flex flex-col items-start opacity-80 relative shrink-0 w-full" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#7d83aa] text-[12px] tracking-[0.6px] w-full">
        <p className="leading-[12px]">AVAILABLE BALANCE</p>
      </div>
    </div>
  );
}

function Paragraph() {
  return (
    <div className="[word-break:break-word] content-stretch flex gap-[4px] items-baseline leading-[0] relative shrink-0 w-full whitespace-nowrap" data-name="Paragraph">
      <div className="flex flex-col font-['Liberation_Serif:Bold',sans-serif] justify-center not-italic relative shrink-0 text-[#ffddb4] text-[32px] tracking-[-0.32px]">
        <p className="leading-[38.4px]">₦</p>
      </div>
      <div className="flex flex-col font-['JetBrains_Mono:Bold',sans-serif] font-extrabold justify-center relative shrink-0 text-[48px] text-white tracking-[-1.2px]">
        <p className="leading-[52.8px]">0.00</p>
      </div>
    </div>
  );
}

function Container11() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="20" preserveAspectRatio="none" viewBox="0 0 20 20" width="20">
        <g id="Container">
          <path d={svgPaths.p35b5ef0} fill="var(--fill-0, #6B4500)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Button1() {
  return (
    <div className="bg-[#feae2c] flex-[1_0_0] h-[48px] min-w-px relative rounded-[9999px]" data-name="Button">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex gap-[8px] items-center justify-center px-[24px] relative size-full">
          <Container11 />
          <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#6b4500] text-[12px] text-center tracking-[0.6px] whitespace-nowrap">
            <p className="leading-[12px]">ADD FUNDS</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Container12() {
  return (
    <div className="h-[16px] relative shrink-0 w-[19px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="16" preserveAspectRatio="none" viewBox="0 0 19 16" width="19">
        <g id="Container">
          <path d={svgPaths.pb36e280} fill="var(--fill-0, white)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Button2() {
  return (
    <div className="bg-[rgba(255,255,255,0.1)] content-stretch flex items-center justify-center p-px relative rounded-[9999px] shrink-0 size-[48px]" data-name="Button">
      <div aria-hidden className="absolute border border-[rgba(255,255,255,0.1)] border-solid inset-0 pointer-events-none rounded-[9999px]" />
      <Container12 />
    </div>
  );
}

function Container10() {
  return (
    <div className="content-stretch flex gap-[12px] items-start pt-[24px] relative shrink-0 w-full" data-name="Container">
      <Button1 />
      <Button2 />
    </div>
  );
}

function Container8() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[7.9px] items-start relative size-full">
        <Container9 />
        <Paragraph />
        <Container10 />
      </div>
    </div>
  );
}

function SectionBalanceCardPrimaryAnchor() {
  return (
    <div className="relative rounded-[40px] shrink-0 w-full" style={{ backgroundImage: "linear-gradient(134.774deg, rgb(0, 2, 24) 0%, rgb(20, 27, 60) 100%)" }} data-name="Section - Balance Card (Primary Anchor)">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col items-start p-[33px] relative size-full">
          <div className="absolute bg-[rgba(131,85,0,0.2)] blur-[30px] right-[-47px] rounded-[9999px] size-[192px] top-[-47px]" data-name="Abstract Atmospheric Background Element" />
          <Container8 />
        </div>
      </div>
      <div aria-hidden className="absolute border border-[rgba(20,27,60,0.05)] border-solid inset-0 pointer-events-none rounded-[40px] shadow-[0px_4px_40px_0px_rgba(0,0,0,0.04)]" />
    </div>
  );
}

function Container13() {
  return (
    <div className="h-[22.5px] relative shrink-0 w-full" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="22.5" preserveAspectRatio="none" viewBox="0 0 172.667 22.5" width="172.667">
        <g id="Container">
          <path d={svgPaths.p36063280} fill="var(--fill-0, #835500)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Heading2() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 3">
      <div className="[word-break:break-word] flex flex-col font-['Outfit:Regular',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#000218] text-[18px] w-full">
        <p className="leading-[29.7px]">School Fees</p>
      </div>
    </div>
  );
}

function Container15() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Outfit:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#76767f] text-[14px] w-full">
        <p className="leading-[22.4px]">Pay ABU tuition directly</p>
      </div>
    </div>
  );
}

function Container14() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Heading2 />
        <Container15 />
      </div>
    </div>
  );
}

function BackgroundBorderShadow() {
  return (
    <div className="bg-white col-[1/span_2] drop-shadow-[0px_4px_20px_rgba(0,0,0,0.04)] justify-self-stretch min-h-[160px] relative rounded-[40px] row-1 self-start shrink-0" data-name="Background+Border+Shadow">
      <div aria-hidden className="absolute border border-[rgba(20,27,60,0.05)] border-solid inset-0 pointer-events-none rounded-[40px]" />
      <div className="content-stretch flex flex-col items-start justify-between min-h-[inherit] p-[25px] relative size-full">
        <Container13 />
        <Container14 />
      </div>
    </div>
  );
}

function Container16() {
  return (
    <div className="h-[20px] relative shrink-0 w-[16px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="20" preserveAspectRatio="none" viewBox="0 0 16 20" width="16">
        <g id="Container">
          <path d={svgPaths.p12df5c00} fill="var(--fill-0, #00210F)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Background() {
  return (
    <div className="bg-[#82fab0] relative rounded-[9999px] shrink-0 size-[48px]" data-name="Background">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Container16 />
      </div>
    </div>
  );
}

function Container17() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#000218] text-[12px] tracking-[0.6px] whitespace-nowrap">
          <p className="leading-[12px]">BILLS</p>
        </div>
      </div>
    </div>
  );
}

function BackgroundBorderShadow1() {
  return (
    <div className="bg-white col-3 drop-shadow-[0px_4px_20px_rgba(0,0,0,0.04)] justify-self-stretch relative rounded-[40px] row-1 self-start shrink-0" data-name="Background+Border+Shadow">
      <div aria-hidden className="absolute border border-[rgba(20,27,60,0.05)] border-solid inset-0 pointer-events-none rounded-[40px]" />
      <div className="flex flex-col items-center justify-center size-full">
        <div className="content-stretch flex flex-col gap-[16px] items-center justify-center px-[25px] py-[42px] relative size-full">
          <Background />
          <Container17 />
        </div>
      </div>
    </div>
  );
}

function SectionAsymmetricBentoGridForQuickActions() {
  return (
    <div className="gap-x-[16px] gap-y-[16px] grid grid-cols-[repeat(3,minmax(0,1fr))] grid-rows-[_160px] relative shrink-0 w-full" data-name="Section - Asymmetric Bento Grid for Quick Actions">
      <BackgroundBorderShadow />
      <BackgroundBorderShadow1 />
    </div>
  );
}

function Heading1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Heading 2">
      <div className="[word-break:break-word] flex flex-col font-['Outfit:Regular',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#000218] text-[18px] whitespace-nowrap">
        <p className="leading-[29.7px]">Recent Activity</p>
      </div>
    </div>
  );
}

function Button3() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative shrink-0" data-name="Button">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#835500] text-[12px] text-center tracking-[0.6px] whitespace-nowrap">
        <p className="leading-[12px]">VIEW ALL</p>
      </div>
    </div>
  );
}

function Container18() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Heading1 />
      <Button3 />
    </div>
  );
}

function Container20() {
  return (
    <div className="h-[30px] relative shrink-0 w-[27px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="30" preserveAspectRatio="none" viewBox="0 0 27 30" width="27">
        <g id="Container">
          <path d={svgPaths.pc7d3680} fill="var(--fill-0, #76767F)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Container21() {
  return (
    <div className="relative shrink-0 size-[10.5px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="10.5" preserveAspectRatio="none" viewBox="0 0 10.5 10.5" width="10.5">
        <g id="Container">
          <path d={svgPaths.p210dd580} fill="var(--fill-0, #76767F)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function BackgroundBorder1() {
  return (
    <div className="absolute bg-[#fbf9f6] bottom-[-4px] content-stretch flex items-center justify-center p-[2px] right-[-4px] rounded-[9999px] size-[32px]" data-name="Background+Border">
      <div aria-hidden className="absolute border-2 border-solid border-white inset-0 pointer-events-none rounded-[9999px]" />
      <Container21 />
    </div>
  );
}

function Background1() {
  return (
    <div className="bg-[#e4e2df] content-stretch flex flex-[1_0_0] items-center justify-center min-h-px relative rounded-[9999px] w-full" data-name="Background">
      <Container20 />
      <BackgroundBorder1 />
    </div>
  );
}

function Container19() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center opacity-40 relative shrink-0 size-[96px]" data-name="Container">
      <Background1 />
    </div>
  );
}

function Margin4() {
  return (
    <div className="absolute content-stretch flex flex-col h-[120px] items-start left-[123px] pb-[24px] top-[50px] w-[96px]" data-name="Margin">
      <Container19 />
    </div>
  );
}

function Heading3() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="Heading 3">
      <div className="[word-break:break-word] flex flex-col font-['Outfit:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#000218] text-[18px] text-center whitespace-nowrap">
        <p className="leading-[29.7px]">No Transactions Yet</p>
      </div>
    </div>
  );
}

function Heading3Margin() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[92.56px] pb-[8px] top-[170px]" data-name="Heading 3:margin">
      <Heading3 />
    </div>
  );
}

function Container22() {
  return (
    <div className="-translate-x-1/2 absolute content-stretch flex flex-col items-center left-1/2 max-w-[240px] pl-[10.44px] pr-[10.45px] top-[207.08px]" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Outfit:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#76767f] text-[14px] text-center whitespace-nowrap">
        <p className="leading-[22.4px] mb-0">Your transaction history will appear</p>
        <p className="leading-[22.4px] mb-0">here once you start using your Biya</p>
        <p className="leading-[22.4px]">account.</p>
      </div>
    </div>
  );
}

function Container23() {
  return (
    <div className="relative shrink-0 size-[11.667px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="11.6667" preserveAspectRatio="none" viewBox="0 0 11.6667 11.6667" width="11.6667">
        <g id="Container">
          <path d={svgPaths.p19961e60} fill="var(--fill-0, #835500)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Button4() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Button">
      <Container23 />
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#835500] text-[12px] text-center tracking-[0.6px] whitespace-nowrap">
        <p className="leading-[12px]">How to fund your account</p>
      </div>
    </div>
  );
}

function ButtonMargin() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[66.39px] pt-[32px] top-[274.86px]" data-name="Button:margin">
      <Button4 />
    </div>
  );
}

function BackgroundBorderShadow2() {
  return (
    <div className="bg-white drop-shadow-[0px_4px_20px_rgba(0,0,0,0.04)] h-[376.86px] relative rounded-[40px] shrink-0 w-full" data-name="Background+Border+Shadow">
      <div aria-hidden className="absolute border-2 border-[rgba(199,197,207,0.3)] border-dashed inset-0 pointer-events-none rounded-[40px]" />
      <Margin4 />
      <Heading3Margin />
      <Container22 />
      <ButtonMargin />
    </div>
  );
}

function SectionRecentActivityEmptyState() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start pt-[24px] relative shrink-0 w-full" data-name="Section - Recent Activity (Empty State)">
      <Container18 />
      <BackgroundBorderShadow2 />
    </div>
  );
}

function Main() {
  return (
    <div className="relative shrink-0 w-full z-[1]" data-name="Main">
      <div className="content-stretch flex flex-col gap-[24px] items-start pb-[128px] pt-[16px] px-[24px] relative size-full">
        <WelcomeSection />
        <SectionBalanceCardPrimaryAnchor />
        <SectionAsymmetricBentoGridForQuickActions />
        <SectionRecentActivityEmptyState />
      </div>
    </div>
  );
}

export default function StudentEmptyState() {
  return (
    <div className="content-stretch flex flex-col isolate items-start relative size-full" style={{ backgroundImage: "linear-gradient(90deg, rgb(251, 249, 246) 0%, rgb(251, 249, 246) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" }} data-name="Student Empty State">
      <BottomNavigationBar />
      <HeaderTopAppBar />
      <Main />
    </div>
  );
}