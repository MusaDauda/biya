import svgPaths from "./svg-rd2zq4f9rm";
import imgAb6AXuBTyinZzKmK9K2GiNw5YeVfX2Sfe9ZVXt593RL5CGxgLYbCXXmkq91RMbyquX9N01LwaFgEiW7LHnNi6XcFohNKrHenQdp9DCcnNEcLIiAdgpUGnmTuXyap0EbG4J75GbAvvMmNFlZDcUMqO9JGaVoSb9PyKg3NkmK3FELgo9YnKoiqWzKxjPv5ShelRfBbGmSiCy4BuqZwHDzAJy6JXYwSxsJwYj0Q1UuqeljQIu6RoVk66NGrQ from "./77ad1ac5502ea2fe38b65c0272e4250415bdea2c.png";

function Heading() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0 w-full" data-name="Heading 1">
      <div className="[word-break:break-word] flex flex-col font-['Outfit:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#000218] text-[16px] text-center tracking-[-0.4px] whitespace-nowrap">
        <p className="leading-[24px]">Payment Successful</p>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex flex-col items-center max-w-[280px] relative shrink-0 w-full" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Outfit:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#71717a] text-[16px] text-center whitespace-nowrap">
        <p>
          <span className="leading-[24px]">{`Payment to `}</span>
          <span className="[word-break:break-word] font-['Outfit:Regular',sans-serif] font-normal leading-[24px] text-[#000218]">Iya Basira Food</span>
          <span className="leading-[24px]">{` successful`}</span>
        </p>
      </div>
    </div>
  );
}

function TransactionHeader() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-[272.1px]" data-name="Transaction Header">
      <Heading />
      <Container />
    </div>
  );
}

function TransactionHeaderMargin() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[58.95px] pb-[48px] top-[248.5px]" data-name="Transaction Header:margin">
      <TransactionHeader />
    </div>
  );
}

function Container1() {
  return (
    <div className="h-[36.4px] relative shrink-0 w-[47.733px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="36.4" preserveAspectRatio="none" viewBox="0 0 47.7333 36.4" width="47.7333">
        <g id="Container">
          <path d={svgPaths.p2e249700} fill="var(--fill-0, white)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Background() {
  return (
    <div className="bg-[#1fa463] content-stretch flex items-center justify-center p-[24px] relative rounded-[9999px] shrink-0" data-name="Background">
      <div className="absolute bg-[rgba(255,255,255,0)] inset-[0_-0.27px_0.4px_0] rounded-[9999px] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)]" data-name="Overlay+Shadow" />
      <Container1 />
    </div>
  );
}

function SuccessIconContainer() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Success Icon Container">
      <div className="absolute bg-[rgba(31,164,99,0.1)] left-[-8px] rounded-[9999px] size-[128px] top-[-8px]" data-name="Animated rings behind the tick" />
      <div className="absolute bg-[rgba(31,164,99,0.2)] left-[8px] rounded-[9999px] size-[96px] top-[8px]" data-name="Overlay" />
      <Background />
    </div>
  );
}

function SuccessIconContainerMargin() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[139px] pb-[24px] top-[112.5px]" data-name="Success Icon Container:margin">
      <SuccessIconContainer />
    </div>
  );
}

function Container3() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#71717a] text-[16px] tracking-[1.6px] uppercase w-full">
        <p className="leading-[24px]">AMOUNT PAID</p>
      </div>
    </div>
  );
}

function Container4() {
  return (
    <div className="content-stretch flex items-baseline relative shrink-0 w-full" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Regular','Noto_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#000218] text-[16px] whitespace-nowrap">
        <p className="leading-[24px]">₦1,200.00</p>
      </div>
    </div>
  );
}

function Margin() {
  return (
    <div className="content-stretch flex flex-col items-start pt-[8px] relative shrink-0 w-full" data-name="Margin">
      <Container4 />
    </div>
  );
}

function Container2() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Container3 />
        <Margin />
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#71717a] text-[16px] whitespace-nowrap">
        <p className="leading-[24px]">REF</p>
      </div>
    </div>
  );
}

function Container7() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#000218] text-[16px] tracking-[-0.8px] whitespace-nowrap">
        <p className="leading-[24px]">0x82...f92</p>
      </div>
    </div>
  );
}

function Container5() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between relative size-full">
        <Container6 />
        <Container7 />
      </div>
    </div>
  );
}

function Container9() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#71717a] text-[16px] whitespace-nowrap">
        <p className="leading-[24px]">Receipt</p>
      </div>
    </div>
  );
}

function Container11() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#1fa463] text-[16px] whitespace-nowrap">
        <p className="leading-[24px]">Cleva confirmation</p>
      </div>
    </div>
  );
}

