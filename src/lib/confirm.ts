// Shared SweetAlert2 confirmation helper.
//
// Every admin confirmation goes through `showConfirm` so the modal always
// matches the site theme (deep-navy glass in dark mode, light glass in light
// mode) without duplicating styling in each manager. It is the ONLY place
// that themes SweetAlert2. Callers keep ownership of the Confirm/Cancel logic:
// the helper only builds the themed modal, resolves with the normal
// SweetAlert2 result, and never mutates anything on its own.
//
// - `variant: "danger"`  -> red confirm (delete / disable / irreversible)
// - `variant: "default"` -> purple/blue confirm (role, status, etc.)
import Swal from "sweetalert2";
import type { SweetAlertOptions, SweetAlertResult } from "sweetalert2";

export type ConfirmVariant = "danger" | "default";

export interface ShowConfirmOptions {
  title: string;
  text?: string;
  html?: string;
  icon?: SweetAlertOptions["icon"];
  confirmButtonText?: string;
  cancelButtonText?: string;
  variant?: ConfirmVariant;
}

/** Max ~416px on desktop, always keeps safe viewport margins on phones. */
const RESPONSIVE_WIDTH = "min(26rem, calc(100vw - 2rem))";

export const THEME_CLASS = "tss-swal";

export async function showConfirm(
  options: ShowConfirmOptions
): Promise<SweetAlertResult> {
  const variant: ConfirmVariant = options.variant ?? "default";

  return Swal.fire({
    title: options.title,
    text: options.text,
    html: options.html,
    icon: options.icon ?? "warning",
    showCancelButton: true,
    confirmButtonText: options.confirmButtonText ?? "Confirm",
    cancelButtonText: options.cancelButtonText ?? "Cancel",
    width: RESPONSIVE_WIDTH,
    buttonsStyling: false,
    customClass: {
      container: "tss-swal-container",
      popup: `${THEME_CLASS} tss-swal--${variant}`,
      icon: "tss-swal-icon",
      title: "tss-swal-title",
      htmlContainer: "tss-swal-html",
      confirmButton: "tss-swal-confirm",
      cancelButton: "tss-swal-cancel",
    },
  });
}
