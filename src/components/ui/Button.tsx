// Single source of truth for every button on the site. All buttons share the
// same height, radius, typography, transitions, and responsive behavior —
// only color/intent varies via the `variant` prop. This replaces the
// inconsistent one-off button classNames scattered across pages.
import type { ReactNode, ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";
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
  sm: "px-4 py-2 text-sm rounded-lg gap-1.5",
  md: "px-6 py-3 text-sm rounded-xl gap-2",
  lg: "px-8 py-4 text-base rounded-xl gap-2.5",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center font-semibold transition-all duration-300 whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50";

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  children: ReactNode;
  className?: string;
}

// Renders as internal route (react-router Link)
interface LinkButtonProps extends CommonProps {
  to: string;
  href?: never;
  onClick?: never;
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

export default function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    fullWidth = false,
    icon,
    iconPosition = "right",
    children,
    className = "",
  } = props;

  const classes = `${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${
    fullWidth ? "w-full" : ""
  } ${className}`;

  const content = (
    <>
      {icon && iconPosition === "left" && icon}
      {children}
      {icon && iconPosition === "right" && icon}
    </>
  );

  if ("to" in props && props.to) {
    return (
      <Link to={props.to} className={classes}>
        {content}
      </Link>
    );
  }

  if ("href" in props && props.href) {
    const { variant: _v, size: _s, fullWidth: _fw, icon: _i, iconPosition: _ip, children: _c, className: _cl, to: _t, href, ...anchorProps } = props;
    return (
      <a href={href} className={classes} {...anchorProps}>
        {content}
      </a>
    );
  }

  const { variant: _v2, size: _s2, fullWidth: _fw2, icon: _i2, iconPosition: _ip2, children: _c2, className: _cl2, to: _t2, href: _h2, ...buttonProps } = props as NativeButtonProps;
  return (
    <button className={classes} {...buttonProps}>
      {content}
    </button>
  );
}