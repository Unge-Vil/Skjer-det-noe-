import {
  Accessibility,
  ArrowLeft,
  ArrowRight,
  Ban,
  BellRing,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clapperboard,
  ClipboardList,
  Clock,
  DoorOpen,
  ExternalLink,
  Eye,
  Gamepad2,
  GraduationCap,
  Heart,
  House,
  HouseHeart,
  Image as ImageIcon,
  Info,
  LayoutDashboard,
  List,
  LoaderCircle,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Monitor,
  Moon,
  Music,
  Palette,
  Pencil,
  Plus,
  Repeat,
  Search,
  Settings,
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
  "bell-ring": BellRing,
  "building-2": Building2,
  "calendar-days": CalendarDays,
  check: Check,
  "check-circle-2": CheckCircle2,
  "chevron-down": ChevronDown,
  circle: Circle,
  clapperboard: Clapperboard,
  "clipboard-list": ClipboardList,
  clock: Clock,
  "door-open": DoorOpen,
  "external-link": ExternalLink,
  eye: Eye,
  "gamepad-2": Gamepad2,
  "graduation-cap": GraduationCap,
  heart: Heart,
  house: House,
  "house-heart": HouseHeart,
  image: ImageIcon,
  info: Info,
  "layout-dashboard": LayoutDashboard,
  list: List,
  "loader-circle": LoaderCircle,
  "locate-fixed": LocateFixed,
  map: MapIcon,
  "map-pin": MapPin,
  monitor: Monitor,
  moon: Moon,
  music: Music,
  palette: Palette,
  pencil: Pencil,
  plus: Plus,
  repeat: Repeat,
  search: Search,
  settings: Settings,
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
