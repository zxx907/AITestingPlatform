/**
 * 建筑蓝图美学装饰元素组件库
 * 提供 CAD 风格的网格、线条、框架等装饰元素
 */

/**
 * 网格背景组件
 * 模拟 CAD 工程制图的网格背景
 */
export function GridBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none grid-background" />
  );
}

/**
 * 技术线条分隔符 - 水平
 */
export function TechLineDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent ${className}`} />
  );
}

/**
 * 技术线条分隔符 - 垂直
 */
export function TechLineVertical({ className = "" }: { className?: string }) {
  return (
    <div className={`w-px bg-gradient-to-b from-transparent via-accent/30 to-transparent ${className}`} />
  );
}

/**
 * CAD 风格框架组件
 * 带有蓝图效果的边框框架
 */
export function BlueprintFrame({
  children,
  className = "",
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <div className={`blueprint-card ${className}`}>
      {title && (
        <div className="px-4 py-3 border-b border-border/50">
          <h3 className="text-sm font-semibold text-accent uppercase tracking-widest">
            {title}
          </h3>
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

/**
 * 尺寸标注线组件
 * 模拟 CAD 中的尺寸标注
 */
export function DimensionLine({
  label,
  direction = "horizontal",
  className = "",
}: {
  label?: string;
  direction?: "horizontal" | "vertical";
  className?: string;
}) {
  if (direction === "horizontal") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex-1 h-px bg-accent/20" />
        {label && <span className="text-xs text-accent/60 px-2">{label}</span>}
        <div className="flex-1 h-px bg-accent/20" />
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="flex-1 w-px bg-accent/20" />
      {label && <span className="text-xs text-accent/60 py-2">{label}</span>}
      <div className="flex-1 w-px bg-accent/20" />
    </div>
  );
}

/**
 * 技术强调线组件
 * 左侧竖线强调
 */
export function TechAccentLine({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`tech-accent-left ${className}`}>
      {children}
    </div>
  );
}

/**
 * 坐标网格背景
 * 模拟工程制图的坐标网格
 */
export function CoordinateGrid({
  size = 50,
  opacity = 0.05,
}: {
  size?: number;
  opacity?: number;
}) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{
        backgroundImage: `
          linear-gradient(rgba(0, 212, 255, ${opacity}) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 212, 255, ${opacity}) 1px, transparent 1px)
        `,
        backgroundSize: `${size}px ${size}px`,
      }}
    />
  );
}

/**
 * 数据流动线条
 * 模拟数据流的动画线条
 */
export function DataFlowLine({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div className={`relative h-1 bg-gradient-to-r from-transparent via-accent to-transparent ${className}`}>
      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
    </div>
  );
}

/**
 * 蓝图风格徽章
 */
export function BlueprintBadge({
  children,
  variant = "default",
  className = "",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error";
  className?: string;
}) {
  const variants = {
    default: "badge-blueprint",
    success: "badge-success",
    warning: "badge-warning",
    error: "badge-error",
  };

  return (
    <span className={`${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

/**
 * 蓝图风格加载指示器
 */
export function BlueprintLoader({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeMap = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  };

  return (
    <div className={`${sizeMap[size]} ${className}`}>
      <svg
        className="w-full h-full animate-spin"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2"
          strokeOpacity="0.2"
          className="text-accent/20"
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-accent"
        />
      </svg>
    </div>
  );
}

/**
 * 蓝图风格脉冲效果
 */
export function BlueprintPulse({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`pulse-glow ${className}`}>
      {children}
    </div>
  );
}

/**
 * 蓝图风格分隔线
 */
export function BlueprintDivider({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div className={`divider-blueprint ${className}`} />
  );
}

/**
 * 蓝图风格工具提示
 */
export function BlueprintTooltip({
  children,
  content,
  className = "",
}: {
  children: React.ReactNode;
  content: string;
  className?: string;
}) {
  return (
    <div className={`group relative inline-block ${className}`}>
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block">
        <div className="tooltip-blueprint whitespace-nowrap">
          {content}
        </div>
      </div>
    </div>
  );
}

/**
 * 蓝图风格进度条
 */
export function BlueprintProgress({
  value,
  max = 100,
  className = "",
}: {
  value: number;
  max?: number;
  className?: string;
}) {
  const percentage = (value / max) * 100;

  return (
    <div className={`w-full h-2 bg-blueprint-light rounded-sm overflow-hidden ${className}`}>
      <div
        className="h-full bg-gradient-to-r from-accent to-tech-blue transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

/**
 * 蓝图风格统计卡片
 */
export function StatCard({
  label,
  value,
  unit = "",
  icon,
  trend,
  className = "",
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  trend?: { value: number; direction: "up" | "down" };
  className?: string;
}) {
  return (
    <div className={`stat-card ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{label}</p>
          <p className="stat-value">
            {value}
            {unit && <span className="text-lg ml-1">{unit}</span>}
          </p>
        </div>
        {icon && <div className="text-accent/60">{icon}</div>}
      </div>
      {trend && (
        <div className={`text-xs mt-2 ${trend.direction === "up" ? "text-green-400" : "text-red-400"}`}>
          {trend.direction === "up" ? "↑" : "↓"} {Math.abs(trend.value)}%
        </div>
      )}
    </div>
  );
}
