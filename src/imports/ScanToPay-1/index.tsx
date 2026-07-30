import svgPaths from "./svg-4e3x5hwug4";
import imgFullScreenCameraSimulatorImage from "./f4f6e7784b8f7a7d0fce0fa0779fd9d82a6f4198.png";
import imgAb6AXuCMlGdDAurKgdU7KGqsem7JBlKusg3Z2DgdspV3QZhVMyf0XyeFWmqE5HpXdPnZPjrHeBlrFtPlvFirUu3YyhShMlO0EtrtNj0R4Nto39Xxn5ImZ1Zo57SHxnliZQvA3773Bl1TX87Em2VyRsfOgxnRxZuFhmSk0OlplHjXgPbKxZBgtBLcZbpJmCe5MKZf4Qo0Ik7TPdcXzvGaV8CyF3GEik0Bi46WUoiUqvmejOnW96AYtw from "./fe8d63f7c678b2740344d05fb02431e010d83c05.png";

function IndigoReticle() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 size-[256px]" data-name="Indigo Reticle">
      <div className="relative rounded-[9999px] shrink-0 size-[16px]" data-name="Focus indicator">
        <div aria-hidden className="absolute border border-[rgba(255,255,255,0.2)] border-solid inset-0 pointer-events-none rounded-[9999px]" />
      </div>
      <div className="absolute left-0 rounded-tl-[12px] size-[40px] top-0" data-name="Corners">
        <div aria-hidden className="absolute border-[#141b3c] border-l-4 border-solid border-t-4 inset-0 pointer-events-none rounded-tl-[12px]" />
      </div>
      <div className="absolute right-0 rounded-tr-[12px] size-[40px] top-0" data-name="Border">
        <div aria-hidden className="absolute border-[#141b3c] border-r-4 border-solid border-t-4 inset-0 pointer-events-none rounded-tr-[12px]" />
      </div>
      <div className="absolute bottom-0 left-0 rounded-bl-[12px] size-[40px]" data-name="Border">
        <div aria-hidden className="absolute border-[#141b3c] border-b-4 border-l-4 border-solid inset-0 pointer-events-none rounded-bl-[12px]" />
      </div>
      <div className="absolute bottom-0 right-0 rounded-br-[12px] size-[40px]" data-name="Border">
        <div aria-hidden className="absolute border-[#141b3c] border-b-4 border-r-4 border-solid inset-0 pointer-events-none rounded-br-[12px]" />
      </div>
      <div className="absolute bg-[rgba(20,27,60,0.6)] h-[2px] left-0 right-0 shadow-[0px_0px_15px_0px_#141b3c] top-[127px]" data-name="Animated Scan Line" />
    </div>
  );
}

function Shadow() {
  return (
    <div className="content-stretch drop-shadow-[0px_2px_1px_rgba(0,0,0,0.06),0px_4px_1.5px_rgba(0,0,0,0.07)] flex flex-col items-center relative shrink-0 w-full" data-name="Shadow">
      <div className="[word-break:break-word] flex flex-col font-['Outfit:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[16px] text-center text-white whitespace-nowrap">
        <p className="leading-[24px]">{`Point your camera at the vendor's Biya code`}</p>
      </div>
    </div>
  );
}

function InstructionText() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 px-[24px] top-[64px] w-[390px]" data-name="Instruction Text">
      <Shadow />
    </div>
  );
}

function ScrimOverlay() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.4)] content-stretch flex inset-0 items-center justify-center" data-name="Scrim/Overlay">
      <IndigoReticle />
      <InstructionText />
    </div>
  );
}

function CameraViewfinderLayer() {
  return (
    <div className="absolute content-stretch flex flex-col inset-0 items-start justify-center" data-name="Camera Viewfinder Layer">
      <div className="flex-[1_0_0] min-h-px opacity-80 relative w-full" data-name="Full-screen Camera Simulator Image">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute h-full left-[-157.98%] max-w-none top-0 w-[415.96%]" src={imgFullScreenCameraSimulatorImage} />
        </div>
      </div>
      <ScrimOverlay />
    </div>
  );
}

