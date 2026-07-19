"use client";

import React, { useMemo, useState } from "react";
import { useAsyncList } from "@react-stately/data";
import { ListBoxLoadMoreItem } from "react-aria-components";
import {
  Autocomplete,
  EmptyState,
  Key,
  Label,
  ListBox,
  SearchField,
  Tag,
  TagGroup,
  Avatar,
  useFilter,
  FieldError,
  Spinner,
} from "@heroui/react";

import { Utils } from "@/lib/utils";

interface Props {
  formik: any;
  name: string;
  label: string;
  network?: string;
  placeholder?: string;
  isRequired?: boolean;
  prefix?: React.ReactNode;
  options: ISelectOption[];
  defaultSelected?: Key | Key[];
  selectionMode?: "single" | "multiple";
}

export const AutocompleteInput: React.FC<Props> = ({ isRequired = true, selectionMode = "single", ...props }) => {
  const API_URL = String(process.env.NEXT_PUBLIC_API_URL);
  const { contains } = useFilter({ sensitivity: "base" });

  const formikValue = Utils.instance.getValueByPath(props.formik?.values, props.name);
  const initialSelected = formikValue
    ? selectionMode === "multiple"
      ? Array.isArray(formikValue)
        ? formikValue
        : []
      : formikValue
    : props.defaultSelected
      ? selectionMode === "multiple"
        ? Array.isArray(props.defaultSelected)
          ? props.defaultSelected
          : [props.defaultSelected]
        : props.defaultSelected
      : selectionMode === "multiple"
        ? []
        : "";

  const [result, setResult] = useState({ page: 1, totalPages: 1 });
  const [selectedKeys, setSelectedKeys] = useState<Key[] | Key>(initialSelected);

  const onRemoveTags = (keys: Set<Key>) =>
    setSelectedKeys((prev) => (Array.isArray(prev) ? prev.filter((key) => !keys.has(key)) : prev));

  const list = useAsyncList<ISelectOption>({
    async load({ cursor, signal }) {
      if (props.options && props.network) {
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

  React.useEffect(() => {
    if (formikValue !== undefined && formikValue !== null) {
      setSelectedKeys(selectionMode === "multiple" ? (Array.isArray(formikValue) ? formikValue : []) : formikValue);
    } else if (props.defaultSelected !== undefined) {
      setSelectedKeys(
        selectionMode === "multiple"
          ? Array.isArray(props.defaultSelected)
            ? props.defaultSelected
            : [props.defaultSelected]
          : props.defaultSelected,
      );
    }
  }, [formikValue, props.defaultSelected, selectionMode]);

  const meta = useMemo(() => {
    const error = Utils.instance.getValueByPath(props.formik?.errors, props.name);
    const touched = Utils.instance.getValueByPath(props.formik?.touched, props.name);
    return {
      error,
      touched,
      errorMessage: typeof error === "string" ? error : undefined,
    };
  }, [props.formik?.errors, props.formik?.touched, props.name]);

  const hasError = Boolean(meta.error && (meta.touched || props.formik?.submitCount > 0));

  return (
    <Autocomplete
      fullWidth
      name={props.name}
      isRequired={isRequired}
      placeholder={props.placeholder}
      isInvalid={hasError}
      selectionMode={selectionMode}
      value={selectedKeys}
      variant="secondary"
      validate={meta.error}
      aria-label={props.label}
      onChange={(keys: Key | Key[] | null) => {
        setSelectedKeys(keys as Key[]);
        props.formik.setFieldValue(props.name, keys);
      }}
    >
      <Label className="ml-0.5">{props.label}</Label>
      <Autocomplete.Trigger className="flex items-center">
        {props.prefix}
        <Autocomplete.Value>
          {({ defaultChildren, isPlaceholder, state }: any) => {
            if (isPlaceholder || state.selectedItems.length === 0) return defaultChildren;
            const selectedItemsKeys = state.selectedItems.map((item: any) => item.key);
            return (
              <TagGroup size="sm" onRemove={onRemoveTags}>
                <TagGroup.List>
                  {selectedItemsKeys.map((selectedItemKey: Key, idx: number) => {
                    const item = list.items.find((s) => s.value === selectedItemKey);
                    if (!item) return null;
                    return (
                      <Tag key={idx} id={item.value}>
                        {item.label}
                      </Tag>
                    );
                  })}
                </TagGroup.List>
              </TagGroup>
            );
          }}
        </Autocomplete.Value>
        <Autocomplete.ClearButton />
        <Autocomplete.Indicator />
      </Autocomplete.Trigger>
      <Autocomplete.Popover>
        <Autocomplete.Filter filter={contains}>
          <SearchField autoFocus name="search" variant="secondary">
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search..." />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
          <ListBox selectionMode={selectionMode} renderEmptyState={() => <EmptyState>No results found</EmptyState>}>
            {list.items.map((item, idx: number) => (
              <ListBox.Item id={item.value} key={idx} textValue={item.label}>
                {item.src && (
                  <Avatar className="inline-block h-5 w-5 align-middle">
                    <Avatar.Image src={item.src} alt={item.label} />
                    <Avatar.Fallback>{item.label.charAt(0)}</Avatar.Fallback>
                  </Avatar>
                )}
                {item.label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
            {props.network && result.page < result.totalPages && (
              <ListBoxLoadMoreItem isLoading={list.loadingState === "loadingMore"} onLoadMore={list.loadMore}>
                <div className="flex items-center justify-center gap-2 py-2">
                  <Spinner size="sm" />
                  <span className="text-muted text-sm">Loading more...</span>
                </div>
              </ListBoxLoadMoreItem>
            )}
          </ListBox>
        </Autocomplete.Filter>
      </Autocomplete.Popover>
      <FieldError>{meta.errorMessage}</FieldError>
    </Autocomplete>
  );
};
