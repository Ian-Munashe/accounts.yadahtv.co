"use client";

import { LuInbox } from "react-icons/lu";
import { Card, CardHeader, Description, cn } from "@heroui/react";

interface NoDataProps {
  title?: string;
  className?: string;
  description?: string;
  showIcon?: boolean;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const NoData: React.FC<NoDataProps> = ({
  showIcon = true,
  title = "No data available",
  description = "There isn't anything to display yet. Try adjusting your filters or check back later.",
  ...props
}) => {
  return (
    <Card
      className={cn(
        "border-border bg-surface-alt flex flex-col items-center justify-center gap-4 rounded-2xl border px-8 py-16 text-center",
        props.className,
      )}
    >
      {showIcon && (
        <CardHeader className="flex flex-col items-center justify-center p-0">
          <div className="bg-accent/10 text-accent flex h-16 w-16 items-center justify-center rounded-full">
            {props.icon ?? <LuInbox className="h-8 w-8" />}
          </div>
        </CardHeader>
      )}
      <Card.Content className="flex flex-col items-center justify-center p-0">
        <div className="text-foreground-muted space-y-2">
          <h3 className="text-foreground text-center text-lg font-semibold">{title}</h3>
          {description ? <Description>{description}</Description> : null}
        </div>
        {props.action ? <div className="mt-4">{props.action}</div> : null}
      </Card.Content>
    </Card>
  );
};