function Container10() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-name="Container">
      <div className="bg-[#1fa463] relative rounded-[9999px] shrink-0 size-[8px]" data-name="Background" />
      <Container11 />
    </div>
  );
}

function Container8() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Container9 />
      <Container10 />
    </div>
  );
}

function Margin1() {
  return (
    <div className="relative shrink-0 w-full" data-name="Margin">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[12px] relative size-full">
        <Container8 />
      </div>
    </div>
  );
}

function HorizontalBorder() {
  return (
    <div className="relative shrink-0 w-full" data-name="HorizontalBorder">
      <div aria-hidden className="absolute border-[rgba(20,27,60,0.1)] border-solid border-t inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[25px] relative size-full">
        <Container5 />
        <Margin1 />
      </div>
    </div>
  );
}

function AmountCardAsymmetricBentoStyle() {
  return (
    <div className="bg-white relative rounded-[40px] shrink-0 w-full" data-name="Amount Card (Asymmetric Bento Style)">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col gap-[32px] items-start p-[33px] relative size-full">
          <Container2 />
          <HorizontalBorder />
          <div className="absolute bg-[#1fa463] bottom-px left-px top-px w-[4px]" data-name="Background" />
        </div>
      </div>
      <div aria-hidden className="absolute border border-[rgba(20,27,60,0.1)] border-solid inset-0 pointer-events-none rounded-[40px] shadow-[0px_40px_80px_0px_rgba(0,0,0,0.04)]" />
    </div>
  );
}

function AmountCardAsymmetricBentoStyleMargin() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[24px] pb-[24px] right-[24px] top-[352.5px]" data-name="Amount Card (Asymmetric Bento Style):margin">
      <AmountCardAsymmetricBentoStyle />
    </div>
  );
}

function Ab6AXuBTyinZzKmK9K2GiNw5YeVfX2Sfe9ZVXt593RL5CGxgLYbCXXmkq91RMbyquX9N01LwaFgEiW7LHnNi6XcFohNKrHenQdp9DCcnNEcLIiAdgpUGnmTuXyap0EbG4J75GbAvvMmNFlZDcUMqO9JGaVoSb9PyKg3NkmK3FELgo9YnKoiqWzKxjPv5ShelRfBbGmSiCy4BuqZwHDzAJy6JXYwSxsJwYj0Q1UuqeljQIu6RoVk66NGrQ() {
  return (
    <div className="flex-[1_0_0] min-h-px relative w-full" data-name="AB6AXuBTyinZZKmK9K2GINw5yeVfX2SFE9zVXt593rL5cGxgLYbC-xXmkq91rMbyquX9N01LWAFgEiW7LHn_Ni6xcFohNKrHenQdp9DCcnNEcLIiAdgpUGnmTuXyap_0ebG4J75GbAvvMmNFlZDcUMqO9J_gaVoSb9PyKg3nkmK3fELgo9YnKOIQWzKXJPv5ShelRfBbGMSiCY4BuqZwHDz_aJY6jXYwSXSJwYJ0Q1uuqeljQIu6ROVk66NGrQ">
      <div className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute h-[99.99%] left-[-41.75%] max-w-none top-0 w-[183.5%]" src={imgAb6AXuBTyinZzKmK9K2GiNw5YeVfX2Sfe9ZVXt593RL5CGxgLYbCXXmkq91RMbyquX9N01LwaFgEiW7LHnNi6XcFohNKrHenQdp9DCcnNEcLIiAdgpUGnmTuXyap0EbG4J75GbAvvMmNFlZDcUMqO9JGaVoSb9PyKg3NkmK3FELgo9YnKoiqWzKxjPv5ShelRfBbGmSiCy4BuqZwHDzAJy6JXYwSxsJwYj0Q1UuqeljQIu6RoVk66NGrQ} />
      </div>
    </div>
  );
}

function OverlayBorderShadow() {
  return (
    <div className="flex h-[87.931px] items-center justify-center relative shrink-0 w-[87.929px]">
      <div className="flex-none rotate-6">
        <div className="bg-[rgba(255,255,255,0)] h-[80.006px] relative rounded-[12px] w-[80.005px]" data-name="Overlay+Border+Shadow">
          <div className="content-stretch flex flex-col items-start justify-center overflow-clip p-[4px] relative rounded-[inherit] size-full">
            <Ab6AXuBTyinZzKmK9K2GiNw5YeVfX2Sfe9ZVXt593RL5CGxgLYbCXXmkq91RMbyquX9N01LwaFgEiW7LHnNi6XcFohNKrHenQdp9DCcnNEcLIiAdgpUGnmTuXyap0EbG4J75GbAvvMmNFlZDcUMqO9JGaVoSb9PyKg3NkmK3FELgo9YnKoiqWzKxjPv5ShelRfBbGmSiCy4BuqZwHDzAJy6JXYwSxsJwYj0Q1UuqeljQIu6RoVk66NGrQ />
          </div>
          <div aria-hidden className="absolute border-4 border-solid border-white inset-0 pointer-events-none rounded-[12px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]" />
        </div>
      </div>
    </div>
  );
}

