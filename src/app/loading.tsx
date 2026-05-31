import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-knote-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-[-10px] rounded-[28px] bg-knote-primary/10 blur-xl" />
          <Image
            src="/logo.png"
            alt="KNote"
            width={80}
            height={80}
            className="relative h-20 w-20 rounded-[22px]"
            priority
          />
        </div>
        <div className="h-1 w-28 overflow-hidden rounded-full bg-knote-border/70">
          <div className="h-full w-1/2 animate-[pulse_1.2s_ease-in-out_infinite] rounded-full bg-knote-primary/55" />
        </div>
      </div>
    </div>
  );
}
