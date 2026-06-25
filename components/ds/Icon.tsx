import {
  Accessibility,
  ArrowLeft,
  ArrowRight,
  Ban,
  CalendarDays,
  Check,
  ChevronDown,
  Clapperboard,
  ClipboardList,
  Clock,
  DoorOpen,
  Gamepad2,
  GraduationCap,
  Heart,
  House,
  HouseHeart,
  Info,
  List,
  LoaderCircle,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Monitor,
  Moon,
  Music,
  Palette,
  Search,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Tag,
  TentTree,
  UserX,
  UsersRound,
  Volleyball,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";

const REGISTRY = {
  accessibility: Accessibility,
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  ban: Ban,
  "calendar-days": CalendarDays,
  check: Check,
  "chevron-down": ChevronDown,
  clapperboard: Clapperboard,
  "clipboard-list": ClipboardList,
  clock: Clock,
  "door-open": DoorOpen,
  "gamepad-2": Gamepad2,
  "graduation-cap": GraduationCap,
  heart: Heart,
  house: House,
  "house-heart": HouseHeart,
  info: Info,
  list: List,
  "loader-circle": LoaderCircle,
  "locate-fixed": LocateFixed,
  map: MapIcon,
  "map-pin": MapPin,
  monitor: Monitor,
  moon: Moon,
  music: Music,
  palette: Palette,
  search: Search,
  "sliders-horizontal": SlidersHorizontal,
  sparkles: Sparkles,
  sun: Sun,
  tag: Tag,
  "tent-tree": TentTree,
  "user-x": UserX,
  "users-round": UsersRound,
  volleyball: Volleyball,
  wallet: Wallet,
  x: X,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof REGISTRY;

export function Icon({
  name,
  size = 20,
  className,
  color,
  fill,
  strokeWidth = 2,
}: {
  name: IconName;
  size?: number;
  className?: string;
  color?: string;
  fill?: string;
  strokeWidth?: number;
}) {
  const Cmp = REGISTRY[name];
  return (
    <Cmp
      size={size}
      className={className}
      color={color}
      fill={fill}
      strokeWidth={strokeWidth}
      aria-hidden="true"
    />
  );
}
