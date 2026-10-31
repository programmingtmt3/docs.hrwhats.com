"use client";

import { useState } from "react";

export function Feedback({ question, thanks }: { question: string; thanks: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="mt-8 border-t border-line pt-5 text-center">
      <b className="mb-2 block">{done ? thanks : question}</b>
      {!done && ["😞", "😐", "😃"].map((e) => (
        <button key={e} type="button" onClick={() => setDone(true)}
          className="mx-1 size-[46px] rounded-full border border-line bg-bg text-[22px] hover:border-brand">{e}</button>
      ))}
    </div>
  );
}