function Container() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="16" preserveAspectRatio="none" viewBox="0 0 16 16" width="16">
        <g id="Container">
          <path d={svgPaths.p300a1100} fill="var(--fill-0, white)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Button() {
  return (
    <div className="backdrop-blur-[6px] bg-[rgba(255,255,255,0.1)] content-stretch flex items-center justify-center relative rounded-[9999px] shrink-0 size-[48px]" data-name="Button">
      <Container />
    </div>
  );
}

function Container1() {
  return (
    <div className="h-[20px] relative shrink-0 w-[12px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="20" preserveAspectRatio="none" viewBox="0 0 12 20" width="12">
        <g id="Container">
          <path d={svgPaths.p1c186500} fill="var(--fill-0, white)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Button1() {
  return (
    <div className="backdrop-blur-[6px] bg-[rgba(255,255,255,0.1)] content-stretch flex items-center justify-center relative rounded-[9999px] shrink-0 size-[48px]" data-name="Button">
      <Container1 />
    </div>
  );
}

function UiControlsBackFlash() {
  return (
    <div className="absolute content-stretch flex items-center justify-between left-0 p-[24px] top-0 w-[390px]" data-name="UI Controls (Back / Flash)">
      <Button />
      <Button1 />
    </div>
  );
}

function HandleMargin() {
  return (
    <div className="-translate-x-1/2 absolute content-stretch flex flex-col h-[38px] items-center left-1/2 px-[171px] py-[16px] top-0 w-[390px]" data-name="Handle:margin">
      <div className="bg-[#e4e2df] h-[6px] relative rounded-[9999px] shrink-0 w-[48px]" data-name="Handle" />
    </div>
  );
}

function Ab6AXuCMlGdDAurKgdU7KGqsem7JBlKusg3Z2DgdspV3QZhVMyf0XyeFWmqE5HpXdPnZPjrHeBlrFtPlvFirUu3YyhShMlO0EtrtNj0R4Nto39Xxn5ImZ1Zo57SHxnliZQvA3773Bl1TX87Em2VyRsfOgxnRxZuFhmSk0OlplHjXgPbKxZBgtBLcZbpJmCe5MKZf4Qo0Ik7TPdcXzvGaV8CyF3GEik0Bi46WUoiUqvmejOnW96AYtw() {
  return (
    <div className="flex-[1_0_0] h-full min-w-px relative" data-name="AB6AXuC_MLGdDAurKgdU7KGqsem7jBlKusg3z2dgdspV3QZhVMyf0xyeFWmqE5HpXDPnZPjrHEBlrFTPlvFirUu3YyhShML_O0EtrtNj0r4NTO39Xxn5-imZ1Zo57sHxnliZQvA3773Bl1tX87Em2VYRsfOgxnRxZUFhmSk0OlplHJXgPbKxZBgtBLcZBPJmCE5M-kZf4Qo0Ik_7t_pdcXzvGaV8-cyF3GEik0BI46wUOIUqvmejOn_W96aYtw">
      <div className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgAb6AXuCMlGdDAurKgdU7KGqsem7JBlKusg3Z2DgdspV3QZhVMyf0XyeFWmqE5HpXdPnZPjrHeBlrFtPlvFirUu3YyhShMlO0EtrtNj0R4Nto39Xxn5ImZ1Zo57SHxnliZQvA3773Bl1TX87Em2VyRsfOgxnRxZuFhmSk0OlplHjXgPbKxZBgtBLcZbpJmCe5MKZf4Qo0Ik7TPdcXzvGaV8CyF3GEik0Bi46WUoiUqvmejOnW96AYtw} />
      </div>
    </div>
  );
}

