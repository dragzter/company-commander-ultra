export function enableBtn(btn: HTMLButtonElement) {
  if (!btn) throw new Error("No button element provided");

  btn.classList.remove("disabled");
  btn.disabled = false;
}

export function disableBtn(btn: HTMLButtonElement) {
  if (!btn) throw new Error("No button element provided");
  btn.classList.add("disabled");
  btn.disabled = true;
}
