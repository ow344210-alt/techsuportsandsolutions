// Single source of truth for every button on the site. All buttons share the
// same height, radius, typography, transitions, and responsive behavior —
// only color/intent varies via the `variant` prop. This replaces the
// inconsistent one-off button classNames scattered across pages.
import React, { type ReactNode, type ButtonHTMLAttributes, type AnchorHTMLAttributes } from "react";
import { Link } from "react-router-dom";

type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90 shadow-lg shadow-purple-500/20",
  secondary:
    "bg-white/5 text-white border border-white/10 hover:bg-white/10",
  outline:
    "bg-transparent text-white border border-purple-400/40 hover:bg-purple-500/10",
  danger:
    "bg-rose-500/15 text-rose-300 border border-rose-500/20 hover:bg-rose-500/25",
  ghost:
    "bg-transparent text-purple-400 hover:text-pink-400",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm gap-1.5",
  md: "px-6 py-3 text-sm gap-2",
  lg: "px-8 py-4 text-base gap-2.5",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center font-semibold transition-all duration-300 whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50";

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  loading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

// Renders as internal route (react-router Link)
interface LinkButtonProps extends CommonProps {
  to: string;
  href?: never;
  onClick?: () => void;
}

// Renders as external link
interface AnchorButtonProps extends CommonProps, Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children"> {
  href: string;
  to?: never;
}

// Renders as a native button
interface NativeButtonProps extends CommonProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> {
  to?: never;
  href?: never;
}

type ButtonProps = LinkButtonProps | AnchorButtonProps | NativeButtonProps;

type ButtonRef = HTMLButtonElement;

function getButtonClasses(
  variant: ButtonVariant,
  size: ButtonSize,
  fullWidth: boolean | undefined,
  className: string | undefined,
  loading: boolean | undefined,
): string {
  return `${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${
    fullWidth ? "w-full" : ""
  } ${loading ? "cursor-wait" : ""} ${className ?? ""}`;
}

function getContent(
  icon: ReactNode | undefined,
  iconPosition: "left" | "right" | undefined,
  children: ReactNode,
  loading: boolean | undefined,
  loadingText: string | undefined,
): ReactNode {
  if (loading) {
    return (
      <>
        {icon && iconPosition === "left" && icon}
        {loadingText ?? children}
        {icon && iconPosition === "right" && icon}
      </>
    );
  }
  return (
    <>
      {icon && iconPosition === "left" && icon}
      {children}
      {icon && iconPosition === "right" && icon}
    </>
  );
}

const Button = /* @__PURE__ */ React.forwardRef<ButtonRef, ButtonProps>(
  function Button(props, ref) {
    const {
      variant = "primary",
      size = "md",
      fullWidth = false,
      icon,
      iconPosition = "right",
      loading = false,
      loadingText,
      children,
      className = "",
      disabled,
      to,
      href,
      ...rest
    } = props;

    const classes = getButtonClasses(variant, size, fullWidth, className, loading);
    const isDisabled = disabled ?? loading;

    const content = getContent(icon, iconPosition, children, loading, loadingText);

    if (to) {
      const linkProps = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
      return (
        <Link to={to} className={classes} onClick={linkProps.onClick}>
          {content}
        </Link>
      );
    }

    if (href) {
      const anchorProps = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
      return (
        <a href={href} className={classes} {...anchorProps}>
          {content}
        </a>
      );
    }

    const buttonProps = rest as ButtonHTMLAttributes<HTMLButtonElement>;
    return (
      <button ref={ref} className={classes} disabled={isDisabled} {...buttonProps}>
        {content}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;