function BackgroundBorderShadow() {
  return (
    <div className="bg-[#feae2c] relative rounded-[9999px] shrink-0 size-[64px]" data-name="Background+Border+Shadow">
      <div className="content-stretch flex items-center justify-center overflow-clip p-[2px] relative rounded-[inherit] size-full">
        <Ab6AXuCMlGdDAurKgdU7KGqsem7JBlKusg3Z2DgdspV3QZhVMyf0XyeFWmqE5HpXdPnZPjrHeBlrFtPlvFirUu3YyhShMlO0EtrtNj0R4Nto39Xxn5ImZ1Zo57SHxnliZQvA3773Bl1TX87Em2VyRsfOgxnRxZuFhmSk0OlplHjXgPbKxZBgtBLcZbpJmCe5MKZf4Qo0Ik7TPdcXzvGaV8CyF3GEik0Bi46WUoiUqvmejOnW96AYtw />
      </div>
      <div aria-hidden className="absolute border-2 border-solid border-white inset-0 pointer-events-none rounded-[9999px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}

function Margin() {
  return (
    <div className="content-stretch flex flex-col h-[72px] items-start pb-[8px] relative shrink-0 w-[64px]" data-name="Margin">
      <BackgroundBorderShadow />
    </div>
  );
}

function Heading() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Heading 2">
      <div className="[word-break:break-word] flex flex-col font-['Outfit:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#000218] text-[16px] whitespace-nowrap">
        <p className="leading-[24px]">Iya Basira Food</p>
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#71717a] text-[16px] tracking-[1.6px] uppercase whitespace-nowrap">
        <p className="leading-[24px]">ABU SAMARU CAMPUS</p>
      </div>
    </div>
  );
}

function VendorIdentity() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="Vendor Identity">
      <Margin />
      <Heading />
      <Container3 />
    </div>
  );
}

function VendorIdentityMargin() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[24px] relative shrink-0" data-name="Vendor Identity:margin">
      <VendorIdentity />
    </div>
  );
}

function Margin1() {
  return (
    <div className="relative shrink-0" data-name="Margin">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-[8px] relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#71717a] text-[16px] whitespace-nowrap">
          <p className="leading-[24px]">AMOUNT TO PAY</p>
        </div>
      </div>
    </div>
  );
}

function Container5() {
  return (
    <div className="content-stretch flex flex-col items-center overflow-auto pl-[88.8px] pr-[88.79px] relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#000218] text-[16px] text-center whitespace-nowrap">
        <p className="leading-[24px]">0.00</p>
      </div>
    </div>
  );
}

function Input() {
  return (
    <div className="content-stretch flex flex-col items-start max-w-[240px] overflow-clip px-[12px] py-[8px] relative shrink-0" data-name="Input">
      <Container5 />
    </div>
  );
}

function InputMargin() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[17.34px] max-w-[248px] pl-[8px] top-px" data-name="Input:margin">
      <Input />
    </div>
  );
}

function Container4() {
  return (
    <div className="h-[41px] relative shrink-0 w-[265.34px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <div className="-translate-y-1/2 [word-break:break-word] absolute flex flex-col font-['Liberation_Serif:Regular',sans-serif] justify-center leading-[0] left-0 not-italic text-[#000218] text-[24px] top-[18px] whitespace-nowrap">
          <p className="leading-[36px]">₦</p>
        </div>
        <InputMargin />
      </div>
    </div>
  );
}

function AmountInputDisplay() {
  return (
    <div className="bg-[#f5f3f0] relative rounded-[32px] shrink-0 w-full" data-name="Amount Input Display">
      <div aria-hidden className="absolute border border-[rgba(20,27,60,0.1)] border-solid inset-0 pointer-events-none rounded-[32px]" />
      <div className="flex flex-col items-center justify-center size-full">
        <div className="content-stretch flex flex-col items-center justify-center p-[25px] relative size-full">
          <Margin1 />
          <Container4 />
        </div>
      </div>
    </div>
  );
}

function AmountInputDisplayMargin() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[24px] relative shrink-0 w-full" data-name="Amount Input Display:margin">
      <AmountInputDisplay />
    </div>
  );
}

