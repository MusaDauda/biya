import svgPaths from "./svg-x3h3vdw5tb";

function Container1() {
  return (
    <div className="h-[16.667px] relative shrink-0 w-[13.333px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="16.6667" preserveAspectRatio="none" viewBox="0 0 13.3333 16.6667" width="13.3333">
        <g id="Container">
          <path d={svgPaths.pc7c8480} fill="var(--fill-0, white)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Background() {
  return (
    <div className="bg-[#835500] content-stretch flex items-center justify-center relative rounded-[8px] shrink-0 size-[32px]" data-name="Background">
      <Container1 />
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#835500] text-[12px] tracking-[0.6px] whitespace-nowrap">
        <p className="leading-[12px]">Secure confirmation</p>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Container">
      <Background />
      <Container2 />
    </div>
  );
}

function Heading() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 1">
      <div className="[word-break:break-word] flex flex-col font-['Outfit:Regular',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#000218] text-[28px] tracking-[-0.7px] w-full">
        <p className="leading-[33.6px]">Enter your PIN to confirm</p>
      </div>
    </div>
  );
}

function HeaderTopBrandingAnchor() {
  return (
    <div className="relative shrink-0 w-full" data-name="Header - Top Branding Anchor">
      <div className="content-stretch flex flex-col gap-[8px] items-start pb-[24px] pt-[48px] px-[24px] relative size-full">
        <Container />
        <Heading />
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="content-stretch flex gap-[24px] items-start relative shrink-0" data-name="Container">
      <div className="relative rounded-[9999px] shrink-0 size-[24px]" data-name="Pin Dots">
        <div aria-hidden className="absolute border-2 border-[#c7c5cf] border-solid inset-0 pointer-events-none rounded-[9999px]" />
      </div>
      <div className="relative rounded-[9999px] shrink-0 size-[24px]" data-name="Border">
        <div aria-hidden className="absolute border-2 border-[#c7c5cf] border-solid inset-0 pointer-events-none rounded-[9999px]" />
      </div>
      <div className="relative rounded-[9999px] shrink-0 size-[24px]" data-name="Border">
        <div aria-hidden className="absolute border-2 border-[#c7c5cf] border-solid inset-0 pointer-events-none rounded-[9999px]" />
      </div>
      <div className="relative rounded-[9999px] shrink-0 size-[24px]" data-name="Border">
        <div aria-hidden className="absolute border-2 border-[#c7c5cf] border-solid inset-0 pointer-events-none rounded-[9999px]" />
      </div>
    </div>
  );
}

function Margin() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[48px] relative shrink-0" data-name="Margin">
      <Container3 />
    </div>
  );
}

function Container4() {
  return (
    <div className="content-stretch flex flex-col items-center max-w-[280px] pl-[8.67px] pr-[8.69px] relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Outfit:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#46464e] text-[16px] text-center whitespace-nowrap">
        <p className="leading-[24px] mb-0">Please enter your 4-digit security PIN</p>
        <p className="leading-[24px]">to authorize this transaction.</p>
      </div>
    </div>
  );
}

function PinVisualRepresentation() {
  return (
    <div className="flex-[1_0_0] min-h-px relative w-full" data-name="PIN Visual Representation">
      <div className="flex flex-col items-center size-full">
        <div className="content-stretch flex flex-col items-center pt-[48px] px-[24px] relative size-full">
          <Margin />
          <Container4 />
        </div>
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Bold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#000218] text-[36px] text-center tracking-[-1.8px] whitespace-nowrap">
        <p className="leading-[36px]">1</p>
      </div>
    </div>
  );
}

function ButtonNumbers() {
  return (
    <div className="col-1 content-stretch flex h-[48px] items-center justify-center justify-self-start pl-[41.75px] pr-[41.77px] relative rounded-[12px] row-1 shrink-0" data-name="Button - Numbers 1-9">
      <Container6 />
    </div>
  );
}

function Container7() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Bold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#000218] text-[36px] text-center tracking-[-1.8px] whitespace-nowrap">
        <p className="leading-[36px]">2</p>
      </div>
    </div>
  );
}

function Button() {
  return (
    <div className="col-2 content-stretch flex h-[48px] items-center justify-center justify-self-start pl-[41.75px] pr-[41.77px] relative rounded-[12px] row-1 shrink-0" data-name="Button">
      <Container7 />
    </div>
  );
}

function Container8() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Bold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#000218] text-[36px] text-center tracking-[-1.8px] whitespace-nowrap">
        <p className="leading-[36px]">3</p>
      </div>
    </div>
  );
}

function Button1() {
  return (
    <div className="col-3 content-stretch flex h-[48px] items-center justify-center justify-self-start pl-[41.76px] pr-[41.77px] relative rounded-[12px] row-1 shrink-0" data-name="Button">
      <Container8 />
    </div>
  );
}

function Container9() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Bold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#000218] text-[36px] text-center tracking-[-1.8px] whitespace-nowrap">
        <p className="leading-[36px]">4</p>
      </div>
    </div>
  );
}

function Button2() {
  return (
    <div className="col-1 content-stretch flex h-[48px] items-center justify-center justify-self-start pl-[41.75px] pr-[41.77px] relative rounded-[12px] row-2 shrink-0" data-name="Button">
      <Container9 />
    </div>
  );
}

