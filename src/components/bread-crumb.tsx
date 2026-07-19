import { Description } from "@heroui/react";

interface Props {
  title: string;
  description: string;
  children?: React.ReactNode;
}

export const BreadCrumb: React.FC<Props> = (props) => {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">{props.title}</h1>
        <Description>{props.description}</Description>
      </div>
      {props.children && <div className="flex shrink-0 items-center">{props.children}</div>}
    </div>
  );
};
