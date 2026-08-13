import { LuShieldAlert } from "react-icons/lu";
import React, { useEffect, useState } from "react";
import { Accordion, Button, Checkbox, Chip, cn, Description, Drawer, Separator } from "@heroui/react";

import { permissions } from "@/permissions";

interface Props {
  isOpen: boolean;
  permissions: string[];
  onSave?: (value: string[]) => void;
  onOpenChange: (value: boolean) => void;
}

export const PermissionsDrawer: React.FC<Props> = (props) => {
  const [selected, setSelected] = useState<string[]>(props.permissions);

  const handleTogglePermission = (permission: string, categoryPermissions: ISelectOption[], exclusive?: boolean) => {
    setSelected((prev) => {
      if (prev.includes(permission)) return prev.filter((p) => p !== permission);

      const categoryValues = new Set(categoryPermissions.map((p) => p.value));
      const withoutCategory = exclusive ? prev.filter((p) => !categoryValues.has(p)) : prev;
      return [...withoutCategory, permission];
    });
  };

  const handleSave = () => {
    props.onSave?.(selected);
    props.onOpenChange(false);
  };

  useEffect(() => {
    if (props.isOpen) setSelected(props.permissions);
  }, [props.isOpen, props.permissions]);

  return (
    <Drawer isOpen={props.isOpen} onOpenChange={props.onOpenChange}>
      <Drawer.Backdrop className="z-9999">
        <Drawer.Content placement="right">
          <Drawer.Dialog>
            <Drawer.Handle />
            <Drawer.CloseTrigger />
            <Drawer.Header>
              <Drawer.Heading className="flex items-center gap-2 text-lg font-bold">
                <LuShieldAlert className="text-accent" size={20} />
                System Permissions
              </Drawer.Heading>
              <Description className="text-muted text-xs font-normal">
                Choose application security permissions based on categories.
              </Description>
            </Drawer.Header>
            <Separator className="my-4" />
            <Drawer.Body>
              <div className="text-muted flex items-center justify-between px-1 text-xs font-medium">
                <span>Selected: {selected.length} items</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn("text-accent invisible text-xs", { visible: selected.length > 0 })}
                  onPress={() => setSelected([])}
                >
                  Clear All
                </Button>
              </div>
              <Accordion className="w-full max-w-md" variant="surface">
                {permissions.map(({ category, permissions: categoryPermissions, exclusive }) => {
                  const activeCount = categoryPermissions.filter((p) => selected.includes(p.value)).length;
                  return (
                    <Accordion.Item key={category}>
                      <Accordion.Heading>
                        <Accordion.Trigger>
                          <div className="flex items-center gap-2">
                            <span className="text-foreground text-sm font-semibold">{category}</span>
                            {activeCount > 0 && (
                              <Chip size="sm" className="bg-accent/10 text-accent font-semibold">
                                {activeCount} selected
                              </Chip>
                            )}
                          </div>
                          <Accordion.Indicator />
                        </Accordion.Trigger>
                      </Accordion.Heading>
                      <Accordion.Panel>
                        <Accordion.Body className="flex flex-col gap-3">
                          {categoryPermissions.length === 0 ? (
                            <p className="text-muted py-1 text-xs italic">No permissions configured.</p>
                          ) : (
                            categoryPermissions.map(({ label, value }) => {
                              const isChecked = selected.includes(value);
                              return (
                                <Checkbox
                                  id={value}
                                  key={value}
                                  isSelected={isChecked}
                                  onChange={() => handleTogglePermission(value, categoryPermissions, exclusive)}
                                >
                                  <Checkbox.Content className="cursor-pointer text-xs select-none">
                                    <Checkbox.Control className="bg-muted/30">
                                      <Checkbox.Indicator className="text-accent-foreground" />
                                    </Checkbox.Control>
                                    <span className="text-foreground font-mono font-medium">{label}</span>
                                  </Checkbox.Content>
                                </Checkbox>
                              );
                            })
                          )}
                        </Accordion.Body>
                      </Accordion.Panel>
                    </Accordion.Item>
                  );
                })}
              </Accordion>
            </Drawer.Body>
            <Drawer.Footer>
              <Button slot="close" variant="secondary">
                Cancel
              </Button>
              <Button onPress={handleSave}>Apply Permissions</Button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
};