function ReceiptImageDecoration() {
  return (
    <div className="absolute content-stretch flex items-start justify-end left-0 pl-[242.036px] pr-[12.034px] right-0 top-[-27.97px]" data-name="Receipt Image Decoration">
      <OverlayBorderShadow />
    </div>
  );
}

function ReceiptImageDecorationMargin() {
  return (
    <div className="absolute h-[56px] left-[24px] right-[24px] top-[615.5px]" data-name="Receipt Image Decoration:margin">
      <ReceiptImageDecoration />
    </div>
  );
}

function MainContentCanvas() {
  return (
    <div className="h-[736px] max-w-[390px] relative shrink-0 w-full" data-name="Main Content Canvas">
      <TransactionHeaderMargin />
      <SuccessIconContainerMargin />
      <AmountCardAsymmetricBentoStyleMargin />
      <ReceiptImageDecorationMargin />
    </div>
  );
}

function Button() {
  return (
    <div className="bg-[#000218] content-stretch flex h-[48px] items-center justify-center pb-[12.5px] pt-[11.5px] relative rounded-[9999px] shrink-0 w-full" data-name="Button">
      <div className="absolute bg-[rgba(255,255,255,0)] h-[48px] left-0 right-0 rounded-[9999px] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)] top-0" data-name="Button:shadow" />
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[16px] text-center text-white tracking-[2.4px] uppercase whitespace-nowrap">
        <p className="leading-[24px]">DONE</p>
      </div>
    </div>
  );
}

function Container12() {
  return (
    <div className="content-stretch flex flex-col items-start relative self-stretch shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Outfit:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[24px] text-[rgba(0,2,24,0.2)] whitespace-nowrap">
        <p className="leading-[36px]">BIYA</p>
      </div>
    </div>
  );
}

function AppLogoAnchor() {
  return (
    <div className="content-stretch flex h-[36px] items-start justify-center relative shrink-0 w-full" data-name="App Logo Anchor">
      <Container12 />
    </div>
  );
}

