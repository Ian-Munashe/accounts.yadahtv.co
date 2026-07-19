"use client";

import { useAsyncList } from "@react-stately/data";
import { Collection, ListBoxLoadMoreItem } from "react-aria-components";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Avatar, Select, Label, Key, ListBox, FieldError, Spinner } from "@heroui/react";

import { Utils } from "@/lib/utils";

interface SelectInputProps {
  formik: any;
  name: string;
  label: string;
  network?: string;
  placeholder?: string;
  isRequired?: boolean;
  prefix?: React.ReactNode;
  options?: ISelectOption[];
  isDisabled?: boolean;
  selectionMode?: "single" | "multiple";
}

export const SelectInput: React.FC<SelectInputProps> = ({
  isRequired = true,
  selectionMode = "single",
  isDisabled = false,
  ...props
}) => {
  const API_URL = String(process.env.NEXT_PUBLIC_API_URL);
  const formikValue = Utils.instance.getValueByPath(props.formik?.values, props.name);

  const [selected, setSelected] = useState<Key[] | Key>();
  const [result, setResult] = useState({ page: 1, totalPages: 1 });

  const list = useAsyncList<ISelectOption>({
    async load({ cursor, signal }) {
      if (!props.options && props.network) {
        const url = cursor || `${API_URL}${props.network}?page=${result.page}`;
        const response = await fetch(url, { signal });
        const json = await response.json();
        const mapped: ISelectOption[] = json.results.map((item: any) => ({
          label: item.name,
          value: item._id,
        }));
        if (json.page < json.totalPages) setResult((prev) => ({ ...prev, page: prev.page + 1 }));
        return { cursor: `${API_URL}${props.network}?page=${result.page}`, items: mapped };
      }
      return { items: props.options || [], cursor: undefined };
    },
  });

  const meta = useMemo(() => {
    const error = Utils.instance.getValueByPath(props.formik?.errors, props.name);
    const touched = Utils.instance.getValueByPath(props.formik?.touched, props.name);
    return {
      error,
      touched,
      errorMessage: typeof error === "string" ? error : undefined,
    };
  }, [props.formik?.errors, props.formik?.touched, props.name]);

  const selectRef = useRef<HTMLDivElement>(null);
  const hasError = Boolean(meta.error && (meta.touched || props.formik?.submitCount > 0));

  useEffect(() => {
    setSelected(selectionMode === "multiple" ? (Array.isArray(formikValue) ? formikValue : []) : formikValue);
  }, [formikValue, selectionMode]);

  useLayoutEffect(() => {
    if (!props.options && !props.network) {
      throw new Error("SelectInput requires either options or network prop");
    }
  }, [props.options, props.network]);

  return (
    <div ref={selectRef} className="w-full">
      <Select
        fullWidth
        name={props.name}
        isRequired={isRequired}
        isDisabled={isDisabled}
        isInvalid={hasError}
        variant="secondary"
        value={selected}
        selectionMode={selectionMode}
        placeholder={props.placeholder}
        aria-label={props.label}
        onChange={(keys) => {
          setSelected(keys as any);
          props.formik.setFieldValue(props.name, keys);
        }}
      >
        <Label className="ml-0.5">{props.label}</Label>
        <Select.Trigger>
          <Select.Value>
            {({ defaultChildren, isPlaceholder, state }) => {
              let valueContent = null;
              if (isPlaceholder || !state.selectedItems.length) {
                valueContent = defaultChildren;
              } else if (selectionMode === "single") {
                const selectedKey = state.selectedItems[0]?.key;
                const selectedItem = list.items.find((item) => item.value === selectedKey);
                valueContent = selectedItem ? selectedItem.label : defaultChildren;
              } else {
                const selectedLabels = state.selectedItems
                  .map((sel) => {
                    const found = list.items.find((item) => item.value === sel.key);
                    return found ? found.label : sel.textValue;
                  })
                  .filter(Boolean);
                valueContent = selectedLabels.join(", ");
              }
              return (
                <span className="flex items-center gap-1 py-0 text-[15px] leading-[1.2]">
                  {props.prefix && <span className="text-default-500 flex items-center mr-0.5">{props.prefix}</span>}
                  <span className="truncate">{valueContent}</span>
                </span>
              );
            }}
          </Select.Value>
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <Collection items={list.items}>
              {(item: ISelectOption) => (
                <ListBox.Item id={item.value} textValue={item.label}>
                  {item.src && (
                    <Avatar className="inline-block h-5 w-5 align-middle">
                      <Avatar.Image src={item.src} alt={item.label} />
                      <Avatar.Fallback>{item.label.charAt(0)}</Avatar.Fallback>
                    </Avatar>
                  )}
                  {item.label}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              )}
            </Collection>
            {props.network && result.page < result.totalPages && (
              <ListBoxLoadMoreItem isLoading={list.loadingState === "loadingMore"} onLoadMore={list.loadMore}>
                <div className="flex items-center justify-center gap-2 py-2">
                  <Spinner size="sm" />
                  <span className="text-muted text-sm">Loading more...</span>
                </div>
              </ListBoxLoadMoreItem>
            )}
          </ListBox>
        </Select.Popover>
        <FieldError>{meta.errorMessage}</FieldError>
      </Select>
    </div>
  );
};