function Container6() {
  return (
    <div className="h-[20px] relative shrink-0 w-[16px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="20" preserveAspectRatio="none" viewBox="0 0 16 20" width="16">
        <g id="Container">
          <path d={svgPaths.p9899234} fill="var(--fill-0, #000218)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Container7() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#000218] text-[16px] text-center whitespace-nowrap">
        <p className="leading-[24px]">BIYA</p>
      </div>
    </div>
  );
}

function Margin2() {
  return (
    <div className="content-stretch flex flex-col items-start pl-[8px] relative shrink-0" data-name="Margin">
      <Container7 />
    </div>
  );
}

function MarigoldBiyaButton() {
  return (
    <div className="content-stretch flex h-[48px] items-center justify-center opacity-50 relative rounded-[9999px] shrink-0 w-full" data-name="Marigold Biya Button">
      <div aria-hidden className="absolute inset-0 pointer-events-none rounded-[9999px]">
        <div className="absolute bg-[#feae2c] inset-0 rounded-[9999px]" />
        <div className="absolute bg-white inset-0 mix-blend-saturation rounded-[9999px]" />
      </div>
      <Container6 />
      <Margin2 />
    </div>
  );
}

function Container2() {
  return (
    <div className="absolute content-stretch flex flex-col items-center left-0 pb-[48px] px-[24px] right-0 top-[38px]" data-name="Container">
      <VendorIdentityMargin />
      <AmountInputDisplayMargin />
      <MarigoldBiyaButton />
    </div>
  );
}

function Button2() {
  return (
    <div className="bg-[#fbf9f6] col-1 content-stretch flex h-[64px] items-center justify-center justify-self-start px-[51px] relative rounded-[12px] row-1 shrink-0" data-name="Button">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#000218] text-[20px] text-center whitespace-nowrap">
        <p className="leading-[28px]">1</p>
      </div>
    </div>
  );
}

function Button3() {
  return (
    <div className="bg-[#fbf9f6] col-2 content-stretch flex h-[64px] items-center justify-center justify-self-start px-[51px] relative rounded-[12px] row-1 shrink-0" data-name="Button">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#000218] text-[20px] text-center whitespace-nowrap">
        <p className="leading-[28px]">2</p>
      </div>
    </div>
  );
}

function Button4() {
  return (
    <div className="bg-[#fbf9f6] col-3 content-stretch flex h-[64px] items-center justify-center justify-self-start px-[51px] relative rounded-[12px] row-1 shrink-0" data-name="Button">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#000218] text-[20px] text-center whitespace-nowrap">
        <p className="leading-[28px]">3</p>
      </div>
    </div>
  );
}

function Button5() {
  return (
    <div className="bg-[#fbf9f6] col-1 content-stretch flex h-[64px] items-center justify-center justify-self-start px-[51px] relative rounded-[12px] row-2 shrink-0" data-name="Button">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#000218] text-[20px] text-center whitespace-nowrap">
        <p className="leading-[28px]">4</p>
      </div>
    </div>
  );
}

function Button6() {
  return (
    <div className="bg-[#fbf9f6] col-2 content-stretch flex h-[64px] items-center justify-center justify-self-start px-[51px] relative rounded-[12px] row-2 shrink-0" data-name="Button">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#000218] text-[20px] text-center whitespace-nowrap">
        <p className="leading-[28px]">5</p>
      </div>
    </div>
  );
}

function Button7() {
  return (
    <div className="bg-[#fbf9f6] col-3 content-stretch flex h-[64px] items-center justify-center justify-self-start px-[51px] relative rounded-[12px] row-2 shrink-0" data-name="Button">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#000218] text-[20px] text-center whitespace-nowrap">
        <p className="leading-[28px]">6</p>
      </div>
    </div>
  );
}