function FooterAction() {
  return (
    <div className="max-w-[390px] relative shrink-0 w-full" data-name="Footer Action">
      <div className="content-stretch flex flex-col gap-[24px] items-start max-w-[inherit] pb-[40px] px-[24px] relative size-full">
        <Button />
        <AppLogoAnchor />
      </div>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <div className="content-stretch flex flex-col items-center justify-between relative size-full" style={{ backgroundImage: "linear-gradient(90deg, rgb(251, 249, 246) 0%, rgb(251, 249, 246) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" }} data-name="Payment Success">
      <div className="-translate-x-1/2 absolute flex items-center justify-center left-[calc(50%+153.82px)] size-[15.186px] top-[283.02px]">
        <div className="flex-none rotate-[-111.95deg]">
          <div className="bg-[#000218] opacity-0 relative rounded-[2px] size-[11.67px]" data-name="Background" />
        </div>
      </div>
      <div className="-translate-x-1/2 absolute flex items-center justify-center left-[calc(50%-124.42px)] size-[10.648px] top-[274.27px]">
        <div className="flex-none rotate-[-75.96deg]">
          <div className="bg-[#000218] opacity-0 relative rounded-[2px] size-[8.78px]" data-name="Background" />
        </div>
      </div>
      <div className="-translate-x-1/2 absolute flex items-center justify-center left-[calc(50%+19.03px)] size-[13.039px] top-[406.84px]">
        <div className="flex-none rotate-[-162.35deg]">
          <div className="bg-[#1fa463] opacity-0 relative rounded-[2px] size-[10.38px]" data-name="Background" />
        </div>
      </div>
      <div className="-translate-x-1/2 absolute flex items-center justify-center left-[calc(50%-139.98px)] size-[4.462px] top-[421.3px]">
        <div className="flex-none rotate-[-86.3deg]">
          <div className="bg-[#f5a623] opacity-0 relative rounded-[2px] size-[4.2px]" data-name="Background" />
        </div>
      </div>
      <div className="-translate-x-1/2 absolute flex items-center justify-center left-[calc(50%-191.37px)] size-[6.442px] top-[299.22px]">
        <div className="flex-none rotate-[156.92deg]">
          <div className="bg-[#6b4500] opacity-0 relative rounded-[2px] size-[4.91px]" data-name="Background" />
        </div>
      </div>
      <div className="-translate-x-1/2 absolute flex items-center justify-center left-[calc(50%-60.58px)] size-[9.99px] top-[543.94px]">
        <div className="flex-none rotate-[161.88deg]">
          <div className="bg-[#000218] opacity-0 relative rounded-[2px] size-[7.92px]" data-name="Background" />
        </div>
      </div>
      <div className="-translate-x-1/2 absolute flex items-center justify-center left-[calc(50%-151.33px)] size-[13.417px] top-[444.49px]">
        <div className="flex-none rotate-[8.13deg]">
          <div className="bg-[#1fa463] opacity-0 relative rounded-[2px] size-[11.86px]" data-name="Background" />
        </div>
      </div>
      <div className="-translate-x-1/2 absolute flex items-center justify-center left-[calc(50%+168.61px)] size-[8.088px] top-[257.54px]">
        <div className="flex-none rotate-[-44.05deg]">
          <div className="bg-[#1fa463] opacity-0 relative rounded-[2px] size-[5.72px]" data-name="Background" />
        </div>
      </div>
      <div className="-translate-x-1/2 absolute flex items-center justify-center left-[calc(50%+92.42px)] size-[7.577px] top-[289.28px]">
        <div className="flex-none rotate-[87.53deg]">
          <div className="bg-[#6b4500] opacity-0 relative rounded-[2px] size-[7.27px]" data-name="Background" />
        </div>
      </div>
      <div className="-translate-x-1/2 absolute flex items-center justify-center left-[calc(50%+159.62px)] size-[9.438px] top-[405.82px]">
        <div className="flex-none rotate-[20.05deg]">
          <div className="bg-[#1fa463] opacity-0 relative rounded-[2px] size-[7.36px]" data-name="Background" />
        </div>
      </div>
      <div className="-translate-x-1/2 absolute flex items-center justify-center left-[calc(50%-26.3px)] size-[11.45px] top-[489.57px]">
        <div className="flex-none rotate-[171.18deg]">
          <div className="bg-[#1fa463] opacity-0 relative rounded-[2px] size-[10.03px]" data-name="Background" />
        </div>
      </div>
      <div className="-translate-x-1/2 absolute flex items-center justify-center left-[calc(50%+80.74px)] size-[6.054px] top-[308.48px]">
        <div className="flex-none rotate-[39.57deg]">
          <div className="bg-[#f5a623] opacity-0 relative rounded-[2px] size-[4.3px]" data-name="Background" />
        </div>
      </div>
      <div className="-translate-x-1/2 absolute flex items-center justify-center left-[calc(50%-2.3px)] size-[5.391px] top-[522.6px]">
        <div className="flex-none rotate-[-153.51deg]">
          <div className="bg-[#6b4500] opacity-0 relative rounded-[2px] size-[4.02px]" data-name="Background" />
        </div>
      </div>
      <div className="-translate-x-1/2 absolute flex items-center justify-center left-[calc(50%+73.65px)] size-[12.416px] top-[175.67px]">
        <div className="flex-none rotate-[-115.56deg]">
          <div className="bg-[#6b4500] opacity-0 relative rounded-[2px] size-[9.31px]" data-name="Background" />
        </div>
      </div>
      <div className="-translate-x-1/2 absolute flex items-center justify-center left-[calc(50%+150.85px)] size-[14.82px] top-[269.17px]">
        <div className="flex-none rotate-[16.99deg]">
          <div className="bg-[#6b4500] opacity-0 relative rounded-[2px] size-[11.87px]" data-name="Background" />
        </div>
      </div>
      <div className="-translate-x-1/2 absolute flex items-center justify-center left-[calc(50%+169.45px)] size-[8.989px] top-[319.93px]">
        <div className="flex-none rotate-[28.19deg]">
          <div className="bg-[#f5a623] opacity-0 relative rounded-[2px] size-[6.64px]" data-name="Background" />
        </div>
      </div>
      <div className="-translate-x-1/2 absolute flex items-center justify-center left-[calc(50%+134.96px)] size-[14.464px] top-[480.72px]">
        <div className="flex-none rotate-[-131.2deg]">
          <div className="bg-[#000218] opacity-0 relative rounded-[2px] size-[10.25px]" data-name="Background" />
        </div>
      </div>
      <div className="-translate-x-1/2 absolute flex items-center justify-center left-[calc(50%-134.33px)] size-[10.37px] top-[541.04px]">
        <div className="flex-none rotate-[62.78deg]">
          <div className="bg-[#000218] opacity-0 relative rounded-[2px] size-[7.7px]" data-name="Background" />
        </div>
      </div>
      <div className="-translate-x-1/2 absolute flex items-center justify-center left-[calc(50%-133.54px)] size-[7.16px] top-[270.4px]">
        <div className="flex-none rotate-[178.42deg]">
          <div className="bg-[#1fa463] opacity-0 relative rounded-[2px] size-[6.97px]" data-name="Background" />
        </div>
      </div>
      <div className="-translate-x-1/2 absolute flex items-center justify-center left-[calc(50%-13.95px)] size-[8.392px] top-[485.65px]">
        <div className="flex-none rotate-[-120.13deg]">
          <div className="bg-[#f5a623] opacity-0 relative rounded-[2px] size-[6.14px]" data-name="Background" />
        </div>
      </div>
      <div className="-translate-x-1/2 absolute flex items-center justify-center left-[calc(50%-113.09px)] size-[6.928px] top-[493.64px]">
        <div className="flex-none rotate-[-62.61deg]">
          <div className="bg-[#f5a623] opacity-0 relative rounded-[2px] size-[5.14px]" data-name="Background" />
        </div>
      </div>
      <div className="-translate-x-1/2 absolute flex items-center justify-center left-[calc(50%+173.46px)] size-[9.009px] top-[422.65px]">
        <div className="flex-none rotate-[-162.32deg]">
          <div className="bg-[#f5a623] opacity-0 relative rounded-[2px] size-[7.17px]" data-name="Background" />
        </div>
      </div>
      <div className="-translate-x-1/2 absolute flex items-center justify-center left-[calc(50%-17.11px)] size-[5.846px] top-[174.76px]">
        <div className="flex-none rotate-[128.54deg]">
          <div className="bg-[#f5a623] opacity-0 relative rounded-[2px] size-[4.16px]" data-name="Background" />
        </div>
      </div>
      <div className="-translate-x-1/2 absolute flex items-center justify-center left-[calc(50%+74.7px)] size-[7.424px] top-[214.46px]">
        <div className="flex-none rotate-[-134.08deg]">
          <div className="bg-[#6b4500] opacity-0 relative rounded-[2px] size-[5.25px]" data-name="Background" />
        </div>
      </div>
      <div className="-translate-x-1/2 absolute flex h-[6.852px] items-center justify-center left-[calc(50%+190.4px)] top-[356.96px] w-[6.858px]">
        <div className="flex-none rotate-[70.61deg]">
          <div className="bg-[#1fa463] h-[5.38px] opacity-0 relative rounded-[2px] w-[5.37px]" data-name="Background" />
        </div>
      </div>
      <div className="-translate-x-1/2 absolute flex items-center justify-center left-[calc(50%-177.53px)] size-[10.137px] top-[239.2px]">
        <div className="flex-none rotate-[-46.25deg]">
          <div className="bg-[#1fa463] opacity-0 relative rounded-[2px] size-[7.17px]" data-name="Background" />
        </div>
      </div>
      <div className="-translate-x-1/2 absolute flex items-center justify-center left-[calc(50%-160.29px)] size-[5.73px] top-[456.8px]">
        <div className="flex-none rotate-[121.31deg]">
          <div className="bg-[#6b4500] opacity-0 relative rounded-[2px] size-[4.17px]" data-name="Background" />
        </div>
      </div>
      <div className="-translate-x-1/2 absolute flex items-center justify-center left-[calc(50%+162.06px)] size-[6.759px] top-[162.97px]">
        <div className="flex-none rotate-[-159.92deg]">
          <div className="bg-[#6b4500] opacity-0 relative rounded-[2px] size-[5.27px]" data-name="Background" />
        </div>
      </div>
      <div className="-translate-x-1/2 absolute flex items-center justify-center left-[calc(50%+123.02px)] size-[6.18px] top-[496.14px]">
        <div className="flex-none rotate-[-102.18deg]">
          <div className="bg-[#000218] opacity-0 relative rounded-[2px] size-[5.2px]" data-name="Background" />
        </div>
      </div>
      <div className="-translate-x-1/2 absolute flex items-center justify-center left-[calc(50%+24.86px)] size-[12.132px] top-[280.81px]">
        <div className="flex-none rotate-[-53.34deg]">
          <div className="bg-[#f5a623] opacity-0 relative rounded-[2px] size-[8.67px]" data-name="Background" />
        </div>
      </div>
      <MainContentCanvas />
      <FooterAction />
    </div>
  );
}