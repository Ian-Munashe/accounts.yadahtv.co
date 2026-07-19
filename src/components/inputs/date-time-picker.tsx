"use client";

import React, { Fragment, useMemo } from "react";
import { parseAbsoluteToLocal } from "@internationalized/date";
import { Calendar, DateField, DatePicker, FieldError, Label, TimeField, TimeValue } from "@heroui/react";

import { Utils } from "@/lib/utils";

interface Props {
  formik: any;
  name: string;
  label?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  hideTimeZone?: boolean;
  granularity?: "day" | "hour" | "minute" | "second";
}

export const DateTimePicker: React.FC<Props> = ({ isRequired = true, isDisabled = false, ...props }: Props & any) => {
  const hourCycle = 24;
  const timeGranularity = props.granularity !== "day" ? props.granularity : undefined;
  const showTimeField = !!timeGranularity;

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
    <DatePicker
      name={props.name}
      hourCycle={hourCycle}
      key={props.granularity}
      isRequired={isRequired}
      isDisabled={isDisabled}
      granularity={props.granularity}
      hideTimeZone={props.hideTimeZone}
      isInvalid={hasError}
      className="w-full"
      shouldForceLeadingZeros={true}
      value={props.formik.values[props.name] ? parseAbsoluteToLocal(props.formik.values[props.name]) : undefined}
      onChange={(value: any) => {
        if (!value) return;
        const dateTime = value.toDate ? new Date(value.toDate()) : new Date(value);
        props.formik.setFieldValue(props.name, dateTime.toISOString());
      }}
    >
      {({ state }) => (
        <Fragment>
          <Label className="ml-0.5">{props.label}</Label>
          <DateField.Group fullWidth variant="secondary">
            <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
            <DateField.Suffix>
              <DatePicker.Trigger>
                <DatePicker.TriggerIndicator />
              </DatePicker.Trigger>
            </DateField.Suffix>
          </DateField.Group>
          <DatePicker.Popover>
            <Calendar aria-label="Event date">
              <Calendar.Header>
                <Calendar.YearPickerTrigger>
                  <Calendar.YearPickerTriggerHeading />
                  <Calendar.YearPickerTriggerIndicator />
                </Calendar.YearPickerTrigger>
                <Calendar.NavButton slot="previous" />
                <Calendar.NavButton slot="next" />
              </Calendar.Header>
              <Calendar.Grid>
                <Calendar.GridHeader>{(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}</Calendar.GridHeader>
                <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
              </Calendar.Grid>
              <Calendar.YearPickerGrid>
                <Calendar.YearPickerGridBody>
                  {({ year }) => <Calendar.YearPickerCell year={year} />}
                </Calendar.YearPickerGridBody>
              </Calendar.YearPickerGrid>
            </Calendar>
            {!!showTimeField && (
              <div className="flex items-center justify-between">
                <Label>Time</Label>
                <TimeField
                  aria-label="Time"
                  granularity={timeGranularity}
                  hideTimeZone={props.hideTimeZone}
                  hourCycle={hourCycle}
                  name="time"
                  shouldForceLeadingZeros={true}
                  value={state.timeValue}
                  onChange={(v) => state.setTimeValue(v as TimeValue)}
                >
                  <TimeField.Group variant="secondary">
                    <TimeField.Input>{(segment) => <TimeField.Segment segment={segment} />}</TimeField.Input>
                  </TimeField.Group>
                </TimeField>
              </div>
            )}
          </DatePicker.Popover>
          <FieldError>{meta.errorMessage}</FieldError>
        </Fragment>
      )}
    </DatePicker>
  );
};