function Button8() {
  return (
    <div className="bg-[#fbf9f6] col-1 content-stretch flex h-[64px] items-center justify-center justify-self-start px-[51px] relative rounded-[12px] row-3 shrink-0" data-name="Button">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#000218] text-[20px] text-center whitespace-nowrap">
        <p className="leading-[28px]">7</p>
      </div>
    </div>
  );
}

function Button9() {
  return (
    <div className="bg-[#fbf9f6] col-2 content-stretch flex h-[64px] items-center justify-center justify-self-start px-[51px] relative rounded-[12px] row-3 shrink-0" data-name="Button">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#000218] text-[20px] text-center whitespace-nowrap">
        <p className="leading-[28px]">8</p>
      </div>
    </div>
  );
}

function Button10() {
  return (
    <div className="bg-[#fbf9f6] col-3 content-stretch flex h-[64px] items-center justify-center justify-self-start px-[51px] relative rounded-[12px] row-3 shrink-0" data-name="Button">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#000218] text-[20px] text-center whitespace-nowrap">
        <p className="leading-[28px]">9</p>
      </div>
    </div>
  );
}

function Button11() {
  return (
    <div className="bg-[#fbf9f6] col-1 content-stretch flex h-[64px] items-center justify-center justify-self-start px-[51px] relative rounded-[12px] row-4 shrink-0" data-name="Button">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#000218] text-[20px] text-center whitespace-nowrap">
        <p className="leading-[28px]">.</p>
      </div>
    </div>
  );
}

function Button12() {
  return (
    <div className="bg-[#fbf9f6] col-2 content-stretch flex h-[64px] items-center justify-center justify-self-start px-[51px] relative rounded-[12px] row-4 shrink-0" data-name="Button">
      <div className="[word-break:break-word] flex flex-col font-['JetBrains_Mono:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#000218] text-[20px] text-center whitespace-nowrap">
        <p className="leading-[28px]">0</p>
      </div>
    </div>
  );
}

function Container8() {
  return (
    <div className="h-[16px] relative shrink-0 w-[20px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="16" preserveAspectRatio="none" viewBox="0 0 20 16" width="20">
        <g id="Container">
          <path d={svgPaths.p2b799250} fill="var(--fill-0, #000218)" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Button13() {
  return (
    <div className="bg-[#fbf9f6] col-3 content-stretch flex h-[64px] items-center justify-center justify-self-start pl-[44.98px] pr-[45px] relative rounded-[12px] row-4 shrink-0" data-name="Button">
      <Container8 />
    </div>
  );
}

function NumericKeypad() {
  return (
    <div className="absolute bg-[rgba(228,226,223,0.3)] bottom-[-2px] gap-x-[8px] gap-y-[8px] grid grid-cols-[repeat(3,minmax(0,1fr))] grid-rows-[____64px_64px_64px_64px] left-0 px-[16px] py-[24px] right-0" data-name="Numeric Keypad">
      <Button2 />
      <Button3 />
      <Button4 />
      <Button5 />
      <Button6 />
      <Button7 />
      <Button8 />
      <Button9 />
      <Button10 />
      <Button11 />
      <Button12 />
      <Button13 />
    </div>
  );
}

function ActiveBottomSheet() {
  return (
    <div className="absolute bg-[#fbf9f6] bottom-0 h-[751px] left-0 overflow-clip right-0 rounded-tl-[40px] rounded-tr-[40px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]" data-name="Active Bottom Sheet">
      <HandleMargin />
      <Container2 />
      <NumericKeypad />
    </div>
  );
}

export default function ScanToPay() {
  return (
    <div className="relative size-full" style={{ backgroundImage: "linear-gradient(90deg, rgb(0, 0, 0) 0%, rgb(0, 0, 0) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" }} data-name="Scan to Pay">
      <CameraViewfinderLayer />
      <UiControlsBackFlash />
      <ActiveBottomSheet />
    </div>
  );
}