function Container10() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Bold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#000218] text-[36px] text-center tracking-[-1.8px] whitespace-nowrap">
        <p className="leading-[36px]">5</p>
      </div>
    </div>
  );
}

function Button3() {
  return (
    <div className="col-2 content-stretch flex h-[48px] items-center justify-center justify-self-start pl-[41.75px] pr-[41.77px] relative rounded-[12px] row-2 shrink-0" data-name="Button">
      <Container10 />
    </div>
  );
}

function Container11() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Bold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#000218] text-[36px] text-center tracking-[-1.8px] whitespace-nowrap">
        <p className="leading-[36px]">6</p>
      </div>
    </div>
  );
}

function Button4() {
  return (
    <div className="col-3 content-stretch flex h-[48px] items-center justify-center justify-self-start pl-[41.76px] pr-[41.77px] relative rounded-[12px] row-2 shrink-0" data-name="Button">
      <Container11 />
    </div>
  );
}

function Container12() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Bold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#000218] text-[36px] text-center tracking-[-1.8px] whitespace-nowrap">
        <p className="leading-[36px]">7</p>
      </div>
    </div>
  );
}

function Button5() {
  return (
    <div className="col-1 content-stretch flex h-[48px] items-center justify-center justify-self-start pl-[41.75px] pr-[41.77px] relative rounded-[12px] row-3 shrink-0" data-name="Button">
      <Container12 />
    </div>
  );
}

function Container13() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Bold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#000218] text-[36px] text-center tracking-[-1.8px] whitespace-nowrap">
        <p className="leading-[36px]">8</p>
      </div>
    </div>
  );
}

function Button6() {
  return (
    <div className="col-2 content-stretch flex h-[48px] items-center justify-center justify-self-start pl-[41.75px] pr-[41.77px] relative rounded-[12px] row-3 shrink-0" data-name="Button">
      <Container13 />
    </div>
  );
}

function Container14() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Bold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#000218] text-[36px] text-center tracking-[-1.8px] whitespace-nowrap">
        <p className="leading-[36px]">9</p>
      </div>
    </div>
  );
}

function Button7() {
  return (
    <div className="col-3 content-stretch flex h-[48px] items-center justify-center justify-self-start pl-[41.76px] pr-[41.77px] relative rounded-[12px] row-3 shrink-0" data-name="Button">
      <Container14 />
    </div>
  );
}

function Container15() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Bold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#000218] text-[36px] text-center tracking-[-1.8px] whitespace-nowrap">
        <p className="leading-[36px]">0</p>
      </div>
    </div>
  );
}

function Button8() {
  return (
    <div className="col-2 content-stretch flex h-[48px] items-center justify-center justify-self-start pl-[41.75px] pr-[41.77px] relative rounded-[12px] row-4 shrink-0" data-name="Button">
      <Container15 />
    </div>
  );
}

function Container16() {
  return (
    <div className="h-[21.333px] relative shrink-0 w-[26.667px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="21.3333" preserveAspectRatio="none" viewBox="0 0 26.6667 21.3333" width="26.6667">
        <g id="Container">
          <path d={svgPaths.p3f8a6e00} fill="var(--fill-0, #BA1A1A)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Button9() {
  return (
    <div className="col-3 content-stretch flex h-[48px] items-center justify-center justify-self-start px-[35.67px] relative rounded-[12px] row-4 shrink-0" data-name="Button">
      <Container16 />
    </div>
  );
}

function Container5() {
  return (
    <div className="gap-x-[16px] gap-y-[16px] grid grid-cols-[repeat(3,minmax(0,1fr))] grid-rows-[____48px_48px_48px_48px] relative shrink-0 w-full" data-name="Container">
      <ButtonNumbers />
      <Button />
      <Button1 />
      <Button2 />
      <Button3 />
      <Button4 />
      <Button5 />
      <Button6 />
      <Button7 />
      <Button8 />
      <Button9 />
    </div>
  );
}

function Button10() {
  return (
    <div className="bg-[#835500] content-stretch flex h-[48px] items-center justify-center relative rounded-[9999px] shrink-0 w-full" data-name="Button">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[12px] text-center text-white tracking-[1.2px] whitespace-nowrap">
        <p className="leading-[12px]">FORGOT PIN?</p>
      </div>
    </div>
  );
}

function NumericKeypadArea() {
  return (
    <div className="bg-white drop-shadow-[0px_-4px_20px_rgba(0,0,0,0.04)] relative rounded-tl-[40px] rounded-tr-[40px] shrink-0 w-full" data-name="Numeric Keypad Area">
      <div className="content-stretch flex flex-col gap-[16px] items-start pb-[48px] pt-[24px] px-[24px] relative size-full">
        <Container5 />
        <Button10 />
      </div>
    </div>
  );
}

export default function PinEntry() {
  return (
    <div className="content-stretch flex flex-col items-start relative size-full" style={{ backgroundImage: "linear-gradient(90deg, rgb(250, 248, 245) 0%, rgb(250, 248, 245) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" }} data-name="PIN Entry">
      <HeaderTopBrandingAnchor />
      <PinVisualRepresentation />
      <NumericKeypadArea />
    </div>
  );
}